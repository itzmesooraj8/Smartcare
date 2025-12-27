# run_backend.ps1
# Installs requirements, validates key env vars from .env, and starts the FastAPI server

Write-Host "Installing dependencies from requirements.txt..."
python -m pip install -r requirements.txt

Write-Host "Checking required env vars (DATABASE_URL, SECRET_KEY)..."
$missing = & python -c 'from dotenv import load_dotenv,find_dotenv; import os; load_dotenv(find_dotenv()); print(",".join([k for k in ("DATABASE_URL","SECRET_KEY") if not os.getenv(k)]))'

if ($missing) {
    Write-Host "Missing env vars: $missing"
    Write-Host "Please add them to .env or set them in your environment. The script will continue, but the server may fail if required vars are missing."
}

Write-Host "Starting server (python -m uvicorn app.main:app)..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
