from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import DashboardSummaryResponse

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def read_dashboard_summary(
    period: date | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    summary_period = period or date.today().replace(day=1)
    summary = FinanceRepository(db).build_dashboard_summary(current_user.user_id, summary_period)
    return DashboardSummaryResponse(**summary)
