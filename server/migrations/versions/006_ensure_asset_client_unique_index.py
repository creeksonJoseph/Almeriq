"""Ensure unique index on assets(provider_id, client_asset_id)."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "006_ensure_asset_client_unique_index"
down_revision = "005_add_asset_client_id"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    # check duplicates
    dup = bind.execute(sa.text(
        "SELECT provider_id, client_asset_id, COUNT(*) c FROM assets WHERE client_asset_id IS NOT NULL GROUP BY provider_id, client_asset_id HAVING c > 1"
    )).fetchall()
    if dup:
        raise RuntimeError(f"Duplicate client_asset_id rows exist: {dup}")
    existing = [i["name"] for i in insp.get_indexes("assets")]
    if "uq_assets_provider_client_asset" not in existing:
        op.create_index("uq_assets_provider_client_asset", "assets", ["provider_id", "client_asset_id"], unique=True)

def downgrade():
    try:
        op.drop_index("uq_assets_provider_client_asset", table_name="assets")
    except Exception:
        pass
