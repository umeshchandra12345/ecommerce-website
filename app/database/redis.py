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
    except RedisError:
        logger.exception("Failed to add token to Redis blacklist")

async def is_jti_blacklisted(jti:str)->bool:
    try:
        return bool(await _token_blacklist.exists(jti))
    except RedisError:
        logger.exception("Failed to check Redis token blacklist")
        return False
    
async def add_shipment_verification_code(id:UUID,code:int):
    await _shipment_verification_codes.set(str(id),code)
    
async def get_shipment_verification_code(id:UUID):
    return str(await _shipment_verification_codes.get(str(id)))