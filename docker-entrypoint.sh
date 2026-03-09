#!/bin/sh
# docker-entrypoint.sh
# Generates js/app-config.js from environment variables at container start time.
# Validates and sanitizes all inputs before embedding in generated files.

set -e

CONFIG_FILE="/usr/share/nginx/html/js/app-config.js"

# --- Sanitization Functions ---

# Escape characters unsafe for JS single-quoted strings
sanitize_js_string() {
    printf '%s' "$1" | sed "s/\\\\/\\\\\\\\/g; s/'/\\\\'/g; s/\r//g" | tr -d '\n'
}

# Escape characters unsafe for JSON double-quoted strings
sanitize_json_string() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\r//g' | tr -d '\n'
}

# --- Validation Functions ---

validate_uuid() {
    if ! printf '%s' "$1" | grep -qE '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'; then
        echo "[entrypoint] ERROR: Invalid UUID format: $1" >&2
        return 1
    fi
}

validate_positive_int() {
    if ! printf '%s' "$1" | grep -qE '^[1-9][0-9]*$'; then
        echo "[entrypoint] ERROR: Invalid positive integer: $1" >&2
        return 1
    fi
}

validate_sentry_dsn() {
    # Empty DSN is valid (disabled)
    [ -z "$1" ] && return 0
    if ! printf '%s' "$1" | grep -qE '^https://[a-zA-Z0-9]+@[a-zA-Z0-9.]+/[0-9]+$'; then
        echo "[entrypoint] ERROR: Invalid Sentry DSN format: $1" >&2
        return 1
    fi
}

validate_url_or_relative() {
    # Allow relative paths (./something) or https URLs
    if ! printf '%s' "$1" | grep -qE '^(\./|https://)'; then
        echo "[entrypoint] ERROR: Invalid URL/path (must start with ./ or https://): $1" >&2
        return 1
    fi
}

validate_ehr_vendor() {
    case "$1" in
        generic|epic|cerner|allscripts|meditech) return 0 ;;
        *)
            echo "[entrypoint] ERROR: Invalid EHR vendor: $1 (allowed: generic, epic, cerner, allscripts, meditech)" >&2
            return 1
            ;;
    esac
}

validate_fhir_base_url() {
    # Empty is valid (not configured)
    [ -z "$1" ] && return 0
    if ! printf '%s' "$1" | grep -qE '^https://[a-zA-Z0-9._/-]+$'; then
        echo "[entrypoint] ERROR: Invalid FHIR base URL: $1" >&2
        return 1
    fi
}

validate_log_level() {
    case "$1" in
        DEBUG|INFO|WARN|ERROR) return 0 ;;
        *)
            echo "[entrypoint] ERROR: Invalid log level: $1 (allowed: DEBUG, INFO, WARN, ERROR)" >&2
            return 1
            ;;
    esac
}

validate_log_endpoint() {
    # Empty is valid (disabled)
    [ -z "$1" ] && return 0
    # Allow relative paths (/api/...) or https URLs
    if ! printf '%s' "$1" | grep -qE '^(/[a-zA-Z0-9._/-]+|https://[a-zA-Z0-9._/-]+)$'; then
        echo "[entrypoint] ERROR: Invalid log endpoint: $1 (must start with / or https://)" >&2
        return 1
    fi
}

validate_scope() {
    # FHIR scopes: alphanumeric, slashes, dots, spaces, underscores
    if ! printf '%s' "$1" | grep -qE '^[a-zA-Z0-9/ ._*-]+$'; then
        echo "[entrypoint] ERROR: Invalid FHIR scope string: $1" >&2
        return 1
    fi
}

validate_environment() {
    case "$1" in
        production|staging|development|test) return 0 ;;
        *)
            echo "[entrypoint] ERROR: Invalid environment: $1 (allowed: production, staging, development, test)" >&2
            return 1
            ;;
    esac
}

# --- Read Environment Variables ---

FHIR_CLIENT_ID="${FHIR_CLIENT_ID:-e1b41914-e2b5-4475-90ba-29022b57f820}"
FHIR_SCOPE="${FHIR_SCOPE:-openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs online_access}"
FHIR_REDIRECT_URI="${FHIR_REDIRECT_URI:-./index.html}"
SESSION_TIMEOUT_MINUTES="${SESSION_TIMEOUT_MINUTES:-15}"
SESSION_WARNING_MINUTES="${SESSION_WARNING_MINUTES:-2}"
SENTRY_DSN="${SENTRY_DSN:-}"
SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"
EHR_VENDOR="${EHR_VENDOR:-generic}"
EHR_FHIR_BASE_URL="${EHR_FHIR_BASE_URL:-}"
LOG_REMOTE_ENDPOINT="${LOG_REMOTE_ENDPOINT:-}"
LOG_REMOTE_MIN_LEVEL="${LOG_REMOTE_MIN_LEVEL:-ERROR}"

