# Software Requirements Specification (SRS)

**Product:** MEDCALCEHR
**Version:** 1.0.0
**Classification:** Internal Hospital Use Clinical Calculator Platform

---

## 1. System-Level Requirements

### 1.1 Functional Requirements

| ID | Description | Priority | Verification Method | Status |
|----|-------------|----------|-------------------|--------|
| **REQ-SYS-001** | The system shall provide 92 clinical calculators spanning 14 medical categories. | Must | Calculator registry count + golden dataset coverage | Implemented |
| **REQ-SYS-002** | The system shall authenticate via SMART on FHIR OAuth2 launch flow, receiving patient context from the EHR. | Must | E2E test (auth mock) + launch.html flow | Implemented |
| **REQ-SYS-003** | The system shall validate all numeric inputs using three-zone validation: red zone (hard reject), yellow zone (warning), green zone (accept). | Must | `validator.ts` unit tests + validation audit script | Implemented |
| **REQ-SYS-004** | The system shall enforce session timeout (default 30 minutes) with a warning dialog at 25 minutes, allowing session extension. | Must | `session-manager.ts` unit tests | Implemented |
| **REQ-SYS-005** | The system shall strip all PHI (Protected Health Information) from structured logs and Sentry error reports before transmission. | Must | `logger.test.ts` + `sentry.test.ts` PHI pattern tests | Implemented |
| **REQ-SYS-006** | The system shall auto-populate calculator input fields from EHR data via FHIR Observation resources, mapped by LOINC codes. | Must | E2E test (FHIR mock) + integration tests | Implemented |
| **REQ-SYS-007** | The system shall generate FHIR Provenance resources tracking calculation events including practitioner, patient, and timestamp. | Should | `provenance-service.test.ts` | Implemented |
| **REQ-SYS-008** | The system shall be responsive across desktop (1920px), tablet (768px), and mobile (375px) viewports. | Must | E2E viewport tests + CSS media queries | Implemented |
| **REQ-SYS-009** | The system shall conform to WCAG 2.1 Level AA accessibility standards including semantic landmarks, ARIA labels, focus management, and color contrast. | Must | jest-axe unit tests + @axe-core/playwright E2E tests | Implemented |
| **REQ-SYS-010** | The system shall provide a bilingual user interface (English and Traditional Chinese) with user-selectable language toggle. | Should | i18n unit tests + E2E language switch test | Planned |
| **REQ-SYS-011** | The system shall degrade gracefully when the FHIR server is unavailable, allowing manual data entry for all calculators. | Must | E2E offline test + service worker tests | Implemented |
| **REQ-SYS-012** | The system shall comply with TW Core IG v1.0.0 for FHIR resource profiles, code systems, and observation profiles used in Taiwan healthcare. | Should | `twcore/` module unit tests | Implemented |

### 1.2 Performance Requirements

| ID | Description | Target | Verification Method |
|----|-------------|--------|-------------------|
| **PERF-001** | Calculation results shall be displayed within 1 second of complete data entry. | < 1s | E2E timing test |
| **PERF-002** | The application shall validate input ranges to prevent calculation errors before submission. | Real-time | Unit tests |
| **PERF-003** | Initial page load (homepage) shall achieve Lighthouse Performance score > 90. | > 0.9 | Lighthouse CI |
| **PERF-004** | Calculator page load (with lazy loading) shall complete within 2 seconds on hospital network. | < 2s | E2E timing test |
| **PERF-005** | The production bundle size shall not exceed 500KB gzipped (excluding vendor chunks). | < 500KB | Vite build output |

### 1.3 Security Requirements

| ID | Description | Verification Method |
|----|-------------|-------------------|
| **SEC-001** | Content Security Policy shall block inline scripts, external script sources, and frame embedding. | CSP header in nginx.conf + unit tests |
| **SEC-002** | All user-supplied input shall be HTML-escaped before DOM insertion to prevent XSS. | UIBuilder escaping + security tests |
| **SEC-003** | Session tokens shall be stored in sessionStorage (not localStorage) and cleared on logout. | Session management tests |
| **SEC-004** | Transport security shall be enforced via TLS termination at ALB/reverse proxy with HSTS header. | nginx.conf HSTS + TLS architecture doc |
| **SEC-005** | The application shall not store PHI in localStorage, cookies, or service worker cache. | Code review + security audit |

### 1.4 Interface Requirements

| ID | Description | Verification Method |
|----|-------------|-------------------|
| **INT-001** | The system shall integrate with EHR systems via SMART on FHIR R4 API. | E2E auth flow tests |
| **INT-002** | The system shall use LOINC codes for laboratory value mapping. | FHIR data service tests |
| **INT-003** | The system shall support unit conversion between common clinical measurement systems (e.g., mg/dL ↔ µmol/L, °C ↔ °F). | `unit-converter.test.ts` |
| **INT-004** | The system shall support TW Core IG code systems including ICD-10-CM-TW and medication codes. | `twcore/` unit tests |

