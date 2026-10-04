# SmartCare Platform — Comprehensive Repository Inventory & Audit

## Objective
This document provides a complete, file-by-file classification of the SmartCare codebase to govern the transition into a clean, disciplined **Modular Monolith**. Every file is classified under one of five architectural actions:
- **KEEP**: Core production asset with sound architecture and active consumers.
- **MOVE**: Architectural asset to be placed within a domain package (`features/*` or `domains/*`).
- **REFACTOR**: Active asset requiring interface cleanup, decoupled persistence, or typing improvements.
- **DELETE**: Redundant, orphaned, or obsolete asset scheduled for removal.
- **REPLACE**: Superseded pattern scheduled for replacement by enterprise standard.

---

## 1. Backend Inventory (`smartcare-backend/`)

### A. Routers & API Layer (`app/api/v1/`)
| File | Action | Target Location / Domain | Rationale |
| :--- | :--- | :--- | :--- |
| `auth.py` | **MOVE** | `domains/identity/router.py` | Core authentication, Argon2 hashing, RS256 token issuance. |
| `mfa.py` | **MOVE** | `domains/identity/mfa_router.py` | TOTP MFA enrollment and verification. |
| `mfa_recovery.py` | **MOVE** | `domains/identity/recovery_router.py` | MFA recovery codes and emergency reset flows. |
| `recovery_seed.py` | **MOVE** | `domains/identity/seed_router.py` | Cryptographic recovery seed phrase management. |
| `protected_key.py` | **MOVE** | `domains/vault/keys_router.py` | Master key wrapping and derivation exchange. |
| `vault.py` | **MOVE** | `domains/vault/vault_router.py` | Encrypted patient vault CRUD operations. |
| `medical_records.py` | **MOVE** | `domains/clinical/records_router.py` | Clinical notes, diagnosis encryption, audit logging. |
| `patients.py` | **MOVE** | `domains/clinical/patients_router.py` | Patient profile and demographic endpoints. |
| `doctors.py` | **MOVE** | `domains/clinical/doctors_router.py` | Doctor directory and scheduling metadata. |
| `appointments.py` | **MOVE** | `domains/operations/appointments_router.py` | Appointment booking, conflict prevention, status querying. |
| `dashboard.py` | **REFACTOR** | `domains/clinical/dashboard_router.py` | Consolidate patient dashboard metrics into domain services. |
| `files.py` | **MOVE** | `domains/clinical/files_router.py` | Encrypted clinical attachments with Supabase signed URLs. |
| `tele.py` | **MOVE** | `domains/telehealth/tele_router.py` | Telemedicine clinical session transcription & AI notes. |
| `video.py` | **MOVE** | `domains/telehealth/video_router.py` | LiveKit token generation and room authorization. |
| `admin.py` | **MOVE** | `domains/operations/admin_router.py` | Administrative user management and system audits. |
| `chatbot.py` | **REFACTOR** | `domains/clinical/triage_router.py` | Symptom assessment and conversational triage wrapper. |

### B. ORM Models (`app/models/`)
| File | Action | Target Domain | Rationale |
| :--- | :--- | :--- | :--- |
| `user.py` | **MOVE** | `domains/identity/models.py` | User account representation and role definitions. |
| `patient.py` | **MOVE** | `domains/clinical/models.py` | Patient profile entity linked to User. |
| `doctor.py` | **MOVE** | `domains/clinical/models.py` | Doctor specialty and license entity linked to User. |
| `medical_record.py` | **MOVE** | `domains/clinical/models.py` | Encrypted diagnosis and clinical note entities. |
| `appointment.py` | **MOVE** | `domains/operations/models.py` | Booking schedule and consultation state. |
| `audit_log.py` | **KEEP** | `domains/audit/models.py` | Decoupled audit model without foreign keys. |
| `vault.py` | **MOVE** | `domains/vault/models.py` | Key-wrapping and salt storage entity. |
| `vault_entry.py` | **MOVE** | `domains/vault/models.py` | Client-encrypted data entries. |
| `mfa_recovery_code.py` | **MOVE** | `domains/identity/models.py` | One-time recovery code entity with RLS. |
| `recovery_seed.py` | **MOVE** | `domains/identity/models.py` | Salted recovery seeds. |

