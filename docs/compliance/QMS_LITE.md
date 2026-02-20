# Quality Management System (QMS Lite)

**Product:** MEDCALCEHR
**Version:** 1.0.0
**Classification:** Internal Hospital Use (Non-regulated SaMD)
**Standard Reference:** ISO 13485 (adapted for internal use)

---

## 1. Purpose

This document defines a lightweight quality management system for MEDCALCEHR, a clinical calculator platform used internally within the hospital. While not seeking TFDA/FDA/CE regulatory approval, this QMS ensures the software meets hospital IT quality requirements and clinical safety standards.

---

## 2. Change Management

### 2.1 Change Request Process

All changes follow a **PR-based review workflow**:

1. **Create Branch**: Developer creates a feature/fix branch from `main`
2. **Implement Changes**: Code changes with accompanying tests
3. **Submit PR**: Pull request with description of changes and clinical impact assessment
4. **Automated CI**: All the following must pass:
   - TypeScript type check (`tsc --noEmit`)
   - Unit tests (Jest, 3400+ tests, >50% coverage threshold)
   - Golden dataset clinical validation (83 calculators, 416 test cases)
   - E2E tests (Playwright)
   - Accessibility tests (jest-axe + axe-core)
   - Security audit (`npm audit`)
   - Lint check (ESLint)
5. **Code Review**: At least one reviewer must approve
6. **Clinical Review**: Required for changes affecting:
   - Calculator formulas or scoring logic
   - Interpretation text or risk classifications
   - FHIR data mapping (LOINC codes, unit conversions)
   - Validation rules (min/max ranges)
7. **Merge**: Squash merge to `main`

### 2.2 Change Categories

| Category | CI Required | Code Review | Clinical Review | Examples |
|----------|-------------|-------------|-----------------|----------|
| Critical | YES | YES | YES | Formula changes, new calculators, FHIR mapping |
| Major | YES | YES | Recommended | UI overhaul, new features, security fixes |
| Minor | YES | YES | No | Bug fixes, styling, documentation |
| Patch | YES | Recommended | No | Typo fixes, dependency updates |

---

## 3. Version Control Strategy

### 3.1 Branching Model

- **`main`**: Production-ready code. All merges must pass CI.
- **Feature branches**: `feature/{description}` for new features
- **Fix branches**: `fix/{description}` for bug fixes
- **Release tags**: `v{major}.{minor}.{patch}` following Semantic Versioning

### 3.2 Versioning Rules

- **Major** (v2.0.0): Breaking changes to FHIR interface, data model changes
- **Minor** (v1.1.0): New calculators, new features, i18n additions
- **Patch** (v1.0.1): Bug fixes, validation corrections, documentation updates

### 3.3 Artifacts

Each release produces:
- Docker image tagged with commit SHA and version
- SBOM (Software Bill of Materials) in CycloneDX format
- SOUP list (auto-generated)
- Traceability matrix (auto-generated)

---

## 4. Release Process

### 4.1 Release Checklist

- [ ] All CI checks pass on `main`
- [ ] SOUP list regenerated (`npm run generate:soup`)
- [ ] Traceability matrix regenerated (`npm run generate:traceability`)
- [ ] Validation audit clean (`npm run audit:validation`)
- [ ] Changelog updated with release notes
- [ ] Docker image built and tested
- [ ] Health check endpoint verified
- [ ] Smoke test completed (5 representative calculators)
- [ ] Release tagged in git

### 4.2 Smoke Test Calculators

After each deployment, verify these 5 representative calculators:

1. **BMI/BSA** (simple formula, unit conversion)
2. **APACHE II** (complex scoring, FHIR auto-populate)
3. **CHA₂DS₂-VASc** (scoring with radio buttons)
4. **CKD-EPI** (formula with lab values)
5. **GCS** (scoring with FHIR integration)

### 4.3 Rollback Procedure

1. Identify the issue (Sentry alerts, user reports, health check failure)
2. Stop current container: `docker stop medcalcehr-app`
3. Deploy previous version: `docker run medcalcehr:<previous-sha>`
4. Verify health check: `curl /api/health`
5. Document the incident and root cause

