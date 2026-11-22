"""Add expert profiles and advisory requests."""
from alembic import op
import sqlalchemy as sa

revision = "010_expert_advisory_domain"
down_revision = "009_job_seeker_profile_sections"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "expert_profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("headline", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("expertise_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("years_experience", sa.Integer(), nullable=True),
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("hourly_rate", sa.Numeric(12, 2), nullable=True),
        sa.Column("availability", sa.Text(), nullable=True),
        sa.Column("portfolio_url", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_expert_profiles_user_id", "expert_profiles", ["user_id"])
    op.create_index("ix_expert_profiles_active", "expert_profiles", ["is_active"])

    op.create_table(
        "advisory_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("founder_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expert_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("budget", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_advisory_requests_founder_id", "advisory_requests", ["founder_id"])
    op.create_index("ix_advisory_requests_expert_id", "advisory_requests", ["expert_id"])


def downgrade() -> None:
    op.drop_index("ix_advisory_requests_expert_id", table_name="advisory_requests")
    op.drop_index("ix_advisory_requests_founder_id", table_name="advisory_requests")
    op.drop_table("advisory_requests")
    op.drop_index("ix_expert_profiles_active", table_name="expert_profiles")
    op.drop_index("ix_expert_profiles_user_id", table_name="expert_profiles")
    op.drop_table("expert_profiles")
