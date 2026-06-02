# Shiftora Build and Deployment Runbook

This project runs as four Docker Compose services:

- `proxy`: Nginx public entry point. Serves the app and routes `/api/*` to the backend.
- `web`: TanStack/Vite frontend.
- `api`: Spring Boot backend.
- `postgres`: PostgreSQL 16 with persistent Docker volume storage.
- `pgadmin`: Optional browser database admin console for local/demo inspection.

For the full table design, relationships, indexes and JSONB usage, see `DATABASE_DESIGN.md`.

## Required Tools

- Docker Desktop locally, or Docker Engine + Compose plugin on a VM
- Node.js 22 for local frontend checks
- Java 21 and Maven for local backend checks

## Environment Variables

Create a private env file. For local demo, use `.env.local`. For Azure VM, use `.env.azure`.

```bash
POSTGRES_DB=shiftora
POSTGRES_USER=shiftora
POSTGRES_PASSWORD=change-me
POSTGRES_PORT=15432
HTTP_PORT=8090
API_PORT=18081
PGADMIN_PORT=5050
PGADMIN_DEFAULT_EMAIL=admin@shiftora.com
PGADMIN_DEFAULT_PASSWORD=change-me-too
PUBLIC_APP_ORIGIN=http://localhost:8090
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

Do not commit env files containing secrets.

Important: Docker Compose only auto-loads `.env`, not `.env.local`. If the Claude key is in `.env.local`, always pass `--env-file .env.local`.

## Local Verification Before Deploy

Run frontend tests and build:

```bash
npm test
npm run build
```

Run backend tests:

```bash
cd backend
mvn -q test
cd ..
```

The Vite build may print a Wrangler log-directory warning on this machine. The build is still successful if the command exits with code `0` and prints `built`.

## Run Locally With Docker Compose

Start or rebuild the full local demo:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml up -d --build
```

Open:

```text
http://localhost:8090/login
```

Check services:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml ps
```

Expected services:

- `skillnavigator-ms-postgres-1`
- `skillnavigator-ms-pgadmin-1`
- `skillnavigator-ms-api-1`
- `skillnavigator-ms-web-1`
- `skillnavigator-ms-proxy-1`

## pgAdmin

Open:

```text
http://localhost:5050
```

Default local/demo pgAdmin login:

```text
Email: admin@shiftora.com
Password: shiftora-pgadmin
```

Register the Compose database inside pgAdmin:

```text
Name: Shiftora local
Host: postgres
Port: 5432
Maintenance database: shiftora
Username: shiftora
Password: shiftora
```

For a desktop database client on the host machine:

```text
Host: 127.0.0.1
Port: 15432
Database: shiftora
Username: shiftora
Password: shiftora
```

On Azure VM, these database/admin ports are bound to `127.0.0.1`; use an SSH tunnel rather than opening them publicly.

## Verify AI Sandbox

Confirm the API container has the Claude key without printing the key:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml exec -T api sh -c \
'if [ -n "$ANTHROPIC_API_KEY" ]; then case "$ANTHROPIC_API_KEY" in sk-ant-*) echo ANTHROPIC_API_KEY_PRESENT_AND_HAS_EXPECTED_PREFIX ;; *) echo ANTHROPIC_API_KEY_PRESENT_BUT_BAD_PREFIX ;; esac; else echo ANTHROPIC_API_KEY_MISSING; fi; echo ANTHROPIC_MODEL=${ANTHROPIC_MODEL:-missing}'
```

Run a sandbox request from inside the Docker network:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml exec -T web sh -c \
'wget -qO- --header="Content-Type: application/json" --post-data="{\"aiName\":\"Shiksha AI\",\"scenarioTitle\":\"Lesson Plan Lab\",\"systemPrompt\":\"Generate a short lesson plan.\",\"tenantInstruction\":\"Use classroom-ready language.\",\"scoreLabels\":[\"Alignment\",\"Clarity\",\"Usefulness\"],\"inputs\":{\"subject\":\"Mathematics\",\"grade\":\"Grade 3\",\"topic\":\"Place value\",\"duration\":\"30 minutes\"}}" http://api:8081/api/sandbox/run'
```

If the key is missing, recreate the containers with the env file:

```bash
POSTGRES_PASSWORD=shiftora POSTGRES_DB=shiftora POSTGRES_USER=shiftora HTTP_PORT=8090 API_PORT=18081 \
docker compose -p skillnavigator-ms --env-file .env.local -f docker-compose.azure-vm.yml up -d --force-recreate api web proxy
```

## Azure VM Demo Deployment

1. Create an Azure Linux VM.
2. Open inbound TCP port `80` in the VM Network Security Group.
3. Install Docker Engine and the Docker Compose plugin.
4. Copy this project folder to the VM.
5. Create `.env.azure` on the VM:

```bash
POSTGRES_DB=shiftora
POSTGRES_USER=shiftora
POSTGRES_PASSWORD=<strong-password>
POSTGRES_PORT=15432
HTTP_PORT=80
API_PORT=8081
PGADMIN_PORT=5050
PGADMIN_DEFAULT_EMAIL=<admin-email>
PGADMIN_DEFAULT_PASSWORD=<strong-password>
PUBLIC_APP_ORIGIN=http://<vm-public-ip>
ANTHROPIC_API_KEY=<claude-key>
ANTHROPIC_MODEL=claude-sonnet-4-5
```

6. Build and start:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

7. Open:

```text
http://<vm-public-ip>/login
```

## Operational Commands

View status:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml ps
```

Follow backend logs:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs -f api
```

Restart only the backend after env changes:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --force-recreate api
```

Rebuild frontend/backend after code changes:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

Stop without deleting data:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down
```

Stop and delete the Postgres volume:

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

## Common Issues

AI Sandbox says `ANTHROPIC_API_KEY is not configured`:

- The running API container does not have the key.
- Start Compose with `--env-file .env.local` locally or `--env-file .env.azure` on the VM.
- Recreate `api`, `web`, and `proxy` after changing env values.

App opens but API calls fail:

- Check `proxy` is running and Nginx has `deploy/nginx.conf` mounted.
- Check `api` is running on internal port `8081`.
- Check Postgres health is `healthy`.

Database data disappeared:

- Verify you did not run `docker compose down -v`.
- Data is stored in Docker volume `shiftora_postgres_data`.
