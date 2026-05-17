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

## Change Control (TFDA / IEC 62304) — MANDATORY

**所有變更必須走 PR，禁止直接 push 到 `main`。** 此專案為 SaMD，受 TFDA 醫療器材軟體變更管控規範。

每個 PR 必須:
1. 依 `.github/pull_request_template.md` 完整填寫（不可刪除欄位、不可全部留空）
2. 通過 `.github/workflows/tfda-pr-lint.yml` 自動檢查 — 缺欄位會 block merge
3. 必填欄位:
   - Intended Use 影響評估（是/否 + 說明）
   - 受影響的 Calculator IDs（無則填「N/A — 原因」）
   - V&V 測試證據（新增/修改的測試檔；計算器邏輯變動必須附測試）
   - IEC 62304 安全性等級（Class A/B/C）
   - TFDA 醫療器材分級（第一/二/三級）
   - 風險影響 + 風險控制（依 ISO 14971）
4. 若引入新風險，必須開 `[風險] 風險分析` issue（`.github/ISSUE_TEMPLATE/risk_analysis.yml`）並於 PR 關聯

**禁止行為:**
- `git push --force` 到 main
- 使用 `--no-verify` 跳過 hook
- 直接 commit 到 main（即使 fast-forward）
- 修改 `.github/workflows/tfda-pr-lint.yml` 來放寬規則而不附完整變更理由

Issue 模板對應 IEC 62304 SDLC artifacts:
- `software_requirement.yml` → 需求規格
- `design_specification.yml` → 設計說明
- `risk_analysis.yml` → 風險分析（ISO 14971）
- `verification_record.yml` → 驗證紀錄

Regulatory 文件由 `.github/workflows/regulatory-docs.yml` 從 Issues 自動生成（tag push 或 manual trigger）。

### Dependabot SOUP 路徑（IEC 62304 §8.1）

依賴套件更新由 Dependabot 自動處理，視為 SOUP (Software of Unknown Provenance) 變更:
- **Patch/minor 升級** → `tfda-pr-lint` 自動產生 change-control comment、套用 `soup-update` 標籤、auto-pass。Merge 條件僅需 CI 全綠。
- **Major 升級**或 **safety-critical 套件**（`fhirclient`、`@sentry/browser`、`@sentry/tracing`）→ lint 會 fail，需 reviewer 檢視 changelog + 補 V&V 測試後加 `human-reviewed` 標籤才能 merge。
- 自動 comment 內含完整 SOUP 變更管控記錄（套件名、版本類型、風險評估、Change Control 紀錄），保留於 PR 供稽核。

擴充 safety-critical 清單請編輯 `.github/workflows/tfda-pr-lint.yml` 的 `SAFETY_CRITICAL` 陣列，並於本 commit 附風險評估。

### Dev SOUP Residual Risk (IEC 62304 §8.1 + ISO 14971)

`npm audit` 在 CI 上分兩段:
- **`security-audit` (blocking)** — `npm audit --omit=dev --audit-level=high`，僅檢查 production runtime deps（瀏覽器端 SOUP）
- **dev/build/test SOUP (advisory)** — 完整 `npm audit` 在 CI 仍跑但 `continue-on-error`，不 block merge

**理由 (殘餘風險接受):**
產品 production runtime 僅包含 `fhirclient`、`chart.js`、`@sentry/browser`、`fuse.js`、`web-vitals`，當前 `npm audit --omit=dev` 為零 vulnerability。dev/build/test tooling（jest-environment-jsdom 鏈、@lhci/cli 鏈、@cyclonedx/cyclonedx-npm 鏈、basic-ftp、handlebars、libxmljs2 等）累積 37+ transitive vulns，多數無上游安全版本可用，且僅在開發環境 / CI runner 執行，不打包進部署 artifact。

**控制措施:**
- Dependabot 持續監控所有 deps（含 dev）；新 critical/high 透過自動 SOUP PR 開啟
- TFDA PR Lint dependabot-soup job 自動分類並要求 reviewer 審核 major / safety-critical
- 新 critical vuln 出現於 dev tooling 仍需開 `[風險] 風險分析` issue 評估 supply-chain 攻擊向量

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
