from datetime import UTC, date, datetime, time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.models.entities import IncomeEntry, Transaction
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import TransactionCreate, TransactionListResponse, TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/api/v1/transactions", tags=["transactions"])


@router.get("", response_model=TransactionListResponse)
def list_transactions(
    start: date | None = None,
    end: date | None = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionListResponse:
    repository = FinanceRepository(db)
    transactions = repository.list_transactions(current_user.user_id, start, end)
    income_entries = _filter_income_entries(repository.list_income_entries(current_user.user_id), start, end)
    items = [_to_response(transaction) for transaction in transactions] + [_income_to_response(entry) for entry in income_entries]
    items.sort(key=lambda item: item.occurred_at, reverse=True)

    return TransactionListResponse(
        items=items,
        total=len(items),
    )


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_data: TransactionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = FinanceRepository(db).create_transaction(current_user.user_id, transaction_data)
    return _to_response(transaction)


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: UUID,
    transaction_data: TransactionUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = FinanceRepository(db).update_transaction(
        current_user.user_id,
        transaction_id,
        transaction_data,
    )
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="거래를 찾을 수 없습니다.")
    return _to_response(transaction)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    deleted = FinanceRepository(db).delete_transaction(current_user.user_id, transaction_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="거래를 찾을 수 없습니다.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _to_response(transaction: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=transaction.id,
        user_id=transaction.user_id,
        amount=transaction.amount,
        kind=transaction.transaction_type,
        occurred_at=transaction.occurred_at,
        description=transaction.description,
        category_name=transaction.category.name if transaction.category else None,
        category_id=transaction.category_id,
        account_id=transaction.account_id,
        is_synthetic=transaction.is_synthetic,
    )


def _income_to_response(entry: IncomeEntry) -> TransactionResponse:
    occurred_on = entry.received_at or entry.period
    amount = entry.actual_amount or entry.expected_amount
    source_name = entry.source.name if entry.source else "기본 수입"

    return TransactionResponse(
        id=entry.id,
        user_id=entry.user_id,
        amount=amount,
        kind="income",
        occurred_at=datetime.combine(occurred_on, time.min, tzinfo=UTC),
        description=source_name,
        category_name=source_name,
        category_id=None,
        account_id=None,
        is_synthetic=True,
    )


def _filter_income_entries(
    entries: list[IncomeEntry],
    start: date | None,
    end: date | None,
) -> list[IncomeEntry]:
    filtered_entries: list[IncomeEntry] = []

    for entry in entries:
        event_date = entry.received_at or entry.period
        if start is not None and event_date < start:
            continue
        if end is not None and event_date > end:
            continue
        filtered_entries.append(entry)

    return filtered_entries
