# Changelog

All notable changes to MEDCALCEHR will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Changed
- **Unapproved calculators hidden**: Calculators pending clinical review are now completely hidden from the list instead of showing as disabled with "審核中" badge; approval filter applied before all filter paths (fixes recent-tab bypass bug); category chip counts and stats reflect only approved calculators (`main.ts`)

### Added
- `CLAUDE.md` files for AI-assisted development context at root, `src/`, `src/calculators/`, and `src/calculators/shared/`
- Penetration test report: `docs/compliance/PENETRATION_TEST_2026-03-09.md` (17 findings, 13 fixed)

### Fixed
- **Token expiry immediate logout**: `handleAuthFailure()` no longer immediately redirects to `launch.html` on 401/403; shows a 60-second grace period overlay so users can finish reading current content before re-authentication (`token-lifecycle-manager.ts`)
- **Alert HTML rendering**: `createAlert` now uses `sanitizeHTML()` instead of `escapeHTML()` to preserve safe formatting tags (`<strong>`, `<ul>`, `<li>`) while still stripping dangerous elements (`ui-builder.ts`)
- **Reference citation formatting**: `createReference` citations now use `sanitizeHTML()` to preserve `<em>` journal name italics instead of escaping them to literal text (`ui-builder.ts`)
- **CSP `frame-ancestors` warning**: Removed `frame-ancestors` from `<meta>` CSP tags where it is ignored by browsers; directive is already delivered via nginx HTTP headers (`launch.html`, `health-check.html`, `test-calculators.html`)
- **Standalone FHIR launch**: Added `fhirServiceUrl` fallback for dev mode when no `iss` parameter is present in the URL (`fhir-launch.ts`, `public/js/app-config.js`)
- **UIBuilder CSS selector injection**: `querySelector` calls now use `CSS.escape()` for dynamic IDs and names (`ui-builder.ts`)
- **UIBuilder escapeHtml consolidation**: Delegates to shared `escapeHTML()` from `security.ts` for consistent null-byte and extended character escaping (`ui-builder.ts`)
- **Unit converter toggle bug**: Reset stored value when input is empty; update `dataset.currentUnit` regardless of value presence; added platelet, WBC, D-dimer, fibrinogen decimal places (`unit-converter.ts`)
- **Validator whitespace handling**: Whitespace-only string inputs now treated as empty for required field validation; removed inline `color` style in favor of CSS class (`validator.ts`)

### Security
- **PT-01: FHIR write patient validation bypass**: Write service now requires patient context; rejects writes when `client.patient.id` is undefined instead of silently skipping validation (`fhir-write-service.ts`)
- **PT-02: FHIR responses no longer cached by service worker**: Removed FHIR response caching from service worker to prevent PHI/token storage in Cache API; application-level `FHIRCacheManager` provides encrypted caching (`service-worker.js`)
- **PT-03: Default scope `offline_access` → `online_access`**: Aligned deployment configs with source code fix (`docker-compose.yml`, `docker-entrypoint.sh`, `public/js/app-config.js`)
- **PT-04: Security headers on all responses**: Re-added CSP, HSTS, X-Content-Type-Options, X-Frame-Options to static asset and JS/CSS location blocks that were missing them due to nginx `add_header` inheritance (`nginx.conf`)
- **PT-05: Deep freeze `MEDCALC_CONFIG`**: Replaced shallow `Object.freeze` with recursive deep freeze on both `main.ts` and `calculator-page.ts` to prevent nested config tampering
- **PT-06: Audit event cleanup on logout**: Added `medcalc_audit` prefix to logout cleanup to clear audit events containing PHI (`session-manager.ts`)
- **PT-08: Sentry PHI patterns aligned with logger**: Added phone, email, and Taiwan National ID patterns to Sentry's `PHI_PATTERNS` (`sentry.ts`)
- **PT-09: `result.breakdown` sanitized**: Applied `sanitizeHTML()` to breakdown HTML in unified-formula-calculator to prevent XSS (`unified-formula-calculator.ts`)
- **PT-10: `X-Frame-Options` aligned with CSP**: Changed from `SAMEORIGIN` to `DENY` to match `frame-ancestors 'none'` (`nginx.conf`)
- **PT-11: Redirect URI strict allowlist**: Removed `startsWith(origin)` fallback in redirect URI validation, using strict allowlist only (`fhir-launch.ts`)
- **PT-13: Notification click URL validation**: Added same-origin check for push notification click URLs to prevent open redirect (`service-worker.js`)
- **PHI cache leak on logout**: FHIR API responses cached by the service worker (containing patient demographics, observations, and clinical data) now cleared on logout via targeted `CLEAR_FHIR_CACHE` message (`service-worker.js`, `sw-register.ts`, `session-manager.ts`)

