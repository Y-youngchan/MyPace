from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AuthProvider(StrEnum):
    EMAIL = "email"
    GOOGLE = "google"
    KAKAO = "kakao"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Profile(Base, TimestampMixin):
    __tablename__ = "profiles"
    __table_args__ = (UniqueConstraint("nickname", "nickname_tag", name="uq_profiles_nickname_tag"),)

    user_id: Mapped[UUID] = mapped_column(primary_key=True)
    display_name: Mapped[str] = mapped_column(String(40))
    full_name: Mapped[str] = mapped_column(String(40), default="")
    nickname: Mapped[str] = mapped_column(String(10), default="")
    nickname_tag: Mapped[str] = mapped_column(String(4), default="0000")
    phone_number: Mapped[str] = mapped_column(String(30), default="")
    user_type: Mapped[str] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(320), index=True)
    primary_auth_provider: Mapped[str] = mapped_column(String(20), default=AuthProvider.EMAIL.value)
    auth_providers: Mapped[str] = mapped_column(String(120), default=AuthProvider.EMAIL.value)


class IncomeSource(Base, TimestampMixin):
    __tablename__ = "income_sources"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    name: Mapped[str] = mapped_column(String(80))
    source_type: Mapped[str] = mapped_column(String(30))
    expected_monthly_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    is_recurring: Mapped[bool] = mapped_column(default=True)

    entries: Mapped[list["IncomeEntry"]] = relationship(
        back_populates="source",
        cascade="all, delete-orphan",
    )


class IncomeEntry(Base, TimestampMixin):
    __tablename__ = "income_entries"
    __table_args__ = (Index("ix_income_entries_user_period", "user_id", "period"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    source_id: Mapped[UUID] = mapped_column(ForeignKey("income_sources.id", ondelete="CASCADE"))
    period: Mapped[date] = mapped_column(Date)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=0)
    actual_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    received_at: Mapped[Optional[date]] = mapped_column(Date)

    source: Mapped[IncomeSource] = relationship(back_populates="entries")


class FinancialAccount(Base, TimestampMixin):
    __tablename__ = "financial_accounts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    name: Mapped[str] = mapped_column(String(80))
    account_type: Mapped[str] = mapped_column(String(30))
    institution_name: Mapped[str] = mapped_column(String(80), default="Demo Bank")

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="account",
        cascade="all, delete-orphan",
    )


class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_categories_user_name"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    name: Mapped[str] = mapped_column(String(80))
    category_type: Mapped[str] = mapped_column(String(30))


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"
    __table_args__ = (Index("ix_transactions_user_occurred_at", "user_id", "occurred_at"),)

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    account_id: Mapped[UUID] = mapped_column(ForeignKey("financial_accounts.id", ondelete="CASCADE"))
    category_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    description: Mapped[str] = mapped_column(String(160))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    transaction_type: Mapped[str] = mapped_column(String(20))
    is_synthetic: Mapped[bool] = mapped_column(default=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(120), index=True)

    account: Mapped[FinancialAccount] = relationship(back_populates="transactions")


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"
    __table_args__ = (
        Index("ix_budgets_user_period", "user_id", "period"),
        UniqueConstraint("user_id", "period", name="uq_budgets_user_period"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    period: Mapped[date] = mapped_column(Date)
    basis_income_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(30), default="draft")

    items: Mapped[list["BudgetItem"]] = relationship(
        back_populates="budget",
        cascade="all, delete-orphan",
    )


class BudgetItem(Base, TimestampMixin):
    __tablename__ = "budget_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    budget_id: Mapped[UUID] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    recommended_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    adjusted_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    reason: Mapped[str] = mapped_column(Text, default="")

    budget: Mapped[Budget] = relationship(back_populates="items")
    category: Mapped[Category] = relationship()


class AiInsight(Base, TimestampMixin):
    __tablename__ = "ai_insights"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    period: Mapped[date] = mapped_column(Date)
    insight_type: Mapped[str] = mapped_column(String(40))
    prompt_basis: Mapped[str] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)


class MonthlyReport(Base, TimestampMixin):
    __tablename__ = "monthly_reports"
    __table_args__ = (
        Index("ix_monthly_reports_user_period", "user_id", "period"),
        UniqueConstraint("user_id", "period", name="uq_monthly_reports_user_period"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(index=True)
    period: Mapped[date] = mapped_column(Date)
    summary: Mapped[str] = mapped_column(Text)
    pdf_storage_path: Mapped[Optional[str]] = mapped_column(String(240))
