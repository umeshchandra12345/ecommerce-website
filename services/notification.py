from jinja2 import Environment, FileSystemLoader
from fastapi import BackgroundTasks
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from jwt.utils import from_base64url_uint
from pydantic import EmailStr
from twilio.rest import Client
from app.config import notification_settings
from utils import TEMPLATE_DIR


class NotificationService:
    def __init__(self, tasks: BackgroundTasks):
        self.tasks = tasks
        self.template_env = Environment(
            loader=FileSystemLoader(TEMPLATE_DIR),
            autoescape=True,
        )
        self.fastmail = FastMail(
            ConnectionConfig(
                **notification_settings.model_dump(
                    exclude=["TWILIO_SID","TWILIO_AUTH_TOKEN","TWILIO_NUMBER"]
                        ),
                TEMPLATE_FOLDER=TEMPLATE_DIR,
            )
        )
        
        self.twilio_client = Client( # type: ignore
            notification_settings.TWILIO_SID,
            notification_settings.TWILIO_AUTH_TOKEN,
        )

    def _render_template(self, template_name: str, context: dict) -> str:
        template = self.template_env.get_template(template_name)
        return template.render(**context)

    def _enqueue_send(self, message: MessageSchema) -> None:
        async def _send() -> None:
            await self.fastmail.send_message(message)

        self.tasks.add_task(_send)

    async def send_email(
        self,
        recipients: list[str],
        subject: str,
        body: str,
    ):
        self._enqueue_send(
            MessageSchema(
                recipients=recipients,
                subject=subject,
                body=body,
                subtype=MessageType.plain,
            )
        )

    async def send_email_with_template(
        self,
        recipients: list[EmailStr],
        subject: str,
        context: dict,
        template_name: str,
    ):
        html_body = self._render_template(template_name, context)
        self._enqueue_send(
            MessageSchema(
                recipients=recipients,
                subject=subject,
                body=html_body,
                subtype=MessageType.html,
            )
        )
        
    async def send_sms(self,to:str,body:str):
        await self.twilio_client.messages.create_async(
            from_=notification_settings.TWILIO_NUMBER,
            to=to,
            body=body,
        )
