import { Sale, OrderStatus } from '../types';

export const DEFAULT_SHOP_NAME = 'Chathura Printers';
export const DEFAULT_SHOP_ADDRESS = 'No. 6A, Sri Hemananda Mw, Joolgaha, Galle';
export const DEFAULT_SHOP_PHONE = '072 0129297 / 077 8683088';
export const DEFAULT_SHOP_WHATSAPP = '072 0129297';

/**
 * Sanitizes phone number to international format without plus or symbols.
 * Handles local Sri Lanka formats (077..., 071..., 072..., etc.).
 */
export function sanitizeWhatsAppNumber(phone?: string | null, defaultCountry = '94'): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  if (cleaned.startsWith('0')) {
    return defaultCountry + cleaned.slice(1);
  }
  if (cleaned.length === 9 && !cleaned.startsWith(defaultCountry)) {
    return defaultCountry + cleaned;
  }
  return cleaned;
}

/**
 * Formats a raw phone string into a friendly Sri Lankan display string (+94 77 123 4567).
 */
export function formatDisplayPhone(phone?: string | null): string {
  const sanitized = sanitizeWhatsAppNumber(phone);
  if (!sanitized) return '';

  if (sanitized.startsWith('94') && sanitized.length === 11) {
    const operator = sanitized.slice(2, 4);
    const part1 = sanitized.slice(4, 7);
    const part2 = sanitized.slice(7);
    return `+94 ${operator} ${part1} ${part2}`;
  }
  return `+${sanitized}`;
}

/**
 * Builds the WhatsApp bill receipt text.
 */
export function generateWhatsAppBillText(
  sale: Sale,
  shopName = DEFAULT_SHOP_NAME,
  shopAddress = DEFAULT_SHOP_ADDRESS,
  shopPhone = DEFAULT_SHOP_PHONE
): string {
  const lines: string[] = [
    `🖨️ *${shopName.toUpperCase()}*`,
    `📍 ${shopAddress}`,
    `📞 ${shopPhone}`,
    '────────────────────────',
    `🧾 *Bill Receipt:* #${sale.bill_number}`,
  ];

  if (sale.customer_name) {
    lines.push(`👤 *Customer:* ${sale.customer_name}`);
  }

  const dateStr = sale.created_at
    ? new Date(sale.created_at).toLocaleString('en-LK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Today';

  lines.push(`📅 *Date:* ${dateStr}`);
  lines.push(`💳 *Payment:* ${sale.payment_method.toUpperCase()}`);
  lines.push('────────────────────────');
  lines.push('*ITEMS ORDERED:*');

  (sale.items || []).forEach((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unit_price).toFixed(2);
    const lineTot = Number(item.line_total).toFixed(2);
    lines.push(`• ${qty}x ${item.description} @ Rs. ${price} = *Rs. ${lineTot}*`);
  });

  lines.push('────────────────────────');
  lines.push(`Subtotal: Rs. ${Number(sale.subtotal).toFixed(2)}`);
  if (Number(sale.discount || 0) > 0) {
    lines.push(`Discount: - Rs. ${Number(sale.discount).toFixed(2)}`);
  }
  if (Number(sale.tax_amount || 0) > 0) {
    lines.push(`Tax: Rs. ${Number(sale.tax_amount).toFixed(2)}`);
  }
  lines.push(`*TOTAL AMOUNT: Rs. ${Number(sale.total).toFixed(2)}*`);
  lines.push('────────────────────────');
  lines.push('🙏 *Thank you for your business!*');
  lines.push(`For inquiries, please WhatsApp ${DEFAULT_SHOP_WHATSAPP} or call ${DEFAULT_SHOP_PHONE}.`);

  return lines.join('\n');
}

/**
 * Builds progress status update text for WhatsApp.
 */
export function generateWhatsAppStatusText(
  sale: Sale,
  status: OrderStatus,
  customNote?: string,
  shopName = DEFAULT_SHOP_NAME,
  shopAddress = DEFAULT_SHOP_ADDRESS,
  shopPhone = DEFAULT_SHOP_PHONE
): string {
  const custName = sale.customer_name || 'Valued Customer';
  const billNum = sale.bill_number;
  const totStr = `Rs. ${Number(sale.total).toFixed(2)}`;

  let header = '';
  let body = '';

  switch (status) {
    case 'pending':
      header = '👋 *Order Received & Queued*';
      body =
        `Hello ${custName},\n` +
        `Your print order *#${billNum}* has been received at *${shopName}*.\n\n` +
        `📋 *Order Total:* ${totStr}\n` +
        `⏳ *Current Status:* Queued / Waiting to Print\n\n` +
        `We will notify you via WhatsApp as soon as production begins!`;
      break;

    case 'in_progress':
      header = '⚙️ *Order In Production*';
      body =
        `Hello ${custName},\n` +
        `Your order *#${billNum}* is currently *being printed and processed* at *${shopName}*.\n\n` +
        `We will notify you the moment your items are ready for pickup!`;
      break;

    case 'ready':
      header = '🎉 *Order Ready for Pickup!*';
      body =
        `Hello ${custName},\n` +
        `Great news! Your print job *#${billNum}* is *READY FOR PICKUP*!\n\n` +
        `💰 *Balance Due:* ${totStr} (${sale.payment_method.toUpperCase()})\n` +
        `📍 *Pickup Location:* ${shopAddress}\n` +
        `📞 *Tel:* ${shopPhone}\n\n` +
        `Please present bill number *#${billNum}* at our counter. See you soon!`;
      break;

    case 'completed':
      header = '✅ *Order Completed & Collected*';
      body =
        `Hello ${custName},\n` +
        `Your order *#${billNum}* has been completed and collected.\n\n` +
        `🙏 Thank you for choosing *${shopName}*! We look forward to serving you again.`;
      break;

    case 'cancelled':
      header = '❌ *Order Cancelled*';
      body =
        `Hello ${custName},\n` +
        `Your order *#${billNum}* at *${shopName}* has been cancelled.\n` +
        `If you have questions, please contact us at ${shopPhone}.`;
      break;
  }

  const lines = [header, '────────────────────────', body];

  if (customNote && customNote.trim()) {
    lines.push('\n📝 *Note from Shop:*');
    lines.push(customNote.trim());
  }

  lines.push('────────────────────────');
  lines.push(`*${shopName}*`);

  return lines.join('\n');
}

/**
 * Opens WhatsApp Web or native app with pre-filled text.
 */
export function openWhatsAppChat(phone: string, text: string): void {
  const sanitized = sanitizeWhatsAppNumber(phone);
  if (!sanitized) {
    alert('Please enter a valid WhatsApp phone number.');
    return;
  }
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${sanitized}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
