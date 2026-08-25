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
from app.models.entities import Base, IncomeEntry, IncomeSource


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


def test_creating_income_entry_assigns_token_user(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    response = client.post(
        "/api/v1/incomes",
        json={
            "source_name": "월급",
            "source_type": "salary",
            "period": "2026-08-01",
            "expected_amount": "2800000",
            "actual_amount": "2750000",
            "received_at": "2026-08-25",
        },
    )

    saved_entry = db_session.query(IncomeEntry).one()
    saved_source = db_session.query(IncomeSource).one()

    assert response.status_code == 201
    assert response.json()["user_id"] == str(user_id)
    assert response.json()["expected_amount"] == "2800000.00"
    assert response.json()["actual_amount"] == "2750000.00"
    assert saved_entry.user_id == user_id
    assert saved_source.user_id == user_id
    assert saved_source.name == "월급"


def test_listing_income_entries_returns_only_the_token_users_rows(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    owner_source = IncomeSource(user_id=user_id, name="내 월급", source_type="salary")
    other_source = IncomeSource(user_id=other_user_id, name="남의 월급", source_type="salary")
    db_session.add_all([owner_source, other_source])
    db_session.flush()
    db_session.add_all(
        [
                IncomeEntry(
                    user_id=user_id,
                    source_id=owner_source.id,
                    period=date(2026, 8, 1),
                    expected_amount=Decimal("2800000"),
                    actual_amount=Decimal("2750000"),
                ),
                IncomeEntry(
                    user_id=other_user_id,
                    source_id=other_source.id,
                    period=date(2026, 8, 1),
                    expected_amount=Decimal("9900000"),
                    actual_amount=Decimal("9900000"),
                ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/incomes")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["user_id"] == str(user_id)
    assert response.json()[0]["expected_amount"] == "2800000.00"


def test_deleting_income_entry_removes_only_the_token_users_row(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    owner_source = IncomeSource(user_id=user_id, name="내 월급", source_type="salary")
    other_source = IncomeSource(user_id=other_user_id, name="남의 월급", source_type="salary")
    db_session.add_all([owner_source, other_source])
    db_session.flush()
    owner_entry = IncomeEntry(
        user_id=user_id,
        source_id=owner_source.id,
        period=date(2026, 8, 1),
        expected_amount=Decimal("2800000"),
        actual_amount=Decimal("2750000"),
    )
    other_entry = IncomeEntry(
        user_id=other_user_id,
        source_id=other_source.id,
        period=date(2026, 8, 1),
        expected_amount=Decimal("9900000"),
        actual_amount=Decimal("9900000"),
    )
    db_session.add_all([owner_entry, other_entry])
    db_session.commit()

    response = client.delete(f"/api/v1/incomes/{owner_entry.id}")

    assert response.status_code == 204
    assert db_session.get(IncomeEntry, owner_entry.id) is None
    assert db_session.get(IncomeEntry, other_entry.id) is not None


def test_income_expected_amount_must_be_positive(client: TestClient) -> None:
    response = client.post(
        "/api/v1/incomes",
        json={
            "source_name": "월급",
            "source_type": "salary",
            "period": "2026-08-01",
            "expected_amount": 0,
        },
    )

    assert response.status_code == 422
