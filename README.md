# Smartcare Platform

> **CONFIDENTIAL & PROPRIETARY**
> This repository contains confidential information and proprietary software belonging to **Smartcare**.
> Unauthorized copying, distribution, modification, public display, or use of this software, via any medium, is strictly prohibited.

![Build Status](https://img.shields.io/badge/Build-Passing-success) ![Security](https://img.shields.io/badge/Security-HIPAA_Ready-blue) ![License](https://img.shields.io/badge/License-Proprietary-red)

> [!IMPORTANT]
> **Production database schema is migration-controlled. Never modify production schema manually.**
> All database schema changes must be authored as SQL migrations under `supabase/migrations/` and verified through CI/CD pipelines.

---

## 1. Executive Summary

Smartcare is an enterprise-grade Telehealth and Electronic Health Record (EHR) orchestration engine designed to eliminate clinical friction and improve patient outcomes. Unlike standard video conferencing tools, Smartcare integrates real-time communication directly with clinical workflows, offering AI-assisted triage, encrypted record keeping, and audit-compliant file exchange.

The platform is engineered for high availability, low latency, and strict adherence to healthcare data privacy standards (HIPAA/GDPR).

---

## 2. Target Architecture

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
              smartcare_backend role
                         │
              ┌──────────┴──────────┐
              │                     │
          Supabase DB          Supabase Storage
              │
          PostgreSQL (RLS)
              │
        Realtime / Presence
```

* **Frontend:** Vite + React 18, TypeScript, Tailwind CSS, Shadcn/UI, deployed on **Vercel**.
* **Backend:** FastAPI, SQLAlchemy 2.0 (ORM queries only; DDL disabled), Pydantic v2, deployed on **Render**.
* **Database & Auth:** Supabase PostgreSQL with 100% Row-Level Security (RLS), security-definer procedures, and least-privilege `smartcare_backend` runtime role.
* **Audit Trail:** Tamper-evident, decoupled append-only audit logging ledger powered by security-definer database functions (`log_user_audit_event`, `log_system_audit_event`).

---

## 3. Documentation Suite

Comprehensive technical and operational specifications are available in the [`docs/`](./docs) directory:

| Document | Purpose |
| :--- | :--- |
| [Architecture Guide](./docs/architecture.md) | High-level system design, network topologies, and microservice boundaries |
| [Security Architecture](./docs/security.md) | Threat model, zero-trust RBAC, least privilege, and HIPAA/GDPR controls |
| [Database & Migrations](./docs/database.md) | Schema design, RLS policies, migration workflows, and repair guidelines |
| [Audit Logging](./docs/audit-logging.md) | Security-definer audit engine, actor models, and compliance ledger |
| [Environment Variables](./docs/environment-variables.md) | Tiered secrets management across Vercel, Render, and GitHub Actions |
| [Deployment & CI/CD](./docs/deployment.md) | CI pipeline specs, GitHub Actions, and production deployment gates |
| [Realtime & WebSockets](./docs/realtime.md) | WebRTC signaling, presence tracking, and Supabase Realtime integration |
| [Disaster Recovery](./docs/disaster-recovery.md) | Backup policies, RTO/RPO targets, and emergency runbooks |
| [Development Guide](./docs/development.md) | Local developer environment setup, linting, and testing workflows |

---

## 4. Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Client** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Shadcn/UI |
| **Server** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2 |
| **Database** | PostgreSQL 17 (Supabase Managed), Row-Level Security (RLS) |
| **Realtime** | WebSockets, Supabase Realtime Channels, WebRTC (STUN/TURN) |
| **Infrastructure** | Vercel (Frontend), Render (API), GitHub Actions (CI/CD) |
| **Testing** | Unittest, Pytest, Playwright, Supabase CLI |

---

## 5. Security & Governance

- [Security Policy](./SECURITY.md) - Vulnerability reporting and responsible disclosure
- [Contribution Guidelines](./CONTRIBUTING.md) - Code quality standards and commit protocols
- [Environment Template](./.env.example) - Public variable keys (no values or secrets)