## [1.8.0] - 2026-03-03

### Security
- **C-01: Per-session encryption key**: Replaced hardcoded PBKDF2 passphrase with `crypto.subtle.generateKey()` random non-extractable AES-256-GCM key per page session (`security.ts`)
- **C-02: Encrypted PHI cache**: Patient/observation data now stored via `secureLocalStore` (AES-GCM) instead of plaintext Cache API (`cache-manager.ts`)
- **H-01/H-02: XSS escape-by-default**: All 16+ `UIBuilder` template methods now call `escapeHtml()` on string inputs; `createAlert` defaults to `escapeMessage: true` (`ui-builder.ts`)
- **H-03: Review gate dev-only bypass**: `enableAllCalculators` bypass restricted to `__DEV__` builds only; `window.MEDCALC_CONFIG` frozen via `Object.freeze()` after init (`review-gate.ts`, `main.ts`)
- **H-04/H-05: FHIR write validation**: Patient ID matched against SMART context; string fields sanitized (length limits, alphanumeric `calculatorId`); generic error responses (`fhir-write-service.ts`)
- **H-06/H-07: FHIR feedback & staleness XSS**: All FHIR-sourced values escaped before innerHTML insertion (`fhir-feedback.ts`, `data-staleness.ts`)
- **H-08/H-09: Security labels hardened defaults**: Break-the-glass defaults to deny; Restricted without user context now DENY (was MASK); Moderate now MASK (was ALLOW) (`security-labels-service.ts`)
- **H-10: Session timeout bounds**: Clamped to 1–120 minutes (`session-manager.ts`)
- **H-11/H-12: OAuth hardening**: Removed hardcoded client ID fallback; redirect URI whitelist + same-origin validation; `offline_access` → `online_access`; `extraParams` sanitized (`fhir-launch.ts`)
- **H-15/H-16: PHI storage encryption**: Provenance and calculation history now use `secureLocalStore`/`secureLocalRetrieve` (`provenance-service.ts`, `calculation-history.ts`)
- **H-17/H-18: PHI stripping expanded**: +3 PHI patterns (Taiwan National ID, phone, email), +16 healthcare keys, array recursion, URL logging stripped to origin+pathname (`logger.ts`, `sentry.ts`)
- **M-01**: Removed public export of deprecated XOR obfuscation (`security.ts`)
- **M-02**: `data:image/` restricted to explicit safe types (png, jpeg, gif, webp) (`security.ts`)
- **M-04**: CSS comment stripping + `behavior:`/`-moz-binding` checks in style sanitization (`security.ts`)
- **M-05**: Logout clears all `medcalc-phi-*`, `medcalc-history-*`, `medcalc-provenance-*` keys + encryption key cache (`session-manager.ts`)
- **M-08**: VIP detection uses specific extension URL whitelist (`security-labels-service.ts`)
- **M-10**: `encodeURIComponent()` on FHIR query parameters (`fhir-data-service.ts`)
- **M-13**: FHIR write string fields truncated and sanitized (`fhir-write-service.ts`)
- **M-14/M-15**: Audit PHI sanitization expanded; `clearLocalEvents` adds warning + flush attempt (`audit-event-service.ts`)
- **M-18**: Error handler uses `escapeHTML()` and `__DEV__` build flag (`errorHandler.ts`)
- **M-19**: i18n `resolve()` blocks `__proto__`/`constructor`/`prototype` traversal (`i18n/index.ts`)
- **M-23**: `loadCalculator` validates ID format (`/^[a-z0-9-]+$/`) and whitelist (`calculators/index.ts`)
- **L-08/L-09/L-10/L-11**: `Math.random` UUIDs replaced with `crypto.randomUUID()` (`audit-event-service.ts`, `provenance-service.ts`)

