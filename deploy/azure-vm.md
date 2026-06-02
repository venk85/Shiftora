# Azure VM Deployment — skillshifts.in

For the full local build, test, Docker, AI sandbox, backup, and troubleshooting runbook, see:

```text
BUILD_AND_DEPLOY.md
```

This deployment runs the full stack on one Azure Linux VM with HTTPS via Let's Encrypt:

- `proxy`: Nginx on ports 80 + 443 (HTTP redirect + SSL termination)
- `web`: Built frontend served by Vite preview
- `api`: Spring Boot backend
- `postgres`: PostgreSQL 16 with a persistent Docker volume
- `certbot`: Automatic certificate renewal every 12 hours

## Prerequisites on the VM

- Docker Engine + Compose plugin installed
- Inbound ports **80** and **443** open in the Azure Network Security Group
- DNS A records for `skillshifts.in` and `www.skillshifts.in` pointing to the VM's public IP
- This project folder copied to the VM

## 1. Create `.env.azure`

```bash
cp .env.azure.example .env.azure
```

Edit `.env.azure` and set:

```bash
POSTGRES_PASSWORD=<strong-password>
PUBLIC_APP_ORIGIN=https://skillshifts.in
LETSENCRYPT_EMAIL=<your-email>
ANTHROPIC_API_KEY=<claude-key>
```

Keep `.env.azure` private — it is gitignored.

## 2. Bootstrap SSL Certificate (first deploy only)

This step creates the Let's Encrypt certificate. Run it once before starting the full stack:

```bash
source .env.azure
bash deploy/init-letsencrypt.sh
```

The script will:
1. Create a temporary self-signed cert so nginx can start
2. Start the nginx proxy
3. Request the real cert from Let's Encrypt via HTTP-01 challenge
4. Reload nginx with the real cert

## 3. Start the Full Stack

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

The app is available at:

```text
https://skillshifts.in
```

HTTP (`http://skillshifts.in`) automatically redirects to HTTPS.

## 4. Populate Education Master Data

After first deploy, populate the UDISE hierarchy (states, districts, blocks) from the KYS API.
Log in as the platform admin and run:

```bash
TOKEN=$(curl -s -X POST https://skillshifts.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"<password>"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

curl -s -X POST "https://skillshifts.in/api/education/sync/kys?yearId=11" \
  -H "Authorization: Bearer $TOKEN"
```

This pulls all 36 states, ~779 districts, and ~7,006 blocks from the official UDISE+ API.

## 5. Check Status

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml ps
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs -f api
```

## Certificate Renewal

The `certbot` container automatically renews certificates every 12 hours. No manual action needed.
To force a renewal check:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec certbot certbot renew
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec proxy nginx -s reload
```

## Operational Commands

Rebuild after code changes:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

Restart only the backend after env changes:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --force-recreate api
```

Stop without deleting data:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down
```

Stop and delete the Postgres volume (destroys all data):

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down -v
```

## Database Backup and Restore

Backup:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > shiftora-demo.sql
```

Restore:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" < shiftora-demo.sql
```
