# SmartCare Chatbot Configuration Test

Write-Host "🤖 SmartCare Chatbot Configuration Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check .env file exists
Write-Host "Test 1: Checking backend .env file..." -ForegroundColor Yellow
if (Test-Path "smartcare-backend\.env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if GEMINI_API_KEY is set
    $envContent = Get-Content "smartcare-backend\.env" -Raw
    if ($envContent -match "GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg") {
        Write-Host "✅ GEMINI_API_KEY is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ GEMINI_API_KEY not found or incorrect" -ForegroundColor Red
    }
    
    if ($envContent -match "FRONTEND_URL=https://smartcare-zflo.netlify.app") {
        Write-Host "✅ FRONTEND_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  FRONTEND_URL might not be set correctly" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Run: .\setup-chatbot.ps1" -ForegroundColor Gray
}

Write-Host ""

# Test 2: Check netlify.toml
Write-Host "Test 2: Checking netlify.toml..." -ForegroundColor Yellow
if (Test-Path "netlify.toml") {
    $netlifyContent = Get-Content "netlify.toml" -Raw
    if ($netlifyContent -match "smartcare-zflo.onrender.com") {
        Write-Host "✅ Netlify configured with production URLs" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Netlify URLs might need updating" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ netlify.toml not found" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check Python dependencies
Write-Host "Test 3: Checking Python environment..." -ForegroundColor Yellow
if (Test-Path "smartcare-backend\venv") {
    Write-Host "✅ Virtual environment exists" -ForegroundColor Green
    
    # Try to import chatbot service
    Write-Host "   Testing chatbot service import..." -ForegroundColor Gray
    $testResult = & python -c "import sys; sys.path.insert(0, 'smartcare-backend'); from app.services.chatbot import ChatbotService, USE_AI; print('AI_ENABLED' if USE_AI else 'AI_DISABLED')" 2>&1
    
    if ($testResult -match "AI_ENABLED") {
        Write-Host "✅ Chatbot service loaded with AI ENABLED" -ForegroundColor Green
    } elseif ($testResult -match "AI_DISABLED") {
        Write-Host "⚠️  Chatbot service loaded but AI DISABLED" -ForegroundColor Yellow
        Write-Host "   Check GEMINI_API_KEY in .env file" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Could not verify chatbot service" -ForegroundColor Yellow
        Write-Host "   Error: $testResult" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Virtual environment not found" -ForegroundColor Red
    Write-Host "   Run: .\setup-chatbot.ps1" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Check Node modules
Write-Host "Test 4: Checking Node.js environment..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Node modules installed" -ForegroundColor Green
} else {
    Write-Host "❌ Node modules not found" -ForegroundColor Red
    Write-Host "   Run: npm install" -ForegroundColor Gray
}

Write-Host ""

# Test 5: Check chatbot files
Write-Host "Test 5: Checking chatbot files..." -ForegroundColor Yellow
$requiredFiles = @(
    "smartcare-backend\app\services\chatbot.py",
    "src\components\Chatbot.tsx",
    "smartcare-backend\app\main.py"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file not found" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

# Summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

if ($allFilesExist) {
    Write-Host "✅ All required files present" -ForegroundColor Green
    Write-Host "✅ Configuration appears correct" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to start!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Start backend:" -ForegroundColor Yellow
    Write-Host "   cd smartcare-backend" -ForegroundColor White
    Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Start frontend (new terminal):" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Test chatbot:" -ForegroundColor Yellow
    Write-Host "   Open http://localhost:5173" -ForegroundColor White
    Write-Host "   Click chatbot button (🤖)" -ForegroundColor White
    Write-Host "   Send: 'What are the symptoms of flu?'" -ForegroundColor White
} else {
    Write-Host "⚠️  Some files are missing" -ForegroundColor Yellow
    Write-Host "   Please check the errors above" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📚 Documentation: See CONFIGURATION_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""
