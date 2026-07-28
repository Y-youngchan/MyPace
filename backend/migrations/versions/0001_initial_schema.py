"""create MyPace schema

Revision ID: 0001
Revises:
Create Date: 2026-07-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

USER_OWNED_TABLES = (
    "profiles",
    "income_sources",
    "income_entries",
    "financial_accounts",
    "categories",
    "transactions",
    "budgets",
    "ai_insights",
    "monthly_reports",
)


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("display_name", sa.String(length=40), nullable=False),
        sa.Column("user_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_table(
        "income_sources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("source_type", sa.String(length=30), nullable=False),
        sa.Column("expected_monthly_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("is_recurring", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_income_sources_user_id"), "income_sources", ["user_id"])
    op.create_table(
        "financial_accounts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("account_type", sa.String(length=30), nullable=False),
        sa.Column("institution_name", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_financial_accounts_user_id"), "financial_accounts", ["user_id"])
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("category_type", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_categories_user_name"),
    )
    op.create_index(op.f("ix_categories_user_id"), "categories", ["user_id"])
    op.create_table(
        "budgets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("period", sa.Date(), nullable=False),
        sa.Column("basis_income_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "period", name="uq_budgets_user_period"),
    )
    op.create_index("ix_budgets_user_period", "budgets", ["user_id", "period"])
    op.create_index(op.f("ix_budgets_user_id"), "budgets", ["user_id"])
    op.create_table(
        "income_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("source_id", sa.Uuid(), nullable=False),
        sa.Column("period", sa.Date(), nullable=False),
        sa.Column("expected_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("actual_amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("received_at", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["income_sources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_income_entries_user_period", "income_entries", ["user_id", "period"])
    op.create_index(op.f("ix_income_entries_user_id"), "income_entries", ["user_id"])
    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=True),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("description", sa.String(length=160), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("transaction_type", sa.String(length=20), nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_user_occurred_at", "transactions", ["user_id", "occurred_at"])
    op.create_index(op.f("ix_transactions_user_id"), "transactions", ["user_id"])
    op.create_table(
        "budget_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("budget_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("recommended_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("adjusted_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["budget_id"], ["budgets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_budget_items_budget_id"), "budget_items", ["budget_id"])
    op.create_table(
        "ai_insights",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("period", sa.Date(), nullable=False),
        sa.Column("insight_type", sa.String(length=40), nullable=False),
        sa.Column("prompt_basis", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_insights_user_id"), "ai_insights", ["user_id"])
    op.create_table(
        "monthly_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("period", sa.Date(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("pdf_storage_path", sa.String(length=240), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "period", name="uq_monthly_reports_user_period"),
    )
    op.create_index("ix_monthly_reports_user_period", "monthly_reports", ["user_id", "period"])
    op.create_index(op.f("ix_monthly_reports_user_id"), "monthly_reports", ["user_id"])

    for table in USER_OWNED_TABLES:
        op.execute(f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY')
        op.execute(
            f'''CREATE POLICY "{table}_owner_all" ON public."{table}"
                FOR ALL TO authenticated
                USING ((select auth.uid()) = user_id)
                WITH CHECK ((select auth.uid()) = user_id)'''
        )

    op.execute('ALTER TABLE public."budget_items" ENABLE ROW LEVEL SECURITY')
    op.execute(
        '''CREATE POLICY "budget_items_owner_all" ON public."budget_items"
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public."budgets"
                    WHERE budgets.id = budget_items.budget_id
                    AND budgets.user_id = (select auth.uid())
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public."budgets"
                    WHERE budgets.id = budget_items.budget_id
                    AND budgets.user_id = (select auth.uid())
                )
            )'''
    )


def downgrade() -> None:
    op.execute('DROP POLICY IF EXISTS "budget_items_owner_all" ON public."budget_items"')
    op.execute('ALTER TABLE public."budget_items" DISABLE ROW LEVEL SECURITY')
    for table in reversed(USER_OWNED_TABLES):
        op.execute(f'DROP POLICY IF EXISTS "{table}_owner_all" ON public."{table}"')
        op.execute(f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY')

    op.drop_index(op.f("ix_monthly_reports_user_id"), table_name="monthly_reports")
    op.drop_index("ix_monthly_reports_user_period", table_name="monthly_reports")
    op.drop_table("monthly_reports")
    op.drop_index(op.f("ix_ai_insights_user_id"), table_name="ai_insights")
    op.drop_table("ai_insights")
    op.drop_index(op.f("ix_budget_items_budget_id"), table_name="budget_items")
    op.drop_table("budget_items")
    op.drop_index(op.f("ix_transactions_user_id"), table_name="transactions")
    op.drop_index("ix_transactions_user_occurred_at", table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_income_entries_user_id"), table_name="income_entries")
    op.drop_index("ix_income_entries_user_period", table_name="income_entries")
    op.drop_table("income_entries")
    op.drop_index(op.f("ix_budgets_user_id"), table_name="budgets")
    op.drop_index("ix_budgets_user_period", table_name="budgets")
    op.drop_table("budgets")
    op.drop_index(op.f("ix_categories_user_id"), table_name="categories")
    op.drop_table("categories")
    op.drop_index(op.f("ix_financial_accounts_user_id"), table_name="financial_accounts")
    op.drop_table("financial_accounts")
    op.drop_index(op.f("ix_income_sources_user_id"), table_name="income_sources")
    op.drop_table("income_sources")
    op.drop_table("profiles")
