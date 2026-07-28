from dataclasses import dataclass
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import get_settings


@dataclass(frozen=True)
class CurrentUser:
    user_id: UUID
    email: str | None = None


class SupabaseTokenVerifier:
    def __init__(self) -> None:
        settings = get_settings()
        self.supabase_url = settings.supabase_url.rstrip("/")
        self.issuer = settings.supabase_jwt_issuer
        self.jwks_client = PyJWKClient(f"{self.supabase_url}/auth/v1/.well-known/jwks.json")

    def verify(self, token: str) -> CurrentUser:
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256", "ES256"],
                issuer=self.issuer,
                options={"require": ["exp", "sub"]},
            )
            return CurrentUser(
                user_id=UUID(payload["sub"]),
                email=payload.get("email"),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않거나 만료된 로그인입니다.",
            ) from exc
