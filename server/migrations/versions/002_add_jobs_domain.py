"""002_add_jobs_domain

Revision ID: 002_add_jobs_domain
Revises: d4f8c2b6e9a1
Create Date: 2026-11-19

Dialect-neutral creation of the jobs domain tables using SQLAlchemy operations.
Alembic tracks this revision; this migration is intentionally not rerunnable
against a database where these tables already exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_add_jobs_domain"
down_revision: Union[str, Sequence[str], None] = "d4f8c2b6e9a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "job_postings",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "provider_id",
            sa.Integer,
            sa.ForeignKey("provider_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("location", sa.Text, nullable=True),
        sa.Column("role_type", sa.Text, nullable=True),
        sa.Column("salary_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("salary_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("requirements", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_job_postings_provider_id", "job_postings", ["provider_id"])
    op.create_index(
        "idx_job_postings_provider_active", "job_postings", ["provider_id", "is_active"]
    )
    op.create_index("idx_job_postings_is_active", "job_postings", ["is_active"])

    op.create_table(
        "job_applications",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "job_posting_id",
            sa.Integer,
            sa.ForeignKey("job_postings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "applicant_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("cover_letter", sa.Text, nullable=True),
        sa.Column("resume_url", sa.Text, nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="pending"),
        sa.Column(
            "applied_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "job_posting_id", "applicant_id", name="uq_job_application_one_per_user"
        ),
    )
    op.create_index(
        "idx_job_applications_job_posting_id", "job_applications", ["job_posting_id"]
    )
    op.create_index(
        "idx_job_applications_applicant_id", "job_applications", ["applicant_id"]
    )
    op.create_index(
        "idx_job_applications_applicant_status",
        "job_applications",
        ["applicant_id", "status"],
    )

    op.create_table(
        "job_seeker_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("headline", sa.Text, nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("location", sa.Text, nullable=True),
        sa.Column("skills_json", sa.Text, nullable=False, server_default="[]"),
        sa.Column("experience_years", sa.Integer, nullable=True),
        sa.Column("resume_url", sa.Text, nullable=True),
        sa.Column("portfolio_url", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", name="uq_job_seeker_profile_user"),
    )
    op.create_index(
        "idx_job_seeker_profiles_user_id", "job_seeker_profiles", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_job_seeker_profiles_user_id", table_name="job_seeker_profiles")
    op.drop_table("job_seeker_profiles")
    op.drop_index(
        "idx_job_applications_applicant_status", table_name="job_applications"
    )
    op.drop_index("idx_job_applications_applicant_id", table_name="job_applications")
    op.drop_index("idx_job_applications_job_posting_id", table_name="job_applications")
    op.drop_table("job_applications")
    op.drop_index("idx_job_postings_is_active", table_name="job_postings")
    op.drop_index("idx_job_postings_provider_active", table_name="job_postings")
    op.drop_index("idx_job_postings_provider_id", table_name="job_postings")
    op.drop_table("job_postings")
