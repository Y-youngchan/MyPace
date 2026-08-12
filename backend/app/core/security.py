from dataclasses import dataclass
from uuid import UUID

import httpx
import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import get_settings


@dataclass(frozen=True)
class CurrentUser:
    user_id: UUID
    email: str | None = None
    provider: str = "email"


class SupabaseTokenVerifier:
    def __init__(self) -> None:
        settings = get_settings()
        self.supabase_url = settings.supabase_url.rstrip("/")
        self.issuer = settings.supabase_jwt_issuer
        self.publishable_key = settings.supabase_publishable_key
        self.jwks_client = PyJWKClient(f"{self.supabase_url}/auth/v1/.well-known/jwks.json")

    def verify(self, token: str) -> CurrentUser:
        try:
            return self._verify_with_jwks(token)
        except Exception:
            return self._verify_with_auth_server(token)

    def _verify_with_jwks(self, token: str) -> CurrentUser:
        signing_key = self.jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            issuer=self.issuer,
            options={"require": ["exp", "sub"]},
        )
        provider = payload.get("app_metadata", {}).get("provider") or "email"
        return CurrentUser(
            user_id=UUID(payload["sub"]),
            email=payload.get("email"),
            provider=provider,
        )

    def _verify_with_auth_server(self, token: str) -> CurrentUser:
        if not self.supabase_url or not self.publishable_key:
            self._raise_unauthorized()

        try:
            response = httpx.get(
                f"{self.supabase_url}/auth/v1/user",
                headers={
                    "apikey": self.publishable_key,
                    "Authorization": f"Bearer {token}",
                },
                timeout=5.0,
            )
            response.raise_for_status()
            payload = response.json()
            provider = payload.get("app_metadata", {}).get("provider") or "email"
            return CurrentUser(
                user_id=UUID(payload["id"]),
                email=payload.get("email"),
                provider=provider,
            )
        except Exception as exc:
            self._raise_unauthorized(exc)

    def _raise_unauthorized(self, exc: Exception | None = None) -> None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 로그인입니다.",
        ) from exc
