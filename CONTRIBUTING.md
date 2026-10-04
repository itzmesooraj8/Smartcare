# Contributing to SmartCare

Thank you for your interest in contributing to SmartCare.

## Database Schema Governance
> **CRITICAL RULE**:
> Production database schema is migration-controlled. Never modify production schema manually.
> All schema modifications must occur via a new migration file in `supabase/migrations/` and be accompanied by preflight validation scripts and transactional rollback tests.

## Development Workflow
1. Fork the repository and create feature branches from `main`.
2. Follow existing TypeScript / Python styling and formatting guidelines.
3. Verify test suites before opening a Pull Request:
   - Backend: `PYTHONPATH=. python -m unittest discover -s tests -p "test_*.py"`
   - Frontend: `npm run build`
4. For security-sensitive changes (encryption, auth, migrations), request a security review and adhere to the least-privilege role boundaries (`smartcare_backend`).

## Submitting Pull Requests
- Keep PRs focused, atomic, and well-documented.
- Ensure all CI/CD pipeline checks pass.
