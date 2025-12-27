import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy import engine_from_config
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Ensure project package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import application settings which handle dotenv loading and validation
from app.core.config import settings

# Import Base metadata from the application to support autogenerate
from app.database import Base

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the metadata target for autogenerate
target_metadata = Base.metadata


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
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Important: use the application's `settings.DATABASE_URL` which loads .env files
    and validates required environment variables. This avoids Alembic missing the
    application's dotenv configuration during CI/local runs.
    """
    # Prefer the application's settings value (which already loaded .env/.env.local)
    db_url = getattr(settings, "DATABASE_URL", None) or config.get_main_option("sqlalchemy.url")

    # Update the alembic configuration section so engine_from_config picks it up.
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = db_url

    # Use async engine if an async dialect is used; otherwise use classic engine.
    if db_url and (db_url.startswith("postgresql+async") or "+async" in db_url):
        connectable = async_engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)

        await connectable.dispose()
    else:
        connectable = engine_from_config(
            configuration,
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            do_run_migrations(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
