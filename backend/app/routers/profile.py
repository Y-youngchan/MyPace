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
    return ProfileResponse.model_validate(profile)


@router.put("", response_model=ProfileResponse)
def upsert_profile(
    profile_data: ProfileUpsert,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = FinanceRepository(db).upsert_profile(current_user.user_id, profile_data)
    return ProfileResponse.model_validate(profile)
