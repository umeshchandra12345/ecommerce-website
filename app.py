from twilio.rest import Client
from app.config import notification_settings


client = Client(
    notification_settings.TWILIO_SID,
    notification_settings.TWILIO_AUTH_TOKEN,
    
)

client.messages.create(
    from_=notification_settings.TWILIO_NUMBER,
    to="1010101010"
    body=""
)