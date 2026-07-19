from contextlib import asynccontextmanager
from pathlib import Path
import logging
from time import perf_counter
from uuid import uuid4

from fastapi.middleware.cors import CORSMiddleware
from fastapi import BackgroundTasks, FastAPI, Depends, Response, Request
from fastapi.responses import JSONResponse
from scalar_fastapi import get_scalar_api_reference

from api.router import master_router
from api.tags import APITag
from app.database.session import create_db_tables
from core.exceptions import InvalidToken, add_exception_handlers
from fastapi.routing import APIRoute

logger = logging.getLogger(__name__)


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
# FastAPI master application instance with CORS and Vercel routing
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
        "https://ecommerce-website-kappa-mauve.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Limit", "X-Total-Pages", "*"],
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

@app.middleware("http")   
async def custom_middleware(request:Request,call_next):
    # Strip /app/main.py or /api prefix if present (useful when deployed on Vercel behind rewrites)
    path = request.scope["path"]
    if path.startswith("/app/main.py"):
        path = path[12:]
    if path.startswith("/api"):
        path = path[4:]
    if not path:
        path = "/"
    request.scope["path"] = path

    start = perf_counter()    
    response : Response = await call_next(request)
    
    end=perf_counter()
    time_taken=round(end - start,2)
    
    logger.info(f"{request.method} {request.url} ({response.status_code}) {time_taken}s")
    return response
    

#Server Running status 
@app.get("/")
def read_root():
    return {
        "message": "welcome to fastship API",
        }

@app.get("/api/v2-force-cache-break")
def force_cache_break():
    return {"build_time": "2026-07-19T17:22:00", "v": "2.0"}

### Scalar API Documentation
@app.get("/docs", include_in_schema=False)
def get_scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title="Scalar API",
    )
