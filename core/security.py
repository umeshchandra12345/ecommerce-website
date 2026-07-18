from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer,HTTPBearer

from utils import decode_access_token
oauth2_scheme_seller = OAuth2PasswordBearer(tokenUrl="seller/token", scheme_name="seller")
oauth2_scheme_partner = OAuth2PasswordBearer(tokenUrl="partner/token", scheme_name="partner")

class AccessTokenBearer(HTTPBearer):
    async def __call__(self,request):
        auth_credentials = await super().__call__(request)
        token = auth_credentials.credentials
        
        
        token_data=decode_access_token(token)
        
        if token_data is None:
            from core.exceptions import InvalidToken
            raise InvalidToken()
            
        return token_data
        
access_token_bearer=AccessTokenBearer()

Annotated[dict,Depends(access_token_bearer)]