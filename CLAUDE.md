# CLAUDE.md — MedCalcEHR

## Project Overview

SMART on FHIR medical calculator web app — 92 clinical calculators across 14 specialties. TypeScript + vanilla DOM (no React/Angular). Served via Nginx in Docker.

## Quick Commands

```bash
npm run build          # Vite production build → dist/
npm run dev            # Vite dev server
npx tsc --noEmit       # Type-check only (some pre-existing errors in global types are expected)
npx tsc                # Compile TS → js/ directory
npm test               # Jest unit tests (jsdom)
npm run test:e2e       # Playwright E2E tests
npm run lint           # ESLint
npm run format         # Prettier
```

## Architecture

```
src/
├── calculators/          # 87 calculator dirs, each with index.ts (+ optional calculation.ts)
│   ├── shared/           # Factory functions: scoring, formula, conversion, dynamic-list
│   └── index.ts          # Registry: calculatorModules[], loadCalculator(), calculatorExists()
├── types/                # Centralized type defs (calculator-base, -scoring, -formula, -specialized)
├── twcore/               # Taiwan FHIR Core IG profiles, codesystems, validation
├── ehr-adapters/         # EHR-specific adapters (Epic, Cerner, Meditech, Generic)
├── i18n/                 # Internationalization (en, zh-TW)
├── __tests__/            # 118+ test files mirroring src/ structure
├── ui-builder.ts         # Singleton HTML component factory (escapes by default)
├── fhir-data-service.ts  # Central FHIR data access & auto-population
├── security.ts           # escapeHTML(), sanitizeHTML(), AES-GCM encryption, PHI stripping
├── validator.ts          # Dual-zone validation (red=error, yellow=warning)
├── session-manager.ts    # Inactivity timeout + logout (clears PHI + FHIR cache)
├── logger.ts             # Structured JSON logging with automatic PHI stripping
└── main.ts               # App entry point
```

## Key Conventions

### TypeScript & Modules
- **ESM with `.js` extensions** — all imports use `.js` suffix: `import { x } from './foo.js'`
- **Strict mode** — `tsconfig.json` has `strict: true`, target ES2020, module ESNext
- **`noImplicitAny: false`** — implicit any is allowed (legacy)

### Naming
- **Files**: kebab-case (`fhir-data-service.ts`, `unit-converter.ts`)
- **Calculator dirs**: kebab-case matching calculator ID (`ascvd/`, `bmi-bsa/`, `meld-na/`)
- **Classes/Interfaces**: PascalCase (`UIBuilder`, `ValidationRule`)
- **Singletons**: camelCase exports (`logger`, `uiBuilder`, `fhirDataService`)
- **Constants**: UPPER_SNAKE_CASE (`LOINC_CODES`, `SNOMED_CODES`, `PHI_PATTERNS`)
- **Factory functions**: `create*Calculator` pattern

### Formatting (Prettier)
- Semicolons: yes
- Single quotes: yes
- Tab width: 4 spaces
- Print width: 100
- Trailing comma: none
- End of line: lf

### Calculator IDs
- Format: `/^[a-z0-9-]+$/` (lowercase alphanumeric + hyphens)
- Must match directory name under `src/calculators/`
- Must be registered in `calculatorModules` array in `src/calculators/index.ts`

## Security Rules (CRITICAL)

- **Never use `innerHTML` with unsanitized data** — use `textContent`, `escapeHTML()`, or `sanitizeHTML()`
- **UIBuilder `createAlert` defaults `escapeMessage: true`** — never set to `false` with dynamic content
- **PHI must use `secureLocalStore`/`secureLocalRetrieve`** (AES-GCM) — never plaintext localStorage for patient data
- **All FHIR query params must use `encodeURIComponent()`**
- **Calculator IDs are validated** against allowlist before dynamic import
- **Logout must clear**: sessionStorage, PHI localStorage keys, encryption key cache, FHIR service worker cache
- **`__DEV__` build flag** gates dev-only features (review gate bypass, debug error details)

## Testing

- **Unit tests**: Jest + ts-jest, jsdom environment, files in `src/__tests__/`
- **Naming**: `*.test.ts`
- **Coverage threshold**: 50% lines/functions/statements, 47% branches
- **Golden datasets**: Reference validation data in `src/__tests__/golden-datasets/`
- **E2E**: Playwright, tests in `e2e/tests/`, fixtures in `e2e/fixtures/`
- **Accessibility**: jest-axe (unit) + @axe-core/playwright (E2E)

## Build & Deploy

- **Vite** builds to `dist/` with code splitting (vendor-fhir, vendor-chart, vendor-sentry, core, ui)
- **`tsc`** compiles to `js/` (used for non-bundled serving)
- **Docker**: multi-stage build, Nginx on port 8080, non-root user
- **Service worker**: `service-worker.js` at root (not compiled from TS)
- **CSS**: hand-written in `css/` with PostCSS (autoprefixer + cssnano)

## Common Pitfalls

- `window.MEDCALC_CONFIG` type is declared in `src/types/global.d.ts` — pre-existing TS error on access is expected
- The `js/` directory contains stale compiled output — always check `src/` for truth
- Service worker is plain JS, not TypeScript — edit `service-worker.js` directly
- `fhirclient` library brings no framework — all DOM manipulation is vanilla