---

## 2. Calculator-Specific Requirements (APACHE II — Reference Implementation)

The APACHE II calculator serves as the reference implementation demonstrating all requirement patterns. Other calculators follow the same configuration-driven architecture.

### 2.1 Functional Requirements

| ID | Description | Source | Risk Class |
|----|-------------|--------|-----------|
| **REQ-APACHE-001** | The calculator must accept input for **Temperature** (Rectal). | Knaus et al., 1985 | B |
| **REQ-APACHE-002** | The calculator must accept input for **Mean Arterial Pressure (MAP)**. | Knaus et al., 1985 | B |
| **REQ-APACHE-003** | The calculator must accept input for **Heart Rate**. | Knaus et al., 1985 | B |
| **REQ-APACHE-004** | The calculator must accept input for **Respiratory Rate**. | Knaus et al., 1985 | B |
| **REQ-APACHE-005** | The calculator must accept input for **Oxygenation (AaDO2 or PaO2)**. | Knaus et al., 1985 | B |
| **REQ-APACHE-006** | The calculator must accept input for **Arterial pH**. | Knaus et al., 1985 | B |
| **REQ-APACHE-007** | The calculator must accept input for **Serum Sodium**. | Knaus et al., 1985 | B |
| **REQ-APACHE-008** | The calculator must accept input for **Serum Potassium**. | Knaus et al., 1985 | B |
| **REQ-APACHE-009** | The calculator must accept input for **Serum Creatinine**. | Knaus et al., 1985 | B |
| **REQ-APACHE-010** | The calculator must accept input for **Hematocrit**. | Knaus et al., 1985 | B |
| **REQ-APACHE-011** | The calculator must accept input for **White Blood Count (WBC)**. | Knaus et al., 1985 | B |
| **REQ-APACHE-012** | The calculator must accept input for **Glasgow Coma Score (GCS)** range 3-15. | Knaus et al., 1985 | B |
| **REQ-APACHE-013** | The calculator must accept input for **Age**. | Knaus et al., 1985 | B |
| **REQ-APACHE-014** | The calculator must provide a check for **Chronic Health Status** history. | Knaus et al., 1985 | B |
| **REQ-APACHE-015** | The calculator shall double the point weight for Creatinine if "Acute Renal Failure" is present. | Knaus et al., 1985 | B |
| **REQ-APACHE-016** | The system shall compute the total score by summing points from A (Physiology), B (Age), and C (Chronic Health). | Knaus et al., 1985 | B |
| **REQ-APACHE-017** | The system shall estimate mortality percentage based on the final total score. | Knaus et al., 1985 | B |

### 2.2 APACHE II Verification

- **Unit Test:** `src/__tests__/calculators/apache-ii.test.ts`
- **Golden Dataset:** `src/__tests__/golden-datasets/apache-ii.json` (5 clinical cases)
- **E2E Test:** Playwright FHIR integration test

---

## 3. Calculator Categories and Coverage

| Category | Calculator Count | Example Calculators |
|----------|-----------------|-------------------|
| Cardiovascular | 12 | ASCVD, CHA₂DS₂-VASc, HEART, GRACE, HAS-BLED |
| Critical Care | 8 | APACHE II, SOFA, qSOFA, MEWS, SIRS |
| Renal / Electrolyte | 10 | CKD-EPI, CrCl, FENa, Serum Osmolality |
| Drug Dosing | 6 | MME, Phenytoin Correction, Steroid Conversion |
| Infection | 6 | CPIS, CURB-65, Bacterial Meningitis Score |
| Neurology | 4 | GCS, NIHSS, 2HELPS2B |
| Respiratory | 4 | ABG Analyzer, ABL, A-a Gradient |
| Pediatric | 5 | APGAR, PECARN, Pediatric BP, Growth Chart |
| Metabolic | 5 | BMI/BSA, HOMA-IR, NAFLD Fibrosis |
| Hematology | 4 | ISTH-DIC, FIB-4, HScore |
| Gastroenterology | 3 | Child-Pugh, MELD-Na, Ranson |
| Psychiatry | 3 | GAD-7, PHQ-9, CIWA-Ar |
| Obstetrics | 1 | Due Date Calculator |
| General | 4 | IBW, MAP, Free Water Deficit |

> Full traceability for all 92 calculators is maintained in `docs/compliance/TRACEABILITY_MATRIX.md` (auto-generated).

---

## 4. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Software Developer | | | |
| Quality Manager | | | |
| Clinical Reviewer | | | |
