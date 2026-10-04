import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.routes import health, documents, reviews, rules, auth, findings, reports, policies
from app.core.config import settings
from app.core.rate_limit import RateLimiterMiddleware
from app.core.security_headers import SecurityHeadersMiddleware
from app.database.database import engine, Base
from app.database import models
from app.database.seed import seed_db

# -------------------------------------------------------------------
# Structured logging
# -------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  [%(levelname)s]  %(name)s: %(message)s",
)
logger = logging.getLogger("aurelia")

# -------------------------------------------------------------------
# Database bootstrap
# -------------------------------------------------------------------
Base.metadata.create_all(bind=engine)
seed_db()

# -------------------------------------------------------------------
# FastAPI application
# -------------------------------------------------------------------
# In production, disable Swagger UI and ReDoc so internals are not exposed.
docs_url = "/api/docs" if settings.ENVIRONMENT == "development" else None
redoc_url = "/api/redoc" if settings.ENVIRONMENT == "development" else None
openapi_url = "/api/openapi.json" if settings.ENVIRONMENT == "development" else None

app = FastAPI(
    title="AURELIA — Academic Unified Review Engine",
    description=(
        "Adaptive Multi-Agent System for Lecturer-Guided Review "
        "of Student Academic Project Documents"
    ),
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
    # Never expose debug info in error responses
    debug=False,
)

# -------------------------------------------------------------------
# Security Middleware (order matters — added first = outermost wrapper)
# -------------------------------------------------------------------

# 1. Rate limiting (innermost application logic guard)
app.add_middleware(RateLimiterMiddleware)

# 2. Security response headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. CORS — static whitelist + runtime-injectable CORS_EXTRA_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_all_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    max_age=600,
)

# -------------------------------------------------------------------
# Global exception handler — avoid leaking stack traces
# -------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request data.", "errors": exc.errors()},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# -------------------------------------------------------------------
# API Routes
# -------------------------------------------------------------------
app.include_router(health.router,     prefix=settings.API_V1_STR,              tags=["Health"])
app.include_router(auth.router,       prefix=f"{settings.API_V1_STR}/auth",    tags=["Auth"])
app.include_router(rules.router,      prefix=f"{settings.API_V1_STR}/rules",   tags=["Rules & Guidelines"])
app.include_router(policies.router,   prefix=f"{settings.API_V1_STR}/policies",tags=["Policies"])
app.include_router(documents.router,  prefix=f"{settings.API_V1_STR}/documents",tags=["Documents"])
app.include_router(reviews.router,    prefix=f"{settings.API_V1_STR}/reviews", tags=["Reviews"])
app.include_router(findings.router,   prefix=f"{settings.API_V1_STR}/findings",tags=["Findings"])
app.include_router(reports.router,    prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])

# -------------------------------------------------------------------
# Serve built React frontend (SPA catch-all)
# -------------------------------------------------------------------
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Prevent path traversal: only serve from FRONTEND_DIR
        safe_path = (FRONTEND_DIR / full_path).resolve()
        if not str(safe_path).startswith(str(FRONTEND_DIR)):
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})
        if full_path and safe_path.is_file():
            return FileResponse(safe_path)
        return FileResponse(FRONTEND_DIR / "index.html")

# -------------------------------------------------------------------
# Dev runner
# -------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
    )
