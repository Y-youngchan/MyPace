"""add profile identity fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("full_name", sa.String(length=40), nullable=False, server_default=""))
    op.add_column("profiles", sa.Column("nickname", sa.String(length=40), nullable=False, server_default=""))
    op.add_column("profiles", sa.Column("phone_number", sa.String(length=30), nullable=False, server_default=""))
    op.create_index(op.f("ix_profiles_phone_number"), "profiles", ["phone_number"])


def downgrade() -> None:
    op.drop_index(op.f("ix_profiles_phone_number"), table_name="profiles")
    op.drop_column("profiles", "phone_number")
    op.drop_column("profiles", "nickname")
    op.drop_column("profiles", "full_name")
