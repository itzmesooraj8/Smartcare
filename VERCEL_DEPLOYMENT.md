# 🚀 Vercel Deployment Guide - SmartCare Chatbot

## ✅ Configuration Updated

Your SmartCare chatbot is now configured for Vercel deployment at:
**https://smartcare-six.vercel.app/**

---

## 📋 What Was Updated

### 1. Backend CORS Configuration ✅
**File**: `smartcare-backend/.env`

Updated to allow your Vercel domain:
```bash
FRONTEND_URL=https://smartcare-six.vercel.app
ADDITIONAL_ORIGINS=http://localhost:5173,https://localhost:5173,https://smartcare-zflo.netlify.app
```

### 2. Vercel Configuration ✅
**File**: `vercel.json` (CREATED)

Contains:
- Build settings for Vite
- Environment variables (VITE_API_URL, VITE_WS_URL)
- SPA routing configuration
- Security headers

---

## 🌐 Vercel Environment Variables

You need to set these in your Vercel dashboard:

### Option 1: Via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your project: **smartcare-six**
3. Go to: **Settings** → **Environment Variables**
4. Add these variables:

| Variable Name | Value |
|--------------|-------|
| `VITE_API_URL` | `https://smartcare-zflo.onrender.com` |
| `VITE_WS_URL` | `wss://smartcare-zflo.onrender.com/ws/chatbot` |

**Environment**: Select **Production, Preview, and Development**

### Option 2: Via Vercel CLI

```bash
vercel env add VITE_API_URL
# Enter: https://smartcare-zflo.onrender.com

vercel env add VITE_WS_URL
# Enter: wss://smartcare-zflo.onrender.com/ws/chatbot
```

---

## 🔧 Render.com Backend Configuration

Update your Render.com environment variables to include Vercel:

**Add to Render Dashboard** → **Environment**:

```bash
FRONTEND_URL=https://smartcare-six.vercel.app
ADDITIONAL_ORIGINS=https://smartcare-zflo.netlify.app,http://localhost:5173
GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg
SECRET_KEY=smartcare-secret-key-change-in-production-2024
DATABASE_URL=sqlite:///./smartcare.db
```

**Important**: After updating, click **"Manual Deploy"** to restart with new settings.

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure chatbot for Vercel deployment"
git push origin main
```

### Step 2: Vercel Auto-Deploy

Vercel will automatically:
1. Detect the push
2. Build your project
3. Deploy to production
4. Update https://smartcare-six.vercel.app/

### Step 3: Verify Deployment

1. Visit: https://smartcare-six.vercel.app/
2. Open browser console (F12)
3. Check for any errors
4. Click chatbot button (🤖)
5. Verify connection status

---

## 🧪 Testing Checklist

### Local Testing First

```powershell
# Terminal 1 - Backend
cd smartcare-backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
npm run dev
```

Test at: http://localhost:5173

### Production Testing

After deployment, test at: https://smartcare-six.vercel.app/

**Test Checklist:**
- [ ] Website loads correctly
- [ ] Chatbot button appears (🤖)
- [ ] Click chatbot button
- [ ] Connection status shows 🟢 Connected
- [ ] Send: "Hello"
- [ ] Receive response
- [ ] Send: "What are the symptoms of flu?"
- [ ] Receive AI-powered response
- [ ] No errors in browser console

---

## 🐛 Troubleshooting

### Issue: Chatbot shows "Disconnected" (🔴)

**Possible Causes:**
1. Backend not running
2. CORS not configured
3. Environment variables not set

**Solutions:**

1. **Check Backend Health:**
   ```bash
   curl https://smartcare-zflo.onrender.com/health
   ```
   Expected: `{"status": "ok"}`

2. **Verify Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Confirm `VITE_API_URL` and `VITE_WS_URL` are set
   - Redeploy if you just added them

3. **Check CORS in Render:**
   - Verify `FRONTEND_URL=https://smartcare-six.vercel.app`
   - Click "Manual Deploy" to restart

4. **Check Browser Console:**
   - Press F12
   - Look for CORS errors
   - Look for WebSocket connection errors

### Issue: CORS Error in Console

**Error Message:**
```
Access to XMLHttpRequest at 'https://smartcare-zflo.onrender.com' 
from origin 'https://smartcare-six.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Update Render environment variable:
   ```
   FRONTEND_URL=https://smartcare-six.vercel.app
   ```
2. Restart Render service (Manual Deploy)
3. Wait 1-2 minutes for restart
4. Test again

### Issue: WebSocket Connection Failed

**Error Message:**
```
WebSocket connection to 'wss://smartcare-zflo.onrender.com/ws/chatbot' failed
```

**Solution:**
1. Verify backend is running: https://smartcare-zflo.onrender.com/health
2. Check WebSocket URL in Vercel env vars
3. Ensure using `wss://` (not `ws://`)
4. Check browser console for detailed error

