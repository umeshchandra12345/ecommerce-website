from abc import ABC, abstractmethod
import logging
from app.config import notification_settings

logger = logging.getLogger(__name__)

class BaseSMSProvider(ABC):
    """Abstract SMS Service Interface for pluggable SMS providers (Twilio, MSG91, AWS SNS, etc.)"""

    @abstractmethod
    def send_sms(self, to_phone: str, message_body: str) -> bool:
        pass

class TwilioSMSProvider(BaseSMSProvider):
    """Twilio SMS Provider Implementation"""

    def send_sms(self, to_phone: str, message_body: str) -> bool:
        try:
            from app.worker.tasks import send_sms as celery_send_sms
            if notification_settings.TWILIO_SID and notification_settings.TWILIO_AUTH_TOKEN:
                celery_send_sms.delay(to=to_phone, body=message_body)
                return True
        except Exception as exc:
            logger.error(f"Failed to trigger Twilio SMS task for {to_phone}: {exc}")
        return False

class MockSMSProvider(BaseSMSProvider):
    """Mock SMS Provider for local development, testing, and Vercel edge deployment"""

    def send_sms(self, to_phone: str, message_body: str) -> bool:
        logger.info(f"[SMS PROVIDER LOG] To: {to_phone} | Body: {message_body}")
        print(f"📱 [SMS SENT TO {to_phone}]: {message_body}")
        return True

class SMSNotificationService:
    """SMS Notification Service Manager"""

    def __init__(self, provider: BaseSMSProvider | None = None):
        if provider is None:
            if notification_settings.TWILIO_SID and notification_settings.TWILIO_AUTH_TOKEN:
                self.provider = TwilioSMSProvider()
            else:
                self.provider = MockSMSProvider()
        else:
            self.provider = provider

    def send_otp_sms(self, to_phone: str, otp_code: str) -> bool:
        body = (
            f"Your FastShip order is out for delivery! "
            f"Your Delivery Verification OTP is {otp_code}. "
            f"Share this code ONLY with your delivery executive at your doorstep."
        )
        return self.provider.send_sms(to_phone, body)
