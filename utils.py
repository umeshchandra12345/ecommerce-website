from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import jwt
from itsdangerous import  BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import security_settings
serializer = URLSafeTimedSerializer(security_settings.JWT_SECRET)
#generate a token
token = serializer.dumps({"email":"user@his.site"})

#decode a token
token_data = serializer.loads(token,max_age=timedelta(days=1).total_seconds())


APP_DIR = Path(__file__).resolve().parent
TEMPLATE_DIR = APP_DIR / "templates"
TEMPLATE_DIR.mkdir(parents=True, exist_ok=True)


def generate_access_token(
    data: dict,
    expiry: timedelta = timedelta(minutes=20),
) -> str:
    return jwt.encode(
        payload={
            **data,
            "jti": str(uuid4()),
            "exp": datetime.now(timezone.utc) + expiry,
        },
        algorithm=security_settings.JWT_ALGORITHM,
        key=security_settings.JWT_SECRET,
    )


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            jwt=token,
            key=security_settings.JWT_SECRET,
            algorithms=[security_settings.JWT_ALGORITHM],
        )
    except jwt.PyJWTError:
        return None
    
def generate_url_safe_token(data: dict, salt: str | None = None)->str:
    return serializer.dumps(data, salt=salt)

def decode_url_safe_token(token:str,expiry:timedelta | None = None, salt: str | None = None)->dict | None:
    try:
        return serializer.loads(
            token,
            max_age=expiry.total_seconds() if expiry else None,
            salt=salt, 
        )
    except (BadSignature,SignatureExpired):
        return None


def print_label(data: any) -> None:
    from rich import print as rprint, panel
    rprint(panel.Panel(str(data), title="Response Data", border_style="cyan"))

