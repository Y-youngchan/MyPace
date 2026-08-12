from collections.abc import Generator
from datetime import UTC, datetime
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
from app.models.entities import Base, Category, FinancialAccount, Transaction


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


def test_creating_transaction_assigns_token_user(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    response = client.post(
        "/api/v1/transactions",
        json={
            "amount": "12000",
            "kind": "expense",
            "occurred_at": "2026-07-03",
            "description": "점심",
        },
    )

    saved = db_session.query(Transaction).one()

    assert response.status_code == 201
    assert response.json()["user_id"] == str(user_id)
    assert saved.user_id == user_id


def test_listing_transactions_returns_only_the_token_users_rows(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    owner_account = FinancialAccount(user_id=user_id, name="현금", account_type="cash")
    other_account = FinancialAccount(user_id=other_user_id, name="현금", account_type="cash")
    owner_category = Category(user_id=user_id, name="식비", category_type="expense")
    other_category = Category(user_id=other_user_id, name="식비", category_type="expense")
    db_session.add_all([owner_account, other_account, owner_category, other_category])
    db_session.flush()
    db_session.add_all(
        [
            Transaction(
                user_id=user_id,
                account_id=owner_account.id,
                category_id=owner_category.id,
                amount=Decimal("7000"),
                description="내 거래",
                occurred_at=datetime(2026, 7, 4, tzinfo=UTC),
                transaction_type="expense",
            ),
            Transaction(
                user_id=other_user_id,
                account_id=other_account.id,
                category_id=other_category.id,
                amount=Decimal("99000"),
                description="남의 거래",
                occurred_at=datetime(2026, 7, 4, tzinfo=UTC),
                transaction_type="expense",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/transactions")

    assert response.status_code == 200
    assert [item["description"] for item in response.json()["items"]] == ["내 거래"]


def test_transaction_amount_must_be_positive(client: TestClient) -> None:
    response = client.post(
        "/api/v1/transactions",
        json={"amount": 0, "kind": "expense", "occurred_at": "2026-07-03"},
    )

    assert response.status_code == 422


def test_updating_transaction_returns_updated_category_name(client: TestClient) -> None:
    created_response = client.post(
        "/api/v1/transactions",
        json={
            "amount": "12000",
            "kind": "expense",
            "occurred_at": "2026-07-03",
            "description": "점심",
            "category_name": "식비",
        },
    )

    response = client.put(
        f"/api/v1/transactions/{created_response.json()['id']}",
        json={
            "amount": "18000",
            "kind": "expense",
            "occurred_at": "2026-07-04",
            "description": "저녁",
            "category_name": "외식",
        },
    )

    assert response.status_code == 200
    assert response.json()["amount"] == "18000.00"
    assert response.json()["description"] == "저녁"
    assert response.json()["category_name"] == "외식"


def test_deleting_transaction_removes_it_from_list(client: TestClient) -> None:
    created_response = client.post(
        "/api/v1/transactions",
        json={
            "amount": "12000",
            "kind": "expense",
            "occurred_at": "2026-07-03",
            "description": "점심",
            "category_name": "식비",
        },
    )

    response = client.delete(f"/api/v1/transactions/{created_response.json()['id']}")
    list_response = client.get("/api/v1/transactions")

    assert response.status_code == 204
    assert list_response.json()["items"] == []


def test_deleting_another_users_transaction_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    other_user_id = uuid4()
    account = FinancialAccount(user_id=other_user_id, name="현금", account_type="cash")
    category = Category(user_id=other_user_id, name="식비", category_type="expense")
    db_session.add_all([account, category])
    db_session.flush()
    transaction = Transaction(
        user_id=other_user_id,
        account_id=account.id,
        category_id=category.id,
        amount=Decimal("15000"),
        description="남의 거래",
        occurred_at=datetime(2026, 7, 5, tzinfo=UTC),
        transaction_type="expense",
    )
    db_session.add(transaction)
    db_session.commit()

    response = client.delete(f"/api/v1/transactions/{transaction.id}")

    assert response.status_code == 404


def test_mock_banking_import_is_idempotent(client: TestClient) -> None:
    first = client.post("/api/v1/mock-banking/import?persona=worker&period=2026-07")
    second = client.post("/api/v1/mock-banking/import?persona=worker&period=2026-07")

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["inserted"] > 0
    assert second.json()["inserted"] == 0
    assert first.json()["total_demo_rows"] == second.json()["total_demo_rows"]
