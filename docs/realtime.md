# SmartCare Realtime Architecture

## Overview
SmartCare leverages Supabase Realtime (Elixir-based Postgres CDC & Presence engine) and Upstash Redis for instant messaging, appointment notifications, and WebRTC signaling.

## Realtime Publications
Tables included in `supabase_realtime` publication:
- `public.messages`: Enables sub-100ms doctor-patient consultation chat.
- `public.appointments`: Realtime booking status synchronization.

### Security Controls on Realtime
- `public.audit_logs` is explicitly **DROPPED** from `supabase_realtime` publication to prevent internal compliance logs from being broadcast over client WebSocket subscriptions.
- All CDC broadcasts are evaluated against PostgreSQL Row Level Security (RLS) policies.

> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
