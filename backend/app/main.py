from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers.budgets import router as budgets_router
from app.routers.calendar import router as calendar_router
from app.routers.categories import router as categories_router
from app.routers.dashboard import router as dashboard_router
from app.routers.account_recovery import router as account_recovery_router
from app.routers.incomes import router as incomes_router
from app.routers.mock_banking import router as mock_banking_router
from app.routers.profile import router as profile_router
from app.routers.transactions import router as transactions_router

settings = get_settings()
app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(budgets_router)
app.include_router(calendar_router)
app.include_router(categories_router)
app.include_router(dashboard_router)
app.include_router(incomes_router)
app.include_router(mock_banking_router)
app.include_router(profile_router)
app.include_router(account_recovery_router)
app.include_router(transactions_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
