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
            Category(user_id=user_id, name="반려동물", category_type="expense"),
            Category(user_id=other_user_id, name="남의 카테고리", category_type="expense"),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/categories")
    names = [item["name"] for item in response.json()]

    assert response.status_code == 200
    assert "식비" in names
    assert "월급" in names
    assert "반려동물" in names
    assert "남의 카테고리" not in names
    assert "월세/관리비" in names
    assert names.count("식비") == 1
    assert names.count("월급") == 1


def test_listing_categories_seeds_default_categories_for_new_users(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    response = client.get("/api/v1/categories")

    saved_categories = db_session.query(Category).filter(Category.user_id == user_id).all()
    response_items = response.json()
    expense_names = {item["name"] for item in response_items if item["kind"] == "expense"}
    income_names = {item["name"] for item in response_items if item["kind"] == "income"}

    assert response.status_code == 200
    assert len(saved_categories) == len(response_items)
    assert next(item for item in response_items if item["name"] == "월세/관리비")["cost_type"] == "fixed"
    assert next(item for item in response_items if item["name"] == "식비")["cost_type"] == "variable"
    assert next(item for item in response_items if item["name"] == "월급")["cost_type"] is None
    assert {
        "월세/관리비",
        "통신비",
        "보험료",
        "구독료",
        "대출/할부",
        "교통 정기권",
        "공과금",
        "교육비",
        "저축/적금",
        "기타 고정비",
        "식비",
        "카페/간식",
        "교통",
        "쇼핑",
        "생활용품",
        "병원/약국",
        "문화/취미",
        "경조사",
        "여행",
        "기타 지출",
    }.issubset(expense_names)
    assert {"월급", "부수입", "보너스", "환급/정산", "기타 수입"}.issubset(income_names)


def test_listing_categories_ignores_budget_only_categories(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    db_session.add(Category(user_id=user_id, name="고정비", category_type="budget"))
    db_session.commit()

    response = client.get("/api/v1/categories")
    names = [item["name"] for item in response.json()]
    kinds = {item["kind"] for item in response.json()}

    assert response.status_code == 200
    assert "고정비" not in names
    assert kinds <= {"expense", "income"}
    assert "식비" in names
    assert "월급" in names


def test_creating_category_assigns_token_user(client: TestClient, db_session: Session, user_id) -> None:
    response = client.post("/api/v1/categories", json={"name": "교통", "kind": "expense", "cost_type": "variable"})

    saved = db_session.query(Category).one()

    assert response.status_code == 201
    assert response.json()["name"] == "교통"
    assert response.json()["kind"] == "expense"
    assert response.json()["cost_type"] == "variable"
    assert saved.cost_type == "variable"
    assert saved.user_id == user_id


def test_updating_category_changes_name_and_kind(client: TestClient) -> None:
    created_response = client.post("/api/v1/categories", json={"name": "카페", "kind": "expense", "cost_type": "variable"})

    response = client.put(
        f"/api/v1/categories/{created_response.json()['id']}",
        json={"name": "부수입", "kind": "income", "cost_type": None},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "부수입"
    assert response.json()["kind"] == "income"
    assert response.json()["cost_type"] is None


def test_deleting_category_removes_only_the_token_users_row(
    client: TestClient,
    db_session: Session,
    user_id,
) -> None:
    other_user_id = uuid4()
    owner_category = Category(user_id=user_id, name="식비", category_type="expense", cost_type="variable")
    other_category = Category(user_id=other_user_id, name="식비", category_type="expense", cost_type="variable")
    db_session.add_all([owner_category, other_category])
    db_session.commit()

    response = client.delete(f"/api/v1/categories/{owner_category.id}")

    assert response.status_code == 204
    assert db_session.get(Category, owner_category.id) is None
    assert db_session.get(Category, other_category.id) is not None


def test_creating_duplicate_category_returns_409(client: TestClient) -> None:
    client.post("/api/v1/categories", json={"name": "식비", "kind": "expense"})

    response = client.post("/api/v1/categories", json={"name": "식비", "kind": "expense"})

    assert response.status_code == 409
