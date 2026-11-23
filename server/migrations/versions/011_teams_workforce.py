"""Add persistent founder teams, talent invitations and memberships."""

from alembic import op
import sqlalchemy as sa

revision = "011_teams_workforce"
down_revision = "010_expert_advisory_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "team_invitations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("founder_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invitee_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("founder_id", "invitee_id", name="uq_team_invitation_founder_invitee"),
    )
    op.create_index("ix_team_invitations_founder_id", "team_invitations", ["founder_id"])
    op.create_index("ix_team_invitations_invitee_id", "team_invitations", ["invitee_id"])
    op.create_table(
        "team_memberships",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("founder_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("member_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invitation_id", sa.Integer(), sa.ForeignKey("team_invitations.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("role", sa.Text(), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("founder_id", "member_id", name="uq_team_membership_founder_member"),
    )
    op.create_index("ix_team_memberships_founder_id", "team_memberships", ["founder_id"])
    op.create_index("ix_team_memberships_member_id", "team_memberships", ["member_id"])


def downgrade() -> None:
    op.drop_index("ix_team_memberships_member_id", table_name="team_memberships")
    op.drop_index("ix_team_memberships_founder_id", table_name="team_memberships")
    op.drop_table("team_memberships")
    op.drop_index("ix_team_invitations_invitee_id", table_name="team_invitations")
    op.drop_index("ix_team_invitations_founder_id", table_name="team_invitations")
    op.drop_table("team_invitations")
