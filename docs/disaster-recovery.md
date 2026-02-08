# Disaster Recovery Plan

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

Images are tagged with git commit SHA:
```
medcalcehr:abc1234   # specific commit
medcalcehr:latest    # most recent build
```

Keep at least 3 previous image versions available for rollback.

## Recovery Steps

### Scenario 1: Container Crash
1. Docker restart policy (`unless-stopped`) handles automatic restart
2. Verify: `docker ps` to check container status
3. Check logs: `docker logs medcalcehr-app`
4. If persistent: `docker compose down && docker compose up -d`

### Scenario 2: Bad Deployment
1. Stop current container: `docker stop medcalcehr-app`
2. Start previous version:
   ```bash
   docker run -d --name medcalcehr-app -p 8080:80 \
     --env-file .env.production \
     medcalcehr:<previous-commit-sha>
   ```
3. Verify health: `curl http://localhost:8080/api/health`

### Scenario 3: Host Failure
1. Provision new host
2. Pull latest working Docker image
3. Copy environment file
4. Start container
5. Update DNS/load balancer

### Scenario 4: FHIR Server Outage
- App degrades gracefully: calculators work with manual input
- Patient info shows "No patient data available"
- No action needed on MEDCALCEHR side

## Monitoring

- **Health endpoint:** `GET /api/health` returns JSON with version and status
- **Sentry:** Real-time error alerts (if configured)
- **Docker healthcheck:** Automatic container health monitoring
- **Web Vitals:** Performance metrics logged to Sentry

## Contact

Escalation path for production issues:
1. Check Sentry dashboard for error details
2. Review Docker logs
3. Check FHIR server connectivity
4. Contact EHR vendor if FHIR API issues
