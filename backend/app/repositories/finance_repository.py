from datetime import UTC, date, datetime, time
from decimal import Decimal
from itertools import count
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import (
    AuthProvider,
    Budget,
    BudgetItem,
    Category,
    FinancialAccount,
    IncomeEntry,
    IncomeSource,
    Profile,
    Transaction,
)
from app.schemas.finance import BudgetUpsert, IncomeEntryCreate, ProfileUpsert, SignupProfileCreate, TransactionCreate, TransactionUpdate


class FinanceRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_profile(self, user_id: UUID) -> Profile | None:
        return self.db.get(Profile, user_id)

    def upsert_profile(
        self,
        user_id: UUID,
        profile_data: ProfileUpsert,
        *,
        email: str | None = None,
        auth_provider: str = AuthProvider.EMAIL.value,
    ) -> Profile:
        profile = self.get_profile(user_id)
        provider = self._normalize_auth_provider(auth_provider)
        if profile is None:
            profile = Profile(
                user_id=user_id,
                display_name=profile_data.display_name,
                full_name=profile_data.full_name,
                nickname=profile_data.nickname,
                nickname_tag=self._next_nickname_tag(profile_data.nickname),
                phone_number=profile_data.phone_number,
                user_type=profile_data.user_type,
                email=email,
                primary_auth_provider=provider,
                auth_providers=provider,
            )
            self.db.add(profile)
        else:
            profile.display_name = profile_data.display_name
            profile.full_name = profile_data.full_name
            if profile.nickname != profile_data.nickname:
                profile.nickname = profile_data.nickname
                profile.nickname_tag = self._next_nickname_tag(profile_data.nickname)
            profile.phone_number = profile_data.phone_number
            profile.user_type = profile_data.user_type
            profile.email = email or profile.email
            profile.primary_auth_provider = profile.primary_auth_provider or provider
            profile.auth_providers = self._merge_provider(profile.auth_providers, provider)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def create_signup_profile(self, profile_data: SignupProfileCreate) -> Profile:
        profile = self.get_profile(profile_data.user_id)
        if profile is None:
            profile = Profile(
                user_id=profile_data.user_id,
                display_name=profile_data.display_name,
                full_name=profile_data.full_name,
                nickname=profile_data.nickname,
                nickname_tag=self._next_nickname_tag(profile_data.nickname),
                phone_number=profile_data.phone_number,
                user_type=profile_data.user_type,
                email=profile_data.email,
                primary_auth_provider=AuthProvider.EMAIL.value,
                auth_providers=AuthProvider.EMAIL.value,
            )
            self.db.add(profile)
        else:
            profile.display_name = profile_data.display_name
            profile.full_name = profile_data.full_name
            if profile.nickname != profile_data.nickname:
                profile.nickname = profile_data.nickname
                profile.nickname_tag = self._next_nickname_tag(profile_data.nickname)
            profile.phone_number = profile_data.phone_number
            profile.user_type = profile_data.user_type
            profile.email = profile_data.email
            profile.auth_providers = self._merge_provider(profile.auth_providers, AuthProvider.EMAIL.value)

        self.db.commit()
        self.db.refresh(profile)
        return profile

    def find_emails_by_identity(self, full_name: str, phone_number: str) -> list[str]:
        statement = select(Profile).where(
            Profile.full_name == full_name,
            Profile.email.is_not(None),
        )
        requested_phone = self._normalize_phone_number(phone_number)
        return [
            profile.email
            for profile in self.db.scalars(statement)
            if profile.email and self._normalize_phone_number(profile.phone_number) == requested_phone
        ]

    def can_reset_password(self, email: str, full_name: str, phone_number: str) -> bool:
        statement = select(Profile).where(
            Profile.email == email,
            Profile.full_name == full_name,
        )
        requested_phone = self._normalize_phone_number(phone_number)
        return any(
            self._normalize_phone_number(profile.phone_number) == requested_phone
            for profile in self.db.scalars(statement)
        )

    def list_income_entries(self, user_id: UUID) -> list[IncomeEntry]:
        statement = (
            select(IncomeEntry)
            .where(IncomeEntry.user_id == user_id)
            .order_by(IncomeEntry.period.desc(), IncomeEntry.created_at.desc())
        )
        return list(self.db.scalars(statement))

    def create_income_entry(self, user_id: UUID, entry_data: IncomeEntryCreate) -> IncomeEntry:
        source = self._get_or_create_income_source(
            user_id=user_id,
            name=entry_data.source_name,
            source_type=entry_data.source_type,
            expected_amount=entry_data.expected_amount,
        )
        entry = IncomeEntry(
            user_id=user_id,
            source_id=source.id,
            period=entry_data.period,
            expected_amount=entry_data.expected_amount,
            actual_amount=entry_data.actual_amount,
            received_at=entry_data.received_at,
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_transactions(
        self,
        user_id: UUID,
        start: date | None = None,
        end: date | None = None,
    ) -> list[Transaction]:
        statement = select(Transaction).where(Transaction.user_id == user_id)
        if start:
            statement = statement.where(Transaction.occurred_at >= self._start_of_day(start))
        if end:
            statement = statement.where(Transaction.occurred_at <= self._end_of_day(end))
        statement = statement.order_by(Transaction.occurred_at.desc(), Transaction.created_at.desc())
        return list(self.db.scalars(statement))

    def create_transaction(
        self,
        user_id: UUID,
        transaction_data: TransactionCreate,
        *,
        is_synthetic: bool = False,
        external_id: str | None = None,
    ) -> Transaction:
        existing = self.get_transaction_by_external_id(user_id, external_id) if external_id else None
        if existing is not None:
            return existing

        account = self._get_or_create_account(user_id)
        category = self._get_or_create_category(
            user_id=user_id,
            name=transaction_data.category_name or "미분류",
            category_type=transaction_data.kind,
        )
        transaction = Transaction(
            user_id=user_id,
            account_id=account.id,
            category_id=category.id,
            amount=transaction_data.amount,
            description=transaction_data.description or category.name,
            occurred_at=self._start_of_day(transaction_data.occurred_at),
            transaction_type=transaction_data.kind,
            is_synthetic=is_synthetic,
            external_id=external_id,
        )
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def update_transaction(
        self,
        user_id: UUID,
        transaction_id: UUID,
        transaction_data: TransactionUpdate,
    ) -> Transaction | None:
        transaction = self.get_transaction(user_id, transaction_id)
        if transaction is None:
            return None

        if transaction_data.amount is not None:
            transaction.amount = transaction_data.amount
        if transaction_data.kind is not None:
            transaction.transaction_type = transaction_data.kind
        if transaction_data.occurred_at is not None:
            transaction.occurred_at = self._start_of_day(transaction_data.occurred_at)
        if transaction_data.description is not None:
            transaction.description = transaction_data.description
        if transaction_data.category_name is not None:
            category = self._get_or_create_category(
                user_id=user_id,
                name=transaction_data.category_name,
                category_type=transaction.transaction_type,
            )
            transaction.category_id = category.id

        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def delete_transaction(self, user_id: UUID, transaction_id: UUID) -> bool:
        transaction = self.get_transaction(user_id, transaction_id)
        if transaction is None:
            return False
        self.db.delete(transaction)
        self.db.commit()
        return True

    def upsert_budget(self, user_id: UUID, period: date, budget_data: BudgetUpsert) -> Budget:
        existing = self.get_budget(user_id, period)
        if existing is None:
            budget = Budget(
                user_id=user_id,
                period=period,
                basis_income_amount=budget_data.basis_income_amount,
                status="accepted",
            )
            self.db.add(budget)
            self.db.flush()
        else:
            budget = existing
            budget.basis_income_amount = budget_data.basis_income_amount
            budget.status = "accepted"
            budget.items.clear()
            self.db.flush()

        for item in budget_data.items:
            category = self._get_or_create_category(user_id, item.category_name, "budget")
            self.db.add(
                BudgetItem(
                    budget_id=budget.id,
                    category_id=category.id,
                    recommended_amount=item.amount,
                    adjusted_amount=item.amount,
                    reason=item.reason,
                )
            )

        self.db.commit()
        self.db.refresh(budget)
        return budget

    def get_budget(self, user_id: UUID, period: date) -> Budget | None:
        statement = select(Budget).where(Budget.user_id == user_id, Budget.period == period)
        return self.db.scalar(statement)

    def get_transaction(self, user_id: UUID, transaction_id: UUID) -> Transaction | None:
        statement = select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        return self.db.scalar(statement)

    def get_transaction_by_external_id(self, user_id: UUID, external_id: str | None) -> Transaction | None:
        if external_id is None:
            return None
        statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.external_id == external_id,
        )
        return self.db.scalar(statement)

    def _get_or_create_account(self, user_id: UUID) -> FinancialAccount:
        statement = select(FinancialAccount).where(
            FinancialAccount.user_id == user_id,
            FinancialAccount.name == "현금",
            FinancialAccount.account_type == "cash",
        )
        account = self.db.scalar(statement)
        if account is not None:
            return account

        account = FinancialAccount(user_id=user_id, name="현금", account_type="cash", institution_name="Demo Bank")
        self.db.add(account)
        self.db.flush()
        return account

    def _get_or_create_category(self, user_id: UUID, name: str, category_type: str) -> Category:
        statement = select(Category).where(Category.user_id == user_id, Category.name == name)
        category = self.db.scalar(statement)
        if category is not None:
            return category

        category = Category(user_id=user_id, name=name, category_type=category_type)
        self.db.add(category)
        self.db.flush()
        return category

    def _get_or_create_income_source(
        self,
        user_id: UUID,
        name: str,
        source_type: str,
        expected_amount: Decimal,
    ) -> IncomeSource:
        statement = select(IncomeSource).where(IncomeSource.user_id == user_id, IncomeSource.name == name)
        source = self.db.scalar(statement)
        if source is not None:
            return source

        source = IncomeSource(
            user_id=user_id,
            name=name,
            source_type=source_type,
            expected_monthly_amount=expected_amount,
            is_recurring=True,
        )
        self.db.add(source)
        self.db.flush()
        return source

    @staticmethod
    def _normalize_auth_provider(provider: str) -> str:
        return provider if provider in {item.value for item in AuthProvider} else AuthProvider.EMAIL.value

    @staticmethod
    def _merge_provider(existing: str | None, provider: str) -> str:
        providers = [item for item in (existing or "").split(",") if item]
        if provider not in providers:
            providers.append(provider)
        return ",".join(providers) or AuthProvider.EMAIL.value

    @staticmethod
    def _normalize_phone_number(phone_number: str) -> str:
        return "".join(char for char in phone_number if char.isdigit())

    def _next_nickname_tag(self, nickname: str) -> str:
        existing_tags = set(
            self.db.scalars(
                select(Profile.nickname_tag).where(
                    Profile.nickname == nickname,
                    Profile.nickname_tag.is_not(None),
                )
            )
        )
        for value in count(1):
            candidate = f"{value:04d}"
            if candidate not in existing_tags:
                return candidate
            if value >= 9999:
                raise ValueError("사용 가능한 닉네임 태그가 없습니다.")
        raise ValueError("사용 가능한 닉네임 태그가 없습니다.")

    @staticmethod
    def _start_of_day(value: date) -> datetime:
        return datetime.combine(value, time.min, tzinfo=UTC)

    @staticmethod
    def _end_of_day(value: date) -> datetime:
        return datetime.combine(value, time.max, tzinfo=UTC)
