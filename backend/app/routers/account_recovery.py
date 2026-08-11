from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.finance_repository import FinanceRepository
from app.schemas.finance import (
    FindEmailRequest,
    FindEmailResponse,
    PasswordResetVerificationRequest,
    PasswordResetVerificationResponse,
    ProfileResponse,
    SignupProfileCreate,
)
from app.routers.profile import _to_profile_response

router = APIRouter(prefix="/api/v1/account-recovery", tags=["account-recovery"])


@router.post("/signup-profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_signup_profile(
    profile_data: SignupProfileCreate,
    db: Session = Depends(get_db),
) -> ProfileResponse:
    profile = FinanceRepository(db).create_signup_profile(profile_data)
    return _to_profile_response(profile)


@router.post("/find-email", response_model=FindEmailResponse)
def find_email(
    request_data: FindEmailRequest,
    db: Session = Depends(get_db),
) -> FindEmailResponse:
    emails = FinanceRepository(db).find_emails_by_identity(
        request_data.full_name,
        request_data.phone_number,
    )
    return FindEmailResponse(emails=emails)


@router.post("/verify-password-reset", response_model=PasswordResetVerificationResponse)
def verify_password_reset(
    request_data: PasswordResetVerificationRequest,
    db: Session = Depends(get_db),
) -> PasswordResetVerificationResponse:
    can_reset = FinanceRepository(db).can_reset_password(
        request_data.email,
        request_data.full_name,
        request_data.phone_number,
    )
    return PasswordResetVerificationResponse(can_reset=can_reset)
