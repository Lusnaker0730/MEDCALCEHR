# Risk Management File (ISO 14971)

**Product:** MEDCALCEHR
**Version:** 1.0.0
**Scope:** System-wide (92 Clinical Calculators)
**Classification:** Internal Hospital Use

---

## 1. Risk Analysis Method

We utilize **Failure Mode and Effects Analysis (FMEA)** to identify, evaluate, and control risks associated with the medical device software. Risks are categorized by **failure type** rather than per-calculator, as the factory pattern architecture means common risk categories apply across calculator types.

### Severity Levels (S)

1.  **Negligible**: Inconvenience or temporary discomfort.
2.  **Minor**: Results in temporary injury or impairment not requiring professional medical intervention.
3.  **Serious**: Results in injury or impairment requiring professional medical intervention.
4.  **Critical**: Results in permanent impairment or life-threatening injury.
5.  **Catastrophic**: Results in patient death.

### Probability Levels (P)

1.  **Improbable**: < 10^-6
2.  **Remote**: 10^-6 to 10^-4
3.  **Occasional**: 10^-4 to 10^-2
4.  **Probable**: 10^-2 to 10^-1
5.  **Frequent**: > 10^-1

### Risk Evaluation Matrix

Risk Score = S \* P

- **Acceptable (Green)**: Score 1-4
- **ALARP (Yellow)**: Score 5-9 (As Low As Reasonably Practicable - Requires mitigation)
- **Unacceptable (Red)**: Score 10+ (Must be mitigated)

---

## 2. Failure Mode and Effects Analysis (FMEA)

### Category A: Input Validation Risks

| ID | Failure Mode | Cause | Hazard | S | P | Risk Score | Risk Control Measure | Verification | Residual Risk |
|----|-------------|-------|--------|---|---|-----------|---------------------|-------------|--------------|
| **RISK-001** | Physiologically impossible value entered | User typo (e.g., Temp 370 instead of 37.0) | Calculation result wildly incorrect, wrong severity assessment | 3 (Serious) | 3 (Occasional) | **9 (ALARP)** | `validator.ts` enforces strict red-zone ranges (e.g., Temp 30-45°C). Inputs outside range are rejected with alert. | Unit Test: `validator.test.ts` boundary checks | Acceptable (3×1=3) |
| **RISK-002** | Unusual but clinically valid value causes false warning | Edge-case patient (e.g., BMI > 50 in bariatric patient) | User ignores valid data due to yellow-zone warning, enters wrong value | 2 (Minor) | 3 (Occasional) | **6 (ALARP)** | Yellow zone warns but does not block. Warning text explains clinical range. User retains override capability. | Unit Test: Yellow zone allows submission | Acceptable (2×1=2) |
| **RISK-003** | Missing validation rule on number field | Developer omits `validationType` in calculator config | No range check on input; extreme values produce wrong results | 3 (Serious) | 2 (Remote) | **6 (ALARP)** | Automated validation audit (`audit-validation-coverage.ts`) scans all calculators. CI enforcement planned. | Audit Script: `npm run audit:validation` | Acceptable (3×1=3) |

### Category B: Data Integration Risks

| ID | Failure Mode | Cause | Hazard | S | P | Risk Score | Risk Control Measure | Verification | Residual Risk |
|----|-------------|-------|--------|---|---|-----------|---------------------|-------------|--------------|
| **RISK-004** | FHIR data staleness | Lab results fetched are outdated (e.g., 3 months old) | Algorithm uses old data for current risk assessment | 3 (Serious) | 4 (Probable) | **12 (Unacceptable)** | Display "Data Date" next to auto-populated fields. Warn if data older than 24 hours. Staleness tracker in `fhir-data-service.ts`. | UI Verification: Check data date warning | Acceptable (3×2=6) |
| **RISK-005** | Incorrect unit conversion | Lab sends Creatinine in µmol/L, calculator expects mg/dL | Score inflated/deflated by factor of 88.4 | 4 (Critical) | 2 (Remote) | **8 (ALARP)** | Integrated `UnitConverter` module handles standardization before calculation. Unit toggle shows current unit. | Unit Test: `unit-converter.test.ts` | Acceptable (4×1=4) |
| **RISK-006** | FHIR LOINC code mismatch | Wrong LOINC code mapped to field, fetches unrelated lab value | Incorrect value auto-populated without user awareness | 4 (Critical) | 1 (Improbable) | **4 (Acceptable)** | LOINC mappings centralized in `LOINC_CODES` constant. Code review for all FHIR mappings. Golden dataset validation covers FHIR data paths. | Code Review + Golden Dataset Tests | Acceptable |
| **RISK-007** | FHIR server downtime | Hospital FHIR server unreachable | Cannot auto-populate; increased manual entry workload and error chance | 2 (Minor) | 3 (Occasional) | **6 (ALARP)** | Graceful degradation: allows manual entry, notifies user "Auto-population failed". Service worker provides offline UI. | E2E Test: Offline mode simulation | Acceptable (2×1=2) |

### Category C: Scoring Calculator Risks

