from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.main import app
from app.models.entities import Base, Category


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


def test_listing_categories_returns_only_the_token_users_rows(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    db_session.add_all(
        [
            Category(user_id=user_id, name="식비", category_type="expense"),
            Category(user_id=user_id, name="월급", category_type="income"),
            Category(user_id=other_user_id, name="남의 카테고리", category_type="expense"),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/categories")

    assert response.status_code == 200
    assert [item["name"] for item in response.json()] == ["식비", "월급"]


def test_creating_category_assigns_token_user(client: TestClient, db_session: Session, user_id) -> None:
    response = client.post("/api/v1/categories", json={"name": "교통", "kind": "expense"})

    saved = db_session.query(Category).one()

    assert response.status_code == 201
    assert response.json()["name"] == "교통"
    assert response.json()["kind"] == "expense"
    assert saved.user_id == user_id


def test_updating_category_changes_name_and_kind(client: TestClient) -> None:
    created_response = client.post("/api/v1/categories", json={"name": "카페", "kind": "expense"})

    response = client.put(
        f"/api/v1/categories/{created_response.json()['id']}",
        json={"name": "부수입", "kind": "income"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "부수입"
    assert response.json()["kind"] == "income"


def test_creating_duplicate_category_returns_409(client: TestClient) -> None:
    client.post("/api/v1/categories", json={"name": "식비", "kind": "expense"})

    response = client.post("/api/v1/categories", json={"name": "식비", "kind": "expense"})

    assert response.status_code == 409
