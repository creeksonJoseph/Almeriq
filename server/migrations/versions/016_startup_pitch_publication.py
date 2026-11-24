"""Add an explicit draft/published lifecycle to startup pitches.

Existing pitches remain discoverable to avoid unexpectedly hiding profiles
already shared with investors. New pitches default to draft.
"""
from alembic import op
import sqlalchemy as sa

revision = "016_startup_pitch_publication"
down_revision = "015_job_posting_owner_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("startup_pitches", sa.Column("status", sa.Text(), nullable=False, server_default="active"))
    op.add_column("startup_pitches", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_startup_pitches_status", "startup_pitches", ["status"])
    op.execute("UPDATE startup_pitches SET published_at = updated_at WHERE status = 'active'")
    with op.batch_alter_table("startup_pitches") as batch_op:
        batch_op.alter_column("status", existing_type=sa.Text(), server_default="draft")


def downgrade() -> None:
    op.drop_index("ix_startup_pitches_status", table_name="startup_pitches")
    op.drop_column("startup_pitches", "published_at")
    op.drop_column("startup_pitches", "status")
