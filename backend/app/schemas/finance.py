from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProfileUpsert(BaseModel):
    display_name: str = Field(min_length=1, max_length=40)
    full_name: str = Field(default="", max_length=40)
    nickname: str = Field(default="", max_length=10)
    phone_number: str = Field(default="", max_length=30)
    user_type: Literal["worker", "student"]


class ProfileResponse(ProfileUpsert):
    user_id: UUID
    nickname_tag: str = "0000"
    email: str | None = None
    primary_auth_provider: Literal["email", "google", "kakao"] = "email"
    auth_providers: list[Literal["email", "google", "kakao"]] = Field(default_factory=lambda: ["email"])

    model_config = ConfigDict(from_attributes=True)


class SignupProfileCreate(ProfileUpsert):
    user_id: UUID
    email: str = Field(min_length=3, max_length=320)


class FindEmailRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=40)
    phone_number: str = Field(min_length=1, max_length=30)


class FindEmailResponse(BaseModel):
    emails: list[str]


class PasswordResetVerificationRequest(FindEmailRequest):
    email: str = Field(min_length=3, max_length=320)


class PasswordResetVerificationResponse(BaseModel):
    can_reset: bool


class IncomeEntryCreate(BaseModel):
    source_name: str = Field(default="기본 수입", min_length=1, max_length=80)
    source_type: str = Field(default="salary", min_length=1, max_length=30)
    period: date
    expected_amount: Decimal = Field(gt=0)
    actual_amount: Decimal | None = Field(default=None, gt=0)
    received_at: date | None = None


class IncomeEntryResponse(BaseModel):
    id: UUID
    user_id: UUID
    source_id: UUID
    period: date
    expected_amount: Decimal
    actual_amount: Decimal | None
    received_at: date | None

    model_config = ConfigDict(from_attributes=True)


class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    kind: Literal["income", "expense"]
    occurred_at: date
    description: str = Field(default="", max_length=120)
    category_name: str | None = Field(default=None, max_length=80)


class TransactionUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    kind: Literal["income", "expense"] | None = None
    occurred_at: date | None = None
    description: str | None = Field(default=None, max_length=120)
    category_name: str | None = Field(default=None, max_length=80)


class TransactionResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    kind: Literal["income", "expense"]
    occurred_at: datetime
    description: str
    category_id: UUID | None
    account_id: UUID
    is_synthetic: bool


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int


class CalendarEventResponse(BaseModel):
    id: str
    event_date: date
    event_type: Literal["income", "expense", "budget"]
    title: str
    amount: Decimal | None = None


class MockBankingImportResponse(BaseModel):
    persona: Literal["worker", "student"]
    period: str
    inserted: int
    total_demo_rows: int


class BudgetRecommendationRequest(BaseModel):
    persona: Literal["worker", "student"]
    expected_income: Decimal = Field(gt=0)
    fixed_expenses: Decimal = Field(ge=0)
    category_history: dict[str, Decimal] = Field(default_factory=dict)


class BudgetRecommendationResponse(BaseModel):
    persona: Literal["worker", "student"]
    base_income: Decimal
    items: dict[str, Decimal]
    total: Decimal


class BudgetItemUpsert(BaseModel):
    category_name: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(ge=0)
    reason: str = Field(default="", max_length=240)


class BudgetUpsert(BaseModel):
    basis_income_amount: Decimal = Field(gt=0)
    items: list[BudgetItemUpsert]


class BudgetResponse(BaseModel):
    id: UUID
    user_id: UUID
    period: date
    basis_income_amount: Decimal
    status: str
    items: dict[str, Decimal]


class ActualIncomeAdjustmentRequest(BaseModel):
    expected_income: Decimal = Field(gt=0)
    actual_income: Decimal = Field(ge=0)
    spent: Decimal = Field(ge=0)
    remaining_required: Decimal = Field(ge=0)
    remaining_savings: Decimal = Field(ge=0)
    remaining_discretionary: Decimal = Field(ge=0)
    remaining_days: int = Field(ge=0)


class ActualIncomeAdjustmentResponse(BaseModel):
    expected_income: Decimal
    actual_income: Decimal
    income_gap: Decimal
    spent: Decimal
    available_after_spent: Decimal
    adjusted_required: Decimal
    adjusted_savings: Decimal
    adjusted_discretionary: Decimal
    daily_available: Decimal
