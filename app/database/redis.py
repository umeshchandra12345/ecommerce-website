from redis.asyncio import Redis
from redis.exceptions import RedisError
from sqlmodel import UUID

from app.config import db_settings
import logging

logger = logging.getLogger(__name__)

_token_blacklist = Redis(
    host=db_settings.REDIS_HOST,
    port=db_settings.REDIS_PORT,
    db=0,
)
_shipment_verification_codes =Redis(
    host=db_settings.REDIS_HOST,
    port=db_settings.REDIS_PORT,
    db=1,
    decode_responses=True,
)

async def add_jti_to_blacklist(jti:str):
    try:
        await _token_blacklist.set(jti,"blacklisted")
    except Exception:
        logger.exception("Failed to add token to Redis blacklist")

async def is_jti_blacklisted(jti:str)->bool:
    try:
        return bool(await _token_blacklist.exists(jti))
    except Exception:
        return False
    
_in_memory_verification_codes = {}

async def add_shipment_verification_code(id:UUID,code:int):
    _in_memory_verification_codes[str(id)] = str(code)
    try:
        await _shipment_verification_codes.set(str(id),code)
    except Exception:
        pass
    
async def get_shipment_verification_code(id:UUID):
    try:
        val = await _shipment_verification_codes.get(str(id))
        if val:
            return str(val)
    except Exception:
        pass
    return _in_memory_verification_codes.get(str(id))