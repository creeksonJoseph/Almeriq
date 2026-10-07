"""initial_schema_waitlist_and_users

Revision ID: 1f63d573c728
Revises: 
Create Date: 2026-10-07 12:52:28.004334

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1f63d573c728'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Create waitlist and users tables with indexes and safe column migration."""
    # 1. Waitlist table & index
    op.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id          SERIAL       PRIMARY KEY,
            full_name   TEXT         NOT NULL,
            email       TEXT         NOT NULL UNIQUE,
            role        TEXT         NOT NULL,
            joined_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at
            ON waitlist (joined_at DESC);
    """)

    # 2. Users table & index
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id                   SERIAL       PRIMARY KEY,
            email                TEXT         NOT NULL UNIQUE,
            hashed_password      TEXT         NULL,
            full_name            TEXT         NULL,
            nationality          TEXT         NULL,
            id_number            TEXT         NULL,
            role                 TEXT         NOT NULL DEFAULT 'user',
            onboarding_completed BOOLEAN      NOT NULL DEFAULT FALSE,
            google_id            TEXT         NULL UNIQUE,
            created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        );

        -- Safe column migrations if table existed from an earlier revision
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

        CREATE INDEX IF NOT EXISTS idx_users_email
            ON users (email);

        CREATE INDEX IF NOT EXISTS idx_users_google_id
            ON users (google_id);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
    op.execute("DROP TABLE IF EXISTS waitlist CASCADE;")
