"""003_add_investor_domain

Revision ID: 003_add_investor_domain
Revises: 002_add_jobs_domain
Create Date: 2026-11-19

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_add_investor_domain'
down_revision: Union[str, Sequence[str], None] = '002_add_jobs_domain'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "investor_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("firm_name", sa.Text, nullable=True),
        sa.Column("investment_focus", sa.Text, nullable=True),
        sa.Column("check_size", sa.Text, nullable=True),
        sa.Column("location", sa.Text, nullable=True),
        sa.Column("about", sa.Text, nullable=True),
        sa.Column("verified", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "startup_pitches",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("founder_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("sector", sa.Text, nullable=True),
        sa.Column("stage", sa.Text, nullable=True),
        sa.Column("ask_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "investments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("investor_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pitch_id", sa.Integer, sa.ForeignKey("startup_pitches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table("investments")
    op.drop_table("startup_pitches")
    op.drop_table("investor_profiles")
