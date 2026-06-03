# Azure VM Deployment — skillshifts.in

Complete runbook for deploying and maintaining Shiftora on an Azure Linux VM.

---

## Architecture

```
Internet → Nginx proxy (80 / 443)
              ├── /api/*  →  Spring Boot API  (port 8081)
              └── /*      →  Vite frontend    (port 8080)
                               └── PostgreSQL 16  (port 5432, localhost only)
```

All four services run as Docker containers managed by `docker-compose.azure-vm.yml`.  
Data is persisted in a named Docker volume (`shiftora_postgres_data`) — it survives container restarts.

---

## Prerequisites on the Azure VM

| Requirement | Check |
|---|---|
| Ubuntu 22.04 LTS (or similar) | `lsb_release -a` |
| Docker Engine + Compose plugin | `docker compose version` |
| Inbound NSG rules: ports **80** and **443** | Azure Portal → VM → Networking |
| DNS A record: `skillshifts.in` → VM public IP | `dig skillshifts.in` |
| DNS A record: `www.skillshifts.in` → VM public IP | `dig www.skillshifts.in` |

Install Docker on Ubuntu if not already installed:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in after this
```

---

## First-time Deployment

### Step 1 — Clone the repo onto the VM

```bash
git clone https://github.com/<your-org>/Shiftora.git
cd Shiftora
```

### Step 2 — Create `.env.azure`

```bash
cp .env.azure.example .env.azure
nano .env.azure
```

Set these values (the rest can stay as defaults):

```bash
POSTGRES_PASSWORD=<strong-random-password>        # at least 20 chars
PUBLIC_APP_ORIGIN=https://skillshifts.in
LETSENCRYPT_EMAIL=<your-email@example.com>
ANTHROPIC_API_KEY=<your-claude-api-key>
ANTHROPIC_MODEL=claude-sonnet-4-5
```

> `.env.azure` is gitignored — never commit it.

### Step 3 — Bootstrap HTTPS (first deploy only)

> **Prerequisites:** DNS A records for `skillshifts.in` and `www.skillshifts.in` must already point to this VM's public IP, and Azure NSG rules must allow inbound TCP 80 and 443.

Run once before starting the full stack:

```bash
bash deploy/init-letsencrypt.sh
```

The script sources `.env.azure` automatically — no need to `source` it first.

This will:
1. Create a temporary self-signed cert so Nginx can start on port 80
2. Verify the ACME challenge path is reachable (HTTP 200 self-test)
3. Remove the temporary cert directory (certbot requires the directory to not exist)
4. Request the real cert from Let's Encrypt via HTTP-01 challenge
5. Reload Nginx with the real certificate

Skip this step for HTTP-only deployments (not recommended for production).

### Step 4 — Build and start the full stack

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

The build takes 3–5 minutes the first time (downloads Maven/Node base images and compiles).  
Subsequent deployments are faster due to Docker layer caching.

Check everything started:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml ps
```

Expected output (all services `Up`):

```
NAME                          STATUS
shiftora-...-postgres-1       Up (healthy)
shiftora-...-api-1            Up
shiftora-...-web-1            Up
shiftora-...-proxy-1          Up
```

### Step 5 — Verify the API is running

```bash
curl -s http://localhost/api/health    # or https://skillshifts.in/api/health
```

Expected response: `{"status":"UP"}` (or similar — check API logs if different).

---

## Populate Master Data (one-time after first deploy)

### 5a — UDISE hierarchy (states, districts, blocks)

Sync ~36 states, ~779 districts, and ~7,006 blocks from the official UDISE+ API:

```bash
# Get a platform admin token
TOKEN=$(curl -s -X POST https://skillshifts.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@skillshifts.in","password":"<platform-admin-password>"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Run the sync (pulls all states → districts → blocks in one call)
curl -s -X POST "https://skillshifts.in/api/education/sync/kys?yearId=11" \
  -H "Authorization: Bearer $TOKEN"
```

### 5b — TN School Master (45,530 government and aided schools)

This loads all Tamil Nadu Government, Fully Aided, and Partially Aided schools from the flat file in the repo.

**On your local machine**, copy the data file to the VM:

```bash
# Replace <vm-user> and <vm-ip> with your Azure VM's SSH user and public IP
scp tn_govt_fully_aided_schools_udise.txt <vm-user>@<vm-ip>:~/Shiftora/
```

**On the VM**, run the loader script from the repo root:

```bash
cd ~/Shiftora

# Find the exact postgres container name
docker ps --format '{{.Names}}' | grep postgres
# Usually: shiftora-<project>-postgres-1

# Run the loader (pass the container name as the argument)
bash deploy/load-tn-schools.sh shiftora-<project>-postgres-1
```

The script:
1. Copies the `.txt` file into the container at `/tmp/`
2. Runs a PostgreSQL server-side `COPY` — loads all 45,530 rows in seconds
3. Prints the final row count to confirm success

