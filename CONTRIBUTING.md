# Contributing to SmartCare

Thank you for your interest in contributing to SmartCare. This document gives a short overview on how to get started.

- Fork the repository and create feature branches from `main`.
- Follow the existing TypeScript / Python project styles.
- Run linters and formatters before creating a PR.
  - Frontend: `npm run lint` (if configured) and `npm run format`.
  - Backend: use `black` / `ruff` and run tests.
- Write tests for new features or bug fixes. Aim to add unit tests to `tests/`.
- For security-sensitive changes (encryption, auth, migrations), request a code review from a senior maintainer and include a migration plan.

# Running locally

- Frontend: `npm install` then `npm run dev`.
- Backend: create and activate a Python venv, install `requirements.txt`, and run `uvicorn app.main:app --reload`.

# Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers at security@smartcare.example (replace with real address).
