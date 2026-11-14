"""add_founder_ventures_table

Revision ID: 9ccb43ac22ab
Revises: d4f8c2b6e9a1
Create Date: 2026-10-12 13:52:07.747888

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '9ccb43ac22ab'
down_revision: Union[str, Sequence[str], None] = 'd4f8c2b6e9a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('founder_ventures',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('idea', sa.Text(), nullable=False),
        sa.Column('problem', sa.Text(), nullable=False),
        sa.Column('solution', sa.Text(), nullable=False),
        sa.Column('customer', sa.Text(), nullable=False),
        sa.Column('location', sa.Text(), nullable=False),
        sa.Column('source', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('market', sa.Text(), nullable=False),
        sa.Column('risks_json', sa.Text(), nullable=False),
        sa.Column('mvp_json', sa.Text(), nullable=False),
        sa.Column('roadmap_json', sa.Text(), nullable=False),
        sa.Column('next_steps_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_founder_ventures_user_id'), 'founder_ventures', ['user_id'], unique=False)
    
    # Drop test table if it exists (from Neon playground) - conditional for dialect compatibility
    bind = op.get_bind()
    inspector = inspect(bind)
    if 'playing_with_neon' in inspector.get_table_names():
        op.drop_table('playing_with_neon')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_founder_ventures_user_id'), table_name='founder_ventures')
    op.drop_table('founder_ventures')
    
    # Recreate test table for downgrade
    op.create_table('playing_with_neon',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('value', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('playing_with_neon_pkey'))
    )