"""Restore database-level ownership constraints for founder-owned job postings.

Revision 015 is intentionally separate from revision 008. Revision 008 was
already applied in some environments without these constraints, so this
migration repairs both fresh databases and databases that have already
recorded revision 008.
"""
from alembic import op
import sqlalchemy as sa

revision = "015_job_posting_owner_constraints"
down_revision = "014_investor_deal_confirmation"
branch_labels = None
depends_on = None

CHECK_NAME = "ck_job_posting_exactly_one_owner"
FOREIGN_KEY_NAME = "fk_job_postings_founder_user_id_users"


def _owner_check_exists(inspector) -> bool:
    for constraint in inspector.get_check_constraints("job_postings"):
        if constraint.get("name") == CHECK_NAME:
            return True
        sqltext = (constraint.get("sqltext") or "").lower().replace('"', "").replace(" ", "")
        if (
            "provider_idisnotnull" in sqltext
            and "founder_user_idisnull" in sqltext
            and "provider_idisnull" in sqltext
            and "founder_user_idisnotnull" in sqltext
        ):
            return True
    return False


def _founder_foreign_key_exists(inspector) -> bool:
    return any(
        fk.get("referred_table") == "users"
        and fk.get("constrained_columns") == ["founder_user_id"]
        for fk in inspector.get_foreign_keys("job_postings")
    )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    has_check = _owner_check_exists(inspector)
    has_foreign_key = _founder_foreign_key_exists(inspector)

    # batch_alter_table lets SQLite rebuild the table with the constraints;
    # PostgreSQL emits the corresponding ALTER TABLE statements.
    with op.batch_alter_table("job_postings") as batch_op:
        if not has_foreign_key:
            batch_op.create_foreign_key(
                FOREIGN_KEY_NAME,
                "users",
                ["founder_user_id"],
                ["id"],
                ondelete="CASCADE",
            )
        if not has_check:
            batch_op.create_check_constraint(
                CHECK_NAME,
                "(provider_id IS NOT NULL AND founder_user_id IS NULL) OR "
                "(provider_id IS NULL AND founder_user_id IS NOT NULL)",
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    named_checks = {
        item.get("name")
        for item in inspector.get_check_constraints("job_postings")
        if item.get("name")
    }
    named_foreign_keys = {
        item.get("name")
        for item in inspector.get_foreign_keys("job_postings")
        if item.get("name")
        and item.get("referred_table") == "users"
        and item.get("constrained_columns") == ["founder_user_id"]
    }

    with op.batch_alter_table("job_postings") as batch_op:
        if CHECK_NAME in named_checks:
            batch_op.drop_constraint(CHECK_NAME, type_="check")
        for foreign_key_name in named_foreign_keys:
            batch_op.drop_constraint(foreign_key_name, type_="foreignkey")
