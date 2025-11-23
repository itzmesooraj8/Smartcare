# 🚀 SmartCare Chatbot - Deployment Checklist

## Pre-Deployment Verification

### Local Testing
- [ ] Chatbot works in local development
- [ ] All tests in CHATBOT_TESTING.md pass
- [ ] No console errors
- [ ] No backend errors in logs
- [ ] Build completes successfully (`npm run build`)

### Code Review
- [ ] All changes reviewed
- [ ] No hardcoded credentials
- [ ] Environment variables properly configured
- [ ] Code follows project standards
- [ ] Documentation is up to date

## Backend Deployment

### 1. Environment Setup

#### Required Environment Variables
- [ ] `SECRET_KEY` - Set to secure random value
- [ ] `DATABASE_URL` - Production database URL
- [ ] `FRONTEND_URL` - Production frontend URL
- [ ] `ADDITIONAL_ORIGINS` - Any additional allowed origins

#### Optional Environment Variables
- [ ] `GEMINI_API_KEY` - For AI-powered responses
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - For emails
- [ ] `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - For file uploads

### 2. Deployment Platform Configuration

#### Render.com
```yaml
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] Environment variables set in Render dashboard
- [ ] Health check endpoint configured: `/health`
- [ ] Auto-deploy enabled (optional)

#### Railway.app
```yaml
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] Environment variables set in Railway dashboard
- [ ] Domain configured
- [ ] Health checks enabled

#### Heroku
```yaml
Procfile: web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- [ ] Config vars set in Heroku dashboard
- [ ] Dyno type selected
- [ ] Add-ons configured (if needed)

### 3. Backend Verification

