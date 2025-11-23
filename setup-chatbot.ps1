# SmartCare Chatbot Quick Setup Script (PowerShell)

Write-Host "🤖 SmartCare Chatbot Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "smartcare-backend")) {
    Write-Host "❌ Error: Please run this script from the smartcare root directory" -ForegroundColor Red
    exit 1
}

# Backend setup
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location smartcare-backend

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit smartcare-backend\.env and add your GEMINI_API_KEY (optional)" -ForegroundColor Yellow
    Write-Host "   Get your key from: https://makersuite.google.com/app/apikey" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "🐍 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "📥 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

Write-Host ""
Write-Host "✅ Backend setup complete!" -ForegroundColor Green
Write-Host ""

# Frontend setup
Set-Location ..
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 Installing Node dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Node modules already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Frontend setup complete!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "🎉 Setup Complete!" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host ""
Write-Host "1️⃣  Start Backend:" -ForegroundColor Yellow
Write-Host "   cd smartcare-backend" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Start Frontend (in a new terminal):" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Open browser to: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 For more information, see CHATBOT_README.md" -ForegroundColor Cyan
Write-Host ""

# Optional: Check if GEMINI_API_KEY is set
if (Test-Path "smartcare-backend\.env") {
    $envContent = Get-Content "smartcare-backend\.env" -Raw
    if ($envContent -match "GEMINI_API_KEY=your-gemini-api-key-here") {
        Write-Host "⚠️  REMINDER: Update GEMINI_API_KEY in smartcare-backend\.env for AI features" -ForegroundColor Yellow
        Write-Host "   (Chatbot will work with rule-based responses without it)" -ForegroundColor Gray
    }
}
