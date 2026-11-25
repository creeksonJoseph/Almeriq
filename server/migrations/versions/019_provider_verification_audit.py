"""Record provider verification reviewer and timestamp."""

from alembic import op
import sqlalchemy as sa

revision = "019_provider_verification_audit"
down_revision = "018_investor_updates"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("provider_profiles") as batch_op:
        batch_op.add_column(sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("verified_by", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("verification_reviewed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("verification_reviewed_by", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_provider_profiles_verified_by_users",
            "users",
            ["verified_by"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_foreign_key(
            "fk_provider_profiles_verification_reviewed_by_users",
            "users",
            ["verification_reviewed_by"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("provider_profiles") as batch_op:
        batch_op.drop_constraint("fk_provider_profiles_verification_reviewed_by_users", type_="foreignkey")
        batch_op.drop_constraint("fk_provider_profiles_verified_by_users", type_="foreignkey")
        batch_op.drop_column("verification_reviewed_by")
        batch_op.drop_column("verification_reviewed_at")
        batch_op.drop_column("verified_by")
        batch_op.drop_column("verified_at")
