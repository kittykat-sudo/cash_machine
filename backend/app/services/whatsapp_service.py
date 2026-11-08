from __future__ import annotations
import re
import urllib.parse
import logging
import requests
from typing import Optional, Dict, Any, TYPE_CHECKING
from app.config import settings

if TYPE_CHECKING:
    from app.models import Sale

logger = logging.getLogger("whatsapp_service")


class WhatsAppService:
    @staticmethod
    def sanitize_phone(phone: Optional[str], default_country_code: str = "94") -> str:
        """
        Cleans and normalizes phone numbers into international format without '+'.
        Handles Sri Lankan local format (077XXXXXXX -> 9477XXXXXXX) as well as
        already internationalized numbers (+94... or 94...).
        """
        if not phone:
            return ""

        # Remove all whitespace, dashes, parens, and leading plus
        cleaned = re.sub(r"[\s\-\(\)\+]", "", phone.strip())

        # If starts with leading 0 (common in Sri Lanka: 077..., 071..., 072..., 011...)
        if cleaned.startswith("0"):
            cleaned = default_country_code + cleaned[1:]
        # If 9 digits entered without leading 0 (e.g. 771234567)
        elif len(cleaned) == 9 and not cleaned.startswith(default_country_code):
            cleaned = default_country_code + cleaned

        return cleaned

    @staticmethod
    def build_wa_link(phone: str, message: str) -> str:
        """Generates a wa.me direct Click-to-Chat URL."""
        cleaned_phone = WhatsAppService.sanitize_phone(phone, settings.WHATSAPP_DEFAULT_COUNTRY_CODE)
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{cleaned_phone}?text={encoded_message}"

    @staticmethod
    def build_bill_message(sale: Sale) -> str:
        """
        Generates a clear, beautifully formatted WhatsApp text receipt.
        """
        lines = [
            f"🖨️ *{settings.SHOP_NAME.upper()}*",
            f"📍 {settings.SHOP_ADDRESS}",
            f"📞 {settings.SHOP_PHONE}",
            "────────────────────────",
            f"🧾 *Bill Receipt:* #{sale.bill_number}",
        ]

        if sale.customer_name:
            lines.append(f"👤 *Customer:* {sale.customer_name}")

        created_str = sale.created_at.strftime("%d/%m/%Y %I:%M %p") if sale.created_at else "Today"
        lines.append(f"📅 *Date:* {created_str}")
        lines.append(f"💳 *Payment:* {sale.payment_method.upper()}")
        lines.append("────────────────────────")
        lines.append("*ITEMS ORDERED:*")

        for item in (sale.items or []):
            qty = f"{float(item.quantity):g}"
            unit_p = f"{float(item.unit_price):.2f}"
            l_tot = f"{float(item.line_total):.2f}"
            lines.append(f"• {qty}x {item.description} @ Rs. {unit_p} = *Rs. {l_tot}*")

        lines.append("────────────────────────")
        lines.append(f"Subtotal: Rs. {float(sale.subtotal):.2f}")
        if float(sale.discount or 0) > 0:
            lines.append(f"Discount: - Rs. {float(sale.discount):.2f}")
        if float(sale.tax_amount or 0) > 0:
            lines.append(f"Tax: Rs. {float(sale.tax_amount):.2f}")
        lines.append(f"*TOTAL AMOUNT: Rs. {float(sale.total):.2f}*")
        lines.append("────────────────────────")
        lines.append("🙏 *Thank you for your business!*")
        lines.append(f"For inquiries, reply here or WhatsApp/call {settings.SHOP_WHATSAPP_NUMBER}.")

        return "\n".join(lines)

    @staticmethod
    def build_progress_message(sale: Sale, status: str, custom_text: Optional[str] = None) -> str:
        """
        Generates an order progress update message for the customer.
        """
        cust_name = sale.customer_name or "Valued Customer"
        bill_num = sale.bill_number
        tot_str = f"Rs. {float(sale.total):.2f}"

        status_lower = status.lower()

        if status_lower in ["received", "pending"]:
            header = "👋 *Order Received & Queued*"
            body = (
                f"Hello {cust_name},\n"
                f"Your print order *#{bill_num}* has been received at *{settings.SHOP_NAME}*.\n\n"
                f"📋 *Order Total:* {tot_str}\n"
                f"⏳ *Current Status:* Queued / Waiting to Print\n\n"
                f"We will notify you via WhatsApp as soon as production starts!"
            )
        elif status_lower == "in_progress":
            header = "⚙️ *Order In Production*"
            body = (
                f"Hello {cust_name},\n"
                f"Your order *#{bill_num}* is currently being *printed and prepared* at *{settings.SHOP_NAME}*.\n\n"
                f"We will notify you immediately once your items are ready for collection!"
            )
        elif status_lower == "ready":
            header = "🎉 *Order Ready for Pickup!*"
            body = (
                f"Hello {cust_name},\n"
                f"Great news! Your print job *#{bill_num}* is *READY FOR PICKUP*!\n\n"
                f"💰 *Balance Due:* {tot_str} ({sale.payment_method.upper()})\n"
                f"📍 *Pickup Location:* {settings.SHOP_ADDRESS}\n"
                f"📱 *WhatsApp:* {settings.SHOP_WHATSAPP_NUMBER}\n"
                f"📞 *Tel:* {settings.SHOP_PHONE}\n\n"
                f"Please present your bill number *#{bill_num}* at our counter. See you soon!"
            )
        elif status_lower == "completed":
            header = "✅ *Order Completed*"
            body = (
                f"Hello {cust_name},\n"
                f"Your order *#{bill_num}* has been marked as *Completed*.\n\n"
                f"🙏 Thank you for choosing *{settings.SHOP_NAME}*! We look forward to seeing you again."
            )
        elif status_lower == "cancelled":
            header = "❌ *Order Cancelled*"
            body = (
                f"Hello {cust_name},\n"
                f"Your order *#{bill_num}* at *{settings.SHOP_NAME}* has been cancelled.\n"
                f"If you have questions, please WhatsApp/call us at {settings.SHOP_WHATSAPP_NUMBER}."
            )
        else:
            header = f"ℹ️ *Order Update: {status.upper()}*"
            body = (
                f"Hello {cust_name},\n"
                f"Update regarding your order *#{bill_num}* at *{settings.SHOP_NAME}*:\n"
                f"Status: *{status.title()}*"
            )

        lines = [header, "────────────────────────", body]

        if custom_text and custom_text.strip():
            lines.append("\n📝 *Note from Shop:*")
            lines.append(custom_text.strip())

        lines.append("────────────────────────")
        lines.append(f"*{settings.SHOP_NAME}*")

        return "\n".join(lines)

    @staticmethod
    def get_bridge_status() -> Dict[str, Any]:
        """
        Queries the WhatsApp bridge microservice for connection state, QR code, and linked phone.
        """
        bridge_url = settings.WHATSAPP_BRIDGE_URL.rstrip("/")
        try:
            resp = requests.get(f"{bridge_url}/status", timeout=4)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "available": True,
                    "connected": data.get("connected", False),
                    "phone": data.get("phone"),
                    "target_shop_phone": data.get("targetShopPhone") or settings.SHOP_WHATSAPP_NUMBER,
                    "qr": data.get("qr"),
                    "qr_raw": data.get("qrRaw"),
                    "pairing_code": data.get("pairingCode"),
                }
            else:
                return {
                    "available": False,
                    "connected": False,
                    "error": f"Bridge responded with HTTP {resp.status_code}",
                }
        except Exception as e:
            logger.debug(f"WhatsApp bridge not reachable: {e}")
            return {
                "available": False,
                "connected": False,
                "error": str(e),
                "target_shop_phone": settings.SHOP_WHATSAPP_NUMBER,
            }

    @staticmethod
    def request_bridge_pairing_code(phone: Optional[str] = None) -> Dict[str, Any]:
        """
        Requests an 8-character pairing code from Baileys for linking the shop WhatsApp account.
        """
        bridge_url = settings.WHATSAPP_BRIDGE_URL.rstrip("/")
        target = phone or settings.SHOP_WHATSAPP_NUMBER
        try:
            resp = requests.post(
                f"{bridge_url}/pairing-code",
                json={"phone": target},
                timeout=10,
            )
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to request pairing code from bridge: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def send_via_bridge(phone: str, message: str) -> Dict[str, Any]:
        """
        Directly sends the WhatsApp message through the linked WhatsApp account (0720129297)
        via the WhatsApp bridge microservice.
        """
        bridge_url = settings.WHATSAPP_BRIDGE_URL.rstrip("/")
        cleaned_phone = WhatsAppService.sanitize_phone(phone, settings.WHATSAPP_DEFAULT_COUNTRY_CODE)
        if not cleaned_phone:
            return {"success": False, "error": "Invalid recipient phone number"}

        try:
            resp = requests.post(
                f"{bridge_url}/send",
                json={"phone": cleaned_phone, "message": message},
                timeout=15,
            )
            data = resp.json() if resp.content else {}
            if resp.status_code == 200 and data.get("success"):
                return {
                    "success": True,
                    "provider": "bridge",
                    "phone": cleaned_phone,
                    "message_id": data.get("messageId"),
                    "response": data,
                }
            else:
                err_msg = data.get("error") or f"Bridge HTTP {resp.status_code}"
                return {
                    "success": False,
                    "provider": "bridge",
                    "error": err_msg,
                    "requires_linking": data.get("requiresLinking", False),
                }
        except Exception as e:
            logger.error(f"WhatsApp bridge send error: {e}")
            return {"success": False, "provider": "bridge", "error": str(e)}

    @staticmethod
    def logout_bridge() -> Dict[str, Any]:
        """Logs out and resets WhatsApp bridge session."""
        bridge_url = settings.WHATSAPP_BRIDGE_URL.rstrip("/")
        try:
            resp = requests.post(f"{bridge_url}/logout", timeout=6)
            return resp.json() if resp.content else {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def send_via_api(phone: str, message: str) -> Dict[str, Any]:
        """
        Sends the WhatsApp message directly via:
        1. WhatsApp Multi-Device Bridge (Linked account 0720129297) - Primary!
        2. Meta Cloud API (if configured)
        3. Twilio API (if configured)
        4. Fallback to click-to-chat
        """
        cleaned_phone = WhatsAppService.sanitize_phone(phone, settings.WHATSAPP_DEFAULT_COUNTRY_CODE)
        if not cleaned_phone:
            return {"success": False, "error": "Invalid or missing phone number"}

        mode = (settings.WHATSAPP_MODE or "bridge").lower()

        # 1. Primary: WhatsApp Bridge (Sends natively from 0720129297)
        if mode in ("bridge", "baileys", "multidevice", "click_to_chat"):
            bridge_status = WhatsAppService.get_bridge_status()
            if bridge_status.get("available") and bridge_status.get("connected"):
                result = WhatsAppService.send_via_bridge(cleaned_phone, message)
                if result.get("success"):
                    return result
                logger.warning(f"Bridge send failed, checking other providers: {result.get('error')}")

        # 2. Meta WhatsApp Cloud API
        if mode == "cloud_api" and settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
            try:
                url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
                headers = {
                    "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": cleaned_phone,
                    "type": "text",
                    "text": {"preview_url": False, "body": message},
                }
                resp = requests.post(url, json=payload, headers=headers, timeout=10)
                if resp.status_code in (200, 201):
                    return {"success": True, "provider": "meta_cloud", "response": resp.json()}
                else:
                    logger.error(f"Meta Cloud API error: {resp.status_code} - {resp.text}")
                    return {"success": False, "provider": "meta_cloud", "error": resp.text}
            except Exception as e:
                logger.error(f"Failed to send via Meta Cloud API: {e}")
                return {"success": False, "provider": "meta_cloud", "error": str(e)}

        # 3. Twilio WhatsApp API
        elif mode == "twilio" and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                from_num = settings.TWILIO_WHATSAPP_NUMBER
                if not from_num.startswith("whatsapp:"):
                    from_num = f"whatsapp:{from_num}"
                to_num = f"whatsapp:+{cleaned_phone}"
                data = {"From": from_num, "To": to_num, "Body": message}
                resp = requests.post(
                    url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    timeout=10,
                )
                if resp.status_code in (200, 201):
                    return {"success": True, "provider": "twilio", "response": resp.json()}
                else:
                    logger.error(f"Twilio API error: {resp.status_code} - {resp.text}")
                    return {"success": False, "provider": "twilio", "error": resp.text}
            except Exception as e:
                logger.error(f"Failed to send via Twilio API: {e}")
                return {"success": False, "provider": "twilio", "error": str(e)}

        # If bridge is reachable but not connected, return linking required info
        bridge_status = WhatsAppService.get_bridge_status()
        if bridge_status.get("available") and not bridge_status.get("connected"):
            return {
                "success": False,
                "provider": "bridge",
                "requires_linking": True,
                "error": f"WhatsApp ({settings.SHOP_WHATSAPP_NUMBER}) is not linked yet. Please scan the QR code to connect.",
            }

        # Default fallback: Click-to-chat
        return {
            "success": True,
            "provider": "click_to_chat",
            "info": "Direct send not ready; generated wa.me click-to-chat link.",
        }


whatsapp_service = WhatsAppService()
