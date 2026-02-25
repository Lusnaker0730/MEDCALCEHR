# Changelog

All notable changes to MEDCALCEHR will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
