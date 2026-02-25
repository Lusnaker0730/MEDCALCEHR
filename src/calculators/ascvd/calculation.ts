/**
 * ASCVD Risk Calculator - Pure Calculation Logic
 *
 * References:
 * - 2013 ACC/AHA Pooled Cohort Equations (PCE)
 * - Goff DC Jr, Lloyd-Jones DM, et al. Circulation. 2014;129:S49-S73.
 */

import { ValidationError } from '../../errorHandler.js';
import type { AlertSeverity } from '../../types/index.js';

// ==========================================
// Exported Coefficients for SaMD Testing
// ==========================================

/**
 * PCE Coefficients from 2013 ACC/AHA Guidelines
 * Source: Goff DC Jr, et al. Circulation. 2014;129:S49-S73
 */
export const PCE_COEFFICIENTS = {
    whiteMale: {
        lnAge: 12.344,
        lnTC: 11.853,
        lnAgeLnTC: -2.664,
        lnHDL: -7.99,
        lnAgeLnHDL: 1.769,
        lnSBP_treated: 1.797,
        lnSBP_untreated: 1.764,
        smoker: 7.837,
        lnAgeSmoker: -1.795,
        diabetes: 0.658,
        meanCoeff: 61.18,
        baselineSurvival: 0.9144
    },
    aaMale: {
        lnAge: 2.469,
        lnTC: 0.302,
        lnHDL: -0.307,
        lnSBP_treated: 1.916,
        lnSBP_untreated: 1.809,
        smoker: 0.549,
        diabetes: 0.645,
        meanCoeff: 19.54,
        baselineSurvival: 0.8954
    },
    whiteFemale: {
        lnAge: -29.799,
        lnAgeSq: 4.884,
        lnTC: 13.54,
        lnAgeLnTC: -3.114,
        lnHDL: -13.578,
        lnAgeLnHDL: 3.149,
        lnSBP_treated: 2.019,
        lnSBP_untreated: 1.957,
        smoker: 7.574,
        lnAgeSmoker: -1.665,
        diabetes: 0.661,
        meanCoeff: -29.18,
        baselineSurvival: 0.9665
    },
    aaFemale: {
        lnAge: 17.114,
        lnTC: 0.94,
        lnHDL: -18.92,
        lnAgeLnHDL: 4.475,
        lnSBP_treated: 29.291,
        lnSBP_untreated: 27.82,
        lnAgeLnSBP: -6.432,
        smoker: 0.691,
        diabetes: 0.874,
        meanCoeff: 86.61,
        baselineSurvival: 0.9533
    }
};

// ==========================================
// Interfaces
// ==========================================

export interface AscvdPatient {
    age: number;
    tc: number;
    hdl: number;
    ldl?: number;
    sbp: number;
    dbp?: number;
    isMale: boolean;
    race: 'white' | 'aa' | 'other';
    onHtnTx: boolean;
    isDiabetic: boolean;
    isSmoker: boolean;
    smokerStatus: 'current' | 'former' | 'never';
}

export interface AscvdResult {
    results: any[];
    risk: number;
    patient: AscvdPatient;
}

// ==========================================
// Core Calculation Functions
// ==========================================

/**
 * Pure function for PCE (Pooled Cohort Equations) Calculation
 * @param patient - Patient data object
 * @returns 10-year ASCVD risk as percentage (0-100)
 */
