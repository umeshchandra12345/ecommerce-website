from time import sleep

from asgiref.sync import async_to_sync
from celery import Celery
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema
from pydantic import EmailStr
from app.config import db_settings , notification_settings
from utils import TEMPLATE_DIR
from twilio.rest import Client
fast_mail=FastMail(
    ConnectionConfig(
        **notification_settings.model_dump(
            exclude=["TWILIO_SID","TWILIO_AUTH_TOKEN","TWILIO_NUMBER"]
                        ),
        TEMPLATE_FOLDER=TEMPLATE_DIR,
            )
        )


twilio_client = Client( # type: ignore
            notification_settings.TWILIO_SID,
            notification_settings.TWILIO_AUTH_TOKEN,
        )
send_message = async_to_sync(fast_mail.send_message)

app = Celery(
    "api_tasks",
    broker=db_settings.REDIS_URL(9),
    backend=db_settings.REDIS_URL(9),
    broker_connection_retry_on_startup=True
)
@app.task
def add_log(log:str) -> None:
    with open("file.log","a")as file:
        file.write(f"{log}\n")

@app.task
def send_mail(
    recipients:list[str],
    subject:str,
    body:str,
):
    send_message(MessageSchema(
        recipients=recipients,
        subject=subject,
        body=body,
    ))
    
    return "Message Sent!"


@app.task
def send_email_with_template(
    recipients: list[EmailStr],
    subject: str,
    context: dict,
    template_name: str,
):
    from fastapi_mail import MessageType
    send_message(
        message=MessageSchema(
            recipients=recipients,
            subject=subject,
            template_body=context,
            subtype=MessageType.html,
            ),
            template_name=template_name,
        )



@app.task
def send_sms(to:str,body:str):
        twilio_client.messages.create(
            from_=notification_settings.TWILIO_NUMBER,
            to=to,
            body=body,
        )

@app.task
def background_task(name:str,data:dict):
    sleep(5)
    return name