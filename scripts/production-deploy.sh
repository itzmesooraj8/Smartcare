#!/usr/bin/env bash
set -euo pipefail

# production-deploy.sh
# Generates RSA-4096 keypair for RS256, generates 32-byte Fernet key,
# prints Docker permission guidance and an Nginx config snippet with strict HSTS & CSP.

WORKDIR=$(cd "$(dirname "$0")/.." && pwd)
OUTDIR="$WORKDIR/secrets"
mkdir -p "$OUTDIR"

echo "Generating RSA-4096 key pair..."
PRIVATE_KEY_PATH="$OUTDIR/private_key.pem"
PUBLIC_KEY_PATH="$OUTDIR/public_key.pem"

if [ -f "$PRIVATE_KEY_PATH" ] || [ -f "$PUBLIC_KEY_PATH" ]; then
  echo "Warning: keys already exist in $OUTDIR. Will overwrite in 5s unless cancelled (Ctrl-C)."
  sleep 5
fi

# Generate private key
openssl genpkey -algorithm RSA -out "$PRIVATE_KEY_PATH" -pkeyopt rsa_keygen_bits:4096
# Extract public key
openssl rsa -pubout -in "$PRIVATE_KEY_PATH" -out "$PUBLIC_KEY_PATH"

chmod 600 "$PRIVATE_KEY_PATH"
chmod 644 "$PUBLIC_KEY_PATH"

echo "RSA keys written to:"
echo "  PRIVATE: $PRIVATE_KEY_PATH"
echo "  PUBLIC : $PUBLIC_KEY_PATH"

# Generate 32-byte Fernet key (base64)
echo "Generating 32-byte Fernet key..."
FERNET_KEY_PATH="$OUTDIR/fernet.key"
python - <<'PY'
import base64, os
k = base64.urlsafe_b64encode(os.urandom(32))
print(k.decode())
PY > "$FERNET_KEY_PATH"
chmod 600 "$FERNET_KEY_PATH"

echo "Fernet key written to: $FERNET_KEY_PATH"

# Output environment variable exports for CI or docker-compose
cat <<EOF

----- ENV VARS TO SET (example) -----
# In your secrets manager or CI environment, set these values:
# PRIVATE_KEY: contents of $PRIVATE_KEY_PATH
# PUBLIC_KEY: contents of $PUBLIC_KEY_PATH
# ENCRYPTION_KEY: contents of $FERNET_KEY_PATH

# Example (bash):
# export PRIVATE_KEY="$(sed -e ':a' -e 'N' -e "s/\n/\\n/g" "$PRIVATE_KEY_PATH")"
# export PUBLIC_KEY="$(sed -e ':a' -e 'N' -e "s/\n/\\n/g" "$PUBLIC_KEY_PATH")"
# export ENCRYPTION_KEY="$(cat $FERNET_KEY_PATH)"

-------------------------------------
EOF

# Docker non-root guidance
cat <<'DOCKER'

----- DOCKER CONTAINER NON-ROOT GUIDE -----
# In your Dockerfile, use a non-root user and set permissions for runtime dirs:
# Example snippet:
#   FROM python:3.12-slim
#   RUN groupadd -r app && useradd -r -g app app
#   WORKDIR /app
#   COPY . /app
#   RUN chown -R app:app /app /var/log/smartcare && chmod -R 750 /app
#   USER app
# Note: ensure any sockets or mounted volumes are owned by the container runtime user.

DOCKER

# Nginx HSTS & CSP snippet
cat <<'NGINX'

----- NGINX (reverse proxy) SNIPPET -----
# Place inside your server {} block
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
# Strong CSP disallowing inline scripts/styles; use nonces or hashes for allowed script tags
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https:; connect-src 'self' https:; img-src 'self' data:; style-src 'self' https:; font-src 'self' https:;" always;

# Enable basic rate limiting (tweak to taste)
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
limit_req zone=one burst=20;

# Recommended Docker runtime flags example (docker-compose):
# services:
#   app:
#     image: smartcare:latest
#     read_only: true
#     tmpfs:
#       - /tmp
#       - /run
#     volumes:
#       - ./secrets:/run/secrets:ro

NGINX

echo "Done. Secrets are in: $OUTDIR"
exit 0
