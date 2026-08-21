from collections.abc import Generator
from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.main import app
from app.models.entities import Base, Budget, BudgetItem, Category, FinancialAccount, IncomeEntry, IncomeSource, Transaction


@pytest.fixture()
def db_session() -> Generator[Session]:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        yield session


@pytest.fixture()
def user_id():
    return uuid4()


@pytest.fixture()
def client(db_session: Session, user_id) -> Generator[TestClient]:
    def override_get_db() -> Generator[Session]:
        yield db_session

    def override_current_user() -> CurrentUser:
        return CurrentUser(user_id=user_id, email="owner@example.com")

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_dashboard_summary_combines_monthly_income_expenses_budget_and_recent_transactions(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    source = IncomeSource(user_id=user_id, name="월급", source_type="salary")
    account = FinancialAccount(user_id=user_id, name="현금", account_type="cash")
    food = Category(user_id=user_id, name="식비", category_type="expense")
    transport = Category(user_id=user_id, name="교통", category_type="expense")
    other = Category(user_id=uuid4(), name="식비", category_type="expense")
    db_session.add_all([source, account, food, transport, other])
    db_session.flush()

    budget = Budget(user_id=user_id, period=date(2026, 8, 1), basis_income_amount=Decimal("2800000"))
    db_session.add(budget)
    db_session.flush()
    db_session.add_all(
        [
            BudgetItem(budget_id=budget.id, category_id=food.id, recommended_amount=Decimal("500000"), adjusted_amount=Decimal("500000")),
            BudgetItem(
                budget_id=budget.id,
                category_id=transport.id,
                recommended_amount=Decimal("200000"),
                adjusted_amount=Decimal("200000"),
            ),
        ]
    )
    db_session.add_all(
        [
            IncomeEntry(
                user_id=user_id,
                source_id=source.id,
                period=date(2026, 8, 1),
                expected_amount=Decimal("2800000"),
                actual_amount=Decimal("2750000"),
            ),
            Transaction(
                user_id=user_id,
                account_id=account.id,
                category_id=food.id,
                amount=Decimal("12000"),
                description="점심 식사",
                occurred_at=datetime(2026, 8, 12, 12, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=user_id,
                account_id=account.id,
                category_id=transport.id,
                amount=Decimal("55000"),
                description="지하철 정기권",
                occurred_at=datetime(2026, 8, 10, 9, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=other.user_id,
                account_id=account.id,
                category_id=other.id,
                amount=Decimal("999999"),
                description="남의 거래",
                occurred_at=datetime(2026, 8, 12, 9, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/dashboard/summary?period=2026-08-01")

    assert response.status_code == 200
    body = response.json()
    assert body["expected_income"] == "2800000.00"
    assert body["monthly_spent"] == "67000.00"
    assert body["remaining_living_money"] == "2733000.00"
    assert body["budget_usage_percent"] == 10
    assert body["recent_transactions"][0] == {
        "title": "점심 식사",
        "category": "식비",
        "amount": "12000.00",
    }
    assert body["budget_progress"][0] == {
        "category": "식비",
        "used_amount": "12000.00",
        "budget_amount": "500000.00",
        "used_percent": 2,
        "status": "여유",
    }
    assert body["weekly_actions"]


def test_dashboard_budget_progress_groups_expense_transactions_by_budget_bucket(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    account = FinancialAccount(user_id=user_id, name="현금", account_type="cash")
    rent = Category(user_id=user_id, name="월세/관리비", category_type="expense", cost_type="fixed")
    food = Category(user_id=user_id, name="식비", category_type="expense", cost_type="variable")
    savings = Category(user_id=user_id, name="저축/적금", category_type="expense", cost_type="fixed")
    db_session.add_all([account, rent, food, savings])
    db_session.flush()

    budget = Budget(user_id=user_id, period=date(2026, 8, 1), basis_income_amount=Decimal("3000000"))
    db_session.add(budget)
    db_session.flush()

    fixed_budget = Category(user_id=user_id, name="고정비", category_type="budget")
    living_budget = Category(user_id=user_id, name="생활비", category_type="budget")
    savings_budget = Category(user_id=user_id, name="저축", category_type="budget")
    db_session.add_all([fixed_budget, living_budget, savings_budget])
    db_session.flush()

    db_session.add_all(
        [
            BudgetItem(
                budget_id=budget.id,
                category_id=fixed_budget.id,
                recommended_amount=Decimal("1000000"),
                adjusted_amount=Decimal("1000000"),
            ),
            BudgetItem(
                budget_id=budget.id,
                category_id=living_budget.id,
                recommended_amount=Decimal("800000"),
                adjusted_amount=Decimal("800000"),
            ),
            BudgetItem(
                budget_id=budget.id,
                category_id=savings_budget.id,
                recommended_amount=Decimal("600000"),
                adjusted_amount=Decimal("600000"),
            ),
            Transaction(
                user_id=user_id,
                account_id=account.id,
                category_id=rent.id,
                amount=Decimal("500000"),
                description="월세",
                occurred_at=datetime(2026, 8, 5, 9, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=user_id,
                account_id=account.id,
                category_id=food.id,
                amount=Decimal("120000"),
                description="식비",
                occurred_at=datetime(2026, 8, 10, 9, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=user_id,
                account_id=account.id,
                category_id=savings.id,
                amount=Decimal("300000"),
                description="적금",
                occurred_at=datetime(2026, 8, 15, 9, 0, tzinfo=UTC),
                transaction_type="expense",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/dashboard/summary?period=2026-08-01")

    assert response.status_code == 200
    progress = {item["category"]: item for item in response.json()["budget_progress"]}
    assert progress["고정비"]["used_amount"] == "500000.00"
    assert progress["고정비"]["used_percent"] == 50
    assert progress["생활비"]["used_amount"] == "120000.00"
    assert progress["생활비"]["used_percent"] == 15
    assert progress["저축"]["used_amount"] == "300000.00"
    assert progress["저축"]["used_percent"] == 50