### Added
- Security review report: `docs/compliance/SECURITY_REVIEW_2026-03-03.md` (65 findings)
- Security remediation report: `docs/compliance/SECURITY_REMEDIATION_2026-03-03.md` (48 fixed, 17 deferred)
- `__DEV__` build-time constant for Vite/Jest compatible dev-mode detection (`vite.config.ts`, `jest.setup.ts`, `global.d.ts`)

### Changed
- `README.md` rewritten to reflect current architecture (86 calculators, 14 categories, factory patterns, UIBuilder examples)
- `calculation-history.ts` methods now async (encrypted storage)
- `provenance-service.ts` local storage now async (encrypted storage)

### Removed
- `CONTRIBUTING.md` (consolidated into README)
- `product.md` (consolidated into README)

## [1.7.4] - 2026-02-25

### Changed
- **Growth chart: Taiwan reference data**: Replaced CDC growth curves with 衛生福利部國民健康署台灣兒童生長標準 (birth to 17 years, P3/P15/P25/P50/P75/P85/P97)
- **Growth chart: BMI thresholds**: Uses Taiwan-specific BMI cutoffs for underweight/overweight/obese instead of CDC percentiles

### Added
- **Growth chart: manual height/weight input**: Clinicians can enter current-visit height (cm) and weight (kg) directly — auto-calculates age in months from FHIR patient birthDate, merges with historical data, recalculates BMI, and redraws all charts instantly
- **Growth chart: same-day overwrite**: Re-entering data on the same day replaces the previous manual entry instead of duplicating it

## [1.7.3] - 2026-02-25

### Fixed
- **ASCVD Known ASCVD checkbox not working**: `unified-formula-calculator` `validateInputs` was missing checkbox value collection — `known-ascvd` checkbox state was never passed to calculation function
- **ASCVD Hypertension Treatment auto-detect incorrect**: Removed `snomedCode: SNOMED_CODES.HYPERTENSION` from "On Hypertension Treatment?" field — a hypertension diagnosis does not imply active treatment
- **ASCVD Diabetes auto-detect incomplete**: Changed `snomedCode` to accept both Type 1 (`46635009`) and Type 2 (`44054006`) DM, matching PCE's treatment of all diabetes equally

### Added
- **Unified formula calculator: snomedCode auto-populate for radio fields**: Factory now auto-detects FHIR Conditions matching radio field `snomedCode` and selects the appropriate option; supports comma-separated codes; batches all codes into a single `getConditions()` call
- **9 unit tests for snomedCode auto-populate**: Covers matching, no-match, comma-separated codes, batched call, FHIR-not-ready, error handling, dedup, and multi-coding conditions
- **4 ASCVD golden dataset cases**: Borderline risk 5.7% (GD-ASCVD-006), Intermediate risk 8.0% (GD-ASCVD-007), High risk 21.0% (GD-ASCVD-008), Young adult age 25 lifetime-risk-only (GD-ASCVD-009)

### Changed
- **ASCVD references consolidated**: Removed 4 scattered inline `uiBuilder.createReference()` calls from Therapy Impact, Lifetime Risk, CAC Guidance, and Therapy Results panels; unified all 5 citations into a single References section at the bottom of the calculator
- ASCVD Smoking Status `snomedCode` removed (smoking status is an Observation, not a Condition — manual selection required)

## [1.7.2] - 2026-02-25

