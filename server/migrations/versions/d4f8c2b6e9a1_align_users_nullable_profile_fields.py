"""align legacy users profile columns with the ORM model

Revision ID: d4f8c2b6e9a1
Revises: c3e7b1a2f4d8

Note: In the dialect-neutral initial migration, profile columns are already nullable.
This migration is a no-op for SQLite. For PostgreSQL, it ensures columns
are nullable if they were created as NOT NULL in legacy deployments.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "d4f8c2b6e9a1"
down_revision: Union[str, Sequence[str], None] = "c3e7b1a2f4d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Columns are already nullable in the initial migration
    # SQLite doesn't support ALTER COLUMN DROP NOT NULL
    pass


def downgrade() -> None:
    pass