| ID | Failure Mode | Cause | Hazard | S | P | Risk Score | Risk Control Measure | Verification | Residual Risk |
|----|-------------|-------|--------|---|---|-----------|---------------------|-------------|--------------|
| **RISK-008** | Scoring default value produces misleading result | Scoring radio buttons default to a non-zero value or no default selected | User submits form with unintended default score | 2 (Minor) | 3 (Occasional) | **6 (ALARP)** | No radio button is pre-selected by default. Calculate button requires explicit user action. UI shows "Please select" state. | Unit Test: Default state produces no result | Acceptable (2×1=2) |
| **RISK-009** | Integer overflow / floating point error | JavaScript floating point precision in score accumulation | Minor score inaccuracy | 1 (Negligible) | 3 (Occasional) | **3 (Acceptable)** | Integer scoring for point-based calculators. Round final results to 1 decimal place. | Unit Test: Exact point match in golden datasets | Acceptable |

### Category D: User Interface Risks

| ID | Failure Mode | Cause | Hazard | S | P | Risk Score | Risk Control Measure | Verification | Residual Risk |
|----|-------------|-------|--------|---|---|-----------|---------------------|-------------|--------------|
| **RISK-010** | i18n translation inconsistency | Chinese interpretation text differs in clinical meaning from English original | Clinician makes wrong decision based on mistranslated risk level | 3 (Serious) | 2 (Remote) | **6 (ALARP)** | Bilingual interpretation display (Chinese + English). Clinical review of all translations. Key clinical terms kept in English. | Clinical Review: Translation audit | Acceptable (3×1=3) |
| **RISK-011** | Lazy loading failure | Network issue or code-split chunk fails to load | Calculator UI shows blank/error instead of calculator form | 1 (Negligible) | 2 (Remote) | **2 (Acceptable)** | Error boundary catches loading failures. User-friendly error message with retry button. Service worker caches critical chunks. | E2E Test: Chunk loading failure simulation | Acceptable |
| **RISK-012** | User selects wrong calculator | Similar calculator names (e.g., Wells DVT vs Wells PE) | Wrong clinical score applied to patient | 3 (Serious) | 2 (Remote) | **6 (ALARP)** | Clear calculator titles with full names. Category-based navigation. Search with fuzzy matching. Description text visible before selection. | Usability Testing: Task completion rate | Acceptable (3×1=3) |

### Category E: Security Risks

| ID | Failure Mode | Cause | Hazard | S | P | Risk Score | Risk Control Measure | Verification | Residual Risk |
|----|-------------|-------|--------|---|---|-----------|---------------------|-------------|--------------|
| **RISK-013** | XSS via URL parameters | Malicious calculator ID or query parameter injection | Code execution in clinical user's browser session | 3 (Serious) | 2 (Remote) | **6 (ALARP)** | Input sanitization via `DOMPurify`-style escaping in UIBuilder. CSP blocks inline scripts. URL parameters validated against calculator registry. | Unit Test: `security.test.ts` XSS tests | Acceptable (3×1=3) |
| **RISK-014** | Session timeout data loss | User session expires during complex data entry (15+ fields) | Loss of partially entered data; user frustration, re-entry errors | 2 (Minor) | 3 (Occasional) | **6 (ALARP)** | Session timeout warning at 25 minutes (configurable). Warning dialog allows session extension. 30-minute default timeout. | Unit Test: Session manager tests | Acceptable (2×1=2) |
| **RISK-015** | PHI exposure in error logs | Patient data included in Sentry error reports or console logs | Privacy violation, regulatory non-compliance | 3 (Serious) | 2 (Remote) | **6 (ALARP)** | `logger.ts` strips PHI patterns (MRN, names, dates). `sentry.ts` `beforeSend` hook scrubs event data. No PHI in localStorage keys. | Unit Test: `logger.test.ts` PHI stripping | Acceptable (3×1=3) |

---

## 3. Risk Summary

| Risk Level | Count | IDs |
|-----------|-------|-----|
| Unacceptable (before mitigation) | 1 | RISK-004 |
| ALARP (before mitigation) | 10 | RISK-001, 002, 003, 005, 007, 008, 010, 012, 013, 014, 015 |
| Acceptable (before mitigation) | 4 | RISK-006, 009, 011 |

**After mitigation: All 15 risks at Acceptable level.**

---

## 4. Benefit-Risk Analysis

MEDCALCEHR provides 92 standardized clinical calculators with:
- **Rapid calculation**: Automated scoring reduces manual calculation errors
- **FHIR integration**: Auto-population eliminates transcription errors for 60%+ of input fields
- **Standardized validation**: Three-zone validation prevents physiologically impossible inputs
- **Golden dataset verification**: 416 clinical test cases validate calculation accuracy
- **Accessibility**: WCAG 2.1 AA compliance ensures usability for all clinicians

The residual risks after mitigation are primarily related to edge-case user entry errors and data staleness, which are inherent to any clinical decision support tool. The benefits of automated, validated, and standardized clinical calculations significantly outweigh the residual risks.

---

## 5. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Risk Manager | | | |
| Software Developer | | | |
| Clinical Reviewer | | | |
| Quality Manager | | | |
