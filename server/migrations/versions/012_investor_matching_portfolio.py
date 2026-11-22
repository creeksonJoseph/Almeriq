"""Expand investor matching, startup pitch materials and portfolio tracking."""

from alembic import op
import sqlalchemy as sa

revision = "012_investor_matching_portfolio"
down_revision = "011_teams_workforce"
branch_labels = None
depends_on = None


def upgrade() -> None:
    investor_columns = [
        sa.Column("investor_type", sa.Text(), nullable=True),
        sa.Column("preferred_sectors_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("preferred_stages_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("geographies_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("check_size_min", sa.Numeric(12, 2), nullable=True),
        sa.Column("check_size_max", sa.Numeric(12, 2), nullable=True),
        sa.Column("lead_follow_preference", sa.Text(), nullable=True),
        sa.Column("track_record", sa.Text(), nullable=True),
        sa.Column("value_add", sa.Text(), nullable=True),
        sa.Column("accreditation_status", sa.Text(), nullable=True),
        sa.Column("target_return_percent", sa.Numeric(7, 4), nullable=True),
    ]
    for column in investor_columns:
        op.add_column("investor_profiles", column)

    pitch_columns = [
        sa.Column("location", sa.Text(), nullable=True),
        sa.Column("website_url", sa.Text(), nullable=True),
        sa.Column("pitch_deck_url", sa.Text(), nullable=True),
        sa.Column("financials_url", sa.Text(), nullable=True),
        sa.Column("traction", sa.Text(), nullable=True),
        sa.Column("team_summary", sa.Text(), nullable=True),
        sa.Column("documents_json", sa.Text(), nullable=False, server_default="[]"),
    ]
    for column in pitch_columns:
        op.add_column("startup_pitches", column)

    investment_columns = [
        sa.Column("investment_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("current_value", sa.Numeric(12, 2), nullable=True),
        sa.Column("ownership_percent", sa.Numeric(7, 4), nullable=True),
        sa.Column("investment_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    ]
    for column in investment_columns:
        op.add_column("investments", column)


def downgrade() -> None:
    for name in ("notes", "investment_date", "ownership_percent", "current_value", "investment_amount"):
        op.drop_column("investments", name)
    for name in ("documents_json", "team_summary", "traction", "financials_url", "pitch_deck_url", "website_url", "location"):
        op.drop_column("startup_pitches", name)
    for name in ("target_return_percent", "accreditation_status", "value_add", "track_record", "lead_follow_preference", "check_size_max", "check_size_min", "geographies_json", "preferred_stages_json", "preferred_sectors_json", "investor_type"):
        op.drop_column("investor_profiles", name)
