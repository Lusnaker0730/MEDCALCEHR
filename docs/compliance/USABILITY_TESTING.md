# Usability Testing Plan

**Product:** MEDCALCEHR
**Version:** 1.0.0
**Standard Reference:** IEC 62366-1 (Usability Engineering for Medical Devices)

---

## 1. Purpose

This document defines the usability testing plan for MEDCALCEHR clinical calculator platform. The goal is to validate that the user interface is safe, effective, and efficient for clinical use within the hospital setting.

---

## 2. Test Participants

### 2.1 Representative User Profiles

| # | Role | Experience Level | Technical Proficiency | Primary Use Case |
|---|------|-----------------|----------------------|------------------|
| 1 | ICU Attending Physician | 10+ years | Moderate | Complex scoring (APACHE II, SOFA) |
| 2 | Emergency Medicine Resident | 2-3 years | High | Quick risk scores (HEART, Wells, PERC) |
| 3 | Clinical Pharmacist | 5+ years | Moderate | Drug dosing (CrCl, Phenytoin, MME) |
| 4 | Ward Nurse | 5+ years | Basic | Basic assessments (GCS, MEWS, Braden) |
| 5 | Medical Student / Intern | <1 year | High | Learning tool, general calculators |

### 2.2 Recruitment Criteria

- Minimum 5 participants (1 per user profile)
- Must be active hospital staff in relevant department
- Mix of age groups and digital literacy levels
- No prior experience with MEDCALCEHR (for initial testing)

---

## 3. Test Tasks

### Task 1: Find and Use a Basic Calculator

**Scenario:** You need to calculate a patient's BMI and BSA.

**Steps:**
1. Open the application from the EHR
2. Find the BMI/BSA calculator
3. Enter: Weight 72 kg, Height 168 cm
4. Read and interpret the result

**Success Criteria:**
- Calculator found within 60 seconds
- Correct result displayed
- User can verbalize interpretation

**Measures:** Time to completion, error count, success rate

---

### Task 2: Use Auto-Populated FHIR Data

**Scenario:** You are reviewing a patient's APACHE II score in the ICU.

**Steps:**
1. Navigate to the APACHE II calculator
2. Observe auto-populated lab values from EHR
3. Verify data freshness (check date labels)
4. Enter any missing manual values
5. Review the calculated score and mortality estimate

**Success Criteria:**
- User identifies auto-populated vs. manual fields
- User notices and understands data staleness warnings
- User can interpret the score and mortality percentage

**Measures:** Time to completion, error count, comprehension accuracy

---

### Task 3: Handle Validation Warnings

**Scenario:** Enter an unusual but valid creatinine value.

**Steps:**
1. Open CKD-EPI calculator
2. Enter Creatinine = 8.5 mg/dL (high but valid)
3. Observe yellow zone warning
4. Decide whether to proceed or correct
5. View the calculated GFR result

**Success Criteria:**
- User notices the warning message
- User understands what the warning means
- User makes an informed decision to proceed or correct

**Measures:** Warning noticed (yes/no), comprehension, time to decision

---

### Task 4: Switch Language and Use in Chinese

**Scenario:** Switch the interface to Traditional Chinese and use a calculator.

**Steps:**
1. Locate the language toggle
2. Switch to Traditional Chinese
3. Navigate to a calculator (e.g., BMI)
4. Enter values and interpret the result
5. Switch back to English

**Success Criteria:**
- Language toggle found within 30 seconds
- Interface fully updates to Chinese
- User can complete calculation in Chinese
- No confusion from bilingual clinical terms

**Measures:** Time to find toggle, completion success, language comprehension

---

### Task 5: Use Search and Filtering

**Scenario:** Find a calculator by searching and filtering.

**Steps:**
1. Use the search bar to find "Wells"
2. Filter by category "Cardiovascular"
3. Use "Favorites" to bookmark a calculator
4. Return to homepage and access the favorited calculator

**Success Criteria:**
- Search returns relevant results
- Category filter works intuitively
- Favorite functionality is understood and used correctly

**Measures:** Time to find calculator, number of wrong paths, satisfaction

---

## 4. Test Environment

| Aspect | Configuration |
|--------|---------------|
| Device | Hospital workstation (desktop, 1920x1080) |
| Browser | Chrome (latest) |
| Network | Hospital intranet with FHIR server access |
| EHR Integration | SMART on FHIR launch with test patient |
| Observer | 1 facilitator + 1 note-taker |
| Recording | Screen recording + think-aloud audio |

---

## 5. Measurement Criteria

### 5.1 Quantitative Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| Task Completion Rate | > 90% | Pass/Fail per task |
| Time to Complete (Basic Task) | < 2 minutes | Stopwatch |
| Time to Complete (Complex Task) | < 5 minutes | Stopwatch |
| Error Rate | < 2 errors per task | Observer count |
| Critical Error Rate | 0 | Observer count |

### 5.2 Qualitative Metrics

| Metric | Scale | Method |
|--------|-------|--------|
| Ease of Use | 1-5 Likert | Post-task questionnaire |
| Confidence in Results | 1-5 Likert | Post-task questionnaire |
| Overall Satisfaction | SUS (System Usability Scale) | Post-session questionnaire |
| Clinical Appropriateness | 1-5 Likert | Clinical reviewer assessment |

### 5.3 Critical Errors (Safety)

A **critical error** is any usability issue that could lead to:
- Using the wrong calculator
- Entering data in the wrong field
- Misinterpreting a calculation result
- Missing a validation warning
- Using stale/incorrect auto-populated data

---

## 6. Recording Template

### 6.1 Per-Task Record

```
Task #: ___
Participant #: ___
Date: ___________
Facilitator: ___________

Start Time: _____  End Time: _____  Duration: _____ sec

Completion: [ ] Success  [ ] Success with help  [ ] Failure

Errors:
1. ___________________
2. ___________________

Observations:
___________________

User Comments:
___________________

Ease of Use (1-5): ___
Confidence (1-5): ___
```

### 6.2 Post-Session Questionnaire (SUS)

System Usability Scale — 10 questions scored 1(Strongly Disagree) to 5(Strongly Agree):

1. I think I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think I would need technical support to use this system.
5. I found the various functions were well integrated.
6. I thought there was too much inconsistency in this system.
7. I imagine most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot before I could use this system.

**SUS Score Target:** > 68 (above average)

---

## 7. Issue Tracking

| Issue # | Task | Severity | Description | Recommendation | Status |
|---------|------|----------|-------------|----------------|--------|
| | | | | | |

**Severity Levels:**
- **Critical**: Could lead to clinical error — must fix before deployment
- **Major**: Significantly impacts usability — should fix
- **Minor**: Cosmetic or minor inconvenience — nice to fix

---

## 8. Schedule

| Phase | Activity | Duration |
|-------|----------|----------|
| Preparation | Environment setup, participant recruitment | 1 week |
| Pilot Test | 1 participant, refine tasks | 1 day |
| Main Testing | 5 participants | 1 week |
| Analysis | Compile results, identify issues | 3 days |
| Report | Final usability report | 2 days |

---

## 9. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Usability Lead | | | |
| Clinical Director | | | |
| Quality Manager | | | |
