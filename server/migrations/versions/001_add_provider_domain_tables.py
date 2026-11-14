"""001_add_provider_domain_tables

Revision ID: 001_add_provider_domain_tables
Revises: 1f63d573c728
Create Date: 2026-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_add_provider_domain_tables'
down_revision: Union[str, Sequence[str], None] = '758e6570f549'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Create provider domain tables with indexes."""
    # 1. Provider profiles table
    op.create_table(
        "provider_profiles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("company_name", sa.Text, nullable=True),
        sa.Column("trading_name", sa.Text, nullable=True),
        sa.Column("provider_type", sa.Text, nullable=True),
        sa.Column("location", sa.Text, nullable=True),
        sa.Column("about", sa.Text, nullable=True),
        sa.Column("verified", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("enclave_key", sa.Text, nullable=True),
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
    op.create_index("idx_provider_profiles_user_id", "provider_profiles", ["user_id"])

    # 2. Assets table
    op.create_table(
        "assets",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "provider_id",
            sa.Integer,
            sa.ForeignKey("provider_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("category", sa.Text, nullable=False),
        sa.Column("kind", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("specs", sa.JSON, nullable=True),
        sa.Column("price_monthly", sa.Numeric(12, 2), nullable=True),
        sa.Column("quantity_capacity", sa.Integer, nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="available"),
        sa.Column("telemetry_url", sa.Text, nullable=True),
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
    op.create_index("idx_assets_provider_id", "assets", ["provider_id"])
    op.create_index("idx_assets_provider_kind", "assets", ["provider_id", "kind"])
    op.create_index("idx_assets_provider_status", "assets", ["provider_id", "status"])

    # 3. Coverage regions table
    op.create_table(
        "coverage_regions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "provider_id",
            sa.Integer,
            sa.ForeignKey("provider_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("region", sa.Text, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_coverage_regions_provider_id", "coverage_regions", ["provider_id"])
    op.create_index(
        "uq_coverage_provider_region", "coverage_regions", ["provider_id", "region"], unique=True
    )

    # 4. Orders table
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("order_id", sa.Text, unique=True, nullable=False),
        sa.Column(
            "client_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "provider_id",
            sa.Integer,
            sa.ForeignKey("provider_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "asset_id",
            sa.Integer,
            sa.ForeignKey("assets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("allocation", sa.Text, nullable=True),
        sa.Column("lease_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.Text, nullable=False, server_default="pending_review"),
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
    op.create_index("idx_orders_order_id", "orders", ["order_id"])
    op.create_index("idx_orders_client_id", "orders", ["client_id"])
    op.create_index("idx_orders_provider_id", "orders", ["provider_id"])
    op.create_index("idx_orders_asset_id", "orders", ["asset_id"])
    op.create_index("idx_orders_provider_status", "orders", ["provider_id", "status"])
    op.create_index("idx_orders_client_status", "orders", ["client_id", "status"])

    # 5. Order events table
    op.create_table(
        "order_events",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "order_id",
            sa.Integer,
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_type", sa.Text, nullable=False),
        sa.Column(
            "actor_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_order_events_order_id", "order_events", ["order_id"])
    op.create_index("idx_order_events_actor_id", "order_events", ["actor_id"])
    op.create_index("idx_order_events_order_created", "order_events", ["order_id", "created_at"])

    # 6. Deals table
    op.create_table(
        "deals",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "order_id",
            sa.Integer,
            sa.ForeignKey("orders.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("payment_method", sa.Text, nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("signature", sa.Text, nullable=True),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("idx_deals_order_id", "deals", ["order_id"])

    # 7. Conversations table
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "participant_a_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "participant_b_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
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
    )
    op.create_index("idx_conversations_participant_a", "conversations", ["participant_a_id"])
    op.create_index("idx_conversations_participant_b", "conversations", ["participant_b_id"])
    op.create_index(
        "uq_conversation_participants", "conversations", ["participant_a_id", "participant_b_id"], unique=True
    )

    # 8. Messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "conversation_id",
            sa.Integer,
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sender_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("idx_messages_sender_id", "messages", ["sender_id"])
    op.create_index(
        "idx_messages_conversation_created", "messages", ["conversation_id", "created_at"]
    )

    # 9. Notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("read", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("link", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("idx_notifications_user_id", "notifications", ["user_id"])
    op.create_index(
        "idx_notifications_user_read_created", "notifications", ["user_id", "read", "created_at"]
    )


def downgrade() -> None:
    """Downgrade schema: Drop provider domain tables in reverse dependency order."""
    op.drop_index("idx_notifications_user_read_created", table_name="notifications")
    op.drop_index("idx_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("idx_messages_conversation_created", table_name="messages")
    op.drop_index("idx_messages_sender_id", table_name="messages")
    op.drop_index("idx_messages_conversation_id", table_name="messages")
    op.drop_table("messages")

    op.drop_index("uq_conversation_participants", table_name="conversations")
    op.drop_index("idx_conversations_participant_b", table_name="conversations")
    op.drop_index("idx_conversations_participant_a", table_name="conversations")
    op.drop_table("conversations")

    op.drop_index("idx_deals_order_id", table_name="deals")
    op.drop_table("deals")

    op.drop_index("idx_order_events_order_created", table_name="order_events")
    op.drop_index("idx_order_events_actor_id", table_name="order_events")
    op.drop_index("idx_order_events_order_id", table_name="order_events")
    op.drop_table("order_events")

    op.drop_index("idx_orders_client_status", table_name="orders")
    op.drop_index("idx_orders_provider_status", table_name="orders")
    op.drop_index("idx_orders_asset_id", table_name="orders")
    op.drop_index("idx_orders_provider_id", table_name="orders")
    op.drop_index("idx_orders_client_id", table_name="orders")
    op.drop_index("idx_orders_order_id", table_name="orders")
    op.drop_table("orders")

    op.drop_index("uq_coverage_provider_region", table_name="coverage_regions")
    op.drop_index("idx_coverage_regions_provider_id", table_name="coverage_regions")
    op.drop_table("coverage_regions")

    op.drop_index("idx_assets_provider_status", table_name="assets")
    op.drop_index("idx_assets_provider_kind", table_name="assets")
    op.drop_index("idx_assets_provider_id", table_name="assets")
    op.drop_table("assets")

    op.drop_index("idx_provider_profiles_user_id", table_name="provider_profiles")
    op.drop_table("provider_profiles")