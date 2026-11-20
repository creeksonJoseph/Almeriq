"""Add client_asset_id to assets."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "005_add_asset_client_id"
down_revision = "004_add_provider_engagement_prefs"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns("assets")]
    if "client_asset_id" not in cols:
        op.add_column("assets", sa.Column("client_asset_id", sa.Text(), nullable=True))
    # unique index best-effort
    try:
        op.create_index("uq_assets_provider_client_asset", "assets", ["provider_id", "client_asset_id"], unique=True)
    except Exception:
        pass

def downgrade():
    try:
        op.drop_index("uq_assets_provider_client_asset", table_name="assets")
    except Exception:
        pass
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns("assets")]
    if "client_asset_id" in cols:
        op.drop_column("assets", "client_asset_id")
