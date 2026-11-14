"""repair users primary-key sequence after legacy table bootstrap

Revision ID: c3e7b1a2f4d8
Revises: a8f2c1d04e9b

Note: SQLite uses AUTOINCREMENT which doesn't require sequence repair.
This migration is a no-op for SQLite. For PostgreSQL, the sequence
is automatically managed by SERIAL/IDENTITY columns.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "c3e7b1a2f4d8"
down_revision: Union[str, Sequence[str], None] = "a8f2c1d04e9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No-op for SQLite (uses AUTOINCREMENT)
    # For PostgreSQL, SERIAL/IDENTITY columns manage their own sequences
    pass


def downgrade() -> None:
    pass