export function calculatePCE(patient: AscvdPatient): number {
    const lnAge = Math.log(patient.age);
    const lnTC = Math.log(patient.tc);
    const lnHDL = Math.log(patient.hdl);
    const lnSBP = Math.log(patient.sbp);

    let individualSum = 0;
    let baselineSurvival = 0;
    let meanValue = 0;

    if (patient.isMale) {
        if (patient.race === 'white' || patient.race === 'other') {
            const c = PCE_COEFFICIENTS.whiteMale;
            individualSum =
                c.lnAge * lnAge +
                c.lnTC * lnTC +
                c.lnAgeLnTC * lnAge * lnTC +
                c.lnHDL * lnHDL +
                c.lnAgeLnHDL * lnAge * lnHDL +
                (patient.onHtnTx ? c.lnSBP_treated : c.lnSBP_untreated) * lnSBP +
                c.smoker * (patient.isSmoker ? 1 : 0) +
                c.lnAgeSmoker * lnAge * (patient.isSmoker ? 1 : 0) +
                c.diabetes * (patient.isDiabetic ? 1 : 0);
            meanValue = c.meanCoeff;
            baselineSurvival = c.baselineSurvival;
        } else {
            // African American Male
            const c = PCE_COEFFICIENTS.aaMale;
            individualSum =
                c.lnAge * lnAge +
                c.lnTC * lnTC +
                c.lnHDL * lnHDL +
                (patient.onHtnTx ? c.lnSBP_treated : c.lnSBP_untreated) * lnSBP +
                c.smoker * (patient.isSmoker ? 1 : 0) +
                c.diabetes * (patient.isDiabetic ? 1 : 0);
            meanValue = c.meanCoeff;
            baselineSurvival = c.baselineSurvival;
        }
    } else {
        // Female
        if (patient.race === 'white' || patient.race === 'other') {
            const c = PCE_COEFFICIENTS.whiteFemale;
            individualSum =
                c.lnAge * lnAge +
                c.lnAgeSq * lnAge * lnAge +
                c.lnTC * lnTC +
                c.lnAgeLnTC * lnAge * lnTC +
                c.lnHDL * lnHDL +
                c.lnAgeLnHDL * lnAge * lnHDL +
                (patient.onHtnTx ? c.lnSBP_treated : c.lnSBP_untreated) * lnSBP +
                c.smoker * (patient.isSmoker ? 1 : 0) +
                c.lnAgeSmoker * lnAge * (patient.isSmoker ? 1 : 0) +
                c.diabetes * (patient.isDiabetic ? 1 : 0);
            meanValue = c.meanCoeff;
            baselineSurvival = c.baselineSurvival;
        } else {
            // African American Female
            const c = PCE_COEFFICIENTS.aaFemale;
            individualSum =
                c.lnAge * lnAge +
                c.lnTC * lnTC +
                c.lnHDL * lnHDL +
                c.lnAgeLnHDL * lnAge * lnHDL +
                (patient.onHtnTx ? c.lnSBP_treated : c.lnSBP_untreated) * lnSBP +
                c.lnAgeLnSBP * lnAge * lnSBP +
                c.smoker * (patient.isSmoker ? 1 : 0) +
                c.diabetes * (patient.isDiabetic ? 1 : 0);
            meanValue = c.meanCoeff;
            baselineSurvival = c.baselineSurvival;
        }
    }

    const risk = (1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanValue))) * 100;
    return Math.max(0, Math.min(100, risk));
}

/**
 * Calculates optimal 10-year ASCVD risk (assuming optimal risk factors)
 * Reference: ACC ASCVD Risk Estimator Plus "Optimal Risk" calculation logic
 * Optimal values: TC=170 mg/dL, HDL=50 mg/dL, SBP=110 mmHg, Not treated for HTN, Non-smoker, Non-diabetic
 */
export function getOptimalRisk(patient: AscvdPatient): number | null {
    if (patient.age < 40 || patient.age > 79) return null;

    const optimalPatient: AscvdPatient = {
        ...patient,
        tc: 170,
        hdl: 50,
        sbp: 110,
        onHtnTx: false,
        isSmoker: false,
        smokerStatus: 'never',
        isDiabetic: false
    };

    return calculatePCE(optimalPatient);
}

/**
 * Main calculation function with validation
 * @param values - Input values from calculator form
 * @returns AscvdResult object with risk, patient data, and formatted results
 */
