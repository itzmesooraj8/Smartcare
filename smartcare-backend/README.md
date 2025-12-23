SmartCare Realtime Backend

This service implements a minimal realtime signaling server using FastAPI and Redis pub/sub.

How to run (dev):

1. Copy `.env.example` to `.env` and fill values for `SUPABASE_*` and `XAI_API_KEY` and optionally `REDIS_URL`.
2. From repo root:

```powershell
docker compose -f docker-compose.backend.yml up --build
```

Websocket endpoint: `ws://<host>:8000/ws/{room_id}/{client_id}`

Note: This scaffold is intended as a starting point. For production, secure connections, authentication, and robust error handling are required.
