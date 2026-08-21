"""add category cost type

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-18
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


FIXED_CATEGORY_NAMES = (
    "월세/관리비",
    "통신비",
    "보험료",
    "구독료",
    "대출/할부",
    "교통 정기권",
    "공과금",
    "교육비",
    "저축/적금",
    "기타 고정비",
)


def upgrade() -> None:
    op.add_column("categories", sa.Column("cost_type", sa.String(length=30), nullable=True))
    fixed_names = ", ".join(f"'{name}'" for name in FIXED_CATEGORY_NAMES)
    op.execute(f"UPDATE categories SET cost_type = 'fixed' WHERE category_type = 'expense' AND name IN ({fixed_names})")
    op.execute("UPDATE categories SET cost_type = 'variable' WHERE category_type = 'expense' AND cost_type IS NULL")
    op.execute("UPDATE categories SET cost_type = NULL WHERE category_type = 'income'")


def downgrade() -> None:
    op.drop_column("categories", "cost_type")