export const ascvdCalculationPure = (values: Record<string, any>): AscvdResult => {
    // 1. Check Known ASCVD
    if (values['known-ascvd']) {
        return {
            risk: 0,
            patient: {} as AscvdPatient,
            results: [
                {
                    label: '10-Year ASCVD Risk',
                    value: 'High Risk',
                    interpretation: 'Known Clinical ASCVD (History of MI, stroke, PAD)',
                    alertClass: 'danger' as AlertSeverity
                },
                {
                    label: 'Recommendation',
                    value: 'Secondary Prevention',
                    interpretation: 'High-intensity statin therapy is indicated.',
                    alertClass: 'warning' as AlertSeverity
                }
            ]
        };
    }

    // 2. Validate Core Inputs
    const requiredFields = ['ascvd-age', 'ascvd-tc', 'ascvd-hdl', 'ascvd-sbp'];
    const missing = requiredFields.filter(f => values[f] === undefined || values[f] === null);

    if (missing.length > 0) {
        throw new ValidationError(
            'Please complete all fields (Age, TC, HDL, SBP).',
            'MISSING_DATA'
        );
    }

    const age = values['ascvd-age'];
    const tc = values['ascvd-tc'];
    const hdl = values['ascvd-hdl'];
    const sbp = values['ascvd-sbp'];
    const ldl = values['ascvd-ldl'];
    const dbp = values['ascvd-dbp'];

    // Validate age range explicitly
    if (age < 20 || age > 79) {
        throw new ValidationError(`Valid for ages 20-79. Current age: ${age}.`, 'OUT_OF_RANGE');
    }

    // 2a. Cross-Field Validations
    if (values['ascvd-dbp'] !== undefined && values['ascvd-sbp'] !== undefined) {
        if (values['ascvd-dbp'] >= values['ascvd-sbp']) {
            throw new ValidationError('Diastolic blood pressure must be less than systolic blood pressure.', 'LOGIC_ERROR');
        }
    }

    if (values['ascvd-tc'] !== undefined && values['ascvd-hdl'] !== undefined && values['ascvd-ldl'] !== undefined) {
        if (values['ascvd-hdl'] + values['ascvd-ldl'] >= values['ascvd-tc']) {
            throw new ValidationError('HDL + LDL must be less than Total Cholesterol (TC also includes VLDL and other lipoproteins).', 'LOGIC_ERROR');
        }
    }

    // 3. Prepare Patient Object
    // Per ACC guidelines: 'former' smoker who quit ≥2 years is treated as non-smoker in PCE
    const smokerStatus = (values['ascvd-smoker'] || 'never') as 'current' | 'former' | 'never';
    const isSmoker = smokerStatus === 'current';

    const patient: AscvdPatient = {
        age,
        tc,
        hdl,
        ldl,
        sbp,
        dbp,
        isMale: values['ascvd-gender'] !== 'female',
        race: values['ascvd-race'] || 'white',
        onHtnTx: values['ascvd-htn'] === 'yes',
        isDiabetic: values['ascvd-dm'] === 'yes',
        isSmoker,
        smokerStatus
    };

    // 4. Calculate Risk
    // 10-year risk is only valid for ages 40-79
    const isTenYearValid = patient.age >= 40 && patient.age <= 79;
    const risk = isTenYearValid ? calculatePCE(patient) : 0;
    const optimalRisk = isTenYearValid ? getOptimalRisk(patient) : null;

    // 5. Interpret Result
    let interpretation = '';
    let alertClass: AlertSeverity = 'info';

    if (!isTenYearValid) {
        interpretation = `10-year ASCVD risk is validated for ages 40-79. For age ${patient.age}, please refer to the Lifetime Risk panel below.`;
        alertClass = 'info';
    } else if (risk < 5) {
        interpretation = 'Low Risk (<5%). Emphasize lifestyle modifications.';
        alertClass = 'success';
    } else if (risk < 7.5) {
        interpretation =
            'Borderline Risk (5-7.4%). Discuss risk. Consider moderate-intensity statin.';
        alertClass = 'warning';
    } else if (risk < 20) {
        interpretation = 'Intermediate Risk (7.5-19.9%). Initiate moderate-intensity statin.';
        alertClass = 'warning';
    } else {
        interpretation = 'High Risk (≥20%). Initiate high-intensity statin.';
        alertClass = 'danger';
    }

    if (patient.ldl !== undefined && patient.ldl >= 190) {
        interpretation = 'High Risk. Primary Severe Hypercholesterolemia (LDL ≥ 190 mg/dL). Initiate high-intensity statin regardless of 10-year risk score.';
        alertClass = 'danger';
    }

    if (patient.race === 'other' && isTenYearValid) {
        interpretation +=
            '<br><small>Note: Risk for "Other" race may be over- or underestimated.</small>';
    }

    const results: any[] = [];
    if (isTenYearValid) {
        results.push({
            label: '10-Year ASCVD Risk',
            value: risk.toFixed(1),
            unit: '%',
            interpretation: interpretation,
            alertClass: alertClass
        });

        if (optimalRisk !== null && optimalRisk < risk) {
            results.push({
                label: 'Optimal 10-Year Risk',
                value: optimalRisk.toFixed(1),
                unit: '%',
                interpretation: 'Estimated risk if all modifiable risk factors were optimal (TC=170, HDL=50, SBP=110, untreated HTN, non-smoker, no diabetes).',
                alertClass: 'success'
            });
        }
    } else {
        results.push({
            label: '10-Year ASCVD Risk',
            value: 'N/A',
            interpretation: interpretation,
            alertClass: 'info'
        });
    }

    return {
        risk,
        patient,
        results
    };
};

// ==========================================
// Therapy Impact (Million Hearts RR Method)
// ==========================================

export interface TherapyOptions {
    highIntensityStatin?: boolean;
    moderateIntensityStatin?: boolean;
    smokingCessation?: boolean;
    bpControl?: boolean;         // treat to SBP <130 mmHg
    aspirin?: boolean;
}

