"""Persist every provider verification decision, including revocations."""
from alembic import op
import sqlalchemy as sa

revision = "020_provider_verification_history"
down_revision = "019_provider_verification_audit"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "provider_verification_events",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_provider_verification_events_provider_id",
        "provider_verification_events",
        ["provider_id"],
    )
    # Preserve the latest known review for profiles reviewed before this
    # append-only history table was introduced.
    op.execute(sa.text("""
        INSERT INTO provider_verification_events (provider_id, reviewer_id, verified, reviewed_at)
        SELECT id, verification_reviewed_by, verified, verification_reviewed_at
        FROM provider_profiles
        WHERE verification_reviewed_at IS NOT NULL
    """))


def downgrade() -> None:
    op.drop_index("ix_provider_verification_events_provider_id", table_name="provider_verification_events")
    op.drop_table("provider_verification_events")