### Issue: Environment Variables Not Working

**Solution:**
1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Verify variables are set for **Production**
4. Trigger a new deployment:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

## 📊 Verification Commands

### Check Backend Health
```bash
curl https://smartcare-zflo.onrender.com/health
```

### Check Backend CORS
```bash
curl -H "Origin: https://smartcare-six.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://smartcare-zflo.onrender.com/health -v
```

### Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('wss://smartcare-zflo.onrender.com/ws/chatbot');
ws.onopen = () => console.log('✅ Connected!');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onmessage = (e) => console.log('📨 Message:', e.data);
```

---

## 🔄 Deployment Workflow

```
Local Changes
    ↓
Git Commit & Push
    ↓
Vercel Auto-Deploy
    ↓
Build with Environment Variables
    ↓
Deploy to Production
    ↓
https://smartcare-six.vercel.app/
```

---

## 📁 Configuration Files

### Local Files (Updated)
- ✅ `smartcare-backend/.env` - Backend config with Vercel URL
- ✅ `vercel.json` - Vercel deployment config

### Vercel Dashboard
- ⚠️ **Action Required**: Set environment variables
  - `VITE_API_URL`
  - `VITE_WS_URL`

### Render Dashboard
- ⚠️ **Action Required**: Update `FRONTEND_URL`
  - Set to: `https://smartcare-six.vercel.app`
  - Click "Manual Deploy"

---

## ✅ Quick Setup Checklist

### Vercel Setup
- [ ] Set `VITE_API_URL` in Vercel dashboard
- [ ] Set `VITE_WS_URL` in Vercel dashboard
- [ ] Push code to GitHub
- [ ] Verify auto-deployment completes
- [ ] Test chatbot on live site

### Render Setup
- [ ] Update `FRONTEND_URL` to Vercel URL
- [ ] Click "Manual Deploy" to restart
- [ ] Wait for deployment to complete
- [ ] Test health endpoint

### Final Verification
- [ ] Visit https://smartcare-six.vercel.app/
- [ ] Open chatbot (🤖)
- [ ] Verify 🟢 Connected status
- [ ] Send test message
- [ ] Verify AI response
- [ ] Check browser console (no errors)

---

## 🎯 Expected Results

### Successful Deployment
- ✅ Website loads at https://smartcare-six.vercel.app/
- ✅ Chatbot button visible (🤖)
- ✅ Connection status: 🟢 Connected
- ✅ AI responses work
- ✅ Auto-reconnection works
- ✅ No console errors

### Connection Flow
```
User Opens Chatbot
    ↓
Frontend: https://smartcare-six.vercel.app/
    ↓ (WebSocket)
Backend: wss://smartcare-zflo.onrender.com/ws/chatbot
    ↓
ChatbotService (with Gemini AI)
    ↓
AI Response to User
```

---

## 📞 Support

### If Chatbot Doesn't Connect

1. **Check Backend**: https://smartcare-zflo.onrender.com/health
2. **Check Console**: Press F12, look for errors
3. **Verify Environment Variables**: Vercel Dashboard → Settings
4. **Check CORS**: Render Dashboard → Environment → FRONTEND_URL
5. **Redeploy**: Both Vercel and Render if needed

### Common Issues

| Issue | Quick Fix |
|-------|-----------|
| 🔴 Disconnected | Check backend health endpoint |
| CORS Error | Update FRONTEND_URL in Render |
| Env vars not working | Redeploy Vercel after setting vars |
| WebSocket fails | Verify using `wss://` not `ws://` |

---

## 🎉 You're Ready!

Your chatbot is configured for:
- ✅ **Vercel**: https://smartcare-six.vercel.app/
- ✅ **Render Backend**: https://smartcare-zflo.onrender.com
- ✅ **AI Enabled**: Google Gemini
- ✅ **Auto-Reconnection**: Built-in

**Next Steps:**
1. Set environment variables in Vercel dashboard
2. Update FRONTEND_URL in Render dashboard
3. Push to GitHub (auto-deploys to Vercel)
4. Test chatbot on live site

---

**Deployment Date**: 2025-11-23
**Frontend**: Vercel (https://smartcare-six.vercel.app/)
**Backend**: Render (https://smartcare-zflo.onrender.com)
**Status**: ✅ Configured and Ready
