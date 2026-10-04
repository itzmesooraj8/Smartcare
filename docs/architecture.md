# SmartCare System Architecture

## Overview
SmartCare is a healthcare intelligence and telehealth platform architected with strict zero-knowledge security, multi-layered role-based access control (RBAC), and HIPAA/GDPR-compliant immutable audit logging.

```
                         GitHub
                           │
                    Pull Request / CI
                           │
              ┌────────────┴────────────┐
              │                         │
        Frontend CI                Backend CI
              │                         │
           Vercel                    Render
              │                         │
              └──────────┬──────────────┘
                         │
                    SmartCare API
                     FastAPI
                         │
              smartcare_backend role (NOBYPASSRLS)
                         │
              ┌──────────┴──────────┐
              │                     │
          Supabase DB          Supabase Storage
              │
          PostgreSQL 17
              │
        Realtime / Presence
```

## Core Components
1. **Frontend (Vercel)**: React + TypeScript + Vite web client. Exposes only public configuration. Communicates with SmartCare API via REST and WebSocket.
2. **Backend API (Render)**: FastAPI application running in Python 3.11. Connects to PostgreSQL using least-privilege role `smartcare_backend`.
3. **Database (Supabase PostgreSQL 17)**:
   - Row Level Security (RLS) active on all public tables.
   - Dedicated application role `smartcare_backend` with `NOBYPASSRLS`.
   - Security-definer audit procedures with hardened `search_path = public, pg_temp`.
   - Migration-controlled schema lifecycle.
4. **Realtime & Media**:
   - Supabase Realtime for instant messaging and presence.
   - LiveKit for end-to-end encrypted WebRTC telehealth video consults.

> **CRITICAL ARCHITECTURAL INVARIANT**:
> Production database schema is migration-controlled. Never modify production schema manually.
