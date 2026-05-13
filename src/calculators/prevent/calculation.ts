/**
 * AHA PREVENT (Predicting Risk of cardiovascular disease EVENTs) — Pure calculation logic.
 *
 * Reference:
 *   Khan SS, Matsushita K, Sang Y, et al. Development and Validation of the
 *   American Heart Association's PREVENT Equations. Circulation. 2024;149(6):430-449.
 *   doi:10.1161/CIRCULATIONAHA.123.067626
 *
 * Coefficients extracted from the official supplement and cross-validated against
 * the open-source `preventr` R package (Mayer M, github.com/martingmayer/preventr).
 *
 * Implementation supports the Base, +HbA1c, +UACR, and Full (HbA1c+UACR) models for
 * both 10-year and 30-year horizons. The Social Deprivation Index (SDI) model is
 * not implemented because SDI requires a US ZIP code, which is not applicable
 * to the Taiwan deployment of this software. When the Full table is used the
 * SDI portion of the term vector is set to "missing", which matches what the
 * PREVENT equations do for ZIP codes with no SDI data (Khan 2023, Supplement).
 */

import { ValidationError } from '../../errorHandler.js';
import type { AlertSeverity } from '../../types/index.js';
import {
    BASE_10YR,
    BASE_30YR,
    HBA1C_10YR,
    HBA1C_30YR,
    UACR_10YR,
    UACR_30YR,
    FULL_10YR,
    FULL_30YR
} from './coefficients.js';

// ==========================================
// Types
// ==========================================

export type PreventSex = 'female' | 'male';
export type PreventModel = 'base' | 'hba1c' | 'uacr' | 'full';
export type PreventTime = '10yr' | '30yr';
export type PreventOutcome = 'totalCvd' | 'ascvd' | 'heartFailure' | 'chd' | 'stroke';

export interface PreventPatient {
    age: number;                 // years, 30-79
    sex: PreventSex;
    sbp: number;                 // mmHg, 90-180
    totalCholesterol: number;    // mg/dL
    hdl: number;                 // mg/dL
    bmi: number;                 // kg/m^2, 18.5-39.9
    egfr: number;                // mL/min/1.73m^2, 15-140
    diabetes: boolean;
    smoking: boolean;
    onAntihypertensive: boolean;
    onStatin: boolean;
    hba1c?: number;              // %, 4.5-15 (optional)
    uacr?: number;               // mg/g, 0.1-25000 (optional)
}

export interface PreventRisks {
    totalCvd: number;            // probability (0-1)
    ascvd: number;
    heartFailure: number;
    chd: number;
    stroke: number;
}

export interface PreventEstimate {
    model: PreventModel;
    time: PreventTime;
    risks: PreventRisks;
}

// ==========================================
// Constants
// ==========================================

// mg/dL → mmol/L for cholesterol (Khan 2023 uses 0.02586)
const CHOL_MGDL_TO_MMOL = 0.02586;

// Centering values used during equation development
const AGE_CENTER = 55;
const NON_HDL_CENTER_MMOL = 3.5;
const HDL_CENTER_MMOL = 1.3;
const HDL_DIVISOR = 0.3;
const SBP_KNOT = 110;
const SBP_CENTER = 130;
const SBP_DIVISOR = 20;
const BMI_KNOT = 30;
const BMI_CENTER = 25;
const BMI_DIVISOR = 5;
const EGFR_KNOT = 60;
const EGFR_CENTER = 90;
const EGFR_DIVISOR = -15;
const HBA1C_CENTER = 5.3;

// ==========================================
// Validation
// ==========================================

interface PreventInputs {
    age: number;
    sex: PreventSex;
    sbp: number;
    totalCholesterol: number;
    hdl: number;
    bmi: number;
    egfr: number;
    diabetes: boolean;
    smoking: boolean;
    onAntihypertensive: boolean;
    onStatin: boolean;
    hba1c?: number;
    uacr?: number;
}

