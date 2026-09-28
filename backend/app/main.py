from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import health, documents, reviews, rules, auth, findings, reports, policies
from app.core.config import settings
from app.database.database import engine, Base
from app.database import models
from app.database.seed import seed_db

# Create database tables and seed sample records
Base.metadata.create_all(bind=engine)
seed_db()

app = FastAPI(
    title="AURELIA — Academic Unified Review Engine",
    description="Adaptive Multi-Agent System for Lecturer-Guided Review of Student Academic Project Documents",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(rules.router, prefix=f"{settings.API_V1_STR}/rules", tags=["Rules & Guidelines"])
app.include_router(policies.router, prefix=f"{settings.API_V1_STR}/policies", tags=["Policies"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(reviews.router, prefix=f"{settings.API_V1_STR}/reviews", tags=["Reviews"])
app.include_router(findings.router, prefix=f"{settings.API_V1_STR}/findings", tags=["Findings"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
