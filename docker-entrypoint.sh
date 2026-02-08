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
    }
};
EOF

echo "[entrypoint] Generated app-config.js (clientId=${FHIR_CLIENT_ID})"

# Start nginx
exec nginx -g 'daemon off;'