function validatePatient(p: PreventInputs): PreventPatient {
    const check = (name: string, value: number, lo: number, hi: number) => {
        if (value === undefined || value === null || Number.isNaN(value)) {
            throw new ValidationError(`${name} is required.`, 'MISSING_DATA');
        }
        if (value < lo || value > hi) {
            throw new ValidationError(
                `${name} must be between ${lo} and ${hi} (got ${value}).`,
                'OUT_OF_RANGE'
            );
        }
    };

    check('Age', p.age, 30, 79);
    check('Systolic BP', p.sbp, 90, 180);
    check('Total cholesterol', p.totalCholesterol, 130, 320);
    check('HDL cholesterol', p.hdl, 20, 100);
    check('BMI', p.bmi, 18.5, 39.9);
    check('eGFR', p.egfr, 15, 140);

    if (p.hdl >= p.totalCholesterol) {
        throw new ValidationError(
            'HDL cholesterol must be less than total cholesterol.',
            'LOGIC_ERROR'
        );
    }

    if (p.hba1c !== undefined && p.hba1c !== null) {
        check('HbA1c', p.hba1c, 4.5, 15);
    }
    if (p.uacr !== undefined && p.uacr !== null) {
        check('UACR', p.uacr, 0.1, 25000);
    }

    return p as PreventPatient;
}

// ==========================================
// Term preparation
// ==========================================

/**
 * Build the predictor term vector that the PREVENT coefficients are dotted with.
 *
 * Order must exactly match the column order embedded in the coefficient tables
 * (which mirrors `prep_terms` in the preventr R package). For piece-wise linear
 * splines on SBP / BMI / eGFR, each leg is centered separately:
 *   - the "occurring" leg is centered at the global center (130, 25, 90)
 *   - the "non-occurring" leg is centered at the knot (110, 30, 60)
 */
function prepBaseTerms(p: PreventPatient, time: PreventTime): number[] {
    const age = (p.age - AGE_CENTER) / 10;
    const nonHdl = (p.totalCholesterol - p.hdl) * CHOL_MGDL_TO_MMOL - NON_HDL_CENTER_MMOL;
    const hdl = (p.hdl * CHOL_MGDL_TO_MMOL - HDL_CENTER_MMOL) / HDL_DIVISOR;
    const sbpLt = (Math.min(p.sbp, SBP_KNOT) - SBP_KNOT) / SBP_DIVISOR;
    const sbpGte = (Math.max(p.sbp, SBP_KNOT) - SBP_CENTER) / SBP_DIVISOR;
    const dm = p.diabetes ? 1 : 0;
    const smoking = p.smoking ? 1 : 0;
    const bmiLt = (Math.min(p.bmi, BMI_KNOT) - BMI_CENTER) / BMI_DIVISOR;
    const bmiGte = (Math.max(p.bmi, BMI_KNOT) - BMI_KNOT) / BMI_DIVISOR;
    const egfrLt = (Math.min(p.egfr, EGFR_KNOT) - EGFR_KNOT) / EGFR_DIVISOR;
    const egfrGte = (Math.max(p.egfr, EGFR_KNOT) - EGFR_CENTER) / EGFR_DIVISOR;
    const bpTx = p.onAntihypertensive ? 1 : 0;
    const statin = p.onStatin ? 1 : 0;

    const terms = [age];
    if (time === '30yr') terms.push(age * age);
    terms.push(
        nonHdl,
        hdl,
        sbpLt,
        sbpGte,
        dm,
        smoking,
        bmiLt,
        bmiGte,
        egfrLt,
        egfrGte,
        bpTx,
        statin,
        bpTx * sbpGte,
        statin * nonHdl,
        age * nonHdl,
        age * hdl,
        age * sbpGte,
        age * dm,
        age * smoking,
        age * bmiGte,
        age * egfrLt
    );
    return terms;
}

function appendHba1cTerms(terms: number[], hba1c: number | undefined, dm: boolean): number[] {
    if (hba1c === undefined || hba1c === null) {
        return [...terms, 0, 0, 1]; // hba1c_dm=0, hba1c_no_dm=0, missing=1
    }
    const centered = hba1c - HBA1C_CENTER;
    return [...terms, dm ? centered : 0, dm ? 0 : centered, 0];
}

function appendUacrTerms(terms: number[], uacr: number | undefined): number[] {
    if (uacr === undefined || uacr === null) {
        return [...terms, 0, 1]; // ln_uacr=0, missing=1
    }
    return [...terms, Math.log(uacr), 0];
}

function appendMissingSdiTerms(terms: number[]): number[] {
    // SDI is not collected in this implementation; treat as missing per Khan 2023.
    return [...terms, 0, 0, 1]; // sdi_4_6=0, sdi_7_10=0, missing=1
}

// ==========================================
// Coefficient lookup
// ==========================================

type CoefTable = Record<PreventSex, Record<PreventOutcome, readonly number[]>>;

