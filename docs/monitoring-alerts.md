# Monitoring & Alerts Guide

**Product:** MEDCALCEHR
**Version:** 1.0.0

---

## 1. Sentry Error Monitoring

### 1.1 Configuration

Sentry is configured via `window.MEDCALC_CONFIG.sentry` in `js/app-config.js`:

```javascript
sentry: {
    dsn: 'https://<key>@o0.ingest.sentry.io/<project>',
    environment: 'production',  // or 'staging', 'development'
    sampleRate: 1.0,            // 100% error capture
    tracesSampleRate: 0.1       // 10% performance traces
}
```

### 1.2 Recommended Alert Rules

| Alert Name | Condition | Severity | Action |
|-----------|-----------|----------|--------|
| High Error Rate | > 10 errors in 5 minutes | Critical | Investigate immediately, check FHIR server |
| New Error Type | First occurrence of new error | Warning | Review error, determine if fix needed |
| Calculator Load Failure | `Unable to load calculator module` | Critical | Check Vite chunks, verify build |
| FHIR Connection Error | `FHIR client not ready` spike | Warning | Check FHIR server availability |
| Session Timeout Spike | Session expiry rate > 50% | Info | Review timeout configuration |
| JavaScript TypeError | Unhandled TypeError | Warning | Bug fix required |
| CSP Violation | Content-Security-Policy report | Warning | Review and update CSP headers |

### 1.3 Sentry Dashboard Setup

1. Create project for `medcalc-ehr` in Sentry
2. Set up alert rules per table above
3. Configure notification channels (email, Slack)
4. Set up release tracking with git commit SHA
5. Configure source maps upload in CI (optional)

---

## 2. Uptime Monitoring

### 2.1 Health Check Endpoint

**URL:** `GET /api/health`

**Response:**
```json
{
    "status": "healthy",
    "version": "<build-version>",
    "timestamp": "<iso-datetime>"
}
```

### 2.2 Recommended Uptime Service

Choose one of:
- **UptimeRobot** (free tier: 50 monitors, 5-min interval)
- **Pingdom** (paid, 1-min interval)
- **AWS CloudWatch Synthetics** (if using AWS)

### 2.3 Uptime Monitor Configuration

| Monitor | URL | Interval | Alert |
|---------|-----|----------|-------|
| Health Check | `https://<domain>/api/health` | 5 minutes | If down > 2 checks |
| Homepage | `https://<domain>/` | 5 minutes | If status != 200 |
| Calculator Page | `https://<domain>/calculator.html?name=bmi-bsa` | 15 minutes | If status != 200 |

---

## 3. Performance Monitoring

### 3.1 Web Vitals (Built-in)

MEDCALCEHR collects Core Web Vitals via `web-vitals` library and reports to Sentry:

| Metric | Target | Description |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Main content visible |
| FID (First Input Delay) | < 100ms | First interaction responsive |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| TTFB (Time to First Byte) | < 800ms | Server response time |
| INP (Interaction to Next Paint) | < 200ms | Overall responsiveness |

### 3.2 Lighthouse CI

Lighthouse CI runs automatically in the CI pipeline:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Performance | > 0.90 | Warn on failure |
| Accessibility | > 0.95 | Error on failure |
| Best Practices | > 0.95 | Warn on failure |
| SEO | > 0.90 | Warn on failure |

---

## 4. Docker Container Monitoring

### 4.1 Health Check

The Docker container includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:80/api/health || exit 1
```

### 4.2 Resource Monitoring

```bash
# Check container resource usage
docker stats medcalcehr-app

# Check container health
docker inspect --format='{{.State.Health.Status}}' medcalcehr-app

# View recent logs
docker logs --tail 100 medcalcehr-app
```

### 4.3 Log Aggregation

Nginx access logs are available at:
- Standard out: `docker logs medcalcehr-app`
- Inside container: `/var/log/nginx/access.log`

Consider forwarding to a log aggregation service (ELK Stack, CloudWatch Logs, etc.) for production.

---

## 5. Escalation Procedure

| Level | Condition | Response Time | Responder |
|-------|-----------|---------------|-----------|
| P1 - Critical | Service down, wrong calculation | Immediate | On-call engineer |
| P2 - Major | Feature broken, degraded performance | 4 hours | Development team |
| P3 - Minor | UI issue, cosmetic | Next business day | Development team |
| P4 - Info | Monitoring threshold warning | 1 week | Review in sprint |

### 5.1 On-Call Checklist

1. Check Sentry for error details
2. Check uptime monitor for downtime duration
3. Check Docker container health: `docker ps`, `docker logs`
4. Check FHIR server connectivity
5. If needed: rollback to previous Docker image (see `docs/deployment-sop.md`)
6. Document incident and root cause