---

## 5. Bug Report Process

### 5.1 Reporting Template

```
**Reporter:** [Name/Role]
**Date:** [YYYY-MM-DD]
**Severity:** [Critical/Major/Minor]
**Calculator Affected:** [Calculator ID or "System"]

**Description:**
[What happened vs. what was expected]

**Steps to Reproduce:**
1. ...
2. ...

**Clinical Impact:**
[Does this affect calculation accuracy? Patient safety risk?]

**Screenshots/Evidence:**
[If applicable]
```

### 5.2 Severity Definitions

| Severity | Definition | Response Time | Resolution Time |
|----------|-----------|---------------|-----------------|
| Critical | Incorrect calculation result affecting patient safety | Immediate | 4 hours |
| Major | Feature broken but workaround exists | 4 hours | 24 hours |
| Minor | UI issue, cosmetic, non-clinical | 24 hours | 1 week |

### 5.3 Triage Process

1. Receive bug report
2. Classify severity and clinical impact
3. If Critical: Disable affected calculator, deploy hotfix
4. If Major/Minor: Add to sprint backlog, prioritize by impact
5. Fix, test (including golden dataset), deploy
6. Verify fix with reporter

---

## 6. Clinical Review Process

### 6.1 Scope

Clinical review is required for:
- New calculator additions
- Changes to calculation formulas or scoring logic
- Modification of interpretation text or risk classifications
- Changes to FHIR data mapping (LOINC codes)
- Changes to validation rules (physiological ranges)
- Updates to golden dataset expected values

### 6.2 Review Procedure

1. Developer prepares change with clinical reference citations
2. Clinical reviewer (physician/pharmacist) reviews:
   - Formula accuracy against published literature
   - Interpretation text clinical correctness
   - Golden dataset expected values
   - Edge case handling
3. Reviewer documents approval in PR comment
4. Approval recorded in change log

### 6.3 Clinical Reviewer Qualifications

- Licensed physician, pharmacist, or clinical specialist
- Familiar with the clinical domain of the calculator
- Trained on the MEDCALCEHR review process

---

## 7. Training Record Template

### 7.1 User Training

| Trainee | Role | Training Date | Topics Covered | Trainer | Signature |
|---------|------|---------------|----------------|---------|-----------|
| | | | | | |

### 7.2 Training Topics

1. **Basic Usage**: Navigating calculators, interpreting results
2. **FHIR Integration**: Understanding auto-populated data, staleness warnings
3. **Data Entry**: Validation zones (green/yellow/red), unit conversion
4. **Limitations**: Disclaimer understanding, when to override
5. **Troubleshooting**: Offline mode, session timeout, error reporting

### 7.3 Developer Training

| Developer | Date | Topics | Trainer | Signature |
|-----------|------|--------|---------|-----------|
| | | | | |

### 7.4 Developer Training Topics

1. **Architecture**: Factory pattern, calculator configuration
2. **Testing**: Unit tests, golden datasets, E2E tests
3. **FHIR**: SMART on FHIR launch, data retrieval, LOINC mapping
4. **Security**: CSP, input sanitization, PHI handling
5. **Deployment**: Docker build, CI/CD pipeline, rollback procedure
6. **QMS**: Change management, clinical review, bug reporting

---

## 8. Document Control

| Document | Location | Auto-Generated | Update Trigger |
|----------|----------|---------------|----------------|
| SOUP List | `docs/compliance/SOUP_LIST.md` | Yes | Dependency change |
| Traceability Matrix | `docs/compliance/TRACEABILITY_MATRIX.md` | Yes | Calculator change |
| Risk Management | `docs/compliance/RISK_MANAGEMENT.md` | No | Risk assessment change |
| SRS | `docs/compliance/SRS.md` | No | Requirements change |
| Validation Audit | `docs/compliance/VALIDATION_AUDIT.md` | Yes | Validation rule change |
| Architecture | `docs/ARCHITECTURE.md` | No | Architecture change |
| QMS (this document) | `docs/compliance/QMS_LITE.md` | No | Process change |

---

## 9. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Software Lead | | | |
| Quality Manager | | | |
| Clinical Director | | | |
