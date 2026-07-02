from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.utils import get_openapi
from pydantic import ValidationError

from app.core.settings import settings
from app.core.database import check_db_connection
from app.api.routes import auth, employees, departments, leave, attendance, payroll, recruitment, notifications, documents, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    ok = check_db_connection()
    if ok:
        print("✅  Database connected")
    else:
        print("❌  Database connection failed — check DATABASE_URL in .env")
    yield
    print("👋  Server shutting down")


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=(
        "HR Portal REST API — FastAPI + SQLAlchemy 2.0 + MySQL\n\n"
        "**How to authenticate in Swagger:**\n"
        "1. Call `POST /api/auth/login` with your credentials\n"
        "2. Copy the `access_token` from the response\n"
        "3. Click the **Authorize 🔒** button (top-right) and paste: `Bearer <token>`"
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── OpenAPI JWT auth scheme (enables the Authorize button in Swagger) ─────────

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    # Apply security globally to all operations
    for path_data in schema.get("paths", {}).values():
        for operation in path_data.values():
            if isinstance(operation, dict):
                operation.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi  # type: ignore

# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        errors.append({
            "field": ".".join(str(l) for l in err["loc"] if l != "body"),
            "message": err["msg"],
        })
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(ValidationError)
async def pydantic_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation error", "errors": exc.errors()},
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/health", tags=["Health"])
def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
    }


# ── Routers ───────────────────────────────────────────────────────────────────

PREFIX = "/api"

app.include_router(auth.router,          prefix=PREFIX)
app.include_router(employees.router,     prefix=PREFIX)
app.include_router(departments.router,   prefix=PREFIX)
app.include_router(leave.router,         prefix=PREFIX)
app.include_router(attendance.router,    prefix=PREFIX)
app.include_router(payroll.router,       prefix=PREFIX)
app.include_router(recruitment.router,   prefix=PREFIX)
app.include_router(notifications.router, prefix=PREFIX)
app.include_router(documents.router,     prefix=PREFIX)
app.include_router(admin.router,         prefix=PREFIX)
