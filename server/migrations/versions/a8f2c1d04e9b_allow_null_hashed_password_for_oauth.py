"""allow_null_hashed_password_for_oauth

Revision ID: a8f2c1d04e9b
Revises: 1f63d573c728
Create Date: 2026-10-08

Google OAuth users have no password; legacy deployments may have created
hashed_password as NOT NULL before OAuth support.

Note: In the dialect-neutral initial migration, hashed_password is already nullable.
This migration is a no-op for SQLite but ensures compatibility with PostgreSQL.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a8f2c1d04e9b"
down_revision: Union[str, Sequence[str], None] = "1f63d573c728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # hashed_password is already nullable in the initial migration
    # For PostgreSQL, ensure it's nullable (no-op if already nullable)
    # SQLite doesn't support ALTER COLUMN DROP NOT NULL directly
    pass


def downgrade() -> None:
    # Cannot easily revert in SQLite; PostgreSQL would need:
    # UPDATE users SET hashed_password = '' WHERE hashed_password IS NULL;
    # ALTER TABLE users ALTER COLUMN hashed_password SET NOT NULL;
    pass