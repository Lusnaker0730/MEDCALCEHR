# MEDCALCEHR Security Review Report

**Date:** 2026-03-03
**Reviewer:** Automated Security Review (Claude Opus 4.6)
**Scope:** `src/` directory — all modules
**Context:** SMART on FHIR medical calculator application (SaMD / HIPAA / TFDA)

---

## Executive Summary

| Severity     | Count |
| ------------ | ----- |
| **Critical** | 3     |
| **High**     | 18    |
| **Medium**   | 24    |
| **Low**      | 20    |
| **Total**    | **65** |

The most urgent issues are: **client-side PHI encryption with hardcoded keys**, **pervasive innerHTML XSS vulnerabilities**, and **missing server-side authentication in FHIR service calls**.

---

## CRITICAL (3)

### C-01: Hardcoded Encryption Key — PHI Encryption Ineffective

- **File:** `security.ts:497-510`
- **OWASP:** A02 - Cryptographic Failures
- **Issue:** AES-GCM encryption uses hardcoded passphrase `'MedCalcEHR_PHI_Protection_v2' + hostname` and static salt `'MedCalcEHR-salt-v2'`. Visible in client-side JS bundle — anyone can decrypt localStorage PHI.
- **Fix:** Use `crypto.subtle.generateKey()` for per-session random non-extractable key. Add `clearEncryptionKeyCache()` for logout.

### C-02: Patient PHI Cached Unencrypted in Cache API

- **File:** `cache-manager.ts:280-340`
- **OWASP:** A02 - Cryptographic Failures
- **Issue:** `cachePatient()` / `cacheObservations()` stores full patient data as plaintext JSON in Browser Cache API. Persistent, accessible to any same-origin script.
- **Fix:** Use `secureLocalStore` with AES-GCM encryption; hash patient IDs in cache keys.

### C-03: OAuth Flow Lacks State Parameter Validation

- **File:** `fhir-launch.ts:33-44`
- **OWASP:** A07 - Identification & Authentication Failures
- **Issue:** No explicit OAuth `state` parameter generation or validation. Relies entirely on fhirclient library internals.
- **Fix:** Explicitly generate and validate state nonce; document delegation to fhirclient.

---

## HIGH (18)

| #    | File                                | Issue                                                                                             |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| H-01 | `ui-builder.ts:188-991`            | All template methods (createInput, createSection, createResultItem, etc.) never call escapeHtml()  |
| H-02 | `ui-builder.ts:634`                | `createAlert` defaults `escapeMessage=false` (unsafe by default)                                  |
| H-03 | `review-gate.ts:31` + `main.ts`    | `window.MEDCALC_CONFIG.enableAllCalculators` bypasses clinical review gate in production           |
| H-04 | `fhir-write-service.ts:63-92`      | FHIR write missing input validation — patientId not matched to SMART context                      |
| H-05 | `fhir-write-service.ts:63-70`      | FHIR write has no authorization check — only feature flag, no scope/patient validation             |
| H-06 | `fhir-feedback.ts:98-101,289+`     | DOM XSS — FHIR tooltip, value, error.message inserted into innerHTML unescaped                    |
| H-07 | `data-staleness.ts:200-227`        | DOM XSS — item.label (from FHIR LOINC display) inserted into innerHTML unescaped                  |
| H-08 | `security-labels-service.ts:1074`  | Break-the-glass defaults to `true` (allow) when no callback registered                            |
| H-09 | `security-labels-service.ts:584`   | Without user context: Restricted data only MASKed not DENYed; Moderate ALLOWed                    |
| H-10 | `session-manager.ts:37-41`         | Session timeout configurable from client `MEDCALC_CONFIG`, can be set to 0 (disabled)             |
| H-11 | `fhir-launch.ts:14,27,34`          | Hardcoded OAuth client ID fallback `e1b41914-...`                                                 |
| H-12 | `fhir-launch.ts:36`                | `redirect_uri` from client config — no same-origin or whitelist validation                        |
| H-13 | `audit-event-service.ts:960-979`   | Audit events POSTed to FHIR server without Bearer token                                           |
| H-14 | `provenance-service.ts:1121-1140`  | Provenance records POSTed without authentication                                                  |
| H-15 | `provenance-service.ts:1145-1160`  | Provenance stored as plaintext `localStorage.setItem` — not using `secureLocalStore`              |
| H-16 | `calculation-history.ts:56-97`     | Calculation history (clinical results in `resultSummary`) stored unencrypted in localStorage       |
| H-17 | `logger.ts:24-56` / `sentry.ts`    | PHI stripping misses: names, phones, emails, addresses; Arrays not recursed; sent to Sentry cloud |
| H-18 | `logger.ts:100`                    | Every log includes full `window.location.href` (may contain OAuth codes/tokens)                   |

---

## MEDIUM (24)

