from collections.abc import Generator
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.entities import AuthProvider, Base, Profile


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
def client(db_session: Session) -> Generator[TestClient]:
    def override_get_db() -> Generator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_profile_requires_bearer_token(client: TestClient) -> None:
    response = client.get("/api/v1/profile")

    assert response.status_code == 401


def test_profile_returns_the_authenticated_users_profile(
    client: TestClient,
    db_session: Session,
) -> None:
    from app.dependencies import CurrentUser, get_current_user

    user_id = uuid4()
    db_session.add(
        Profile(
            user_id=user_id,
            display_name="Youngchan",
            full_name="유영찬",
            nickname="영찬",
            nickname_tag="0007",
            phone_number="010-1234-5678",
            user_type="worker",
            email="youngchan@example.com",
            primary_auth_provider=AuthProvider.EMAIL,
            auth_providers="email",
        )
    )
    db_session.commit()

    def override_current_user() -> CurrentUser:
        return CurrentUser(user_id=user_id, email="youngchan@example.com")

    app.dependency_overrides[get_current_user] = override_current_user

    response = client.get("/api/v1/profile")

    assert response.status_code == 200
    assert response.json() == {
        "user_id": str(user_id),
        "display_name": "Youngchan",
        "full_name": "유영찬",
        "nickname": "영찬",
        "nickname_tag": "0007",
        "phone_number": "010-1234-5678",
        "user_type": "worker",
        "email": "youngchan@example.com",
        "primary_auth_provider": "email",
        "auth_providers": ["email"],
    }


def test_profile_upsert_uses_token_user_not_request_user_id(
    client: TestClient,
    db_session: Session,
) -> None:
    from app.dependencies import CurrentUser, get_current_user

    token_user_id = uuid4()
    request_user_id = uuid4()

    def override_current_user() -> CurrentUser:
        return CurrentUser(user_id=token_user_id, email=None)

    app.dependency_overrides[get_current_user] = override_current_user

    response = client.put(
        "/api/v1/profile",
        json={
            "user_id": str(request_user_id),
            "display_name": "Token Owner",
            "full_name": "토큰 오너",
            "nickname": "토큰",
            "phone_number": "01099998888",
            "user_type": "student",
        },
    )

    saved_profile = db_session.get(Profile, token_user_id)

    assert response.status_code == 200
    assert response.json()["user_id"] == str(token_user_id)
    assert response.json()["email"] is None
    assert response.json()["primary_auth_provider"] == "email"
    assert response.json()["auth_providers"] == ["email"]
    assert db_session.get(Profile, UUID(str(request_user_id))) is None
    assert saved_profile is not None
    assert saved_profile.display_name == "Token Owner"
    assert saved_profile.full_name == "토큰 오너"
    assert saved_profile.nickname == "토큰"
    assert saved_profile.nickname_tag.isdigit()
    assert len(saved_profile.nickname_tag) == 4
    assert saved_profile.phone_number == "01099998888"
