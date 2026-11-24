"""Add startup pitch publication lifecycle."""

from alembic import op
import sqlalchemy as sa

revision = "016_pitch_publication_lifecycle"
down_revision = "015_job_posting_owner_constraints"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Existing pitches were already exposed to investors; preserve that behavior
    # for existing rows while making all newly created pitches drafts by default.
    op.add_column(
        "startup_pitches",
        sa.Column("status", sa.Text(), nullable=False, server_default="published"),
    )
    op.add_column(
        "startup_pitches",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        "UPDATE startup_pitches SET published_at = created_at "
        "WHERE status = 'published' AND published_at IS NULL"
    )
    op.alter_column(
        "startup_pitches",
        "status",
        existing_type=sa.Text(),
        server_default="draft",
    )
    op.create_index(
        "ix_startup_pitches_status", "startup_pitches", ["status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_startup_pitches_status", table_name="startup_pitches")
    op.drop_column("startup_pitches", "published_at")
    op.drop_column("startup_pitches", "status")