function getCoefTable(model: PreventModel, time: PreventTime): CoefTable {
    if (model === 'base') return time === '10yr' ? BASE_10YR : BASE_30YR;
    if (model === 'hba1c') return time === '10yr' ? HBA1C_10YR : HBA1C_30YR;
    if (model === 'uacr') return time === '10yr' ? UACR_10YR : UACR_30YR;
    return time === '10yr' ? FULL_10YR : FULL_30YR;
}

function buildTerms(p: PreventPatient, model: PreventModel, time: PreventTime): number[] {
    const base = prepBaseTerms(p, time);
    let terms: number[];
    if (model === 'base') {
        terms = base;
    } else if (model === 'hba1c') {
        terms = appendHba1cTerms(base, p.hba1c, p.diabetes);
    } else if (model === 'uacr') {
        terms = appendUacrTerms(base, p.uacr);
    } else {
        // full model — SDI is always treated as missing in this implementation
        terms = appendMissingSdiTerms(base);
        terms = appendUacrTerms(terms, p.uacr);
        terms = appendHba1cTerms(terms, p.hba1c, p.diabetes);
    }
    terms.push(1); // constant
    return terms;
}

function dot(coefs: readonly number[], terms: readonly number[]): number {
    if (coefs.length !== terms.length) {
        throw new Error(
            `PREVENT coefficient/term length mismatch: ${coefs.length} vs ${terms.length}`
        );
    }
    let sum = 0;
    for (let i = 0; i < coefs.length; i++) sum += coefs[i] * terms[i];
    return sum;
}

function logistic(x: number): number {
    // Stable form to avoid overflow for large |x|
    if (x >= 0) {
        const e = Math.exp(-x);
        return 1 / (1 + e);
    }
    const e = Math.exp(x);
    return e / (1 + e);
}

// ==========================================
// Model selection
// ==========================================

/**
 * Pick the most informative model given which optional inputs are present.
 * Mirrors the algorithm in preventr::estimate_risk when model = NULL.
 */
export function selectModel(hba1cPresent: boolean, uacrPresent: boolean): PreventModel {
    if (hba1cPresent && uacrPresent) return 'full';
    if (hba1cPresent) return 'hba1c';
    if (uacrPresent) return 'uacr';
    return 'base';
}

// ==========================================
// Public calculation
// ==========================================

export function calculatePreventOnce(
    p: PreventPatient,
    model: PreventModel,
    time: PreventTime
): PreventRisks {
    const table = getCoefTable(model, time);
    const terms = buildTerms(p, model, time);
    const sex = table[p.sex];

    return {
        totalCvd: logistic(dot(sex.totalCvd, terms)),
        ascvd: logistic(dot(sex.ascvd, terms)),
        heartFailure: logistic(dot(sex.heartFailure, terms)),
        chd: logistic(dot(sex.chd, terms)),
        stroke: logistic(dot(sex.stroke, terms))
    };
}

export function calculatePrevent(p: PreventPatient): {
    model: PreventModel;
    tenYear: PreventRisks;
    thirtyYear: PreventRisks;
} {
    // Public entry point — enforce the published valid ranges so callers can't
    // silently get garbage estimates from extrapolated inputs.
    const validated = validatePatient(p);
    const model = selectModel(validated.hba1c !== undefined, validated.uacr !== undefined);
    return {
        model,
        tenYear: calculatePreventOnce(validated, model, '10yr'),
        thirtyYear: calculatePreventOnce(validated, model, '30yr')
    };
}

// ==========================================
// CKD-EPI 2021 eGFR (race-free) — Inker et al. NEJM 2021;385:1737
// PREVENT uses this race-free reparameterization.
// ==========================================

export function calculateEgfr(
    creatinineMgDl: number,
    age: number,
    sex: PreventSex
): number {
    if (creatinineMgDl <= 0 || age <= 0) return NaN;
    const isFemale = sex === 'female';
    const k = isFemale ? 0.7 : 0.9;
    const a1 = isFemale ? -0.241 : -0.302;
    const a2 = -1.2;
    const c = 0.9938;
    const d = isFemale ? 1.012 : 1.0;
    const cr_k = creatinineMgDl / k;
    const egfr = 142 * Math.min(cr_k, 1) ** a1 * Math.max(cr_k, 1) ** a2 * c ** age * d;
    return Math.round(egfr);
}

// ==========================================
// Form values → calculator result
// ==========================================

export interface PreventCalculatorResult {
    results: Array<{
        label: string;
        value: string;
        unit?: string;
        interpretation: string;
        alertClass: AlertSeverity;
    }>;
    estimate: ReturnType<typeof calculatePrevent>;
    patient: PreventPatient;
}

