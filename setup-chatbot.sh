#!/bin/bash

# SmartCare Chatbot Quick Setup Script

echo "🤖 SmartCare Chatbot Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -d "smartcare-backend" ]; then
    echo "❌ Error: Please run this script from the smartcare root directory"
    exit 1
fi

# Backend setup
echo "📦 Setting up backend..."
cd smartcare-backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit smartcare-backend/.env and add your GEMINI_API_KEY (optional)"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
else
    echo "✅ .env file already exists"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "✅ Backend setup complete!"
echo ""

# Frontend setup
cd ..
echo "📦 Setting up frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node dependencies..."
    npm install
else
    echo "✅ Node modules already installed"
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""

# Summary
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "To start the application:"
echo ""
echo "1️⃣  Start Backend (in smartcare-backend/):"
echo "   cd smartcare-backend"
echo "   source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "2️⃣  Start Frontend (in root directory):"
echo "   npm run dev"
echo ""
echo "3️⃣  Open browser to: http://localhost:5173"
echo ""
echo "📖 For more information, see CHATBOT_README.md"
echo ""

# Optional: Check if GEMINI_API_KEY is set
if [ -f "smartcare-backend/.env" ]; then
    if grep -q "GEMINI_API_KEY=your-gemini-api-key-here" smartcare-backend/.env; then
        echo "⚠️  REMINDER: Update GEMINI_API_KEY in smartcare-backend/.env for AI features"
        echo "   (Chatbot will work with rule-based responses without it)"
    fi
fi
