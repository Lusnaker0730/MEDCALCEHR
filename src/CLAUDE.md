# src/ — Source Code

## Service Architecture

All major services are **singletons** exported as camelCase instances:

| Service | File | Purpose |
|---------|------|---------|
| `uiBuilder` | `ui-builder.ts` | HTML component factory (escapes inputs by default) |
| `fhirDataService` | `fhir-data-service.ts` | FHIR read/auto-populate (47KB, largest file) |
| `logger` | `logger.ts` | Structured JSON logging, auto-strips PHI |
| `sessionManager` | `session-manager.ts` | Inactivity timeout, logout flow |
| `auditEventService` | `audit-event-service.ts` | FHIR AuditEvent logging |
| `calculationHistory` | `calculation-history.ts` | Encrypted calculation history |

## Import Patterns

```typescript
// Services (singleton instances)
import { logger } from './logger.js';
import { uiBuilder } from './ui-builder.js';
import { fhirDataService } from './fhir-data-service.js';

// Security utilities (functions)
import { escapeHTML, sanitizeHTML, clearEncryptionKeyCache } from './security.js';
import { secureLocalStore, secureLocalRetrieve } from './security.js';

// Types (use `import type`)
import type { CalculatorModule, AlertSeverity } from './types/index.js';

// Constants
import { LOINC_CODES, SNOMED_CODES } from './fhir-codes.js';
```

## Validation (validator.ts)

Dual-zone system:
- **Red zone** (`min`/`max`): hard limits, blocks calculation, shows error
- **Yellow zone** (`warnMin`/`warnMax`): soft limits, allows calculation, shows warning

## PHI Handling

- Store with `secureLocalStore(key, data)` — AES-GCM encrypted
- Retrieve with `secureLocalRetrieve(key)` — auto-migrates legacy XOR format
- localStorage keys for PHI use prefixes: `medcalc-phi-`, `medcalc-history-`, `medcalc-provenance-`
- Logger and Sentry auto-strip PHI patterns (SSN, DOB, phone, email, Taiwan National ID)

## Key Subdirectories

- `calculators/` — See `calculators/CLAUDE.md`
- `types/` — Centralized type definitions, re-exported from `types/index.ts`
- `twcore/` — Taiwan FHIR Core IG (profiles, codesystems, validation)
- `ehr-adapters/` — EHR abstraction layer (Epic, Cerner, Meditech, Generic)
- `i18n/` — `en.json` and `zh-TW.json` locale files, `index.ts` for init/switching
- `__tests__/` — Jest tests mirroring src/ structure
