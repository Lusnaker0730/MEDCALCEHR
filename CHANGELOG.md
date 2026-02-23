# Changelog

All notable changes to MEDCALCEHR will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
