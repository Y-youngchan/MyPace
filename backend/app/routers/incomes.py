from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
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


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income_entry(
    entry_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = FinanceRepository(db).delete_income_entry(current_user.user_id, entry_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="수입을 찾을 수 없습니다.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
