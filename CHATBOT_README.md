# SmartCare Chatbot Documentation

## Overview

The SmartCare chatbot is an intelligent assistant that helps patients and healthcare providers with:
- Booking and managing appointments
- Accessing medical records
- Understanding billing and payments
- Video consultations
- General health information
- Navigating the SmartCare platform

## Features

### 🤖 AI-Powered Responses
- **Google Gemini Integration**: When configured with a Gemini API key, the chatbot uses advanced AI for natural, context-aware conversations
- **Intelligent Fallback**: Automatically falls back to rule-based responses if AI is unavailable
- **Conversation History**: Maintains context across the conversation for more relevant responses

### 🔄 Robust Connection Management
- **Auto-Reconnection**: Automatically attempts to reconnect if the connection is lost (up to 5 attempts)
- **Connection Status**: Visual indicator shows connection state (Connected/Connecting/Disconnected)
- **Error Handling**: Graceful error handling with user-friendly messages

### 💬 User Experience
- **Real-time Communication**: WebSocket-based for instant responses
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Conversation Persistence**: Messages remain visible during the session
- **Typing Indicators**: Shows connection status and activity

## Architecture

### Backend (`smartcare-backend/app/services/chatbot.py`)
```
ChatbotService
├── get_response() - Main entry point
├── get_ai_response() - Google Gemini AI integration
└── get_rule_based_response() - Fallback keyword matching
```

### Frontend (`src/components/Chatbot.tsx`)
```
Chatbot Component
├── WebSocket Connection Management
├── Auto-Reconnection Logic
├── Message History
└── UI Components
```

### WebSocket Endpoint
- **URL**: `/ws/chatbot`
- **Protocol**: WebSocket (ws:// for local, wss:// for production)
- **Message Format**: Plain text

## Setup Instructions

### 1. Backend Configuration

#### Option A: With AI (Recommended)

1. Get a Google Gemini API key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. Create/update `.env` file in `smartcare-backend/`:
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

3. Install dependencies:
   ```bash
   cd smartcare-backend
   pip install -r requirements.txt
   ```

#### Option B: Without AI (Rule-based)

The chatbot will automatically use rule-based responses if no API key is configured. No additional setup needed!

### 2. Frontend Configuration

Update environment variables for your deployment:

**Development** (`.env.local` or vite config):
```bash
VITE_WS_URL=ws://localhost:8000/ws/chatbot
```

**Production** (netlify.toml or hosting platform):
```bash
VITE_WS_URL=wss://your-backend-domain.com/ws/chatbot
```

### 3. Running the Application

#### Start Backend:
```bash
cd smartcare-backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Start Frontend:
```bash
npm run dev
```

## Testing the Chatbot

### 1. Basic Functionality Test

1. Open the application in your browser
2. Click the chatbot button (🤖) in the bottom-right corner
3. Check the connection status indicator:
   - 🟢 Green dot = Connected
   - 🟡 Yellow dot (pulsing) = Connecting
   - 🔴 Red dot = Disconnected

### 2. Test Queries

Try these sample queries:

**Greetings:**
- "Hello"
- "Hi there"

**Appointments:**
- "How do I book an appointment?"
- "I need to schedule a doctor visit"

**Medical Records:**
- "Where can I find my medical records?"
- "Show me my test results"

**Billing:**
- "How do I pay my bill?"
- "What payment methods do you accept?"

**Emergency:**
- "I need urgent help"
- "This is an emergency"

**Video Consultations:**
- "Can I have a video call with my doctor?"
- "How do online consultations work?"

### 3. Connection Recovery Test

1. Start the chatbot
2. Stop the backend server
3. Observe auto-reconnection attempts
4. Restart the backend
5. Verify automatic reconnection

## Troubleshooting

### Issue: "Chatbot configuration error"
**Solution**: 
- Check that `VITE_WS_URL` is set correctly
- Verify backend is running
- Check browser console for detailed errors

### Issue: "Connection lost" repeatedly
**Solution**:
- Verify backend is running on the correct port
- Check firewall settings
- Ensure WebSocket connections are not blocked
- Review backend logs for errors

### Issue: AI responses not working
**Solution**:
- Verify `GEMINI_API_KEY` is set in backend `.env`
- Check API key is valid and has quota
- Review backend logs for Gemini API errors
- Chatbot will automatically fall back to rule-based responses

### Issue: CORS errors
**Solution**:
- Add your frontend URL to `FRONTEND_URL` in backend `.env`
- Check `ADDITIONAL_ORIGINS` if using multiple domains
- Verify CORS middleware configuration in `main.py`

## Deployment

### Backend Deployment (Render/Railway/etc.)

1. Set environment variables:
   ```
   GEMINI_API_KEY=your-key
   FRONTEND_URL=https://your-frontend.netlify.app
   ```

2. Ensure WebSocket support is enabled

3. Use `wss://` (secure WebSocket) in production

### Frontend Deployment (Netlify/Vercel/etc.)

1. Set build environment variable:
   ```
   VITE_WS_URL=wss://your-backend.onrender.com/ws/chatbot
   ```

2. Ensure the backend URL uses `wss://` for HTTPS sites

## API Reference

### WebSocket Events

#### Client → Server
```typescript
// Send a message
websocket.send("How do I book an appointment?")
```

#### Server → Client
```typescript
// Receive a response
websocket.onmessage = (event) => {
  const response = event.data; // Plain text response
}
```

### Conversation History Format
```typescript
{
  sender: 'user' | 'bot',
  content: string
}
```

## Customization

### Adding New Rule-based Responses

Edit `smartcare-backend/app/services/chatbot.py`:

```python
def get_rule_based_response(message: str) -> str:
    msg_lower = message.lower()
    
    # Add your custom keyword matching
    if any(word in msg_lower for word in ['prescription', 'medication']):
        return "You can view your prescriptions in the Medical Records section..."
    
    # ... rest of the function
```

### Customizing AI Behavior

Modify the `SYSTEM_PROMPT` in `chatbot.py`:

```python
SYSTEM_PROMPT = """You are SmartCare Assistant...
[Add your custom instructions here]
"""
```

### Styling the Chatbot

Edit `src/components/Chatbot.tsx` to customize:
- Colors and themes
- Button position
- Chat window size
- Message styling

## Performance Considerations

- **Conversation History**: Limited to last 20 messages to prevent memory issues
- **Reconnection**: Maximum 5 attempts with 3-second delays
- **Message Size**: No hard limit, but keep messages reasonable
- **Concurrent Users**: WebSocket can handle many concurrent connections

## Security

- ✅ CORS protection enabled
- ✅ Environment variables for sensitive data
- ✅ No client-side API keys
- ✅ Secure WebSocket (wss://) in production
- ⚠️ Consider adding authentication for production use

## Future Enhancements

Potential improvements:
- [ ] User authentication integration
- [ ] Message persistence in database
- [ ] File/image sharing
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Chatbot analytics dashboard
- [ ] Integration with appointment booking system
- [ ] Proactive notifications

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `smartcare-backend/logs/`
3. Check browser console for frontend errors
4. Verify environment configuration

## License

Part of the SmartCare healthcare management system.