### Fixed
- **ASCVD Therapy Impact: patient-aware calculation**: BP control and smoking cessation now use PCE recalculation instead of fixed RR multipliers, producing risk reductions proportional to the patient's actual baseline values
- **ASCVD Therapy Impact: optimal risk floor**: Treated risk is clamped to never fall below the 10-year optimal risk (theoretical minimum achievable with all optimal risk factors)
- **ASCVD Optimal Risk hidden for near-optimal patients**: Removed `optimalRisk < risk` guard — optimal risk is now always shown for ages 40-79, with a positive message when risk factors are already near optimal
- **ASCVD Statin selection not mutually exclusive**: Changed statin intensity from checkboxes to radio group (None / High / Moderate) to enforce single selection
- **Unit converter missing cross-conversions**: Added D-dimer `µg/mL ↔ ng/mL` and Hemoglobin `g/L ↔ mmol/L` direct conversion pairs that previously returned null

### Changed
- ASCVD therapy impact uses hybrid approach: PCE recalculation for BP/smoking (parameters in the equation), RR multipliers for statin/aspirin (not modeled in PCE)
- Therapy impact panel hides statin options when 10-year risk < 5%, hides BP control when SBP ≤ 130 mmHg
- BP control label shows patient's current SBP dynamically (e.g., "Target SBP <130 mmHg (current: 160 mmHg)")
- Therapy results table header changed from "RR Applied" to "Method" (PCE recalc vs RR)
- Skipped therapies (already at target) displayed in therapy results
- Updated references to full citations: Lloyd-Jones DM et al. Circulation 2006;113(6):791-8 and Karmali KN et al. Circulation 2015;132(16):1571-8

## [1.7.1] - 2026-02-25

### Fixed
- **ASCVD Lifetime Risk accuracy**: Rewrote `getLifetimeRisk()` to match Lloyd-Jones 2006 Table 3 with 5 mutually exclusive sex-specific categories (All Optimal, ≥1 Not Optimal, ≥1 Elevated, 1 Major, ≥2 Major) and correct thresholds
- **ASCVD Lifetime Risk DBP classification**: Added diastolic blood pressure to risk stratification (DBP ≥100 = Major, 90-99 = Elevated, 80-89 = Not Optimal) per Lloyd-Jones 2006
- **ASCVD Lifetime Risk former smoker**: Former smokers no longer incorrectly counted as major risk factor (only current smokers per guideline)
- **Validation message overlapping unit label**: Validation error messages now append to `.ui-input-group` instead of `.ui-input-wrapper`, preventing overlap with absolutely-positioned unit labels

### Changed
- ASCVD calculator footer (Pooled Cohort Equations, Risk Stratification, References) moved below result panel
- Lifetime risk values are now exact percentages (e.g., "5%") instead of approximate (e.g., "~5%"), sex-specific per Lloyd-Jones Table 3

## [1.7.0] - 2026-02-25

### Added
- **Cross-field validation framework**: `crossFieldValidation` callback in `FormulaCalculatorConfig` for real-time inline validation between related fields
- **ASCVD cross-field validation**: DBP >= SBP and HDL + LDL >= TC now show inline errors immediately on input, not just at calculation time
- **ASCVD Lifetime Risk for ages 20-39**: `getLifetimeRisk()` extended from 40-59 to 20-59 per 2013 ACC/AHA guideline recommendations

### Fixed
- **Docker startup failure**: Container crashed in restart loop due to `cap_drop: ALL` + `no-new-privileges` conflicting with `su-exec` privilege dropping. Switched to `USER nginx` in Dockerfile, removed `su-exec` dependency
- **Docker healthcheck IPv6**: `localhost` resolved to `::1` but nginx only listened on IPv4; changed healthcheck URLs to `127.0.0.1`
- **Validation error messages**: Field-level error messages now reflect the calculator's actual `min`/`max` range instead of showing generic rule ranges (e.g., "Age must be between 20-79 years" instead of "0-150 years")
- **ASCVD lipid validation boundary**: Changed HDL + LDL check from `>` to `>=` Total Cholesterol (TC also includes VLDL)

### Changed
- Docker production image runs as non-root `nginx` user directly (no `su-exec`)
- Nginx `user` directive commented out for non-root operation
- ASCVD clinical review status updated to approved