export interface TherapyImpactResult {
    treatedRisk: number;
    arr: number;           // Absolute Risk Reduction (%)
    rrr: number;           // Relative Risk Reduction (%)
    nnt: number | null;    // Number Needed to Treat (10 yr)
    interventions: string[];
}

/**
 * Calculate therapy impact using Million Hearts Longitudinal RR multipliers.
 * Reference: Karmali et al. Circulation. 2015;132(16):1571-8.
 *
 * RR values from high-quality meta-analyses:
 *   High-intensity statin:   RR 0.75  (CTT Collaboration, LDL↓≥50%)
 *   Moderate statin:         RR 0.82  (proportional to LDL reduction)
 *   Smoking cessation:       RR 0.85  (short-term; full effect ≈10 yr)
 *   BP control to <130:      RR 0.73  (Ettehad et al. Lancet 2016)
 *   Aspirin (qualified):     RR 0.90  (conservative primary prevention)
 */
export function calculateTherapyImpact(
    baselineRisk: number,
    options: TherapyOptions
): TherapyImpactResult {
    const interventions: string[] = [];
    let combinedRR = 1.0;

    // Statin therapy (prioritise high over moderate)
    if (options.highIntensityStatin) {
        combinedRR *= 0.75;
        interventions.push('High-intensity statin (≥50% LDL↓, RR 0.75)');
    } else if (options.moderateIntensityStatin) {
        combinedRR *= 0.82;
        interventions.push('Moderate-intensity statin (30-49% LDL↓, RR 0.82)');
    }

    if (options.smokingCessation) {
        combinedRR *= 0.85;
        interventions.push('Smoking cessation (RR 0.85)');
    }

    if (options.bpControl) {
        combinedRR *= 0.73;
        interventions.push('BP control to <130 mmHg (RR 0.73)');
    }

    if (options.aspirin) {
        combinedRR *= 0.90;
        interventions.push('Low-dose aspirin (RR 0.90)');
    }

    const treatedRisk = Math.max(0, baselineRisk * combinedRR);
    const arr = Math.max(0, baselineRisk - treatedRisk);
    const rrr = baselineRisk > 0 ? ((1 - combinedRR) * 100) : 0;
    const nnt = arr > 0 ? Math.round(100 / arr) : null;

    return { treatedRisk, arr, rrr, nnt, interventions };
}

// ==========================================
// Lifetime Risk (Framingham category method)
// ==========================================

/**
 * Estimate lifetime ASCVD risk for patients aged 40-59 with low 10-year risk.
 * Uses major risk factor count to classify into published lifetime risk categories.
 * Reference: Lloyd-Jones DM et al. Circulation. 2006;113(6):791-798.
 *
 * Major Risk Factors:
 *   - Current/former smoking
 *   - Total cholesterol ≥240 mg/dL
 *   - Systolic BP ≥160 mmHg (untreated) or on antihypertensive therapy
 *   - Diabetes mellitus
 */
export function getLifetimeRisk(patient: AscvdPatient): {
    category: string;
    lifetimeRisk: string;
    description: string;
} | null {
    // Lifetime risk meaningful for age 20-59
    // Reference: 2013 ACC/AHA Guidelines recommend lifetime risk discussion for ages 20-59
    if (patient.age < 20 || patient.age > 59) return null;

    // Count major risk factors
    let majorRFs = 0;
    if (patient.isSmoker || patient.smokerStatus === 'former') majorRFs++;
    if (patient.tc >= 240) majorRFs++;
    if (patient.sbp >= 160 || patient.onHtnTx) majorRFs++;
    if (patient.isDiabetic) majorRFs++;

    // Count elevated (but not major) risk factors
    const hasElevatedRF = patient.tc >= 200 || patient.sbp >= 130 || patient.hdl < 50;
    const isOptimal = majorRFs === 0 && !hasElevatedRF;

    if (majorRFs >= 2) {
        return {
            category: '≥2 Major Risk Factors',
            lifetimeRisk: '~69%',
            description: 'Multiple major risk factors present — high lifetime risk'
        };
    } else if (majorRFs === 1) {
        return {
            category: '1 Major Risk Factor',
            lifetimeRisk: '~50%',
            description: 'One major risk factor present — elevated lifetime risk'
        };
    } else if (hasElevatedRF) {
        return {
            category: 'Elevated (Not Major) Risk Factors',
            lifetimeRisk: '~36%',
            description: 'Elevated but below threshold risk factors — moderate lifetime risk'
        };
    } else if (isOptimal) {
        return {
            category: 'Optimal Risk Factors',
            lifetimeRisk: '~5%',
            description: 'All risk factors near optimal — low lifetime risk'
        };
    }
    return null;
}

// ==========================================
// Aspirin Recommendation (2022 USPSTF / ACC)
// ==========================================

