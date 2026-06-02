# Azure VM Docker Compose Demo Deployment

For the full local build, test, Docker, AI sandbox, backup, and troubleshooting runbook, see:

```text
BUILD_AND_DEPLOY.md
```

This deployment runs the full demo on one Azure Linux VM:

- `proxy`: Nginx public entry point on port 80
- `web`: built frontend served by Vite preview
- `api`: Spring Boot backend
- `postgres`: PostgreSQL 16 with a persistent Docker volume

## 1. Prepare the VM

Open inbound port `80` in the Azure Network Security Group.

Install Docker and the Compose plugin on the VM, then copy this project to the VM.

## 2. Configure Environment

Create a VM deployment env file:

```bash
touch .env.azure
```

Update:

- `POSTGRES_PASSWORD`
- `PUBLIC_APP_ORIGIN`, for example `http://<vm-public-ip>`
- `ANTHROPIC_API_KEY`, if the AI sandbox should call Claude
- `ANTHROPIC_MODEL`, default `claude-sonnet-4-5`

Keep `.env.azure` private.

## 3. Build and Start

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml up -d --build
```

The app will be available at:

```text
http://<vm-public-ip>
```

## 4. Check Status

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml ps
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml logs -f api
```

## 5. Back Up the Demo Database

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml exec postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > shiftora-demo.sql
```

## 6. Stop the Demo

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down
```

To delete the database volume as well:

```bash
docker compose --env-file .env.azure -f docker-compose.azure-vm.yml down -v
```
