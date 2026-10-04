import time
from collections import defaultdict
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.config import settings

class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # Store timestamp lists per IP: endpoint_category -> ip -> list of timestamps
        self.requests: Dict[str, Dict[str, List[float]]] = {
            "auth": defaultdict(list),
            "ai": defaultdict(list),
            "general": defaultdict(list)
        }

    async def dispatch(self, request: Request, call_next):
        # Extract client IP (respecting X-Forwarded-For if behind a proxy)
        client_ip = request.headers.get("x-forwarded-for")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        path = request.url.path
        method = request.method
        now = time.time()
        window = 60.0  # 1-minute window

        # Determine rate limit category and threshold
        category = "general"
        limit = settings.RATE_LIMIT_GENERAL_PER_MINUTE

        if path.endswith("/auth/login") or path.endswith("/auth/register"):
            category = "auth"
            limit = settings.RATE_LIMIT_LOGIN_PER_MINUTE
        elif "/reviews" in path and method == "POST":
            category = "ai"
            limit = settings.RATE_LIMIT_AI_PER_MINUTE

        # Clean old timestamps
        history = self.requests[category][client_ip]
        cutoff = now - window
        history[:] = [ts for ts in history if ts > cutoff]

        if len(history) >= limit:
            retry_after = int(window - (now - history[0])) if history else 60
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Too many requests, please slow down."},
                headers={"Retry-After": str(max(1, retry_after))}
            )

        history.append(now)
        return await call_next(request)
