from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
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


DEFAULT_CATEGORY_TEMPLATES = (
    ("월세/관리비", "expense", "fixed"),
    ("통신비", "expense", "fixed"),
    ("보험료", "expense", "fixed"),
    ("구독료", "expense", "fixed"),
    ("대출/할부", "expense", "fixed"),
    ("교통 정기권", "expense", "fixed"),
    ("공과금", "expense", "fixed"),
    ("교육비", "expense", "fixed"),
    ("저축/적금", "expense", "fixed"),
    ("기타 고정비", "expense", "fixed"),
    ("식비", "expense", "variable"),
    ("카페/간식", "expense", "variable"),
    ("교통", "expense", "variable"),
    ("쇼핑", "expense", "variable"),
    ("생활용품", "expense", "variable"),
    ("병원/약국", "expense", "variable"),
    ("문화/취미", "expense", "variable"),
    ("경조사", "expense", "variable"),
    ("여행", "expense", "variable"),
    ("기타 지출", "expense", "variable"),
    ("월급", "income", None),
    ("부수입", "income", None),
    ("보너스", "income", None),
    ("환급/정산", "income", None),
    ("기타 수입", "income", None),
)

SAVINGS_CATEGORY_NAMES = {"저축/적금"}


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

    def get_income_entry(self, user_id: UUID, entry_id: UUID) -> IncomeEntry | None:
        statement = select(IncomeEntry).where(IncomeEntry.user_id == user_id, IncomeEntry.id == entry_id)
        return self.db.scalar(statement)

    def delete_income_entry(self, user_id: UUID, entry_id: UUID) -> bool:
        entry = self.get_income_entry(user_id, entry_id)
        if entry is None:
            return False
        self.db.delete(entry)
        self.db.commit()
        return True

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

    def list_categories(self, user_id: UUID) -> list[Category]:
        statement = (
            select(Category)
            .where(
                Category.user_id == user_id,
                Category.category_type.in_(("expense", "income")),
            )
            .order_by(Category.category_type.asc(), Category.name.asc())
        )
        return list(self.db.scalars(statement))

    def list_categories_with_defaults(self, user_id: UUID) -> list[Category]:
        existing_categories = self.list_categories(user_id)
        existing_names = {category.name for category in existing_categories}
        missing_templates = [
            (name, category_type, cost_type)
            for name, category_type, cost_type in DEFAULT_CATEGORY_TEMPLATES
            if name not in existing_names
        ]

        self.db.add_all(
            Category(user_id=user_id, name=name, category_type=category_type, cost_type=cost_type)
            for name, category_type, cost_type in missing_templates
        )
        if missing_templates:
            self.db.commit()
        return self.list_categories(user_id)

    def get_category(self, user_id: UUID, category_id: UUID) -> Category | None:
        statement = select(Category).where(Category.user_id == user_id, Category.id == category_id)
        return self.db.scalar(statement)

    def category_name_exists(self, user_id: UUID, name: str, *, exclude_category_id: UUID | None = None) -> bool:
        statement = select(Category).where(Category.user_id == user_id, Category.name == name)
        if exclude_category_id is not None:
            statement = statement.where(Category.id != exclude_category_id)
        return self.db.scalar(statement) is not None

    def create_category(self, user_id: UUID, name: str, kind: str, cost_type: str | None = None) -> Category:
        category = Category(user_id=user_id, name=name, category_type=kind, cost_type=self._normalize_category_cost_type(kind, cost_type))
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category(self, user_id: UUID, category_id: UUID, name: str, kind: str, cost_type: str | None = None) -> Category | None:
        category = self.get_category(user_id, category_id)
        if category is None:
            return None
        category.name = name
        category.category_type = kind
        category.cost_type = self._normalize_category_cost_type(kind, cost_type)
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, user_id: UUID, category_id: UUID) -> bool:
        category = self.get_category(user_id, category_id)
        if category is None:
            return False
        self.db.delete(category)
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

    def build_dashboard_summary(self, user_id: UUID, period: date) -> dict:
        month_start = period.replace(day=1)
        month_end = self._end_of_month(month_start)
        income_entries = [
            entry
            for entry in self.list_income_entries(user_id)
            if month_start <= entry.period <= month_end
        ]
        transactions = self.list_transactions(user_id, start=month_start, end=month_end)
        expense_transactions = [transaction for transaction in transactions if transaction.transaction_type == "expense"]
        category_names = self._category_names_for(expense_transactions)

        expected_income = sum((entry.expected_amount for entry in income_entries), Decimal("0"))
        monthly_spent = sum((transaction.amount for transaction in expense_transactions), Decimal("0"))
        remaining_living_money = expected_income - monthly_spent
        daily_available = remaining_living_money / Decimal("30") if remaining_living_money > 0 else Decimal("0")
        budget = self.get_budget(user_id, month_start)
        budget_total = sum((item.adjusted_amount for item in budget.items), Decimal("0")) if budget else Decimal("0")

        return {
            "period": month_start,
            "expected_income": expected_income,
            "monthly_spent": monthly_spent,
            "remaining_living_money": remaining_living_money,
            "daily_available": daily_available,
            "budget_usage_percent": self._percent(monthly_spent, budget_total),
            "recent_transactions": [
                {
                    "title": transaction.description,
                    "category": category_names.get(transaction.category_id, "미분류"),
                    "amount": transaction.amount,
                }
                for transaction in expense_transactions[:3]
            ],
            "budget_progress": self._budget_progress(budget, expense_transactions, category_names),
            "weekly_actions": self._weekly_actions(expected_income, monthly_spent, budget_total),
        }

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

    def _budget_progress(
        self,
        budget: Budget | None,
        transactions: list[Transaction],
        category_names: dict[UUID | None, str],
    ) -> list[dict]:
        if budget is None:
            return []

        transaction_categories = self._categories_for_transactions(transactions)
        spent_by_category: dict[UUID, Decimal] = {}
        spent_by_budget_bucket: dict[str, Decimal] = {}
        for transaction in transactions:
            if transaction.category_id is None:
                continue
            spent_by_category[transaction.category_id] = spent_by_category.get(transaction.category_id, Decimal("0")) + transaction.amount
            bucket = self._budget_bucket_for_transaction_category(transaction_categories.get(transaction.category_id))
            if bucket:
                spent_by_budget_bucket[bucket] = spent_by_budget_bucket.get(bucket, Decimal("0")) + transaction.amount

        progress = []
        for item in budget.items:
            budget_category_name = item.category.name if item.category else ""
            used_amount = spent_by_budget_bucket.get(
                budget_category_name,
                spent_by_category.get(item.category_id, Decimal("0")),
            )
            used_percent = self._percent(used_amount, item.adjusted_amount)
            progress.append(
                {
                    "category": category_names.get(item.category_id, budget_category_name or "미분류"),
                    "used_amount": used_amount,
                    "budget_amount": item.adjusted_amount,
                    "used_percent": used_percent,
                    "status": self._budget_status(used_percent),
                }
            )
        return progress

    def _category_names_for(self, transactions: list[Transaction]) -> dict[UUID | None, str]:
        category_ids = {transaction.category_id for transaction in transactions if transaction.category_id is not None}
        if not category_ids:
            return {}
        categories = self.db.scalars(select(Category).where(Category.id.in_(category_ids)))
        return {category.id: category.name for category in categories}

    def _categories_for_transactions(self, transactions: list[Transaction]) -> dict[UUID, Category]:
        category_ids = {transaction.category_id for transaction in transactions if transaction.category_id is not None}
        if not category_ids:
            return {}
        categories = self.db.scalars(select(Category).where(Category.id.in_(category_ids)))
        return {category.id: category for category in categories}

    @staticmethod
    def _budget_bucket_for_transaction_category(category: Category | None) -> str | None:
        if category is None or category.category_type != "expense":
            return None
        if category.name in SAVINGS_CATEGORY_NAMES:
            return "저축"
        if category.cost_type == "fixed":
            return "고정비"
        if category.cost_type == "variable":
            return "생활비"
        return None

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

        category = Category(
            user_id=user_id,
            name=name,
            category_type=category_type,
            cost_type=self._normalize_category_cost_type(category_type, None),
        )
        self.db.add(category)
        self.db.flush()
        return category

    @staticmethod
    def _normalize_category_cost_type(category_type: str, cost_type: str | None) -> str | None:
        if category_type == "income":
            return None
        return cost_type or "variable"

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

    @staticmethod
    def _percent(value: Decimal, total: Decimal) -> int:
        if total <= 0:
            return 0
        return int(((value / total) * Decimal("100")).to_integral_value(rounding=ROUND_HALF_UP))

    @staticmethod
    def _budget_status(used_percent: int) -> str:
        if used_percent > 100:
            return "초과"
        if used_percent >= 80:
            return "주의"
        if used_percent >= 50:
            return "안정"
        return "여유"

    @staticmethod
    def _weekly_actions(expected_income: Decimal, monthly_spent: Decimal, budget_total: Decimal) -> list[str]:
        if expected_income <= 0:
            return ["수입을 먼저 입력하면 이번 달 예산 기준선을 만들 수 있어요."]
        if budget_total <= 0:
            return ["예산을 등록하면 카테고리별 사용 속도를 확인할 수 있어요."]
        if monthly_spent > budget_total:
            return ["이번 달 예산을 넘었어요. 큰 지출부터 확인해보세요."]
        return [
            "이번 주는 예산 사용률이 높은 항목부터 먼저 확인해보세요.",
            "카페와 외식처럼 자주 쓰는 지출은 주간 한도를 정해두면 좋아요.",
            "월말 전에 실제 수입과 예산 기준선을 한 번 더 맞춰보세요.",
        ]

    @staticmethod
    def _end_of_month(month_start: date) -> date:
        if month_start.month == 12:
            return date(month_start.year, 12, 31)
        return date(month_start.year, month_start.month + 1, 1) - timedelta(days=1)

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
