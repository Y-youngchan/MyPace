from calendar import monthrange
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import CalendarEventResponse

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])


@router.get("/events", response_model=list[CalendarEventResponse])
def list_calendar_events(
    period: str = Query(pattern=r"^\d{4}-\d{2}$"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CalendarEventResponse]:
    start, end = _month_range(period)
    repository = FinanceRepository(db)
    events: list[CalendarEventResponse] = []

    for entry in repository.list_income_entries(current_user.user_id):
        event_date = entry.received_at or entry.period
        if start <= event_date <= end:
            events.append(
                CalendarEventResponse(
                    id=f"income-{entry.id}",
                    event_date=event_date,
                    event_type="income",
                    title="월급 입금",
                    amount=entry.actual_amount or entry.expected_amount,
                )
            )

    for transaction in repository.list_transactions(current_user.user_id, start=start, end=end):
        events.append(
            CalendarEventResponse(
                id=f"transaction-{transaction.id}",
                event_date=transaction.occurred_at.date(),
                event_type=transaction.transaction_type,
                title=transaction.description or "거래",
                amount=transaction.amount,
            )
        )

    return sorted(events, key=lambda event: (event.event_date, event.title))


def _month_range(period: str) -> tuple[date, date]:
    try:
        year_text, month_text = period.split("-")
        year = int(year_text)
        month = int(month_text)
        last_day = monthrange(year, month)[1]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="period는 YYYY-MM 형식이어야 해요.") from exc

    return date(year, month, 1), date(year, month, last_day)
