# Chatbot Testing Checklist

## Pre-Testing Setup

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 5173
- [ ] Browser console is open (F12) for debugging
- [ ] Backend logs are visible

## 1. Connection Tests

### Initial Connection
- [ ] Click chatbot button (🤖) in bottom-right corner
- [ ] Chatbot window opens
- [ ] "Connecting to SmartCare Assistant…" message appears
- [ ] Connection status shows "Connecting..." with yellow pulsing dot
- [ ] Connection status changes to "Connected" with green dot
- [ ] Welcome message from server appears

### Connection Stability
- [ ] Send a test message
- [ ] Receive response within 2-3 seconds
- [ ] Connection status remains "Connected"
- [ ] No errors in browser console
- [ ] No errors in backend logs

## 2. Reconnection Tests

### Manual Disconnect Test
- [ ] Open chatbot and connect
- [ ] Stop the backend server
- [ ] Observe "Connection lost" message
- [ ] See reconnection attempts (1/5, 2/5, etc.)
- [ ] Restart backend server
- [ ] Connection automatically re-establishes
- [ ] Can send messages again

### Network Interruption Simulation
- [ ] Open chatbot
- [ ] Disconnect internet/WiFi
- [ ] Observe reconnection attempts
- [ ] Reconnect internet
- [ ] Verify automatic reconnection

### Max Attempts Test
- [ ] Open chatbot
- [ ] Keep backend stopped
- [ ] Wait for all 5 reconnection attempts
- [ ] Verify final error message appears
- [ ] Verify no more reconnection attempts
- [ ] Close and reopen chatbot
- [ ] Verify reconnection counter resets

## 3. Functional Tests

### Rule-Based Responses (Works without AI)

#### Greetings
- [ ] Send: "Hello" → Receives greeting response
- [ ] Send: "Hi" → Receives greeting response
- [ ] Send: "Hey there" → Receives greeting response

#### Appointments
- [ ] Send: "How do I book an appointment?" → Receives appointment info
- [ ] Send: "I need to schedule a doctor visit" → Receives appointment info
- [ ] Send: "Book appointment" → Receives appointment info

#### Medical Records
- [ ] Send: "Where are my medical records?" → Receives records info
- [ ] Send: "Show me my history" → Receives records info
- [ ] Send: "Test results" → Receives records info

#### Billing
- [ ] Send: "How do I pay my bill?" → Receives payment info
- [ ] Send: "What's the cost?" → Receives payment info
- [ ] Send: "Invoice" → Receives payment info

#### Emergency
- [ ] Send: "This is an emergency" → Receives emergency response with ⚠️
- [ ] Send: "I need urgent help" → Receives emergency response
- [ ] Send: "I'm in pain" → Receives emergency response

#### Video Consultations
- [ ] Send: "Can I have a video call?" → Receives teleconsult info
- [ ] Send: "Online consultation" → Receives teleconsult info

#### Default Response
- [ ] Send: "Random gibberish xyz123" → Receives default help menu

### AI-Powered Responses (Requires GEMINI_API_KEY)

- [ ] GEMINI_API_KEY is set in backend .env
- [ ] Backend logs show "Gemini AI initialized successfully"
- [ ] Send: "What are the symptoms of flu?" → Receives AI response
- [ ] Send: "How can I manage diabetes?" → Receives AI response
- [ ] Verify responses are contextual and natural
- [ ] Verify conversation history is maintained

### Conversation Context (AI only)
- [ ] Send: "What are your hours?"
- [ ] Send: "What about Saturday?" (should understand context)
- [ ] Verify second response references previous question

## 4. UI/UX Tests

### Visual Elements
- [ ] Chatbot button is visible in bottom-right
- [ ] Button has hover effect
- [ ] Chatbot window opens smoothly
- [ ] Header shows bot icon and title
- [ ] Connection status indicator is visible
- [ ] Close button (×) works
- [ ] Messages are properly aligned (user right, bot left)
- [ ] Messages have different styling (user blue, bot gray)

### Responsiveness
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Chatbot window resizes appropriately
- [ ] All buttons are clickable
- [ ] Text is readable on all screen sizes

### Message Display
- [ ] Long messages wrap correctly
- [ ] Multiple messages display in order
- [ ] Auto-scroll to latest message works
- [ ] Emoji display correctly (🤖, ⚠️)
- [ ] Line breaks in messages work

### Input Handling
- [ ] Can type in input field
- [ ] Placeholder text is visible
- [ ] Enter key sends message
- [ ] Send button sends message
- [ ] Input clears after sending
- [ ] Cannot send empty messages
- [ ] Send button is disabled when disconnected

## 5. Error Handling Tests

### Backend Errors
- [ ] Stop backend mid-conversation → See reconnection attempts
- [ ] Send message during reconnection → Message queues or shows error
- [ ] Invalid backend URL → Shows configuration error

### Frontend Errors
- [ ] Open chatbot without backend → Shows connection error
- [ ] Rapid open/close chatbot → No memory leaks or errors
- [ ] Send very long message (1000+ chars) → Handles gracefully

### Edge Cases
- [ ] Send message with special characters: `<script>alert('test')</script>`
- [ ] Send message with emojis: "Hello 😊🎉"
- [ ] Send message with only spaces → Rejected or handled
- [ ] Send 50+ messages rapidly → All processed correctly

## 6. Performance Tests

### Load Testing
- [ ] Send 100 messages → All responses received
- [ ] Keep chatbot open for 30 minutes → No memory leaks
- [ ] Open/close chatbot 20 times → No performance degradation

### Response Time
- [ ] Rule-based response < 500ms
- [ ] AI response < 3 seconds (depends on API)
- [ ] Connection establishment < 2 seconds

## 7. Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## 8. Security Tests

### XSS Prevention
- [ ] Send: `<script>alert('XSS')</script>` → Displayed as text, not executed
- [ ] Send: `<img src=x onerror=alert('XSS')>` → Displayed as text

### Input Validation
- [ ] Very long message (10,000 chars) → Handled or rejected
- [ ] Special characters: `'; DROP TABLE users; --` → Handled safely

## 9. Integration Tests

### With Authentication
- [ ] Login as patient → Chatbot works
- [ ] Login as doctor → Chatbot works
- [ ] Logout → Chatbot still accessible (or disabled based on requirements)

### With Other Features
- [ ] Navigate to different pages → Chatbot remains accessible
- [ ] Chatbot doesn't interfere with other UI elements
- [ ] Chatbot z-index is correct (appears above other elements)

## 10. Production Readiness

### Configuration
- [ ] VITE_WS_URL uses wss:// for production
- [ ] Backend CORS allows production frontend URL
- [ ] GEMINI_API_KEY is set (if using AI)
- [ ] Environment variables are properly configured

### Deployment
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] WebSocket connection works in production
- [ ] HTTPS/WSS working correctly
- [ ] No console errors in production

### Monitoring
- [ ] Backend logs chatbot connections
- [ ] Backend logs errors properly
- [ ] Can track chatbot usage
- [ ] Can identify common queries

## Test Results Summary

**Date:** _______________
**Tester:** _______________
**Environment:** [ ] Local [ ] Staging [ ] Production

**Overall Status:** [ ] Pass [ ] Fail [ ] Partial

**Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Minor Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

**Sign-off:** _______________
