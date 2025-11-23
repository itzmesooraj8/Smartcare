# 🤖 SmartCare Chatbot - Quick Reference Card

## 🚀 Quick Start

### Start Backend
```bash
cd smartcare-backend
source venv/bin/activate  # Windows: .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
npm run dev
```

### Open Application
```
http://localhost:5173
```

## 🔧 Configuration

### Backend (.env)
```bash
# Optional - enables AI responses
GEMINI_API_KEY=your-api-key-here

# Required for CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (netlify.toml or .env)
```bash
# Development
VITE_WS_URL=ws://localhost:8000/ws/chatbot

# Production
VITE_WS_URL=wss://your-backend.onrender.com/ws/chatbot
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `app/services/chatbot.py` | AI chatbot service |
| `app/main.py` | WebSocket endpoint |
| `src/components/Chatbot.tsx` | Frontend component |
| `CHATBOT_README.md` | Full documentation |
| `CHATBOT_TESTING.md` | Testing checklist |

## 🎯 Features

✅ AI-powered responses (Google Gemini)
✅ Rule-based fallback
✅ Auto-reconnection (5 attempts)
✅ Connection status indicator
✅ Conversation history
✅ Error handling

## 🧪 Quick Test

1. Click chatbot button (🤖)
2. Check status: 🟢 Connected
3. Send: "Hello"
4. Verify response received

## 🐛 Common Issues

### "Connection lost"
- Check backend is running: `http://localhost:8000/health`
- Verify VITE_WS_URL is correct

### "AI not working"
- Check GEMINI_API_KEY in backend .env
- Chatbot will use rule-based responses as fallback

### CORS errors
- Add frontend URL to FRONTEND_URL in backend .env

## 📊 Connection Status

| Indicator | Meaning |
|-----------|---------|
| 🟢 Green | Connected |
| 🟡 Yellow (pulsing) | Connecting... |
| 🔴 Red | Disconnected |

## 🔗 Useful Links

- Get Gemini API Key: https://makersuite.google.com/app/apikey
- Backend Health: http://localhost:8000/health
- Frontend: http://localhost:5173

## 📚 Documentation

- **Setup Guide**: CHATBOT_README.md
- **Testing**: CHATBOT_TESTING.md
- **Summary**: CHATBOT_FIX_SUMMARY.md

## 💡 Sample Queries

- "Hello"
- "How do I book an appointment?"
- "Where are my medical records?"
- "How do I pay my bill?"
- "Can I have a video consultation?"

## 🎓 Architecture

```
Frontend (React + WebSocket)
    ↓
Backend (FastAPI)
    ↓
ChatbotService
    ├─→ Google Gemini AI (if configured)
    └─→ Rule-based responses (fallback)
```

## ⚡ Performance

- Connection: < 2s
- Rule-based: < 500ms
- AI response: < 3s
- Auto-reconnect: 3s delay
- Max retries: 5

## 🔒 Security

✅ CORS protection
✅ Environment variables
✅ No client-side API keys
✅ Secure WebSocket (wss://)

---

**Need help?** See CHATBOT_README.md for detailed documentation