function pct(x: number, dp = 1): string {
    return (x * 100).toFixed(dp);
}

function riskCategory(ascvdRisk: number): { label: string; severity: AlertSeverity; advice: string } {
    if (ascvdRisk < 0.05) {
        return {
            label: 'Low',
            severity: 'success',
            advice: 'Emphasize lifestyle optimization; statin generally not indicated.'
        };
    }
    if (ascvdRisk < 0.075) {
        return {
            label: 'Borderline',
            severity: 'warning',
            advice: 'Discuss risk-enhancing factors and consider CAC to refine decision.'
        };
    }
    if (ascvdRisk < 0.20) {
        return {
            label: 'Intermediate',
            severity: 'warning',
            advice: 'Initiate moderate-intensity statin after risk discussion.'
        };
    }
    return {
        label: 'High',
        severity: 'danger',
        advice: 'Initiate high-intensity statin; target LDL-C ≥50% reduction.'
    };
}

export function preventCalculationFromValues(
    values: Record<string, any>
): PreventCalculatorResult {
    const num = (k: string): number | undefined => {
        const v = values[k];
        return v === undefined || v === null || v === '' || Number.isNaN(v)
            ? undefined
            : Number(v);
    };

    const sex = (values['prevent-sex'] || 'female') as PreventSex;
    if (sex !== 'female' && sex !== 'male') {
        throw new ValidationError('Sex is required.', 'MISSING_DATA');
    }

    // eGFR: prefer the directly entered value; fall back to CKD-EPI 2021 from creatinine.
    let egfr = num('prevent-egfr');
    if (egfr === undefined) {
        const cr = num('prevent-creatinine');
        const age = num('prevent-age');
        if (cr !== undefined && age !== undefined) {
            egfr = calculateEgfr(cr, age, sex);
        }
    }
    if (egfr === undefined) {
        throw new ValidationError(
            'Provide eGFR directly, or enter serum creatinine so it can be estimated (CKD-EPI 2021).',
            'MISSING_DATA'
        );
    }

    const patient = validatePatient({
        age: num('prevent-age') as number,
        sex,
        sbp: num('prevent-sbp') as number,
        totalCholesterol: num('prevent-tc') as number,
        hdl: num('prevent-hdl') as number,
        bmi: num('prevent-bmi') as number,
        egfr,
        diabetes: values['prevent-dm'] === 'yes',
        smoking: values['prevent-smoking'] === 'yes',
        onAntihypertensive: values['prevent-htn-tx'] === 'yes',
        onStatin: values['prevent-statin'] === 'yes',
        hba1c: num('prevent-hba1c'),
        uacr: num('prevent-uacr')
    });

    const est = calculatePrevent(patient);
    const cat = riskCategory(est.tenYear.ascvd);

    const modelLabel: Record<PreventModel, string> = {
        base: 'Base',
        hba1c: 'Base + HbA1c',
        uacr: 'Base + UACR',
        full: 'Full (HbA1c + UACR)'
    };

    const results: PreventCalculatorResult['results'] = [
        {
            label: '10-Year Total CVD Risk',
            value: pct(est.tenYear.totalCvd),
            unit: '%',
            interpretation:
                `ASCVD ${pct(est.tenYear.ascvd)}% (CHD ${pct(est.tenYear.chd)}%, stroke ${pct(est.tenYear.stroke)}%), ` +
                `heart failure ${pct(est.tenYear.heartFailure)}%. Model: ${modelLabel[est.model]}.`,
            alertClass: cat.severity
        },
        {
            label: '10-Year ASCVD Risk Category',
            value: cat.label,
            interpretation: cat.advice,
            alertClass: cat.severity
        }
    ];

    // 30-year estimate is most informative for patients <60; flag otherwise.
    const thirtyYearNote =
        patient.age > 59
            ? ' Note: 30-year horizon is less reliable when current age exceeds 59 years.'
            : '';
    results.push({
        label: '30-Year Total CVD Risk',
        value: pct(est.thirtyYear.totalCvd),
        unit: '%',
        interpretation:
            `ASCVD ${pct(est.thirtyYear.ascvd)}% (CHD ${pct(est.thirtyYear.chd)}%, stroke ${pct(est.thirtyYear.stroke)}%), ` +
            `heart failure ${pct(est.thirtyYear.heartFailure)}%.${thirtyYearNote}`,
        alertClass: 'info'
    });

    return { results, estimate: est, patient };
}
