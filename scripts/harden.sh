#!/usr/bin/env bash
# harden.sh - repository hardening checks and automated cleanups
# Defense-in-depth: run as CI step pre-deploy to prevent accidental backdoors.
set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "[hardening] scanning for VITE_ENABLE_DEMO occurrences..."
# Remove demo code blocks by pattern. This is conservative: it alerts and fails if found.
FOUND=$(grep -R --line-number "VITE_ENABLE_DEMO" || true)
if [ -n "$FOUND" ]; then
  echo "[hardening][error] Found VITE_ENABLE_DEMO occurrences:" >&2
  echo "$FOUND" >&2
  echo "Please remove demo backdoors and re-run." >&2
  exit 2
fi

echo "[hardening] checking .env for weak secrets..."
if [ -f ".env" ]; then
  WEAK=$(grep -E "(SECRET_KEY|PRIVATE_KEY|ENCRYPTION_KEY|DATABASE_URL)\s*=\s*(\"?\w{1,8}\"?)" .env || true)
  if [ -n "$WEAK" ]; then
    echo "[hardening][warn] Possible weak or missing secrets in .env:" >&2
    echo "$WEAK" >&2
  fi
else
  echo "[hardening] no .env file present (ok for CI if secrets are provided via env)."
fi

# Emit recommended Nginx rate limit snippet
cat <<'NGINX'
# Nginx rate limit snippet (include in server block)
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/m;
limit_req zone=one burst=20 nodelay;
# Adjust rate and burst to match service SLA; this prevents brute force.
NGINX

echo "[hardening] complete. Forensic note: run tests and verify endpoints before deploy."
