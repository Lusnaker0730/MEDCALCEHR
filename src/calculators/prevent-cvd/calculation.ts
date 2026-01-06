/**
 * QRISK3-Based CVD Risk Calculation Logic
 * 
 * Predicts 10-year risk of cardiovascular disease in patients aged 25-84 without known CVD.
 */

import type { ComplexCalculationResult, GetValueFn, GetStdValueFn, GetCheckboxValueFn } from '../../types/calculator-formula.js';

// ==========================================
// QRISK3 Coefficients
// ==========================================

export interface Coeffs {
    age: number;
    chol: number;
    hdl: number;
    sbp: number;
    smoker: number;
    diabetes: number;
    egfr: number;
    bpad: number;
    fhcvd: number;
    ckd: number;
    rheum: number;
    constant: number;
    meanD: number;
}

export const coefficients: { [key: string]: Coeffs } = {
    male: {
        age: 0.7939,
        chol: 0.5105,
        hdl: -0.9369,
        sbp: 0.01775695,
        smoker: 0.5361,
        diabetes: 0.8668,
        egfr: -0.6046,
        bpad: 0.1198,
        fhcvd: 0.3613,
        ckd: 0.0946,
        rheum: -0.0946,
        constant: -3.3977,
        meanD: 0.52
    },
    female: {
        age: 0.7689,
        chol: 0.0736,
        hdl: -0.9499,
        sbp: 0.01110366,
        smoker: 0.4387,
        diabetes: 0.7693,
        egfr: 0.5379,
        bpad: 0.1502,
        fhcvd: 0.1933,
        ckd: 0.1043,
        rheum: -0.1043,
        constant: -3.0312,
        meanD: 0.48
    }
};

/**
 * Get baseline survival S0 based on gender and age
 * 
 * @param gender - 'male' or 'female'
 * @param age - Patient age
 * @returns Baseline survival value
 */
export function getBaselineSurvival(gender: string, age: number): number {
    let s0 = 0.97;
    if (gender === 'male') {
        if (age < 50) s0 = 0.98;
        else if (age < 60) s0 = 0.975;
        else if (age < 70) s0 = 0.97;
        else s0 = 0.96;
    } else {
        if (age < 50) s0 = 0.985;
        else if (age < 60) s0 = 0.98;
        else if (age < 70) s0 = 0.975;
        else s0 = 0.97;
    }
    return s0;
}

/**
 * QRISK3 CVD Risk Calculation Function
 * 
 * @param getValue - Get raw value function
 * @param getStdValue - Get standardized value function
 * @param getRadioValue - Get radio value function (unused but required by signature)
 * @param getCheckboxValue - Get checkbox value function
 * @returns Calculation result
 */
export function preventCvdCalculation(
    getValue: GetValueFn,
    getStdValue: GetStdValueFn,
    getRadioValue: (name: string) => string | null,
    getCheckboxValue: GetCheckboxValueFn
): ComplexCalculationResult | null {
    const age = getValue('qrisk-age');
    const sbp = getValue('qrisk-sbp');
    const chol = getStdValue('qrisk-cholesterol', 'mmol/L');
    const hdl = getStdValue('qrisk-hdl', 'mmol/L');
    const egfr = getValue('qrisk-egfr');

    // Get gender from select
    const genderEl = document.querySelector('#qrisk-gender') as HTMLSelectElement;
    const gender = genderEl?.value || 'male';

    const smoker = getCheckboxValue('qrisk-smoker') ? 1 : 0;
    const diabetes = getCheckboxValue('qrisk-diabetes') ? 1 : 0;
    const bpad = getCheckboxValue('qrisk-bpad') ? 1 : 0;
    const fhcvd = getCheckboxValue('qrisk-fhcvd') ? 1 : 0;
    const ckd = getCheckboxValue('qrisk-chronic') ? 1 : 0;
    const rheum = getCheckboxValue('qrisk-rheum') ? 1 : 0;

    if (age === null || sbp === null || chol === null || hdl === null || egfr === null) {
        return null;
    }

    const c = coefficients[gender];
    const d =
        c.constant +
        c.age * Math.log(age) +
        c.chol * Math.log(chol) +
        c.hdl * Math.log(hdl) +
        c.sbp * sbp +
        c.smoker * smoker +
        c.diabetes * diabetes +
        c.egfr * Math.log(egfr) +
        c.bpad * bpad +
        c.fhcvd * fhcvd +
        c.ckd * ckd +
        c.rheum * rheum;

    const s0 = getBaselineSurvival(gender, age);
    const risk = 100 * (1 - Math.pow(s0, Math.exp(d - c.meanD)));
    const riskVal = Math.max(0.1, Math.min(99.9, risk));

    let riskCategory = '';
    let severity: 'success' | 'warning' | 'danger' = 'success';
    let recommendation = '';

    if (riskVal < 10) {
        riskCategory = 'Low/Moderate Risk (<10%)';
        severity = 'success';
        recommendation = 'Focus on lifestyle modifications.';
    } else if (riskVal < 20) {
        riskCategory = 'High Risk (10-20%)';
        severity = 'warning';
        recommendation = 'Consider statin therapy and lifestyle interventions.';
    } else {
        riskCategory = 'Very High Risk (≥20%)';
        severity = 'danger';
        recommendation =
            'Strongly consider statin therapy and intensive lifestyle interventions.';
    }

    return {
        value: riskVal,
        interpretation: riskCategory,
        severity,
        additionalResults: [
            { label: '10-Year CVD Risk', value: riskVal.toFixed(1), unit: '%' }
        ],
        breakdown: `<strong>Recommendation:</strong> ${recommendation}`
    };
}
