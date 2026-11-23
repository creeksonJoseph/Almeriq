"""Add structured job seeker profile sections."""
from alembic import op
import sqlalchemy as sa

revision = "009_job_seeker_profile_sections"
down_revision = "008_job_posting_founder_ownership"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = (
        ("experience_json", "[]"),
        ("education_json", "[]"),
        ("certifications_json", "[]"),
        ("projects_json", "[]"),
        ("preferences_json", "{}"),
    )
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("job_seeker_profiles")}
    for name, default in columns:
        if name not in existing:
            op.add_column(
                "job_seeker_profiles",
                sa.Column(name, sa.Text(), nullable=False, server_default=default),
            )


def downgrade() -> None:
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("job_seeker_profiles")}
    for name in ("preferences_json", "projects_json", "certifications_json", "education_json", "experience_json"):
        if name in existing:
            op.drop_column("job_seeker_profiles", name)
