"""allow_null_hashed_password_for_oauth

Revision ID: a8f2c1d04e9b
Revises: 1f63d573c728
Create Date: 2026-10-08

Google OAuth users have no password; legacy deployments may have created
hashed_password as NOT NULL before OAuth support.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "a8f2c1d04e9b"
down_revision: Union[str, Sequence[str], None] = "1f63d573c728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;")


def downgrade() -> None:
    op.execute(
        "UPDATE users SET hashed_password = '' WHERE hashed_password IS NULL;"
    )
    op.execute("ALTER TABLE users ALTER COLUMN hashed_password SET NOT NULL;")