### C. Services & Utilities (`app/services/`, `app/utils/`, `app/core/`)
| File | Action | Target Location | Rationale |
| :--- | :--- | :--- | :--- |
| `app/utils/fhir_export.py` | **KEEP / MOVE** | `domains/clinical/fhir/export.py` | Offline FHIR R4 Bundle exporter. Validated not exposed to HTTP. |
| `app/schemas/fhir.py` | **KEEP / MOVE** | `domains/clinical/fhir/schemas.py` | Pydantic v2 FHIR Observation schemas. |
| `app/services/chatbot.py` | **REFACTOR** | `domains/clinical/services.py` | Google GenAI triage prompt orchestration. |
| `app/core/config.py` | **KEEP** | `core/config.py` | Pydantic v2 BaseSettings, key pair validation, CORS policy. |
| `app/core/encryption.py` | **KEEP** | `core/encryption.py` | Fernet/AES symmetric application helpers. |
| `app/core/security.py` | **KEEP** | `core/security.py` | Argon2 password hashing and token encoding. |
| `app/database.py` | **KEEP** | `infrastructure/database.py` | SQLAlchemy engine, session management, transaction context. |
| `app/signaling.py` | **KEEP** | `infrastructure/signaling.py` | WebSocket peer discovery and chat relay. |

---

## 2. Frontend Inventory (`src/`)

### A. Pages (`src/pages/`)
| File | Action | Target Feature Module | Rationale |
| :--- | :--- | :--- | :--- |
| `LoginPage.tsx` | **MOVE** | `features/auth/pages/LoginPage.tsx` | User login and master key derivation. |
| `RegisterPage.tsx` | **MOVE** | `features/auth/pages/RegisterPage.tsx` | User registration and role selection. |
| `HomePage.tsx` | **KEEP** | `pages/HomePage.tsx` | Public landing page. |
| `AboutPage.tsx` | **KEEP** | `pages/AboutPage.tsx` | Public healthcare mission and compliance info. |
| `ServicesPage.tsx` | **KEEP** | `pages/ServicesPage.tsx` | Public clinical capabilities. |
| `ContactPage.tsx` | **KEEP** | `pages/ContactPage.tsx` | Support inquiry form. |
| `PatientDashboard.tsx` | **MOVE** | `features/patients/pages/Dashboard.tsx` | Patient home: appointments, triage, records summary. |
| `DoctorDashboard.tsx` | **MOVE** | `features/doctors/pages/Dashboard.tsx` | Doctor home: schedule, patient queue, quick notes. |
| `AdminDashboard.tsx` | **MOVE** | `features/admin/pages/Dashboard.tsx` | System metrics, user management, audit logs. |
| `MedicalRecordsPage.tsx`| **MOVE** | `features/records/pages/RecordsPage.tsx` | Encrypted record inspection and upload. |
| `LabResultsCenter.tsx` | **MOVE** | `features/records/pages/LabResults.tsx` | Clinical lab data visualization. |
| `ReportsAnalyticsPage.tsx`| **MOVE**| `features/records/pages/Reports.tsx` | Clinical trend analysis. |
| `AppointmentPage.tsx` | **MOVE** | `features/appointments/pages/AppointmentsPage.tsx` | Realtime schedule calendar. |
| `AppointmentBookingPage.tsx`| **MOVE**| `features/appointments/pages/BookingPage.tsx` | Slot reservation form. |
| `VideoCallPage.tsx` | **MOVE** | `features/telehealth/pages/VideoCallPage.tsx` | LiveKit consultation room with WebRTC media. |
| `WaitingRoom.tsx` | **MOVE** | `features/telehealth/pages/WaitingRoom.tsx` | Patient pre-call queue and hardware check. |
| `MessagesPage.tsx` | **MOVE** | `features/messaging/pages/MessagesPage.tsx` | Consultation chat messaging. |
| `DoctorMessagesPage.tsx`| **MOVE** | `features/messaging/pages/DoctorMessagesPage.tsx`| Doctor clinical communications. |
| `ProfilePage.tsx` | **MOVE** | `features/profile/pages/ProfilePage.tsx` | User credentials and MFA settings. |
| `SettingsPage.tsx` | **MOVE** | `features/settings/pages/SettingsPage.tsx` | Theme, notifications, security preferences. |
| `ResourcesCenter.tsx` | **KEEP** | `pages/ResourcesCenter.tsx` | Health education repository. |
| `DoctorsPage.tsx` | **KEEP** | `pages/DoctorsPage.tsx` | Specialist directory. |
| `DoctorProfilePage.tsx`| **KEEP** | `pages/DoctorProfilePage.tsx` | Doctor credential details. |
| `PatientsPage.tsx` | **MOVE** | `features/patients/pages/PatientsDirectory.tsx` | Doctor view of assigned patients. |
| `DashboardPage.tsx` | **KEEP** | `pages/DashboardPage.tsx` | Role-based router redirector. |
| `NotFound.tsx` | **KEEP** | `pages/NotFound.tsx` | 404 handler. |
| `UnauthorizedPage.tsx` | **KEEP** | `pages/UnauthorizedPage.tsx` | 403 access denied handler. |