- [ ] Backend URL is accessible
- [ ] Health check works: `https://your-backend.com/health`
- [ ] API endpoints respond correctly
- [ ] WebSocket endpoint is accessible
- [ ] CORS is properly configured
- [ ] SSL/TLS certificate is valid (https://)

### 4. Database

- [ ] Production database is set up
- [ ] Database migrations run successfully
- [ ] Database backups configured
- [ ] Connection pooling configured (if applicable)

## Frontend Deployment

### 1. Environment Configuration

#### Build Environment Variables
- [ ] `VITE_API_URL` - Backend API URL (https://your-backend.com)
- [ ] `VITE_WS_URL` - WebSocket URL (wss://your-backend.com/ws/chatbot)

**Important:** Use `wss://` (not `ws://`) for production!

### 2. Build Configuration

#### Netlify
```toml
[build]
  command = "npm run build"
  publish = "dist"

[context.production.environment]
  VITE_API_URL = "https://your-backend.onrender.com"
  VITE_WS_URL = "wss://your-backend.onrender.com/ws/chatbot"
```

- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Redirects configured for SPA
- [ ] Custom domain configured (optional)

#### Vercel
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] Environment variables set in Vercel dashboard
- [ ] Build settings configured
- [ ] Domain configured

### 3. Frontend Verification

- [ ] Frontend URL is accessible
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Assets load correctly (images, fonts, etc.)
- [ ] Routing works correctly
- [ ] SSL certificate is valid (https://)

## Chatbot-Specific Checks

### 1. Connection Test

- [ ] Open chatbot on production site
- [ ] Connection status shows "Connected" (green dot)
- [ ] No connection errors in console
- [ ] WebSocket connection established (check Network tab)

### 2. Functionality Test

#### Basic Queries
- [ ] Send: "Hello" → Receives greeting
- [ ] Send: "How do I book an appointment?" → Receives info
- [ ] Send: "Where are my medical records?" → Receives info

#### AI Test (if configured)
- [ ] Send complex query → Receives AI response
- [ ] Follow-up question → Context is maintained
- [ ] No API errors in backend logs

### 3. Reconnection Test

- [ ] Simulate connection loss
- [ ] Verify auto-reconnection attempts
- [ ] Verify successful reconnection
- [ ] Verify chat continues working

### 4. Error Handling

- [ ] Test with backend temporarily down
- [ ] Verify user-friendly error messages
- [ ] Verify no crashes or blank screens
- [ ] Verify recovery when backend comes back

## Security Checks

### Backend Security
- [ ] HTTPS enabled (SSL/TLS)
- [ ] CORS properly configured (not set to `*` in production)
- [ ] Environment variables not exposed
- [ ] API rate limiting configured (recommended)
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### Frontend Security
- [ ] HTTPS enabled
- [ ] No API keys in client code
- [ ] Content Security Policy configured (optional)
- [ ] No sensitive data in localStorage
- [ ] Secure WebSocket (wss://) used

## Performance Checks

### Backend Performance
- [ ] Response times < 500ms for API calls
- [ ] WebSocket connection time < 2s
- [ ] No memory leaks
- [ ] Proper error handling doesn't crash server
- [ ] Logging doesn't impact performance

### Frontend Performance
- [ ] Page load time < 3s
- [ ] Chatbot opens quickly
- [ ] No UI lag or freezing
- [ ] Messages render smoothly
- [ ] No memory leaks in browser

## Monitoring & Logging

### Backend Monitoring
- [ ] Application logs accessible
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring (optional)
- [ ] Uptime monitoring configured
- [ ] Alert system configured for errors

### Frontend Monitoring
- [ ] Browser error tracking (Sentry, etc.)
- [ ] Analytics configured (optional)
- [ ] User session recording (optional)

## Documentation

- [ ] README updated with production URLs
- [ ] Deployment documentation updated
- [ ] Environment variables documented
- [ ] Troubleshooting guide updated
- [ ] API documentation updated (if applicable)

## Rollback Plan

### Preparation
- [ ] Previous version tagged in git
- [ ] Rollback procedure documented
- [ ] Database backup created
- [ ] Team notified of deployment

### Rollback Triggers
- [ ] Critical bugs discovered
- [ ] Performance degradation
- [ ] Security vulnerabilities
- [ ] User-facing errors

## Post-Deployment

### Immediate Checks (0-1 hour)
- [ ] Monitor error logs
- [ ] Check chatbot functionality
- [ ] Verify no spike in errors
- [ ] Test from different devices/browsers
- [ ] Check response times

### Short-term Monitoring (1-24 hours)
- [ ] Monitor user feedback
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Review chatbot usage analytics
- [ ] Check for any unusual patterns

### Long-term Monitoring (1-7 days)
- [ ] Review weekly error reports
- [ ] Analyze chatbot usage patterns
- [ ] Gather user feedback
- [ ] Plan improvements based on data

## Communication

### Before Deployment
- [ ] Team notified of deployment schedule
- [ ] Stakeholders informed
- [ ] Maintenance window communicated (if needed)

### After Deployment
- [ ] Team notified of successful deployment
- [ ] Stakeholders updated
- [ ] Documentation updated with new URLs
- [ ] Known issues communicated (if any)

## Specific Platform Checklists

### Netlify Deployment
- [ ] Site name configured
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Environment variables set
- [ ] Redirects configured in netlify.toml
- [ ] Custom domain configured (optional)
- [ ] SSL certificate auto-provisioned

### Render Deployment (Backend)
- [ ] Service type: Web Service
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment variables set
- [ ] Health check path: `/health`
- [ ] Auto-deploy enabled
- [ ] Instance type selected

## Final Verification

### Functional Test
- [ ] Complete user journey works end-to-end
- [ ] All critical features functional
- [ ] Chatbot responds correctly
- [ ] No blocking issues

### Performance Test
- [ ] Site loads quickly
- [ ] Chatbot responds quickly
- [ ] No performance degradation
- [ ] Mobile performance acceptable

### Security Test
- [ ] HTTPS working on all pages
- [ ] WSS working for chatbot
- [ ] No mixed content warnings
- [ ] CORS working correctly

## Sign-off

**Deployment Date:** _______________
**Deployed By:** _______________
**Backend URL:** _______________
**Frontend URL:** _______________

**Checklist Completed:** [ ] Yes [ ] No

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Resolution:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Deployment Status:** [ ] Success [ ] Partial [ ] Failed [ ] Rolled Back

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

**Approved By:** _______________
**Date:** _______________

---

## Quick Reference

### Backend Health Check
```bash
curl https://your-backend.com/health
```

### Test WebSocket Connection
```javascript
const ws = new WebSocket('wss://your-backend.com/ws/chatbot');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

### Check Frontend Build
```bash
npm run build
npm run preview
```

### Environment Variables Template

**Backend (.env):**
```bash
SECRET_KEY=production-secret-key
DATABASE_URL=postgresql://user:pass@host/db
FRONTEND_URL=https://your-frontend.netlify.app
GEMINI_API_KEY=your-gemini-api-key
```

**Frontend (Netlify):**
```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com/ws/chatbot
```

---

**Remember:** Always test in a staging environment before deploying to production!
