# Deployment Standard Operating Procedure (SOP)

**Product:** MEDCALCEHR
**Version:** 1.0.0

---

## 1. Deployment Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│   GitHub     │     │  CI/CD Pipeline  │     │   Container    │
│   (main)     │────→│ (GitHub Actions) │────→│   Registry     │
└──────────────┘     └──────────────────┘     │   (GHCR)       │
                                               └───────┬────────┘
                                                       │
                            ┌──────────────────────────┘
                            ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Production  │     │   Staging     │
                     │  (Docker)    │     │  (Docker)     │
                     └──────────────┘     └──────────────┘
```

---

## 2. Pre-Deploy Checklist

- [ ] All CI checks pass (tests, lint, type-check, build)
- [ ] E2E tests pass on Chromium
- [ ] Accessibility tests pass (axe-core unit + E2E)
- [ ] Coverage threshold met (>50%)
- [ ] SBOM generated and reviewed
- [ ] SOUP list regenerated (`npm run generate:soup`)
- [ ] Traceability matrix regenerated (`npm run generate:traceability`)
- [ ] Validation audit clean (`npm run audit:validation`)
- [ ] Docker image builds successfully
- [ ] Health check endpoint responds correctly
- [ ] Sentry DSN configured for target environment
- [ ] `FHIR_CLIENT_ID` matches target EHR registration

---

## 3. Build

```bash
# Build production Docker image
docker build \
  --build-arg BUILD_VERSION=$(git rev-parse --short HEAD) \
  --build-arg BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t medcalcehr:$(git rev-parse --short HEAD) \
  -t medcalcehr:latest .
```

---

## 4. Blue-Green Deployment

### Step 1: Start New Container (Green)
```bash
docker run -d --name medcalcehr-green -p 8081:80 \
  --env-file .env.production \
  medcalcehr:$(git rev-parse --short HEAD)
```

### Step 2: Health Check Verification
```bash
sleep 10

# Verify health endpoint
curl -f http://localhost:8081/api/health
# Expected: {"status":"healthy","version":"<sha>"}

# Verify main page loads
curl -f http://localhost:8081/

# Verify calculator page loads
curl -f "http://localhost:8081/calculator.html?name=bmi-bsa"
```

### Step 3: Smoke Test (5 Representative Calculators)

Manually or via script, verify these 5 calculators load and calculate:
1. **BMI/BSA** — Simple formula, unit conversion
2. **APACHE II** — Complex scoring, multiple sections
3. **GCS** — Scoring with FHIR integration
4. **CKD-EPI** — Formula with lab values
5. **PHQ-9** — Psychiatric scoring questionnaire

### Step 4: Switch Traffic
```bash
# Stop old container (Blue)
docker stop medcalcehr-blue
docker rename medcalcehr-blue medcalcehr-old

# Rename new container
docker rename medcalcehr-green medcalcehr-blue

# Update port mapping (if using reverse proxy / ALB target group)
```

### Step 5: Verify Production
```bash
curl -f https://<production-domain>/api/health
```

### Step 6: Cleanup (after 24 hours of stable operation)
```bash
docker rm medcalcehr-old
```

---

## 5. Rollback Procedure

### 5.1 Rollback Trigger Conditions

- Health check endpoint returns non-200
- Sentry reports critical errors (>10 in 5 minutes)
- User reports incorrect calculation results
- Application fails to load

### 5.2 Rollback Steps

```bash
# 1. Stop current (broken) container
docker stop medcalcehr-blue

# 2. Start previous version
docker run -d \
  --name medcalcehr-blue \
  -p 8080:80 \
  --env-file .env.production \
  medcalcehr:<previous-sha>

# 3. Verify health
curl -f http://localhost:8080/api/health

# 4. Verify calculator functionality
curl -f "http://localhost:8080/calculator.html?name=bmi-bsa"
```

### 5.3 Post-Rollback

1. Document the incident
2. Investigate root cause in Sentry/logs
3. Fix the issue on a branch
4. Re-run full CI pipeline before re-deploying
5. Follow full deployment process again

---

## 6. Docker Image Retention Policy

| Tag | Retention | Purpose |
|-----|-----------|---------|
| `:<commit-sha>` | Keep last 5 | Rollback capability |
| `:latest` | Always current | Quick reference |
| `:v<semver>` | Indefinite | Release milestones |

### Cleanup Script
```bash
# List all images sorted by creation time
docker images medcalcehr --format "{{.Tag}}\t{{.CreatedAt}}"

# Remove old images (keep 5 most recent)
docker images medcalcehr --format "{{.ID}}" | tail -n +6 | xargs docker rmi
```

---

## 7. Using Docker Compose

```bash
# Production
docker compose up -d --build

# Staging
docker compose -f docker-compose.staging.yml up -d --build
```

---

## 8. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| FHIR_CLIENT_ID | Yes | demo ID | SMART on FHIR OAuth client ID |
| FHIR_SCOPE | No | standard scopes | OAuth scopes |
| FHIR_REDIRECT_URI | No | ./index.html | Post-auth redirect |
| SESSION_TIMEOUT_MINUTES | No | 30 | Inactivity timeout |
| SESSION_WARNING_MINUTES | No | 25 | Warning before timeout |
| SENTRY_DSN | No | (empty) | Sentry error tracking DSN |
| SENTRY_ENVIRONMENT | No | production | Sentry environment tag |
| SENTRY_SAMPLE_RATE | No | 1.0 | Error sampling rate |
| SENTRY_TRACES_RATE | No | 0.1 | Performance trace sampling |
