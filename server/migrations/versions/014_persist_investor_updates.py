"""Persist founder investor updates and publication history."""

from alembic import op
import sqlalchemy as sa

revision = "014_persist_investor_updates"
down_revision = "013_pitch_publication_lifecycle"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "investor_updates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("founder_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("pitch_id", sa.Integer(), sa.ForeignKey("startup_pitches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("period", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="draft"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_investor_updates_founder_id", "investor_updates", ["founder_id"])
    op.create_index("ix_investor_updates_pitch_id", "investor_updates", ["pitch_id"])
    op.create_index("ix_investor_updates_status", "investor_updates", ["status"])


def downgrade() -> None:
    op.drop_index("ix_investor_updates_status", table_name="investor_updates")
    op.drop_index("ix_investor_updates_pitch_id", table_name="investor_updates")
    op.drop_index("ix_investor_updates_founder_id", table_name="investor_updates")
    op.drop_table("investor_updates")
