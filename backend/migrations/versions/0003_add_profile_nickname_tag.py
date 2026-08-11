"""add profile nickname tag

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("profiles", sa.Column("nickname_tag", sa.String(length=4), nullable=False, server_default="0000"))
    op.create_unique_constraint("uq_profiles_nickname_tag", "profiles", ["nickname", "nickname_tag"])


def downgrade() -> None:
    op.drop_constraint("uq_profiles_nickname_tag", "profiles", type_="unique")
    op.drop_column("profiles", "nickname_tag")
