// src/twcore/index.ts
// Barrel re-export for TW Core IG v1.0.0 module

export { TW_CORE_PROFILES } from './profiles.js';
export type { TWCoreProfileKey, TWCoreProfileUrl } from './profiles.js';

export {
    TW_CODE_SYSTEMS,
    TW_VALUE_SETS,
    TW_OBSERVATION_CATEGORIES,
    TW_MEDICATION_ROUTES,
} from './codesystems.js';

export {
    MEDICATION_FREQUENCY_MAP,
    MEDICATION_ROUTE_TO_SNOMED,
    getNHIFrequencyMapping,
    getTWRouteToSNOMED,
} from './concept-maps.js';

export {
    TW_IDENTIFIER_SYSTEMS,
    TW_IDENTIFIER_TYPE_CODES,
    isTWCoreIdentifierSystem,
    getIdentifierTypeLabel,
} from './identifier-systems.js';

export {
    TW_OBSERVATION_PROFILES,
    getTWCoreObservationProfile,
    isVitalSignCode,
    getTWCoreObservationCategory,
} from './observation-profiles.js';

export {
    checkPatientConformance,
    checkObservationConformance,
    annotateTWCoreProfile,
} from './validation.js';
export type { ConformanceResult, ConformanceIssue } from './validation.js';
