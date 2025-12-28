#!/bin/sh
set -e

# Ensure any accidentally committed .env file is removed at container start
rm -f .env

echo "[entrypoint] running database migrations (alembic upgrade head)"
alembic upgrade head

echo "[entrypoint] starting uvicorn"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
