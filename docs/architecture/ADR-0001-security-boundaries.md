# ADR-0001: Security Architecture & Boundary Verification

## Status
**ACCEPTED**

## Context
SmartCare handles Protected Health Information (PHI) and clinical records requiring strict defense-in-depth, least privilege, cryptographic isolation, and auditability. Rather than making unverified marketing claims, this Architecture Decision Record establishes the technical specifications, verified implementations, test validations, and evidence status for each security boundary.

## Security Control Matrix

| Requirement | Implementation | Test Suite | Verification Status |
| :--- | :--- | :--- | :--- |
| **Cryptographic Isolation** | Client-side key derivation (PBKDF2/AES-GCM); encrypted blobs stored in `vault_entries` and `medical_records.data_encrypted`. Plaintext master keys never stored on server or logged. | `tests/test_vault.py`, `tests/test_crypto.py` | **VERIFIED** |
| **Asymmetric Identity** | RS256 asymmetric JWT authentication with separate public verification key and secure private signing key. | `tests/test_auth.py`, `tests/test_tokens.py` | **VERIFIED** |
| **Metadata Minimization** | IP pseudonymization via HMAC-SHA256 (`_pseudonymize`). Audit logs record actor UUID/system identity without raw client network identifiers. | `tests/test_milestone2_session_security.py` | **VERIFIED** |
| **Immutable Audit Trail** | Decoupled append-only ledger (`audit_logs`) managed exclusively by `SECURITY DEFINER` procedures (`log_user_audit_event`, `log_system_audit_event`) with triggers prohibiting UPDATE and DELETE. | `tests/test_audit.py`, Supabase Security Gates 1–9 | **VERIFIED** |
| **Database Least Privilege** | Runtime service restricted to `smartcare_backend` role with table-level grants limited strictly to operational needs; 100% of public tables protected by Row-Level Security (RLS). | Migration `000001`, `000004`, `test_milestone2_session_security.py` | **VERIFIED** |
| **Authoritative Migrations** | Startup DDL (`Base.metadata.create_all()`) disabled in production. Schema strictly governed by Supabase SQL migrations under version control. | `app/main.py` startup checks, Supabase CLI validation | **VERIFIED** |

## Consequences
- No production database mutations occur during application startup.
- All database schema changes require peer review, SQL migration creation, and automated CI/CD validation.
- Direct database mutations from browser clients are disabled; all clinical operations route through the authenticated FastAPI application layer.
