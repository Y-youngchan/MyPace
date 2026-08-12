from collections.abc import Generator
from datetime import date
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
from app.models.entities import Base, Budget, BudgetItem, Category


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


def test_getting_budget_returns_the_token_users_saved_budget(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    food = Category(user_id=user_id, name="식비", category_type="budget")
    living = Category(user_id=user_id, name="생활비", category_type="budget")
    other_food = Category(user_id=other_user_id, name="식비", category_type="budget")
    db_session.add_all([food, living, other_food])
    db_session.flush()

    owner_budget = Budget(user_id=user_id, period=date(2026, 8, 1), basis_income_amount=Decimal("2900000"), status="accepted")
    other_budget = Budget(
        user_id=other_user_id,
        period=date(2026, 8, 1),
        basis_income_amount=Decimal("9900000"),
        status="accepted",
    )
    db_session.add_all([owner_budget, other_budget])
    db_session.flush()
    db_session.add_all(
        [
            BudgetItem(
                budget_id=owner_budget.id,
                category_id=food.id,
                recommended_amount=Decimal("600000"),
                adjusted_amount=Decimal("650000"),
                reason="저장된 식비",
            ),
            BudgetItem(
                budget_id=owner_budget.id,
                category_id=living.id,
                recommended_amount=Decimal("800000"),
                adjusted_amount=Decimal("850000"),
                reason="저장된 생활비",
            ),
            BudgetItem(
                budget_id=other_budget.id,
                category_id=other_food.id,
                recommended_amount=Decimal("9900000"),
                adjusted_amount=Decimal("9900000"),
                reason="남의 예산",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/budgets/2026-08-01")

    assert response.status_code == 200
    assert response.json()["user_id"] == str(user_id)
    assert response.json()["basis_income_amount"] == "2900000"
    assert response.json()["status"] == "accepted"
    assert response.json()["items"] == {
        "식비": "650000.00",
        "생활비": "850000.00",
    }


def test_getting_missing_budget_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/budgets/2026-08-01")

    assert response.status_code == 404
