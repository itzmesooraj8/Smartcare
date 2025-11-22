# Smartcare Backend Deployment Guide

## Quick Deploy to Render.com (Recommended - Free Tier)

### Step 1: Create a Render Account
1. Go to https://render.com
2. Sign up with your GitHub account

### Step 2: Deploy the Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `itzmesooraj8/Smartcare`
3. Configure the service:
   - **Name**: `smartcare-backend`
   - **Root Directory**: `smartcare-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

### Step 3: Add Environment Variables (in Render dashboard)
```
DATABASE_URL=sqlite:///./smartcare.db
GOOGLE_API_KEY=AIzaSyAaDXShrqJESxBGnJrRENqv0wcPlkioPSg
```

### Step 4: Deploy
Click "Create Web Service" - Render will automatically deploy your backend.

### Step 5: Get Your Backend URL
After deployment, Render will give you a URL like:
`https://smartcare-backend-xxxx.onrender.com`

### Step 6: Update Netlify Environment Variables
1. Go to your Netlify dashboard
2. Navigate to: Site settings → Environment variables
3. Add these variables:
   - `VITE_API_URL` = `https://smartcare-backend-xxxx.onrender.com`
   - `VITE_WS_URL` = `wss://smartcare-backend-xxxx.onrender.com/ws/chatbot`

4. Trigger a new deploy in Netlify

## Alternative: Railway.app

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select `smartcare-backend` directory
4. Railway will auto-detect Python and deploy
5. Add environment variables in Railway dashboard
6. Copy the generated URL and update Netlify

## Important Notes

- The free tier of Render/Railway may "sleep" after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- For production, consider upgrading to a paid tier for 24/7 uptime
- Make sure to run database migrations after first deploy:
  ```bash
  # In Render/Railway shell
  alembic upgrade head
  ```
