"""add_company_registration_guides_table

Revision ID: 6b1e8471c9d2
Revises: 23bd4400b379
Create Date: 2026-10-23 09:58:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b1e8471c9d2'
down_revision: Union[str, Sequence[str], None] = '23bd4400b379'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to add company_registration_guides table."""
    op.create_table(
        'company_registration_guides',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('country', sa.Text(), nullable=False),
        sa.Column('country_name', sa.Text(), nullable=False),
        sa.Column('regulatory_body', sa.Text(), nullable=True),
        sa.Column('portal_url', sa.Text(), nullable=True),
        sa.Column('estimated_timeline', sa.Text(), nullable=True),
        sa.Column('estimated_cost', sa.Text(), nullable=True),
        sa.Column('prerequisites_json', sa.Text(), nullable=True),
        sa.Column('steps_json', sa.Text(), nullable=False),
        sa.Column('common_pitfalls_json', sa.Text(), nullable=True),
        sa.Column('post_registration_json', sa.Text(), nullable=True),
        sa.Column('source', sa.Text(), nullable=False, server_default='ai'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_company_registration_guides_country'),
        'company_registration_guides',
        ['country'],
        unique=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_company_registration_guides_country'), table_name='company_registration_guides')
    op.drop_table('company_registration_guides')
