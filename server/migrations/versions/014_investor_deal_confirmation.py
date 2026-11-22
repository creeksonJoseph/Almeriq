"""Store investor demo deal confirmation metadata."""

from alembic import op
import sqlalchemy as sa

revision = "014_investor_deal_confirmation"
down_revision = "013_investment_risk_level"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("investments", sa.Column("payment_method", sa.Text(), nullable=True))
    op.add_column("investments", sa.Column("signature_data", sa.Text(), nullable=True))
    op.add_column("investments", sa.Column("deal_confirmed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("investments", "deal_confirmed_at")
    op.drop_column("investments", "signature_data")
    op.drop_column("investments", "payment_method")
