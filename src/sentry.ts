// src/sentry.ts — Sentry error tracking with PHI stripping

import * as Sentry from '@sentry/browser';

// Window.MEDCALC_CONFIG type declared in src/types/global.d.ts

// PHI fields to strip from Sentry events
const PHI_KEYS = [
    'ssn', 'socialsecuritynumber', 'password', 'pin',
    'creditcard', 'bankaccount', 'identifier',
    'patientname', 'dob', 'dateofbirth', 'birthdate',
    'address', 'phone', 'email', 'mrn',
];

const PHI_PATTERNS: RegExp[] = [
    /\b\d{3}-\d{2}-\d{4}\b/g,                  // SSN
    /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g,            // DOB YYYY-MM-DD
    /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g,            // DOB MM/DD/YYYY
];

function stripPHIFromString(value: string): string {
    let sanitized = value;
    for (const pattern of PHI_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}

function stripPHIFromObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (PHI_KEYS.some(phi => lowerKey.includes(phi))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'string') {
            sanitized[key] = stripPHIFromString(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = stripPHIFromObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

let initialized = false;

export function initSentry(): void {
    if (initialized) return;

    const config = window.MEDCALC_CONFIG?.sentry;
    if (!config?.dsn) return;

    Sentry.init({
        dsn: config.dsn,
        environment: config.environment || 'production',
        sampleRate: config.sampleRate ?? 1.0,

        denyUrls: [
            /extensions\//i,
            /^chrome:\/\//i,
            /^moz-extension:\/\//i,
        ],

        beforeSend(event) {
            // Strip PHI from event data
            if (event.extra) {
                event.extra = stripPHIFromObject(event.extra as Record<string, unknown>);
            }
            if (event.message) {
                event.message = stripPHIFromString(event.message);
            }
            // Strip breadcrumb data
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map(bc => {
                    if (bc.message) {
                        bc.message = stripPHIFromString(bc.message);
                    }
                    if (bc.data && typeof bc.data === 'object') {
                        bc.data = stripPHIFromObject(bc.data as Record<string, unknown>);
                    }
                    return bc;
                });
            }
            return event;
        },

        beforeBreadcrumb(breadcrumb) {
            if (breadcrumb.message) {
                breadcrumb.message = stripPHIFromString(breadcrumb.message);
            }
            return breadcrumb;
        },
    });

    // Expose Sentry for logger breadcrumb integration
    (globalThis as any).__SENTRY_INSTANCE__ = Sentry;
    initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!initialized) return;
    const safeContext = context ? stripPHIFromObject(context) : undefined;
    Sentry.captureException(error, safeContext ? { extra: safeContext } : undefined);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!initialized) return;
    Sentry.captureMessage(stripPHIFromString(message), level);
}

export { Sentry };
