#!/usr/bin/env python3
"""
finalize_project.py

Robust Windows-friendly cleanup, migration and launch helper for SmartCare backend.

Usage: run from the `smartcare-backend` directory:
    python finalize_project.py

This script is intentionally conservative: it will refuse to run migrations or
start the app unless `DATABASE_URL` is set in the environment (or in a .env file).
"""

from __future__ import annotations

import os
import sys
import shutil
import subprocess
from pathlib import Path

from dotenv import load_dotenv
from colorama import init as colorama_init, Fore, Style


colorama_init()


def info(msg: str) -> None:
    print(f"[INFO] {msg}")


def warn(msg: str) -> None:
    print(f"[WARN] {msg}")


def error(msg: str) -> None:
    print(f"{Fore.RED}[ERROR]{Style.RESET_ALL} {msg}")


def remove_path(path: Path) -> None:
    try:
        if not path.exists():
            info(f"Not found (skipped): {path}")
            return
        if path.is_dir():
            shutil.rmtree(path)
            info(f"Removed directory: {path}")
        else:
            path.unlink()
            info(f"Removed file: {path}")
    except Exception as exc:
        warn(f"Failed to remove {path}: {exc}")


def run_command(cmd: list[str], cwd: Path | None = None, check: bool = True) -> None:
    info(f"Running: {' '.join(cmd)} (cwd={cwd or Path.cwd()})")
    subprocess.check_call(cmd, cwd=str(cwd) if cwd else None)


def main() -> None:
    base = Path(__file__).resolve().parent
    info(f"Base folder: {base}")

    # Load environment from .env.local then .env to mimic app behavior
    load_dotenv(dotenv_path=base / '.env.local', override=True)
    load_dotenv(dotenv_path=base / '.env', override=True)

    # Ensure DATABASE_URL is present before doing anything destructive or running alembic
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        error('DATABASE_URL is not set. Create a .env file with DATABASE_URL and rerun. Aborting.')
        sys.exit(1)

    info('Detected DATABASE_URL in environment. Proceeding...')

    # Targets to delete
    targets = [
        base.parent / 'backups',  # ../backups
        base / 'backups',
        base / 'init_supabase.py',
        base / 'start_server.py',
        base / 'run_backend.ps1',
    ]

    info('Beginning cleanup of legacy/ghost files...')
    for t in targets:
        remove_path(t)

    # Remove alembic sqlite migrations if present
    alembic_versions_dir = base / 'alembic' / 'versions'
    if alembic_versions_dir.exists():
        for p in alembic_versions_dir.glob('*sqlite*.py'):
            remove_path(p)
    else:
        info('No alembic versions folder found (skipped).')

    # Safety net: remove named stray files in base
    for name in ('init_supabase.py', 'start_server.py', 'run_backend.ps1'):
        remove_path(base / name)

    # Install dependencies
    try:
        run_command([sys.executable, '-m', 'pip', 'install', '--upgrade', 'pip'], base)
        run_command([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], base)
    except subprocess.CalledProcessError as exc:
        error(f'Dependency installation failed: {exc}')
        sys.exit(2)

    # Generate alembic revision (best-effort) and upgrade head
    try:
        run_command([sys.executable, '-m', 'alembic', 'revision', '--autogenerate', '-m', 'final_fix'], base)
    except subprocess.CalledProcessError:
        warn('Alembic revision failed or produced no changes. Continuing to upgrade head.')

    try:
        run_command([sys.executable, '-m', 'alembic', 'upgrade', 'head'], base)
    except subprocess.CalledProcessError as exc:
        error(f'Alembic upgrade failed: {exc}')
        sys.exit(3)

    info('Migrations applied. Starting the backend server (this will block)...')
    try:
        run_command([sys.executable, '-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], base)
    except subprocess.CalledProcessError as exc:
        error(f'Failed to start server: {exc}')
        sys.exit(4)


if __name__ == '__main__':
    main()
