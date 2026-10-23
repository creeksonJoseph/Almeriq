"""add_name_to_founder_ventures

Revision ID: 758e6570f549
Revises: 6b1e8471c9d2
Create Date: 2026-10-23 10:16:24.833193

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '758e6570f549'
down_revision: Union[str, Sequence[str], None] = '6b1e8471c9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("founder_ventures", sa.Column("name", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("founder_ventures", "name")
