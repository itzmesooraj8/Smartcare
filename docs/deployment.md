# SmartCare Deployment & CI/CD Guide

## Multi-Cloud Topography
- **Frontend**: Vercel (Production URL: `https://smartcare-six.vercel.app`)
- **Backend**: Render Web Service (FastAPI)
- **Database**: Supabase PostgreSQL 17
- **CI/CD**: GitHub Actions

## Deployment Pipeline
```
PR Opened
   ↓
GitHub Actions CI (Backend tests, Frontend build, Migration integrity)
   ↓
PR Merged to main
   ↓
GitHub Actions Production Pipeline
   ↓
Supabase Database Migration (supabase db push)
   ↓
Vercel Frontend & Render Backend Deployments Triggered
```

## Render Deployment Settings
- Configure Render to deploy **"After CI Checks Pass"** rather than on raw push.
- Set environment variables securely in Render Dashboard (never in Git).
- Runtime credentials connect via `smartcare_backend`.

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
