from uuid import uuid4
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

import app.core.security as security
from app.core.security import SupabaseTokenVerifier


def test_token_verifier_falls_back_to_supabase_auth_user_endpoint(monkeypatch: pytest.MonkeyPatch) -> None:
    user_id = uuid4()

    def fail_jwks_verification(*_args, **_kwargs):
        raise RuntimeError("jwks unavailable")

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "id": str(user_id),
                "email": "youngchan@example.com",
                "app_metadata": {"provider": "google"},
            }

    def fake_get(url: str, *, headers: dict[str, str], timeout: float) -> FakeResponse:
        assert url == "https://example.supabase.co/auth/v1/user"
        assert headers == {
            "apikey": "publishable-key",
            "Authorization": "Bearer access-token",
        }
        assert timeout == 5.0
        return FakeResponse()

    monkeypatch.setattr("app.core.security.PyJWKClient", lambda *_args, **_kwargs: object())
    monkeypatch.setattr("app.core.security.jwt.get_unverified_header", lambda _token: {"alg": "HS256"})
    monkeypatch.setattr("app.core.security.jwt.decode", fail_jwks_verification)
    monkeypatch.setattr(security, "httpx", SimpleNamespace(get=fake_get), raising=False)
    monkeypatch.setattr("app.core.security.get_settings", lambda: _settings())

    current_user = SupabaseTokenVerifier().verify("access-token")

    assert current_user.user_id == user_id
    assert current_user.email == "youngchan@example.com"
    assert current_user.provider == "google"


def test_token_verifier_returns_unauthorized_when_no_verification_method_is_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_jwks_verification(*_args, **_kwargs):
        raise RuntimeError("jwks unavailable")

    monkeypatch.setattr("app.core.security.PyJWKClient", lambda *_args, **_kwargs: object())
    monkeypatch.setattr("app.core.security.jwt.get_unverified_header", lambda _token: {"alg": "HS256"})
    monkeypatch.setattr("app.core.security.jwt.decode", fail_jwks_verification)
    monkeypatch.setattr("app.core.security.get_settings", lambda: _settings(supabase_publishable_key=""))

    with pytest.raises(HTTPException) as exc:
        SupabaseTokenVerifier().verify("access-token")

    assert exc.value.status_code == 401
    assert exc.value.detail == "유효하지 않거나 만료된 로그인입니다."


def _settings(supabase_publishable_key: str = "publishable-key"):
    return SimpleNamespace(
        supabase_url="https://example.supabase.co",
        supabase_jwt_issuer="https://example.supabase.co/auth/v1",
        supabase_publishable_key=supabase_publishable_key,
    )