| #    | File                                | Issue                                                                           |
| ---- | ----------------------------------- | ------------------------------------------------------------------------------- |
| M-01 | `security.ts:416-480`               | Deprecated XOR obfuscation still publicly exported                              |
| M-02 | `security.ts:160-164`               | `data:image/svg+xml` URIs allowed (can contain embedded JS)                     |
| M-03 | `security.ts:122-123`               | Sanitizer uses innerHTML for parsing → mXSS risk                               |
| M-04 | `security.ts:149-157`               | Style `url()` check has logic gap (CSS comments bypass)                         |
| M-05 | `session-manager.ts:91-96`          | Logout only removes `patientDisplayData`, other PHI remains in localStorage     |
| M-06 | `fhir-launch.ts:35`                 | Default scope contains `offline_access` — SPA should not hold refresh tokens    |
| M-07 | `fhir-launch.ts:40-42`             | `Object.assign(authorizeOptions, extraParams)` can override client_id/redirect  |
| M-08 | `security-labels-service.ts:524`    | VIP detection overly broad (any `valueBoolean === true` triggers)               |
| M-09 | `security-labels-service.ts:621`    | Client-side authorization bypassable via `setUserContext()`                     |
| M-10 | `fhir-data-service.ts:480,533`      | FHIR query `code` parameter not `encodeURIComponent`'d → query injection        |
| M-11 | `fhir-data-service.ts:1133-1171`    | `getPatientIdentifiers()` returns National ID/passport without access control   |
| M-12 | `fhir-write-service.ts:63-140`      | FHIR write operations not audited (no auditEventService call)                   |
| M-13 | `fhir-write-service.ts:164,179`     | Unsanitized strings interpolated into FHIR Observation resources                |
| M-14 | `audit-event-service.ts:1088-1108`  | PHI sanitization incomplete (missing name, birthDate, address, phone, mrn)      |
| M-15 | `audit-event-service.ts:1075-1079`  | `clearLocalEvents()` has no access control — XSS can wipe audit trail           |
| M-16 | `provenance-service.ts:821-876`     | Provenance forgery — practitionerId not validated against SMART context          |
| M-17 | `calculator-page.ts:113-121`        | Review-blocked block innerHTML with unescaped `calculatorInfo.title`            |
| M-18 | `errorHandler.ts:98-117`            | Stack trace via innerHTML unescaped; localhost check instead of build flag       |
| M-19 | `i18n/index.ts:35-45`              | `resolve()` traverses `__proto__`/`constructor` — prototype pollution            |
| M-20 | `i18n/index.ts:70-73`              | Interpolation params not HTML-escaped                                           |
| M-21 | `unit-converter.ts:62-69,240-248`   | Non-inverse conversion factors + cumulative round-trip precision drift           |
| M-22 | `lazyLoader.ts:68-81`              | Dynamic import with unsanitized calculatorId                                    |
| M-23 | `calculators/index.ts:242`          | `loadCalculator` dynamic import without whitelist or format validation           |
| M-24 | `calculators/ascvd/index.ts:29-30`  | Module-level mutable state → cross-patient data contamination risk              |

---

## LOW (20)

| #    | File                                | Issue                                                                  |
| ---- | ----------------------------------- | ---------------------------------------------------------------------- |
| L-01 | `security.ts:487`                   | Cached CryptoKey never cleared on logout                               |
| L-02 | `security.ts:241-247`               | `isValidURL` allows `..` path traversal via dot-URLs                   |
| L-03 | `session-manager.ts:39-40`          | No timeout config bounds validation (warningMinutes > timeoutMinutes)  |
| L-04 | `session-manager.ts:98`             | Relative redirect after logout                                         |
| L-05 | `session-manager.ts (missing)`      | No cross-tab session sync                                              |
| L-06 | `fhir-write-service.ts:128-139`     | Raw error details in response (potential info leakage)                 |
| L-07 | `fhir-feedback.ts:456,591`          | CSS selector injection via fieldId                                     |
| L-08 | `audit-event-service.ts:430-432`    | Weak session ID (Math.random)                                          |
| L-09 | `audit-event-service.ts:1144-1150`  | Weak UUID generation (Math.random)                                     |
| L-10 | `audit-event-service.ts:684,918`    | Full URL + userAgent in audit logs                                     |
| L-11 | `provenance-service.ts:1254-1256`   | Weak ID/UUID generation (Math.random)                                  |
| L-12 | `security-labels-service.ts:289`    | Unbounded in-memory access log array                                   |
| L-13 | `security-labels-service.ts:569`    | Audit log records before authorization decision                        |
| L-14 | `ui-builder.ts:703`                 | CSS selector injection in `setRadioValue`                              |
| L-15 | `ui-builder.ts:232`                 | JSON injection via `data-unit-toggle` attribute                        |
| L-16 | `errorHandler.ts:53-74`             | `logError` returns full error object (sensitive data exposure risk)    |
| L-17 | `favorites.ts:353-364`              | `importData` accepts unvalidated external data                         |
| L-18 | `lazyLoader.ts:163-167`             | `data-onload` callback name in CustomEvent                            |
| L-19 | `theme-toggle.ts:46-49`             | Unvalidated localStorage theme value (not exploitable)                 |
| L-20 | `unit-converter.ts:192-196`         | No overflow/underflow guards on conversion results                     |

---

## Methodology

- **Tools:** Manual code review with automated static analysis
- **Standards:** OWASP Top 10 (2021), HIPAA Security Rule, IEC 62304, TFDA
- **Files reviewed:** 40+ TypeScript source files across all src/ modules
- **Categories:** XSS, Injection, Cryptographic Failures, Broken Access Control, Security Misconfiguration, Authentication Failures, Data Integrity, Logging Failures
