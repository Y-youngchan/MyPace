from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import IncomeEntryCreate, IncomeEntryResponse

router = APIRouter(prefix="/api/v1/incomes", tags=["incomes"])


@router.get("", response_model=list[IncomeEntryResponse])
def list_income_entries(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[IncomeEntryResponse]:
    entries = FinanceRepository(db).list_income_entries(current_user.user_id)
    return [IncomeEntryResponse.model_validate(entry) for entry in entries]


@router.post("", response_model=IncomeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_income_entry(
    entry_data: IncomeEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IncomeEntryResponse:
    entry = FinanceRepository(db).create_income_entry(current_user.user_id, entry_data)
    return IncomeEntryResponse.model_validate(entry)
