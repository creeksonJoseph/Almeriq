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
    op.add_column("startup_pitches", sa.Column("status", sa.Text(), nullable=False, server_default="draft"))
    op.add_column("startup_pitches", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_startup_pitches_status", "startup_pitches", ["status"])
    op.execute("""
        UPDATE startup_pitches
        SET status = 'active', published_at = updated_at
        WHERE title IS NOT NULL
          AND trim(title) <> ''
          AND summary IS NOT NULL
          AND trim(summary) <> ''
          AND sector IS NOT NULL
          AND trim(sector) <> ''
          AND stage IS NOT NULL
          AND trim(stage) <> ''
          AND location IS NOT NULL
          AND trim(location) <> ''
    """)


def downgrade() -> None:
    op.drop_index("ix_startup_pitches_status", table_name="startup_pitches")
    op.drop_column("startup_pitches", "published_at")
    op.drop_column("startup_pitches", "status")
