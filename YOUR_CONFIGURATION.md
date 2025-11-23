# 🔑 Your SmartCare Configuration

## Backend Configuration (.env)

**Location:** `smartcare-backend/.env`

Create this file with the following content:

```bash
# Database Configuration
DATABASE_URL=sqlite:///./smartcare.db

# Security
SECRET_KEY=smartcare-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
FRONTEND_URL=https://smartcare-zflo.netlify.app
ADDITIONAL_ORIGINS=http://localhost:5173,https://localhost:5173

# Google Gemini AI Configuration
GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg

# Application Settings
DEBUG=False
LOG_LEVEL=INFO
```

## Frontend Configuration

Your frontend URLs are already configured in `netlify.toml`:
- **API URL:** https://smartcare-zflo.onrender.com
- **WebSocket URL:** wss://smartcare-zflo.onrender.com/ws/chatbot

## Quick Setup Commands

### Create Backend .env File (Windows PowerShell)

```powershell
cd smartcare-backend

# Create .env file
@"
DATABASE_URL=sqlite:///./smartcare.db
SECRET_KEY=smartcare-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=https://smartcare-zflo.netlify.app
ADDITIONAL_ORIGINS=http://localhost:5173,https://localhost:5173
GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg
DEBUG=False
LOG_LEVEL=INFO
"@ | Out-File -FilePath .env -Encoding utf8
```

### Or Create Manually

1. Navigate to `smartcare-backend/` folder
2. Create a new file named `.env` (note the dot at the start)
3. Copy the configuration from the "Backend Configuration" section above
4. Save the file

## Render.com Environment Variables

Set these in your Render.com dashboard for the backend:

```
GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg
FRONTEND_URL=https://smartcare-zflo.netlify.app
SECRET_KEY=smartcare-secret-key-change-in-production-2024
DATABASE_URL=sqlite:///./smartcare.db
```

## Netlify Environment Variables

Already configured in `netlify.toml`:
- ✅ VITE_API_URL=https://smartcare-zflo.onrender.com
- ✅ VITE_WS_URL=wss://smartcare-zflo.onrender.com/ws/chatbot

## Verification

### Test Backend Locally

```bash
cd smartcare-backend
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check: http://localhost:8000/health

### Test Frontend Locally

```bash
npm run dev
```

Check: http://localhost:5173

### Test Chatbot

1. Open the app
2. Click chatbot button (🤖)
3. Check connection status: 🟢 Connected
4. Send: "Hello"
5. Verify AI response (should be more natural than rule-based)

## Production URLs

- **Frontend:** https://smartcare-zflo.netlify.app
- **Backend:** https://smartcare-zflo.onrender.com
- **Backend Health:** https://smartcare-zflo.onrender.com/health
- **WebSocket:** wss://smartcare-zflo.onrender.com/ws/chatbot

## Next Steps

1. ✅ Create backend `.env` file (see commands above)
2. ✅ Test locally
3. ✅ Verify AI responses work
4. ✅ Deploy to Render.com (set environment variables)
5. ✅ Test production chatbot

---

**Note:** Your Google API key is now configured for AI-powered responses! 🤖✨
