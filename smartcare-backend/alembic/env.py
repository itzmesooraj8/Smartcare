import asyncio
from logging.config import fileConfig
import os
import sys

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy import engine_from_config, create_engine
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# --- FIX: Add current directory to Python Path ---
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- FIX: Import Base from the correct location ---
# Was: from app.db.base import Base
from app.database import Base
from app.core.config import Settings

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

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Use the Environment Variable for DB URL if available (Production/Local)
    db_url = os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
    
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = db_url

    # If the URL uses an async driver (eg. postgresql+asyncpg), use async engine.
    # Otherwise fall back to a synchronous engine so classic drivers like psycopg2 work.
    if db_url.startswith("postgresql+async") or "+async" in db_url:
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

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
