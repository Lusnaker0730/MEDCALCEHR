# Disaster Recovery Plan

**Product:** MEDCALCEHR
**Version:** 1.0.0

---

## Recovery Targets

- **RTO (Recovery Time Objective):** 15 minutes
- **RPO (Recovery Point Objective):** 0 (stateless frontend, no data loss risk)

## Architecture Notes

MEDCALCEHR is a **stateless frontend application**:
- No server-side database
- Patient data flows through FHIR APIs (EHR system is the source of truth)
- User preferences stored in browser localStorage
- All calculation state is ephemeral (in-memory)

## Docker Image Versioning

Images are tagged with git commit SHA and pushed to GHCR:
```
ghcr.io/<org>/medcalc-ehr:abc1234   # specific commit
ghcr.io/<org>/medcalc-ehr:latest    # most recent build
```

### Image Retention Policy
- Keep at least **5 previous image versions** available for rollback
- Release-tagged images (`:v1.0.0`) retained indefinitely
- Clean up older images monthly

### Cleanup Procedure
```bash
# List available images
docker images ghcr.io/<org>/medcalc-ehr --format "{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Remove images older than 5 versions
docker images ghcr.io/<org>/medcalc-ehr -q | tail -n +6 | xargs docker rmi
```

## Recovery Scenarios

### Scenario 1: Container Crash
1. Docker restart policy (`unless-stopped`) handles automatic restart
2. Verify: `docker ps` to check container status
3. Check logs: `docker logs medcalcehr-app`
4. If persistent: `docker compose down && docker compose up -d`
5. **Expected recovery time: < 1 minute (automatic)**

### Scenario 2: Bad Deployment
1. Stop current container: `docker stop medcalcehr-app`
2. Start previous version:
   ```bash
   docker run -d --name medcalcehr-app -p 8080:80 \
     --env-file .env.production \
     ghcr.io/<org>/medcalc-ehr:<previous-commit-sha>
   ```
3. Verify health: `curl http://localhost:8080/api/health`
4. Verify calculator: `curl "http://localhost:8080/calculator.html?name=bmi-bsa"`
5. **Expected recovery time: < 5 minutes**

### Scenario 3: Host Failure
1. Provision new host (or use standby)
2. Pull latest working Docker image: `docker pull ghcr.io/<org>/medcalc-ehr:<known-good-sha>`
3. Copy environment file (`.env.production`)
4. Start container: `docker run -d --name medcalcehr-app -p 8080:80 --env-file .env.production ghcr.io/<org>/medcalc-ehr:<sha>`
5. Update DNS/load balancer to point to new host
6. Verify health endpoint
7. **Expected recovery time: < 15 minutes**

### Scenario 4: FHIR Server Outage
- App degrades gracefully: calculators work with manual input
- Patient info shows "No patient data available"
- FHIR auto-population fails silently, user enters data manually
- No action needed on MEDCALCEHR side
- **Impact: Reduced convenience, no loss of functionality**

### Scenario 5: Container Registry (GHCR) Unavailable
- Local Docker images on the host are still available
- Use local image for deployment: `docker run medcalcehr:latest`
- If no local image: rebuild from source `docker build -t medcalcehr:latest .`
- **Expected recovery time: < 10 minutes (local), < 20 minutes (rebuild)**

## DNS Failover Procedure

If using multiple deployment zones:

1. **Primary zone failure detected** (health check fails 3 consecutive times)
2. Update DNS A/CNAME record to secondary zone IP
3. Verify secondary zone serves traffic correctly
4. Investigate primary zone failure
5. When primary is restored, update DNS back (or keep secondary if stable)

**DNS TTL recommendation:** 60 seconds for quick failover

## DR Drill Schedule

| Quarter | Drill Type | Description |
|---------|-----------|-------------|
| Q1 | Container rollback | Simulate bad deployment, practice rollback |
| Q2 | Host failure | Simulate host failure, deploy to new host |
| Q3 | Full DR | Simulate complete environment loss, rebuild from scratch |
| Q4 | Review & update | Review DR plan, update procedures, test GHCR access |

### DR Drill Checklist
- [ ] Can pull Docker image from GHCR?
- [ ] Can start container with correct configuration?
- [ ] Health check endpoint responds?
- [ ] Calculator loads and computes correctly?
- [ ] FHIR integration works (or graceful degradation)?
- [ ] DNS/load balancer switch works?
- [ ] Recovery completed within RTO (15 minutes)?

## Monitoring

- **Health endpoint:** `GET /api/health` returns JSON with version and status
- **Sentry:** Real-time error alerts (see `docs/monitoring-alerts.md`)
- **Docker healthcheck:** Automatic container health monitoring (30s interval)
- **Web Vitals:** Performance metrics logged to Sentry
- **Uptime monitor:** External health check every 5 minutes

## Contact & Escalation

Escalation path for production issues:
1. Check Sentry dashboard for error details
2. Review Docker logs (`docker logs medcalcehr-app`)
3. Check FHIR server connectivity
4. Contact hospital IT if infrastructure issue
5. Contact EHR vendor if FHIR API issues
