from collections.abc import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.entities import Base, Profile


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


def test_signup_profile_stores_plain_nickname_and_phone_number(
    client: TestClient,
    db_session: Session,
) -> None:
    user_id = uuid4()

    response = client.post(
        "/api/v1/account-recovery/signup-profile",
        json={
            "user_id": str(user_id),
            "email": "youngchan@example.com",
            "display_name": "영찬",
            "full_name": "유영찬",
            "nickname": "찬이",
            "phone_number": "010-1234-5678",
            "user_type": "worker",
        },
    )

    profile = db_session.get(Profile, user_id)

    assert response.status_code == 201
    assert profile is not None
    assert profile.nickname == "찬이"
    assert profile.nickname_tag.isdigit()
    assert len(profile.nickname_tag) == 4
    assert profile.phone_number == "010-1234-5678"


def test_same_nickname_can_be_used_with_different_tags(
    client: TestClient,
    db_session: Session,
) -> None:
    first_user_id = uuid4()
    second_user_id = uuid4()

    first_response = client.post(
        "/api/v1/account-recovery/signup-profile",
        json={
            "user_id": str(first_user_id),
            "email": "first@example.com",
            "display_name": "찬이",
            "full_name": "유영찬",
            "nickname": "찬이",
            "phone_number": "010-1111-1111",
            "user_type": "worker",
        },
    )
    second_response = client.post(
        "/api/v1/account-recovery/signup-profile",
        json={
            "user_id": str(second_user_id),
            "email": "second@example.com",
            "display_name": "찬이",
            "full_name": "김영찬",
            "nickname": "찬이",
            "phone_number": "010-2222-2222",
            "user_type": "worker",
        },
    )

    first_profile = db_session.get(Profile, first_user_id)
    second_profile = db_session.get(Profile, second_user_id)

    assert first_response.status_code == 201
    assert second_response.status_code == 201
    assert first_profile is not None
    assert second_profile is not None
    assert first_profile.nickname == second_profile.nickname == "찬이"
    assert first_profile.nickname_tag != second_profile.nickname_tag


def test_signup_profile_rejects_nicknames_over_ten_characters(client: TestClient) -> None:
    response = client.post(
        "/api/v1/account-recovery/signup-profile",
        json={
            "user_id": str(uuid4()),
            "email": "youngchan@example.com",
            "display_name": "길이가긴닉네임입니다요",
            "full_name": "유영찬",
            "nickname": "길이가긴닉네임입니다요",
            "phone_number": "010-1234-5678",
            "user_type": "worker",
        },
    )

    assert response.status_code == 422


def test_find_email_with_name_and_phone_number(client: TestClient, db_session: Session) -> None:
    db_session.add(
        Profile(
            user_id=uuid4(),
            display_name="영찬",
            full_name="유영찬",
            nickname="찬이",
            phone_number="010-1234-5678",
            user_type="worker",
            email="youngchan@example.com",
            primary_auth_provider="email",
            auth_providers="email",
        )
    )
    db_session.commit()

    response = client.post(
        "/api/v1/account-recovery/find-email",
        json={"full_name": "유영찬", "phone_number": "01012345678"},
    )

    assert response.status_code == 200
    assert response.json() == {"emails": ["youngchan@example.com"]}


def test_verify_password_reset_requires_email_name_and_phone(client: TestClient, db_session: Session) -> None:
    db_session.add(
        Profile(
            user_id=uuid4(),
            display_name="영찬",
            full_name="유영찬",
            nickname="찬이",
            phone_number="010-1234-5678",
            user_type="worker",
            email="youngchan@example.com",
            primary_auth_provider="email",
            auth_providers="email",
        )
    )
    db_session.commit()

    response = client.post(
        "/api/v1/account-recovery/verify-password-reset",
        json={
            "email": "youngchan@example.com",
            "full_name": "유영찬",
            "phone_number": "01012345678",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"can_reset": True}
