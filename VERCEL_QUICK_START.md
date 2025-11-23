# ✅ VERCEL DEPLOYMENT - ACTION CHECKLIST

## 🎯 Quick Actions Required

Your chatbot is configured for Vercel! Follow these steps:

---

## 📋 STEP 1: Vercel Dashboard (5 minutes)

### Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select project: **smartcare-six**
3. Click: **Settings** → **Environment Variables**

### Add These Variables

**Variable 1:**
- Name: `VITE_API_URL`
- Value: `https://smartcare-zflo.onrender.com`
- Environment: ✅ Production ✅ Preview ✅ Development
- Click: **Save**

**Variable 2:**
- Name: `VITE_WS_URL`
- Value: `wss://smartcare-zflo.onrender.com/ws/chatbot`
- Environment: ✅ Production ✅ Preview ✅ Development
- Click: **Save**

---

## 📋 STEP 2: Render Dashboard (3 minutes)

### Go to Render Dashboard
1. Visit: https://dashboard.render.com/
2. Select your backend service: **smartcare-zflo**
3. Click: **Environment**

### Update This Variable

Find `FRONTEND_URL` and update to:
```
https://smartcare-six.vercel.app
```

**Or add if not exists:**
- Key: `FRONTEND_URL`
- Value: `https://smartcare-six.vercel.app`

### Click "Save Changes" and "Manual Deploy"

---

## 📋 STEP 3: Deploy to Vercel (2 minutes)

### Push Your Code

```bash
git add .
git commit -m "Configure chatbot for Vercel deployment"
git push origin main
```

Vercel will automatically deploy!

---

## 📋 STEP 4: Test (5 minutes)

### Wait for Deployment
- Vercel: ~2 minutes
- Render: ~3 minutes (if you clicked Manual Deploy)

### Test Your Chatbot

1. **Visit**: https://smartcare-six.vercel.app/
2. **Click**: 🤖 chatbot button (bottom-right)
3. **Check**: Connection status should show 🟢 **Connected**
4. **Send**: "What are the symptoms of flu?"
5. **Verify**: You get an AI-powered response

---

## ✅ Success Criteria

Your chatbot is working if you see:
- ✅ Chatbot button appears (🤖)
- ✅ Connection status: 🟢 **Connected** (green dot)
- ✅ Can send messages
- ✅ Receive AI responses
- ✅ No errors in browser console (F12)

---

## 🐛 If Something's Wrong

### Chatbot shows 🔴 Disconnected

**Check 1**: Backend Health
```bash
curl https://smartcare-zflo.onrender.com/health
```
Should return: `{"status": "ok"}`

**Check 2**: Environment Variables
- Vercel: Settings → Environment Variables
- Verify both `VITE_API_URL` and `VITE_WS_URL` are set

**Check 3**: Redeploy
If you just added env vars, trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### CORS Error in Console

**Fix**: 
1. Go to Render Dashboard
2. Update `FRONTEND_URL=https://smartcare-six.vercel.app`
3. Click "Manual Deploy"
4. Wait 3 minutes
5. Test again

---

## 📊 Quick Reference

### Your URLs
- **Frontend**: https://smartcare-six.vercel.app/
- **Backend**: https://smartcare-zflo.onrender.com
- **Health Check**: https://smartcare-zflo.onrender.com/health
- **WebSocket**: wss://smartcare-zflo.onrender.com/ws/chatbot

### Environment Variables

**Vercel** (Frontend):
```
VITE_API_URL=https://smartcare-zflo.onrender.com
VITE_WS_URL=wss://smartcare-zflo.onrender.com/ws/chatbot
```

**Render** (Backend):
```
FRONTEND_URL=https://smartcare-six.vercel.app
GEMINI_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg
```

---

## 🎯 Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Set Vercel env vars | 5 min | ⏳ TODO |
| 2. Update Render FRONTEND_URL | 3 min | ⏳ TODO |
| 3. Push to GitHub | 2 min | ⏳ TODO |
| 4. Wait for deployment | 5 min | ⏳ AUTO |
| 5. Test chatbot | 5 min | ⏳ TODO |
| **Total** | **~20 min** | |

---

## 🚀 Start Now!

**Action 1**: Open Vercel Dashboard
👉 https://vercel.com/dashboard

**Action 2**: Open Render Dashboard  
👉 https://dashboard.render.com/

**Action 3**: Follow steps above

---

**Need detailed help?** See `VERCEL_DEPLOYMENT.md`

**Status**: ⏳ Waiting for your action
**Next**: Set environment variables in Vercel dashboard
