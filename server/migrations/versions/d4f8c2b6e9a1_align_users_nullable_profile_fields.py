"""align legacy users profile columns with the ORM model

Revision ID: d4f8c2b6e9a1
Revises: c3e7b1a2f4d8
"""
from typing import Sequence, Union

from alembic import op


revision: str = "d4f8c2b6e9a1"
down_revision: Union[str, Sequence[str], None] = "c3e7b1a2f4d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE users
            ALTER COLUMN full_name DROP NOT NULL,
            ALTER COLUMN nationality DROP NOT NULL,
            ALTER COLUMN id_number DROP NOT NULL,
            ALTER COLUMN google_id DROP NOT NULL
        """
    )


def downgrade() -> None:
    pass