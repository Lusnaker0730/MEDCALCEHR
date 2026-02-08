#!/bin/sh
# docker-entrypoint.sh
# Generates js/app-config.js from environment variables at container start time.

CONFIG_FILE="/usr/share/nginx/html/js/app-config.js"

# Use environment variables with sensible defaults
FHIR_CLIENT_ID="${FHIR_CLIENT_ID:-e1b41914-e2b5-4475-90ba-29022b57f820}"
FHIR_SCOPE="${FHIR_SCOPE:-openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access}"
FHIR_REDIRECT_URI="${FHIR_REDIRECT_URI:-./index.html}"
SESSION_TIMEOUT_MINUTES="${SESSION_TIMEOUT_MINUTES:-15}"
SESSION_WARNING_MINUTES="${SESSION_WARNING_MINUTES:-2}"
SENTRY_DSN="${SENTRY_DSN:-}"
SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"

# Generate health.json with build info
HEALTH_FILE="/usr/share/nginx/html/health.json"
BUILD_VERSION="${BUILD_VERSION:-unknown}"
BUILD_TIME="${BUILD_TIME:-unknown}"
cat > "$HEALTH_FILE" <<EOF
{
    "status": "ok",
    "version": "${BUILD_VERSION}",
    "buildTime": "${BUILD_TIME}",
    "environment": "${SENTRY_ENVIRONMENT}"
}
EOF

# Build sentry config block
SENTRY_CONFIG=""
if [ -n "$SENTRY_DSN" ]; then
    SENTRY_CONFIG="
    sentry: {
        dsn: '${SENTRY_DSN}',
        environment: '${SENTRY_ENVIRONMENT}',
        sampleRate: 1.0
    },"
fi

cat > "$CONFIG_FILE" <<EOF
window.MEDCALC_CONFIG = {
    fhir: {
        clientId: '${FHIR_CLIENT_ID}',
        scope: '${FHIR_SCOPE}',
        redirectUri: '${FHIR_REDIRECT_URI}'
    },
    session: {
        timeoutMinutes: ${SESSION_TIMEOUT_MINUTES},
        warningMinutes: ${SESSION_WARNING_MINUTES}
    },${SENTRY_CONFIG}
};
EOF

echo "[entrypoint] Generated app-config.js (clientId=${FHIR_CLIENT_ID}, sentry=${SENTRY_DSN:+enabled})"

# Start nginx
exec nginx -g 'daemon off;'
