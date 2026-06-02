# Shiftora API

Spring Boot backend for Shiftora AI. The database is Postgres: frequently
searched/reportable fields live in normal columns, while flexible tenant,
scenario, and practice configuration is stored in `jsonb`.

## Local Run

```bash
docker compose -f backend/docker-compose.yml up -d
cd backend
mvn spring-boot:run
```

The API runs on `http://localhost:8081`.

Important environment variables:

```bash
DATABASE_URL=jdbc:postgresql://localhost:5432/shiftora
DATABASE_USERNAME=shiftora
DATABASE_PASSWORD=shiftora
CORS_ALLOWED_ORIGINS=http://localhost:8080
```
