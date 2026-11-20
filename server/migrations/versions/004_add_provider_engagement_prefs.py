"""Add engagement_preferences to provider_profiles."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "004_add_provider_engagement_prefs"
down_revision = "19fc4425f2d3"
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns("provider_profiles")]
    if "engagement_preferences" not in cols:
        op.add_column("provider_profiles", sa.Column("engagement_preferences", sa.Text(), nullable=True))

def downgrade():
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns("provider_profiles")]
    if "engagement_preferences" in cols:
        op.drop_column("provider_profiles", "engagement_preferences")
