from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.config import settings
from app.services.whatsapp_service import whatsapp_service

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class QuickLinkRequest(BaseModel):
    phone: str
    message: str


class QuickLinkResponse(BaseModel):
    phone: str
    clean_phone: str
    message: str
    wa_link: str


class DirectSendRequest(BaseModel):
    phone: str
    message: str


class PairingRequest(BaseModel):
    phone: Optional[str] = None


@router.get("/config")
def get_whatsapp_config():
    """Returns current WhatsApp configuration mode, bridge status, and shop numbers."""
    mode = settings.WHATSAPP_MODE.lower()
    has_meta_cloud = bool(settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)
    has_twilio = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_WHATSAPP_NUMBER)
    bridge_status = whatsapp_service.get_bridge_status()

    return {
        "mode": mode,
        "default_country_code": settings.WHATSAPP_DEFAULT_COUNTRY_CODE,
        "shop_name": settings.SHOP_NAME,
        "shop_phone": settings.SHOP_PHONE,
        "shop_whatsapp_number": settings.SHOP_WHATSAPP_NUMBER,
        "has_meta_cloud": has_meta_cloud,
        "has_twilio": has_twilio,
        "bridge": bridge_status,
        "is_connected": bridge_status.get("connected", False),
        "is_api_configured": (
            bridge_status.get("connected", False)
            or (mode == "cloud_api" and has_meta_cloud)
            or (mode == "twilio" and has_twilio)
        ),
    }


@router.get("/status")
def get_status():
    """Returns real-time connection status from the WhatsApp bridge."""
    return whatsapp_service.get_bridge_status()


@router.post("/pairing-code")
def request_pairing_code(req: PairingRequest = None):
    """Requests an 8-character pairing code to link 0720129297."""
    phone_to_use = req.phone if req and req.phone else settings.SHOP_WHATSAPP_NUMBER
    res = whatsapp_service.request_bridge_pairing_code(phone_to_use)
    if not res.get("success", False) and not res.get("alreadyConnected", False):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to get pairing code"))
    return res


@router.post("/send-direct")
def send_direct_message(req: DirectSendRequest):
    """Sends a direct WhatsApp message from 0720129297 without opening any browser window."""
    result = whatsapp_service.send_via_api(req.phone, req.message)
    if not result.get("success"):
        raise HTTPException(
            status_code=400 if not result.get("requires_linking") else 503,
            detail=result.get("error", "Failed to send message"),
        )
    return result


@router.post("/logout")
def logout_whatsapp():
    """Unlinks and clears the WhatsApp bridge connection."""
    return whatsapp_service.logout_bridge()


@router.post("/link", response_model=QuickLinkResponse)
def generate_whatsapp_link(req: QuickLinkRequest):
    clean_p = whatsapp_service.sanitize_phone(req.phone, settings.WHATSAPP_DEFAULT_COUNTRY_CODE)
    if not clean_p:
        raise HTTPException(status_code=400, detail="Invalid phone number provided")

    link = whatsapp_service.build_wa_link(req.phone, req.message)
    return QuickLinkResponse(
        phone=req.phone,
        clean_phone=clean_p,
        message=req.message,
        wa_link=link,
    )
