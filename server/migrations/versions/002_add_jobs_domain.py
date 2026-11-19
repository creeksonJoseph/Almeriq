"""002_add_jobs_domain

Revision ID: 002_add_jobs_domain
Revises: d4f8c2b6e9a1
Create Date: 2026-11-19

Idempotent, dialect-neutral creation of the jobs domain tables:
job_postings, job_applications, job_seeker_profiles.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "002_add_jobs_domain"
down_revision: Union[str, Sequence[str], None] = "d4f8c2b6e9a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Create jobs domain tables with indexes (IF NOT EXISTS)."""
    # 1. job_postings
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS job_postings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_id INTEGER NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT,
                role_type TEXT,
                salary_min NUMERIC(12, 2),
                salary_max NUMERIC(12, 2),
                requirements TEXT,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_job_postings_provider_id ON job_postings (provider_id)"))
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS idx_job_postings_provider_active ON job_postings (provider_id, is_active)")
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_job_postings_is_active ON job_postings (is_active)"))

    # 2. job_applications
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS job_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_posting_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
                applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                cover_letter TEXT,
                resume_url TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_job_application_one_per_user UNIQUE (job_posting_id, applicant_id)
            )
            """
        )
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id ON job_applications (job_posting_id)"))
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications (applicant_id)"))
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_status ON job_applications (applicant_id, status)")
    )

    # 3. job_seeker_profiles
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS job_seeker_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                headline TEXT,
                bio TEXT,
                location TEXT,
                skills_json TEXT NOT NULL DEFAULT '[]',
                experience_years INTEGER,
                resume_url TEXT,
                portfolio_url TEXT,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_job_seeker_profile_user UNIQUE (user_id)
            )
            """
        )
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles (user_id)"))


def downgrade() -> None:
    """Downgrade schema: Drop jobs domain tables in reverse dependency order."""
    op.execute(sa.text("DROP TABLE IF EXISTS job_applications"))
    op.execute(sa.text("DROP TABLE IF EXISTS job_seeker_profiles"))
    op.execute(sa.text("DROP TABLE IF EXISTS job_postings"))
