"""repair users primary-key sequence after legacy table bootstrap

Revision ID: c3e7b1a2f4d8
Revises: a8f2c1d04e9b
"""
from typing import Sequence, Union

from alembic import op


revision: str = "c3e7b1a2f4d8"
down_revision: Union[str, Sequence[str], None] = "a8f2c1d04e9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        SELECT setval(
            pg_get_serial_sequence('users', 'id'),
            COALESCE((SELECT MAX(id) FROM users), 0) + 1,
            false
        )
        """
    )


def downgrade() -> None:
    pass