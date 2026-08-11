from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import ProfileResponse, ProfileUpsert

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def read_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = FinanceRepository(db).get_profile(current_user.user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로필이 아직 없습니다.",
        )
    return _to_profile_response(profile)


@router.put("", response_model=ProfileResponse)
def upsert_profile(
    profile_data: ProfileUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = FinanceRepository(db).upsert_profile(
        current_user.user_id,
        profile_data,
        email=current_user.email,
        auth_provider=current_user.provider,
    )
    return _to_profile_response(profile)


def _to_profile_response(profile) -> ProfileResponse:
    providers = [provider for provider in (profile.auth_providers or "email").split(",") if provider]
    return ProfileResponse(
        user_id=profile.user_id,
        display_name=profile.display_name,
        full_name=profile.full_name,
        nickname=profile.nickname,
        nickname_tag=profile.nickname_tag,
        phone_number=profile.phone_number,
        user_type=profile.user_type,
        email=profile.email,
        primary_auth_provider=profile.primary_auth_provider or "email",
        auth_providers=providers or ["email"],
    )
