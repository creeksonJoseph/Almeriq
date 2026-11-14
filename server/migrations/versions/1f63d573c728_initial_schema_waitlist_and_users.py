"""initial_schema_waitlist_and_users

Revision ID: 1f63d573c728
Revises: 
Create Date: 2026-10-07 12:52:28.004334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f63d573c728'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Create waitlist and users tables with indexes."""
    # 1. Waitlist table & index
    op.create_table(
        "waitlist",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.Text, nullable=False),
        sa.Column("email", sa.Text, nullable=False, unique=True),
        sa.Column("role", sa.Text, nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_waitlist_joined_at", "waitlist", ["joined_at"])

    # 2. Users table & index
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("email", sa.Text, nullable=False, unique=True),
        sa.Column("hashed_password", sa.Text, nullable=True),
        sa.Column("full_name", sa.Text, nullable=True),
        sa.Column("nationality", sa.Text, nullable=True),
        sa.Column("id_number", sa.Text, nullable=True),
        sa.Column("role", sa.Text, nullable=False, server_default="user"),
        sa.Column("onboarding_completed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("google_id", sa.Text, nullable=True, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_google_id", "users", ["google_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_users_google_id", table_name="users")
    op.drop_index("idx_users_email", table_name="users")
    op.drop_index("idx_waitlist_joined_at", table_name="waitlist")
    op.drop_table("users")
    op.drop_table("waitlist")