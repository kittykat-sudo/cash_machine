import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import auth, items, sales, expenses, cashbook, reports

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chathura_cash_register")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist (init.sql normally creates them, but this provides double-safety)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.warning(f"Could not automatically create tables at startup: {e}")
    yield

app = FastAPI(
    title="Chathura Printers Cash Register API",
    description="Backend service for cash register, billing, cashbook, and financial reporting",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")] if settings.ALLOWED_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api")
app.include_router(items.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(cashbook.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "Chathura Printers Cash Register API",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "shop": settings.SHOP_NAME,
        "currency": settings.DEFAULT_CURRENCY,
        "timezone": settings.APP_TIMEZONE
    }
