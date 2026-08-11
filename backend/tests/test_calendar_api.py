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
from app.models.entities import Base, Category, FinancialAccount, IncomeEntry, IncomeSource, Transaction


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


def test_listing_calendar_events_combines_owner_income_and_transactions(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    owner_source = IncomeSource(user_id=user_id, name="월급", source_type="salary")
    other_source = IncomeSource(user_id=other_user_id, name="남의 월급", source_type="salary")
    owner_account = FinancialAccount(user_id=user_id, name="현금", account_type="cash")
    other_account = FinancialAccount(user_id=other_user_id, name="현금", account_type="cash")
    owner_category = Category(user_id=user_id, name="식비", category_type="expense")
    other_category = Category(user_id=other_user_id, name="식비", category_type="expense")
    db_session.add_all([owner_source, other_source, owner_account, other_account, owner_category, other_category])
    db_session.flush()
    db_session.add_all(
        [
            IncomeEntry(
                user_id=user_id,
                source_id=owner_source.id,
                period=date(2026, 8, 1),
                expected_amount=Decimal("2800000"),
                actual_amount=Decimal("2750000"),
                received_at=date(2026, 8, 25),
            ),
            IncomeEntry(
                user_id=other_user_id,
                source_id=other_source.id,
                period=date(2026, 8, 1),
                expected_amount=Decimal("9990000"),
                actual_amount=Decimal("9990000"),
                received_at=date(2026, 8, 25),
            ),
            Transaction(
                user_id=user_id,
                account_id=owner_account.id,
                category_id=owner_category.id,
                amount=Decimal("12000"),
                description="점심 식사",
                occurred_at=datetime(2026, 8, 3, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=other_user_id,
                account_id=other_account.id,
                category_id=other_category.id,
                amount=Decimal("88000"),
                description="남의 거래",
                occurred_at=datetime(2026, 8, 3, tzinfo=UTC),
                transaction_type="expense",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/calendar/events?period=2026-08")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["점심 식사", "월급 입금"]
    assert response.json()[0]["event_type"] == "expense"
    assert response.json()[0]["amount"] == "12000.00"
    assert response.json()[1]["event_type"] == "income"
    assert response.json()[1]["amount"] == "2750000.00"


def test_calendar_period_must_use_year_month_format(client: TestClient) -> None:
    response = client.get("/api/v1/calendar/events?period=2026")

    assert response.status_code == 422
