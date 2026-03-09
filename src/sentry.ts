// src/sentry.ts — Sentry error tracking with PHI stripping

import * as Sentry from '@sentry/browser';

// Window.MEDCALC_CONFIG type declared in src/types/global.d.ts

// PHI fields to strip from Sentry events
const PHI_KEYS = [
    'name', 'patientname', 'fullname', 'firstname', 'lastname', 'familyname', 'givenname',
    'dob', 'dateofbirth', 'birthdate', 'birthday',
    'address', 'streetaddress', 'city', 'zipcode', 'postalcode',
    'phone', 'phonenumber', 'telephone', 'mobile', 'fax',
    'email', 'emailaddress',
    'ssn', 'socialsecuritynumber', 'nationalid', 'passport',
    'mrn', 'medicalrecordnumber', 'patientid',
    'password', 'pin', 'creditcard', 'bankaccount',
    'identifier', 'id_number',
];

// PT-08: PHI patterns aligned with logger.ts (was missing phone, email, Taiwan National ID)
const PHI_PATTERNS: RegExp[] = [
    /\b\d{3}-\d{2}-\d{4}\b/g,                  // SSN
    /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g,            // DOB YYYY-MM-DD
    /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g,            // DOB MM/DD/YYYY
    /\b0\d{1,2}[-\s]?\d{6,8}\b/g,              // Phone (TW landline/mobile)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,  // Email
    /\b[A-Z][12]\d{8}\b/g,                     // Taiwan National ID
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
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => {
                if (typeof item === 'string') return stripPHIFromString(item);
                if (typeof item === 'object' && item !== null) return stripPHIFromObject(item as Record<string, unknown>);
                return item;
            });
        } else if (typeof value === 'object' && value !== null) {
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
            // Sanitize exception messages
            if (event.exception?.values) {
                event.exception.values.forEach(ex => {
                    if (ex.value) ex.value = stripPHIFromString(ex.value);
                });
            }
            // Sanitize request URL
            if (event.request?.url) {
                try {
                    const url = new URL(event.request.url);
                    event.request.url = url.origin + url.pathname;
                } catch { /* keep as-is if not a valid URL */ }
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
