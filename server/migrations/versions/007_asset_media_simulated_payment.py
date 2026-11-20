"""Add listing media metadata and explicit simulated deal status."""
from alembic import op
import sqlalchemy as sa

revision = "007_asset_media_simulated_payment"
down_revision = "006_ensure_asset_client_unique_index"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    asset_columns = {column["name"] for column in inspector.get_columns("assets")}
    deal_columns = {column["name"] for column in inspector.get_columns("deals")}

    if "media" not in asset_columns:
        op.add_column("assets", sa.Column("media", sa.JSON(), nullable=True))
    if "payment_status" not in deal_columns:
        op.add_column(
            "deals",
            sa.Column("payment_status", sa.Text(), nullable=False, server_default="simulated"),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    asset_columns = {column["name"] for column in inspector.get_columns("assets")}
    deal_columns = {column["name"] for column in inspector.get_columns("deals")}

    if "payment_status" in deal_columns:
        op.drop_column("deals", "payment_status")
    if "media" in asset_columns:
        op.drop_column("assets", "media")