export interface AspirinRecommendation {
    recommendation: 'consider' | 'not-recommended' | 'not-applicable';
    title: string;
    rationale: string;
    alertClass: 'success' | 'warning' | 'danger' | 'info';
}

/**
 * Generate aspirin recommendation per 2022 USPSTF/ACC guidelines.
 *
 * 2022 USPSTF update:
 *   - Age 40-59, risk ≥10%: Small net benefit — individualized decision
 *   - Age 40-59, risk <10%:  Insufficient evidence / not recommended
 *   - Age ≥60:               Do not initiate (harm outweighs benefit)
 */
export function getAspirinRecommendation(
    patient: AscvdPatient,
    tenYearRisk: number
): AspirinRecommendation {
    if (patient.age < 40 || patient.age > 79) {
        return {
            recommendation: 'not-applicable',
            title: 'Aspirin: N/A',
            rationale: 'PCE valid for ages 40-79 only.',
            alertClass: 'info'
        };
    }

    if (patient.age >= 60) {
        return {
            recommendation: 'not-recommended',
            title: 'Aspirin: Not Recommended',
            rationale:
                'For adults ≥60 years, initiating aspirin for primary prevention is NOT recommended (2022 USPSTF). Bleeding risk outweighs cardiovascular benefit.',
            alertClass: 'danger'
        };
    }

    // Age 40-59
    if (tenYearRisk >= 10) {
        return {
            recommendation: 'consider',
            title: 'Aspirin: Consider (Shared Decision-Making)',
            rationale:
                'For adults 40-59 years with 10-year ASCVD risk ≥10%, low-dose aspirin (81 mg/day) may be considered. ' +
                'Individualize based on bleeding risk factors (prior GI bleed, NSAIDs use, anticoagulant use). ' +
                'Net benefit is small — shared decision-making is essential (2022 USPSTF Grade C).',
            alertClass: 'warning'
        };
    }

    return {
        recommendation: 'not-recommended',
        title: 'Aspirin: Not Recommended',
        rationale:
            'For adults 40-59 years with 10-year ASCVD risk <10%, initiating aspirin for primary prevention is not recommended. ' +
            'Current evidence does not support net benefit over bleeding risk (2022 USPSTF).',
        alertClass: 'info'
    };
}

// ==========================================
// CAC Score Guidance
// ==========================================

export interface CACGuidance {
    show: boolean;
    title: string;
    guidance: string;
    interpretation: string;
    alertClass: 'info' | 'warning' | 'success';
}

/**
 * Generate CAC score guidance based on 10-year ASCVD risk category.
 * Reference: 2018 AHA/ACC Cholesterol Guidelines; Grundy SM et al. Circulation. 2019;139(25).
 *
 * CAC is most useful in patients where treatment decision is uncertain
 * (borderline or intermediate risk).
 */
export function getCACGuidance(tenYearRisk: number): CACGuidance {
    if (tenYearRisk < 5) {
        // Low risk — CAC generally not needed
        return {
            show: false,
            title: '',
            guidance: '',
            interpretation: '',
            alertClass: 'info'
        };
    }

    if (tenYearRisk < 7.5) {
        // Borderline risk — CAC most valuable here
        return {
            show: true,
            title: '🫀 CAC Score: Recommended for Decision Support',
            guidance:
                'In borderline-risk patients (5–7.4%), CAC score is the most evidence-based tool to reclassify risk and guide statin decisions.',
            interpretation:
                '• CAC = 0 → Risk is lower than expected; statin initiation may be deferred\n' +
                '• CAC 1–99 → Favour statin therapy, especially if age ≥55\n' +
                '• CAC ≥100 (or ≥75th percentile) → Initiate statin therapy',
            alertClass: 'warning'
        };
    }

    if (tenYearRisk < 20) {
        // Intermediate risk — CAC useful if decision remains uncertain
        return {
            show: true,
            title: '🫀 CAC Score: Consider if Decision Uncertain',
            guidance:
                'In intermediate-risk patients (7.5–19.9%), a CAC score is reasonable if the patient or clinician remains uncertain about initiating statin therapy after a risk discussion.',
            interpretation:
                '• CAC = 0 → Statin may be withheld; reassess in 5–10 years\n' +
                '• CAC 1–99 → Moderate statin therapy preferred\n' +
                '• CAC ≥100 (or ≥75th percentile) → High-intensity statin indicated',
            alertClass: 'info'
        };
    }

    // High risk — CAC not needed (statin already indicated)
    return {
        show: false,
        title: '',
        guidance: '',
        interpretation: '',
        alertClass: 'info'
    };
}

