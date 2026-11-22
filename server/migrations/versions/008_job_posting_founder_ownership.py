"""Allow founder accounts to own job postings alongside providers."""
from alembic import op
import sqlalchemy as sa

revision = "008_job_posting_founder_ownership"
down_revision = "007_asset_media_simulated_payment"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("job_postings") as batch_op:
        batch_op.add_column(
            sa.Column(
                "founder_user_id",
                sa.Integer(),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=True,
            )
        )
        batch_op.alter_column(
            "provider_id",
            existing_type=sa.Integer(),
            nullable=True,
        )
        batch_op.create_check_constraint(
            "ck_job_posting_exactly_one_owner",
            "(provider_id IS NOT NULL AND founder_user_id IS NULL) OR "
            "(provider_id IS NULL AND founder_user_id IS NOT NULL)",
        )
    op.create_index(
        "ix_job_postings_founder_user_id", "job_postings", ["founder_user_id"]
    )


def downgrade() -> None:
    bind = op.get_bind()
    has_founder_jobs = bind.execute(
        sa.text("SELECT 1 FROM job_postings WHERE founder_user_id IS NOT NULL LIMIT 1")
    ).first()
    if has_founder_jobs:
        raise RuntimeError(
            "Cannot downgrade: founder-owned job postings exist. "
            "Reassign or remove them before downgrading."
        )
    op.drop_index("ix_job_postings_founder_user_id", table_name="job_postings")
    with op.batch_alter_table("job_postings") as batch_op:
        batch_op.drop_constraint(
            "ck_job_posting_exactly_one_owner", type_="check"
        )
        batch_op.alter_column(
            "provider_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
        batch_op.drop_column("founder_user_id")