# --- Validate All Inputs ---

echo "[entrypoint] Validating environment variables..."

validate_uuid "$FHIR_CLIENT_ID" || exit 1
validate_scope "$FHIR_SCOPE" || exit 1
validate_url_or_relative "$FHIR_REDIRECT_URI" || exit 1
validate_positive_int "$SESSION_TIMEOUT_MINUTES" || exit 1
validate_positive_int "$SESSION_WARNING_MINUTES" || exit 1
validate_sentry_dsn "$SENTRY_DSN" || exit 1
validate_environment "$SENTRY_ENVIRONMENT" || exit 1
validate_ehr_vendor "$EHR_VENDOR" || exit 1
validate_fhir_base_url "$EHR_FHIR_BASE_URL" || exit 1
validate_log_endpoint "$LOG_REMOTE_ENDPOINT" || exit 1
validate_log_level "$LOG_REMOTE_MIN_LEVEL" || exit 1

echo "[entrypoint] All environment variables validated."

# --- Sanitize String Values ---

SAFE_CLIENT_ID=$(sanitize_js_string "$FHIR_CLIENT_ID")
SAFE_SCOPE=$(sanitize_js_string "$FHIR_SCOPE")
SAFE_REDIRECT_URI=$(sanitize_js_string "$FHIR_REDIRECT_URI")
SAFE_SENTRY_DSN=$(sanitize_js_string "$SENTRY_DSN")
SAFE_SENTRY_ENV=$(sanitize_js_string "$SENTRY_ENVIRONMENT")
SAFE_EHR_VENDOR=$(sanitize_js_string "$EHR_VENDOR")
SAFE_EHR_FHIR_BASE_URL=$(sanitize_js_string "$EHR_FHIR_BASE_URL")
SAFE_LOG_ENDPOINT=$(sanitize_js_string "$LOG_REMOTE_ENDPOINT")
SAFE_LOG_LEVEL=$(sanitize_js_string "$LOG_REMOTE_MIN_LEVEL")

# JSON-safe values for health.json
JSON_SAFE_VERSION=$(sanitize_json_string "${BUILD_VERSION:-unknown}")
JSON_SAFE_BUILD_TIME=$(sanitize_json_string "${BUILD_TIME:-unknown}")
JSON_SAFE_ENVIRONMENT=$(sanitize_json_string "$SENTRY_ENVIRONMENT")

# --- Generate health.json ---

HEALTH_FILE="/usr/share/nginx/html/health.json"
cat > "$HEALTH_FILE" <<EOF
{
    "status": "ok",
    "version": "${JSON_SAFE_VERSION}",
    "buildTime": "${JSON_SAFE_BUILD_TIME}",
    "environment": "${JSON_SAFE_ENVIRONMENT}"
}
EOF

# --- Build Optional Config Blocks ---

SENTRY_CONFIG=""
if [ -n "$SENTRY_DSN" ]; then
    SENTRY_CONFIG="
    sentry: {
        dsn: '${SAFE_SENTRY_DSN}',
        environment: '${SAFE_SENTRY_ENV}',
        sampleRate: 1.0
    },"
fi

EHR_CONFIG=""
if [ "$EHR_VENDOR" != "generic" ] || [ -n "$EHR_FHIR_BASE_URL" ]; then
    EHR_CONFIG="
    ehr: {
        vendor: '${SAFE_EHR_VENDOR}',
        fhirBaseUrl: '${SAFE_EHR_FHIR_BASE_URL}'
    },"
fi

LOGGING_CONFIG=""
if [ -n "$LOG_REMOTE_ENDPOINT" ]; then
    LOGGING_CONFIG="
    logging: {
        remoteEndpoint: '${SAFE_LOG_ENDPOINT}',
        remoteMinLevel: '${SAFE_LOG_LEVEL}'
    },"
fi

# --- Generate app-config.js ---

cat > "$CONFIG_FILE" <<EOF
window.MEDCALC_CONFIG = {
    fhir: {
        clientId: '${SAFE_CLIENT_ID}',
        scope: '${SAFE_SCOPE}',
        redirectUri: '${SAFE_REDIRECT_URI}'
    },
    session: {
        timeoutMinutes: ${SESSION_TIMEOUT_MINUTES},
        warningMinutes: ${SESSION_WARNING_MINUTES}
    },${SENTRY_CONFIG}${EHR_CONFIG}${LOGGING_CONFIG}
};
EOF

echo "[entrypoint] Generated app-config.js (clientId=${FHIR_CLIENT_ID}, sentry=${SENTRY_DSN:+enabled}, logging=${LOG_REMOTE_ENDPOINT:+enabled})"

# Start nginx (already running as nginx user via Dockerfile USER directive)
exec nginx -g 'daemon off;'