## [1.6.0] - 2026-02-23

### Added
- **Security hardening**: Non-root Docker container via `su-exec` privilege dropping
- **Input validation**: All environment variables validated and sanitized before config generation in `docker-entrypoint.sh`
- **Rate limiting**: Nginx rate limiting with 3 zones (general 10r/s, API 2r/s, OAuth launch 5r/s) and healthcheck exemption
- **Security headers**: `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` headers
- **Container hardening**: `no-new-privileges`, `cap_drop: ALL`, tmpfs mounts, resource limits (512MB/1CPU)
- **Dependabot**: Automated dependency scanning for npm (weekly), GitHub Actions (monthly), Docker (monthly)
- **Trivy scanning**: Container vulnerability scanning in CI/CD with SARIF upload to GitHub Security tab
- **SECURITY.md**: Security policy with vulnerability reporting process and response timelines
- **npm overrides**: Removed unnecessary expo/react-native from fhirclient dependency chain, eliminating 383 packages and all 19 production vulnerabilities

### Changed
- Nginx listens on port 8080 (non-privileged) instead of 80
- Docker Compose port mappings updated: `8080:8080` (prod), `8081:8080` (staging)
- `npm audit --audit-level=high` now blocks CI pipeline (removed `continue-on-error`)
- Advisory-only moderate audit step added (non-blocking)

### Removed
- Deprecated `X-XSS-Protection` header (per OWASP recommendation)
- Homepage subtitle tagline ("92 個臨床計算器，專為醫療專業人員設計")

## [1.5.0] - 2026-02-22

### Added
- **Doctor verification**: Practitioner identity display with FHIR Practitioner resource lookup (parts 1-5)

## [1.4.0] - 2026-02-20

### Added
- **TW Core IG v1.0.0 integration**: Profile URLs, CodeSystems, ConceptMaps, observation profiles, validation module in `src/twcore/`
- TW Core unit tests for profiles, codesystems, observations, patients, and validation

## [1.3.0] - 2026-02-18

### Added
- **Structured logging**: `src/logger.ts` with JSON output and automatic PHI stripping
- **Sentry integration**: `src/sentry.ts` with PHI-safe `beforeSend` filter
- Health check endpoint (`/api/health`) with build version info
- Docker multi-stage build with Nginx production image
- CI/CD pipeline: build, test, E2E, Lighthouse, accessibility, security audit, SBOM, Docker build

## [1.2.0] - 2026-02-15

### Added
- **Accessibility**: Semantic landmarks, skip links, ARIA attributes, focus styles
- `jest-axe` unit tests and `@axe-core/playwright` E2E accessibility tests

## [1.1.0] - 2026-02-12

### Added
- **Clinical validation**: Golden dataset testing for 83 calculators (416 test cases, 100% pass)
- Three runner patterns: simple (45), scoring (32), complex (6)
- Tolerance-based comparison for floating-point results

### Changed
- **Vite migration**: CDN-to-bundle, chunk splitting (vendor-fhir, vendor-chart, vendor-sentry, core, ui)
- CSS optimization and Web Vitals monitoring

## [1.0.0] - 2026-02-08

### Added
- **Playwright E2E tests**: 6 suites + 1 accessibility suite across Chromium, Firefox, WebKit
- Auth bypass mock for FHIR client in E2E tests

### Changed
- Unit test coverage: 8% → 52.5% (117 suites, 3467 tests)

## [0.9.0] - 2026-02-05

### Added
- **AES-GCM encryption** for sensitive cached data
- **Session management**: Configurable timeout with idle detection and warning
- **CSP headers**: Content Security Policy restricting script/style/connect sources
- Environment-based configuration via `window.MEDCALC_CONFIG`

## [0.1.0] - 2026-01-15

### Added
- Initial release: 92 clinical calculators
- SMART on FHIR integration with `fhirclient` v2.6.3
- Factory pattern architecture: unified-formula, scoring, dynamic-list calculators
- Patient context display (name, DOB, gender)
- Category filtering and search
- Favorites and recent usage tracking