Expected output:
```
Copying tn_govt_fully_aided_schools_udise.txt into shiftora-...-postgres-1...
Running COPY into tn_school_master...
COPY 45530
Done. Row count:
 loaded_schools
----------------
          45530
(1 row)
```

> To reload (e.g., after a data update), truncate first:  
> `docker exec <container> psql -U shiftora -d shiftora -c "TRUNCATE tn_school_master;"`  
> Then re-run `bash deploy/load-tn-schools.sh`.

---

## Updating After a Code Change

Pull the latest code and rebuild:

```bash
cd ~/Shiftora
git pull origin main

docker compose --env-file .env.azure -f docker-compose.azure-vm.yml build
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d
```

> **Note:** Use `build` then `up -d` as two separate commands. The `--no-cache` flag belongs on `build`, not `up`.

Flyway runs automatically on API startup and applies any new migrations.  
No need to manually run SQL files.

To rebuild only specific services (e.g., after a backend-only change):

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml build api
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d api
```

To force a full rebuild ignoring Docker layer cache (e.g., after changing base images or system deps):

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml build --no-cache api web
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d api web
```

---

## Operational Commands

| Task | Command |
|---|---|
| View all service status | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml ps` |
| Tail API logs | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs -f api` |
| Tail all logs | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs -f` |
| Restart API only | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml restart api` |
| Stop all (keep data) | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down` |
| Stop + destroy DB volume | `docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down -v` |

---

## Database Operations

### Connect to Postgres directly

```bash
docker exec -it <postgres-container> psql -U shiftora -d shiftora
```

### Backup

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec -T postgres \
  pg_dump -U shiftora shiftora > shiftora-backup-$(date +%Y%m%d).sql
```

### Restore

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec -T postgres \
  psql -U shiftora shiftora < shiftora-backup-YYYYMMDD.sql
```

### Check migration status

```bash
docker exec <postgres-container> psql -U shiftora -d shiftora \
  -c "SELECT version, description, installed_on FROM flyway_schema_history ORDER BY installed_rank;"
```

Current migrations (V1 → V22):

| Version | Description |
|---|---|
| V1 | Core schema |
| V2–V9 | Journey, learning, certificates, workshops |
| V10–V11 | Education UDISE master |
| V12 | Auth sessions |
| V13 | Platform settings |
| V15 | Registered school UDISE |
| V16–V19 | India UDISE state/UT master + KYS seed data |
| V20 | UDISE district + block master |
| V21 | Seed platform admin user |
| V22 | TN school master table (schema only — data loaded separately via COPY) |
| V23 | Seed 3 edu teacher scenarios (Lesson Generator, Paper Evaluation, Learning Paths) |

---

## AI Sandbox — Teacher Use Cases

Three teacher-focused AI sandbox scenarios are seeded by Flyway migration V23 on first API startup:

| Scenario | ID | Tags |
|---|---|---|
| AI Lesson & Resource Generator | `edu-lesson-resource-gen` | NCERT Aligned, HOTS Questions, Instant PPT, Exit Tickets |
| AI-Powered Paper Evaluation | `edu-paper-evaluation` | Handwriting OCR, Auto-Scoring, Topic Feedback, Parent Reports |
| Personalised Student Learning Paths | `edu-learning-path` | Learning Gaps, Study Plans, Pace Tracking, AI Tutor |

**Requirements:**
- `ANTHROPIC_API_KEY` must be set in `.env.azure` (the API key is used for all sandbox runs)
- The tenant's industry must be `edu`

**Verify scenarios loaded:**
```bash
TOKEN=$(curl -s -X POST https://skillshifts.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Shiftora@123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://skillshifts.in/api/scenarios?industry=edu" | python3 -m json.tool
```

Expected: JSON array of 3 scenario objects with `id`, `title`, `tags`, etc.

**Paper Evaluation — file upload:**  
Teachers can upload handwritten student answer sheets (JPG/PNG/PDF). The file is read in the browser and sent as a base64 payload — no S3 or file storage needed. Claude reads the handwriting via its vision API.

---

## SSL Certificate

Certbot renews the certificate automatically every 12 hours. No manual action needed.

To force a renewal check:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec certbot certbot renew
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec proxy nginx -s reload
```

---

## Troubleshooting

**API won't start / migration failed**

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs api | tail -50
```

Look for `FlywayException` — usually means a migration was edited after being applied.  
Fix: set `SPRING_FLYWAY_VALIDATE_ON_MIGRATE=false` in `.env.azure` (already the default).

**Port 80 or 443 not reachable**

Check NSG rules in the Azure Portal: VM → Networking → Inbound port rules.  
Both 80 and 443 must be open to `0.0.0.0/0` (or your IP range).

**UDISE decode returns school not found**

The TN school master data may not be loaded. Run step 5b above.  
Verify: `docker exec <postgres-container> psql -U shiftora -d shiftora -c "SELECT count(*) FROM tn_school_master;"`  
Should return `45530`.

**Out of disk space**

```bash
docker system prune -f          # remove unused images/containers/networks
docker volume ls                # list volumes
df -h                           # check disk usage
```
