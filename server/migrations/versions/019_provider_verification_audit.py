"""Record provider verification reviewer and timestamp."""

from alembic import op
import sqlalchemy as sa

revision = "019_provider_verification_audit"
down_revision = "018_investor_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("provider_profiles", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("provider_profiles", sa.Column("verified_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))
    op.add_column("provider_profiles", sa.Column("verification_reviewed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("provider_profiles", sa.Column("verification_reviewed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True))


def downgrade() -> None:
    op.drop_column("provider_profiles", "verification_reviewed_by")
    op.drop_column("provider_profiles", "verification_reviewed_at")
    op.drop_column("provider_profiles", "verified_by")
    op.drop_column("provider_profiles", "verified_at")
