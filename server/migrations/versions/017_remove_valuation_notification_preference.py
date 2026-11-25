"""Remove the unused investor valuation notification preference."""

from alembic import op
import sqlalchemy as sa

revision = "017_remove_valuation_notification_preference"
down_revision = "016_startup_pitch_publication"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("investor_profiles")}
    if "notify_valuation_changes" in columns:
        with op.batch_alter_table("investor_profiles") as batch_op:
            batch_op.drop_column("notify_valuation_changes")


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("investor_profiles")}
    if "notify_valuation_changes" not in columns:
        with op.batch_alter_table("investor_profiles") as batch_op:
            batch_op.add_column(
                sa.Column("notify_valuation_changes", sa.Boolean(), nullable=False, server_default=sa.true())
            )
