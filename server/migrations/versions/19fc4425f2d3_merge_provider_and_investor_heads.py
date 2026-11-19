"""merge provider and investor heads

Revision ID: 19fc4425f2d3
Revises: 001_add_provider_domain_tables, 003_add_investor_domain
Create Date: 2026-11-19 12:12:20.566916

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '19fc4425f2d3'
down_revision: Union[str, Sequence[str], None] = ('001_add_provider_domain_tables', '003_add_investor_domain')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
