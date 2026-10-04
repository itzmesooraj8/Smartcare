# HIPAA & GDPR Aligned Security Control Matrix

## Purpose & Scope
This document specifies the technical and procedural security safeguards implemented within the SmartCare platform, mapped directly to healthcare privacy (HIPAA Security Rule 45 CFR Part 164) and data protection (GDPR Regulation 2016/679) principles.

> **Governance Notice**: SmartCare is engineered with HIPAA/GDPR-aligned security controls. Legal certification requires organizational policies, business associate agreements (BAAs), and independent auditing in conjunction with these technical safeguards.

---

## Technical Safeguards Matrix

| Standard / Principle | Regulation | Technical Implementation | Enforcement Layer |
| :--- | :--- | :--- | :--- |
| **Transmission Security & Encryption** | HIPAA §164.312(e)(1) / GDPR Art. 32 | All transit protected via TLS 1.3. WebRTC media encrypted via DTLS-SRTP. | Network / Ingress Edge (Render/Vercel/LiveKit) |
| **Access Control (Least Privilege)** | HIPAA §164.312(a)(1) / GDPR Art. 25 | Zero-trust RBAC (`patient`, `doctor`, `admin`). Database access restricted to `smartcare_backend` role. Row-Level Security on all tables. | PostgreSQL RLS / FastAPI Auth Middleware |
| **Audit Controls & Traceability** | HIPAA §164.312(b) / GDPR Art. 5(2) | Immutable append-only audit ledger (`audit_logs`) tracking all read/write/export events. Security-definer insertion triggers prevent tampering. | PostgreSQL Triggers / Stored Procedures |
| **Integrity & Cryptographic Isolation** | HIPAA §164.312(c)(1) / GDPR Art. 32 | Clinical payloads encrypted client-side using AES-256-GCM. Wrapped master keys stored in isolated vault structures. | Client Key Derivation / Backend Vault API |
| **Metadata Minimization** | GDPR Art. 5(1)(c) (Data Minimisation) | IP pseudonymization using HMAC-SHA256 with isolated salt. Elimination of extraneous PII from operational logging. | Application Logging Layer (`_pseudonymize`) |
| **Data Resiliency & Recovery** | HIPAA §164.308(7)(ii)(B) / GDPR Art. 32 | Continuous Point-in-Time Recovery (PITR), daily automated snapshots, disaster recovery playbooks with defined RTO/RPO targets. | Supabase Managed Infrastructure |

---

## Verification & Continuous Compliance
- **Static Analysis (SAST)**: Code scanning on pull requests via GitHub Actions.
- **Automated Security Suites**: 9-gate database security validation suite preventing privilege escalation or RLS bypass.
- **Migration Governance**: Authoritative migrations under version control; zero manual schema manipulation.
