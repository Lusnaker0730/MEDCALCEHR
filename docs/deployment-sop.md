# Deployment Standard Operating Procedure

## Pre-Deploy Checklist

- [ ] All CI checks pass (tests, lint, type-check, build)
- [ ] E2E tests pass on Chromium
- [ ] Accessibility tests pass (axe-core unit + E2E)
- [ ] Coverage threshold met (>50%)
- [ ] SBOM generated and reviewed
- [ ] Docker image builds successfully
- [ ] Health check endpoint responds correctly
- [ ] Sentry DSN configured for target environment
- [ ] `FHIR_CLIENT_ID` matches target EHR registration

## Build

```bash
# Build production Docker image
docker build \
  --build-arg BUILD_VERSION=$(git rev-parse --short HEAD) \
  --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t medcalcehr:$(git rev-parse --short HEAD) \
  -t medcalcehr:latest .
```

## Deploy (Blue-Green)

1. **Start new container** on alternate port:
   ```bash
   docker run -d --name medcalcehr-green -p 8081:80 \
     -e FHIR_CLIENT_ID=... \
     -e SENTRY_DSN=... \
     medcalcehr:latest
   ```

2. **Verify health**:
   ```bash
   curl -f http://localhost:8081/api/health
   curl -f http://localhost:8081/health-check.html
   ```

3. **Switch traffic** (update load balancer / reverse proxy to point to :8081)

4. **Drain old container**:
   ```bash
   docker stop medcalcehr-blue
   docker rm medcalcehr-blue
   ```

5. **Rename**:
   ```bash
   docker rename medcalcehr-green medcalcehr-blue
   ```

## Rollback Procedure

1. Pull previous Docker image tag
2. Start container with previous tag
3. Verify health endpoint
4. Switch traffic back
5. Investigate the failed deployment

## Using Docker Compose

```bash
# Production
docker compose up -d --build

# Staging
docker compose -f docker-compose.staging.yml up -d --build
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| FHIR_CLIENT_ID | Yes | demo ID | SMART on FHIR OAuth client ID |
| FHIR_SCOPE | No | standard scopes | OAuth scopes |
| FHIR_REDIRECT_URI | No | ./index.html | Post-auth redirect |
| SESSION_TIMEOUT_MINUTES | No | 15 | Inactivity timeout |
| SESSION_WARNING_MINUTES | No | 2 | Warning before timeout |
| SENTRY_DSN | No | (empty) | Sentry error tracking DSN |
| SENTRY_ENVIRONMENT | No | production | Sentry environment tag |
