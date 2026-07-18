from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
import sys
from time import perf_counter
from typing import Annotated
from uuid import UUID, uuid4

from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks, FastAPI, Depends, Response, Request
from fastapi.responses import JSONResponse
from scalar_fastapi import get_scalar_api_reference
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.router import master_router
from api.tags import APITag
from app.database.session import create_db_tables, get_session
from app.worker.tasks import add_log
from core.exceptions import InvalidToken, add_exception_handlers
from services.notification import NotificationService
from app.database.models import Seller, DeliveryPartner
from utils import decode_url_safe_token
from fastapi.routing import APIRoute


def custom_generate_unique_id(route: APIRoute) -> str:
    return route.name



@asynccontextmanager
async def lifespan_handler(app: FastAPI):
    await create_db_tables()
    yield

description="""Delivery Management System for sellers and delivery agents

###Seller
- Submit shipment effortlessly
- Share tracking links with customers

###Delivery Agents
- Auto accept shipments
- Track nd update shipment status 
- Email and SMS notifications
"""
app = FastAPI(
    title="FastShip",
    description=description,
    docs_url=None,
    redoc_url=None,
    version="0.1.0",
    terms_of_service="http://fastship.com/terms",
    contact={
        "name":"FastShip Support",
        "url":"https://fastship.com/support",
        "email":"support@fastship.com",
    },
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan_handler,
    openapi_tags=[
        {
            "name":APITag.SHIPMENT,
            "description":"Operations related to shipments"
            
        },
        {
            "name":APITag.SELLER,
            "description":"Operations related to seller."
        },
        {
            "name":APITag.PARTNER,
            "description":"Operations related to delivery partner."
        },
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


add_exception_handlers(app)
app.include_router(master_router)


def handler(request,exception):
    return JSONResponse(
        content={"detail":"Token is invalid or expired"},
        status_code=400
    )

app.add_exception_handler(
    InvalidToken,
    handler,
)

@app.get("/mail")
async def send_test_mail(tasks:BackgroundTasks):
    
    tasks.add_task(
        NotificationService().send_email,
        recipients=["umeshpathakamuri1611@gmail.com"],
        subject="Test Mail coming Through Twice",
        body="You should not be interested in everybody...",
        
    )
    
    return {"detail":"Mail sent✅"}


@app.get("/test")
def test():
    now=datetime.now()
    background_task.delay(
        f"Background Task { now.second}",
        data={
            "min":now.minute,
            "sec":now.second,
        }
    )
    
@app.middleware("http")   
async def custom_middleware(request:Request,call_next):
    # Strip /api prefix if present (useful when deployed on Vercel behind rewrites)
    if request.scope["path"].startswith("/api"):
        request.scope["path"] = request.scope["path"][4:]
        if not request.scope["path"]:
            request.scope["path"] = "/"

    start = perf_counter()    
    response : Response = await call_next(request)
    
    end=perf_counter()
    time_taken=round(end - start,2)
    
    add_log(f"{request.method} {request.url} ({response.status_code}){time_taken} s ")    
    return response
    

def get_id():
    return uuid4()

#Server Running status 
@app.get("/")
def read_root():
    return {
        "message": "welcome to fastship API",
        }

### Scalar API Documentation
@app.get("/docs", include_in_schema=False)
def get_scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API",
    )
