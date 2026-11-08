const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay,
  Browsers,
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, 'auth_info_baileys');
const DEFAULT_SHOP_PHONE = process.env.SHOP_WHATSAPP_NUMBER || '0720129297';

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let isConnected = false;
let connectedUser = null;
let latestQr = null;
let latestQrRaw = null;
let latestPairingCode = null;
let isConnecting = false;

function cleanPhone(rawPhone, defaultCountryCode = '94') {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[\s\-\(\)\+]/g, '').trim();
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  } else if (cleaned.length === 9 && !cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }
  return cleaned;
}

function clearAuthDir() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      const files = fs.readdirSync(AUTH_DIR);
      for (const file of files) {
        try {
          fs.rmSync(path.join(AUTH_DIR, file), { recursive: true, force: true });
        } catch (fileErr) {
          console.error(`Could not delete auth file ${file}:`, fileErr);
        }
      }
    }
  } catch (e) {
    console.error('Failed to clear auth dir contents:', e);
  }
}

async function connectToWhatsApp() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        latestQrRaw = qr;
        try {
          latestQr = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error('Failed to generate QR data URL:', err);
        }
      }

      if (connection === 'open') {
        isConnected = true;
        isConnecting = false;
        latestQr = null;
        latestQrRaw = null;
        latestPairingCode = null;
        connectedUser = sock.user;

        const userPhone = sock.user?.id ? sock.user.id.split(':')[0] : DEFAULT_SHOP_PHONE;
        console.log(`[WhatsApp Bridge] Connected successfully as ${userPhone}`);
      }

      if (connection === 'close') {
        isConnected = false;
        isConnecting = false;
        connectedUser = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || 'unknown';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Bridge] Connection closed (code: ${statusCode}, reason: ${reason}). Reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            connectToWhatsApp().catch(console.error);
          }, 3000);
        } else {
          console.log('[WhatsApp Bridge] Logged out from WhatsApp. Resetting auth directory...');
          clearAuthDir();
          latestQr = null;
          latestQrRaw = null;
          latestPairingCode = null;
          setTimeout(() => {
            connectToWhatsApp().catch(console.error);
          }, 2000);
        }
      }
    });
  } catch (error) {
    console.error('[WhatsApp Bridge] Error initializing connection:', error);
    isConnecting = false;
    setTimeout(() => {
      connectToWhatsApp().catch(console.error);
    }, 5000);
  }
}

// Start connection on launch
connectToWhatsApp().catch(console.error);

// ----------------- API Endpoints -----------------

// 1. Status endpoint
app.get('/status', (req, res) => {
  let displayPhone = null;
  if (connectedUser?.id) {
    displayPhone = connectedUser.id.split(':')[0].split('@')[0];
  }

  res.json({
    connected: isConnected,
    phone: displayPhone || (isConnected ? DEFAULT_SHOP_PHONE : null),
    targetShopPhone: DEFAULT_SHOP_PHONE,
    qr: latestQr,
    qrRaw: latestQrRaw,
    pairingCode: latestPairingCode,
  });
});

// 2. Request 8-digit Pairing Code (link with phone number)
app.post('/pairing-code', async (req, res) => {
  try {
    if (isConnected) {
      return res.json({
        success: true,
        alreadyConnected: true,
        message: 'WhatsApp is already connected.',
      });
    }

    if (!sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp socket is initializing. Please try again in a few seconds.',
      });
    }

    const inputPhone = req.body?.phone || DEFAULT_SHOP_PHONE;
    const sanitized = cleanPhone(inputPhone);

    if (!sanitized || sanitized.length < 9) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number for pairing code.',
      });
    }

    console.log(`[WhatsApp Bridge] Requesting pairing code for phone: ${sanitized}`);
    const code = await sock.requestPairingCode(sanitized);
    latestPairingCode = code;

    return res.json({
      success: true,
      phone: sanitized,
      pairingCode: code,
    });
  } catch (error) {
    console.error('[WhatsApp Bridge] Error requesting pairing code:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to request pairing code',
    });
  }
});

// 3. Send WhatsApp message directly from the linked account
app.post('/send', async (req, res) => {
  const { phone, message } = req.body || {};

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Both "phone" and "message" fields are required.',
    });
  }

  if (!isConnected || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp account is not connected. Please scan the QR code to link your account (0720129297).',
      requiresLinking: true,
    });
  }

  const cleaned = cleanPhone(phone);
  if (!cleaned || cleaned.length < 9) {
    return res.status(400).json({
      success: false,
      error: `Invalid recipient phone number: ${phone}`,
    });
  }

  const jid = `${cleaned}@s.whatsapp.net`;

  try {
    console.log(`[WhatsApp Bridge] Sending message to ${jid}...`);
    const sent = await sock.sendMessage(jid, { text: message });

    console.log(`[WhatsApp Bridge] Successfully sent message ID: ${sent.key.id} to ${cleaned}`);
    return res.json({
      success: true,
      phone: cleaned,
      messageId: sent.key.id,
      timestamp: sent.messageTimestamp,
    });
  } catch (error) {
    console.error(`[WhatsApp Bridge] Failed to send message to ${jid}:`, error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to deliver message via WhatsApp',
    });
  }
});

// 4. Disconnect / Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout().catch(() => {});
    }
    clearAuthDir();
    isConnected = false;
    connectedUser = null;
    latestQr = null;
    latestQrRaw = null;
    latestPairingCode = null;

    setTimeout(() => {
      connectToWhatsApp().catch(console.error);
    }, 1000);

    return res.json({ success: true, message: 'Disconnected and reset session.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Bridge] Listening on port ${PORT}`);
  console.log(`[WhatsApp Bridge] Default shop number: ${DEFAULT_SHOP_PHONE}`);
});
