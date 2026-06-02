#!/bin/bash
# Bootstrap Let's Encrypt certificates for skillshifts.in.
# Run this once on the VM before starting the full stack.
# Requires: docker, docker compose, openssl, curl

set -euo pipefail

# Load env file from repo root so LETSENCRYPT_EMAIL and other vars are available
# when the script is invoked directly (without prior `source .env.azure`).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.azure"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck source=../.env.azure
  source "$ENV_FILE"
  set +a
fi

DOMAIN="skillshifts.in"
DOMAINS="-d skillshifts.in -d www.skillshifts.in"
EMAIL="${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL in .env.azure}"
COMPOSE="docker compose --env-file .env.azure -f docker-compose.azure-vm.yml"
CERT_DIR="./certbot/conf/live/$DOMAIN"
WWW_DIR="./certbot/www"

mkdir -p "$CERT_DIR" "$WWW_DIR/.well-known/acme-challenge"
chmod -R 755 "$WWW_DIR"

if [ -f "$CERT_DIR/fullchain.pem" ]; then
  echo "Certificate already exists at $CERT_DIR — skipping issuance."
  echo "To force renewal: certbot renew --force-renewal"
  exit 0
fi

echo "==> Creating temporary self-signed certificate so nginx can start..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=$DOMAIN" 2>/dev/null

echo "==> Starting proxy (nginx) with temporary certificate..."
$COMPOSE up -d proxy

echo "==> Waiting for nginx to be ready..."
sleep 5

echo "==> Verifying nginx can serve ACME challenge path..."
echo "nginx-ok" > "$WWW_DIR/.well-known/acme-challenge/.test"
TEST_URL="http://$DOMAIN/.well-known/acme-challenge/.test"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" || echo "000")
rm -f "$WWW_DIR/.well-known/acme-challenge/.test"
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: nginx returned HTTP $HTTP_CODE for $TEST_URL"
  echo "Check: docker compose logs proxy"
  exit 1
fi
echo "   OK — nginx is serving the challenge path (HTTP 200)"

echo "==> Requesting Let's Encrypt certificate for $DOMAIN..."
$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  --force-renewal \
  $DOMAINS

echo "==> Removing temporary certificate..."
rm -f "$CERT_DIR/fullchain.pem" "$CERT_DIR/privkey.pem"

echo "==> Reloading nginx with the real certificate..."
$COMPOSE exec proxy nginx -s reload

echo ""
echo "Done. https://$DOMAIN is ready."
