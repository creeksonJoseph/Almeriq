"""Alembic environment configuration."""
from __future__ import annotations
import asyncio
import os
import re
import sys
from logging.config import fileConfig
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Add server directory to path for config import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import settings from core.config (uses pydantic-settings with .env support)
from core.config import settings

# this is the Alembic Config object
config = context.config

# Dynamically read and adapt DATABASE_URL for psycopg driver (Neon DB compatible)
raw_url = settings.DATABASE_URL
if raw_url:
    psycopg_url = re.sub(r"^(postgres|postgresql)(\\+[^:]+)?:", "postgresql+psycopg:", raw_url)
    config.set_main_option("sqlalchemy.url", psycopg_url.replace("%", "%%"))

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from models import Base

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def _ensure_postgresql_alembic_version_capacity(connection: Connection) -> None:
    """Widen Alembic's version column before it records long revision identifiers.

    Alembic's default PostgreSQL version table uses VARCHAR(32). This repository
    contains revision IDs longer than 32 characters, so the column must be widened
    before Alembic starts traversing the migration graph. Doing this here (rather
    than in a normal revision) also repairs databases that currently fail while
    trying to record one of those earlier revisions.
    """
    if connection.dialect.name != "postgresql":
        return

    inspector = sa.inspect(connection)
    if not inspector.has_table("alembic_version"):
        # A new database will get the version table from Alembic itself.
        return

    version_column = next(
        (
            column
            for column in inspector.get_columns("alembic_version")
            if column["name"] == "version_num"
        ),
        None,
    )
    if version_column is None:
        raise RuntimeError(
            "The alembic_version table exists but has no version_num column."
        )

    current_length = getattr(version_column["type"], "length", None)
    if current_length is not None and current_length < 255:
        connection.exec_driver_sql(
            "ALTER TABLE alembic_version "
            "ALTER COLUMN version_num TYPE VARCHAR(255)"
        )


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # Must happen before context.configure/run_migrations: an ordinary Alembic
    # revision cannot fix this because Alembic must first write that revision ID.
    _ensure_postgresql_alembic_version_capacity(connection)
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
