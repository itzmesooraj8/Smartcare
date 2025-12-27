#!/usr/bin/env python3
"""Start script that installs requirements and runs the FastAPI app via uvicorn.run().
This bypasses PATH/execution-policy issues on Windows by invoking uvicorn as a module.
"""
import subprocess
import sys
import os
from dotenv import load_dotenv, find_dotenv


def ensure_requirements():
    req = os.path.join(os.path.dirname(__file__), "requirements.txt")
    # Ensure key packages are present first to avoid PATH/driver issues
    core_pkgs = ["uvicorn[standard]", "psycopg2-binary", "python-dotenv"]
    try:
        print("Installing core packages:", ", ".join(core_pkgs))
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + core_pkgs)
    except subprocess.CalledProcessError as e:
        print("Failed to install core packages:", e)

    if os.path.exists(req):
        print("Installing requirements from requirements.txt...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req])
        except subprocess.CalledProcessError as e:
            print("Failed to install requirements:", e)
            # continue — maybe packages already present


def load_env():
    # Load .env and .env.local if present, searching upwards from the current working directory.
    env_file = find_dotenv('.env', usecwd=True)
    if env_file:
        print(f"Loading env from {env_file}")
        load_dotenv(env_file, override=True)

    # Prefer .env.local (Vercel style) if available anywhere up the tree
    env_local = find_dotenv('.env.local', usecwd=True)
    if env_local:
        print(f"Loading env from {env_local}")
        load_dotenv(env_local, override=True)

    # Also check adjacent to this script (repo layout may place .env at workspace root)
    local_neighbor = os.path.join(os.path.dirname(__file__), ".env.local")
    if os.path.exists(local_neighbor):
        print(f"Loading env from {local_neighbor}")
        load_dotenv(local_neighbor, override=True)


def check_env():
    missing = []
    for k in ("DATABASE_URL", "SECRET_KEY", "ENCRYPTION_KEY"):
        if not os.getenv(k):
            missing.append(k)
    if missing:
        print("Warning: missing environment vars:", ", ".join(missing))
    else:
        print("Required env vars present.")


def main():
    ensure_requirements()
    load_env()
    check_env()

    print("Launching uvicorn via python -m uvicorn...")
    try:
        import uvicorn

        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        print("Failed to start uvicorn:", e)


if __name__ == "__main__":
    main()
