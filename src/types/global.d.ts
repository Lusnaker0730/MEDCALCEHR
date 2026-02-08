/**
 * Global type declarations for MEDCALCEHR.
 * Defines the canonical shape of window.MEDCALC_CONFIG used across modules.
 */

export {};

declare global {
    interface Window {
        MEDCALC_CONFIG?: {
            fhir?: {
                clientId?: string;
                scope?: string;
                redirectUri?: string;
                [key: string]: string | undefined;
            };
            session?: {
                timeoutMinutes?: number;
                warningMinutes?: number;
                [key: string]: number | undefined;
            };
            sentry?: {
                dsn?: string;
                environment?: string;
                sampleRate?: number;
                tracesSampleRate?: number;
                [key: string]: string | number | undefined;
            };
        };
        CACHE_VERSION: string;
    }
}
