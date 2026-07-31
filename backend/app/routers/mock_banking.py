from datetime import date
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import MockBankingImportResponse, TransactionCreate

router = APIRouter(prefix="/api/v1/mock-banking", tags=["mock-banking"])

DemoPersona = Literal["worker", "student"]


@router.post("/import", response_model=MockBankingImportResponse, status_code=status.HTTP_201_CREATED)
def import_mock_banking_transactions(
    persona: DemoPersona = Query(),
    period: str = Query(pattern=r"^\d{4}-\d{2}$"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MockBankingImportResponse:
    repository = FinanceRepository(db)
    demo_rows = build_demo_transactions(persona, period)
    inserted = 0

    for row in demo_rows:
        existing = repository.get_transaction_by_external_id(current_user.user_id, row["external_id"])
        if existing is not None:
            continue
        repository.create_transaction(
            current_user.user_id,
            TransactionCreate(
                amount=row["amount"],
                kind=row["kind"],
                occurred_at=row["occurred_at"],
                description=row["description"],
                category_name=row["category_name"],
            ),
            is_synthetic=True,
            external_id=row["external_id"],
        )
        inserted += 1

    return MockBankingImportResponse(
        persona=persona,
        period=period,
        inserted=inserted,
        total_demo_rows=len(demo_rows),
    )


def build_demo_transactions(persona: DemoPersona, period: str) -> list[dict]:
    year, month = [int(part) for part in period.split("-")]
    common_rows = [
        _row(persona, period, "food-01", Decimal("12500"), "expense", date(year, month, 3), "점심", "식비"),
        _row(persona, period, "coffee-01", Decimal("5200"), "expense", date(year, month, 6), "카페", "카페"),
        _row(persona, period, "transport-01", Decimal("65000"), "expense", date(year, month, 8), "교통비", "교통"),
    ]
    if persona == "worker":
        return [
            _row(persona, period, "salary", Decimal("2800000"), "income", date(year, month, 1), "월급", "급여"),
            _row(persona, period, "rent", Decimal("550000"), "expense", date(year, month, 2), "월세", "주거"),
            *common_rows,
            _row(persona, period, "dinner-01", Decimal("42000"), "expense", date(year, month, 12), "저녁 약속", "외식"),
        ]
    return [
        _row(persona, period, "allowance", Decimal("500000"), "income", date(year, month, 1), "용돈", "용돈"),
        _row(persona, period, "part-time", Decimal("420000"), "income", date(year, month, 10), "아르바이트", "아르바이트"),
        *common_rows,
        _row(persona, period, "book-01", Decimal("38000"), "expense", date(year, month, 13), "전공 서적", "학업"),
    ]


def _row(
    persona: DemoPersona,
    period: str,
    suffix: str,
    amount: Decimal,
    kind: Literal["income", "expense"],
    occurred_at: date,
    description: str,
    category_name: str,
) -> dict:
    return {
        "external_id": f"demo:{persona}:{period}:{suffix}",
        "amount": amount,
        "kind": kind,
        "occurred_at": occurred_at,
        "description": description,
        "category_name": category_name,
    }