### B. Shared Components & Hooks (`src/components/`, `src/hooks/`, `src/lib/`)
| File | Action | Target Location | Rationale |
| :--- | :--- | :--- | :--- |
| `src/lib/notifications.ts` | **KEEP** | `lib/notifications.ts` | Unified Sonner toast interface. |
| `src/lib/api.ts` | **KEEP** | `lib/api.ts` | Axios instance with auth interceptors. |
| `src/lib/realtime.ts` | **REFACTOR** | `lib/realtime.ts` | Scoped presence and broadcast signaling. |
| `src/lib/supabase.ts` | **KEEP** | `lib/supabase.ts` | Supabase Client for Realtime and Storage. |
| `src/components/ui/sonner.tsx`| **KEEP** | `components/ui/sonner.tsx` | Single UI toast provider. |
| `src/components/ui/toaster.tsx`| **DELETE** | — | Redundant second toast system (App uses Sonner). |
| `src/components/ui/use-toast.ts`| **DELETE** | — | Redundant compatibility wrapper. |
| `src/hooks/use-toast.ts` | **REPLACE** | `lib/notifications.ts` | Migrate call sites to `notify.*` then remove. |
| `src/hooks/useEncryption.ts` | **KEEP** | `hooks/useEncryption.ts` | Web Crypto API PBKDF2/AES-GCM client encryption. |
| `src/hooks/useRealtimeAppointments.ts`| **KEEP** | `hooks/useRealtimeAppointments.ts` | Realtime schedule sync via backend API. |
| `src/components/CreateMedicalRecord.tsx`| **MOVE**| `features/records/components/CreateRecordModal.tsx` | Encrypted record authoring modal. |
| `src/components/RecoveryCodes.tsx` | **MOVE** | `features/auth/components/RecoveryCodesModal.tsx` | MFA backup code generator modal. |
| `src/components/ErrorBoundary.tsx` | **KEEP** | `components/ErrorBoundary.tsx` | React error boundary. |
| `src/components/LoadingSpinner.tsx` | **KEEP** | `components/LoadingSpinner.tsx` | Reusable loading UI. |
| `src/components/ProtectedRoute.tsx` | **KEEP** | `components/ProtectedRoute.tsx` | Role-gated route guard. |
| `src/components/Chatbot.tsx` | **KEEP** | `components/Chatbot.tsx` | Floating clinical triage widget. |

---

## 3. Database & Migrations (`supabase/`)

| File / Entity | Action | Status |
| :--- | :--- | :--- |
| `20260101000000_init_smartcare_realtime.sql` | **KEEP** | Authoritative baseline table definition. |
| `20260101000001_secure_rls_and_roles.sql` | **KEEP** | Production RLS policies, role creation, and audit trigger. |
| `20260101000002_fix_audit_functions_uuid.sql` | **KEEP** | gen_random_uuid() replacement preserving hardened search_path. |
| `20260101000003_decouple_audit_logs_fk.sql` | **KEEP** | Removal of cascading foreign key on audit_logs. |
| `20260101000004_secure_vault_and_auxiliary_tables.sql` | **KEEP** | RLS enforcement on auxiliary vault/MFA tables. |
| `20260101000005_retire_alembic_and_harden_security.sql` | **KEEP** | Dropped alembic_version and restricted security definer ACLs. |
| `public.alembic_version` | **DELETED** | Permanently dropped from production database. |

---

## 4. Execution Governance
1. **Incremental Refactoring**: File reorganization must proceed feature-by-feature with zero breaking changes to routes or database models.
2. **Quality Gate**: Each step must be verified by running the unit test suite and CI checks.
