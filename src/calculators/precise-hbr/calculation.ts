/**
 * PRECISE-HBR Score Calculation Logic
 *
 * Predicts bleeding risk in patients undergoing stent implantation.
 */

import type {
    ComplexCalculationResult,
    GetValueFn,
    GetRadioValueFn
} from '../../types/calculator-formula.js';

// ==========================================
// PRECISE-HBR Score Calculation
// Coefficients from cdss_config.json (Costa F, Lancet 2017)
// Risk formula: cloglog link from Fine-Gray competing risks model
// ==========================================

// Cloglog coefficients for 1-year BARC 3/5 bleeding risk
const CLOGLOG_A = -5.3945;
const CLOGLOG_B = 0.09725;

/**
 * Calculate 1-year bleeding risk percentage from PRECISE-HBR score
 * using complementary log-log (cloglog) link function.
 *
 * Risk% = 100 × (1 - exp(-exp(a + b × score)))
 */
export function calculateRiskPercent(score: number): number {
    const clamped = Math.max(2, Math.min(54, score));
    const lp = CLOGLOG_A + CLOGLOG_B * clamped;
    const risk = 1.0 - Math.exp(-Math.exp(lp));
    return Math.round(risk * 10000) / 100; // round to 2 decimals
}

export interface ScoreResult {
    score: number;
    breakdown: string;
}

/**
 * Calculate PRECISE-HBR Score
 *
 * @param age - Patient age (years)
 * @param hb - Hemoglobin (g/dL)
 * @param egfr - eGFR (mL/min/1.73m²)
 * @param wbc - White blood cell count (10⁹/L)
 * @param priorBleeding - Prior bleeding history
 * @param oralAnticoagulation - On oral anticoagulants
 * @param arcHbrRisk - Any ARC-HBR risk factor present
 * @returns Score and breakdown
 */
export function calculatePreciseHbrScore(
    age: number,
    hb: number,
    egfr: number,
    wbc: number,
    priorBleeding: boolean,
    oralAnticoagulation: boolean,
    arcHbrRisk: boolean
): ScoreResult {
    let score = 2; // Base Score
    const breakdownParts: string[] = ['Base Score (2)'];

    // --- Age ---
    // Range 30-80. If > 30: + (Age - 30) × 0.25
    let ageClamped = age;
    if (age < 30) ageClamped = 30;
    if (age > 80) ageClamped = 80;

    if (age > 30) {
        const agePoints = (ageClamped - 30) * 0.25;
        if (agePoints > 0) {
            score += agePoints;
            breakdownParts.push(`Age ${age} (Clamped: ${ageClamped}) -> +${agePoints.toFixed(2)}`);
        }
    }

    // --- Hb ---
    // Range 5.0 - 15.0 g/dL. If < 15: + (15 - Hb) × 2.5
    let hbClamped = hb;
    if (hb < 5.0) hbClamped = 5.0;
    if (hb > 15.0) hbClamped = 15.0;

    if (hb < 15.0) {
        const hbPoints = (15 - hbClamped) * 2.5;
        if (hbPoints > 0) {
            score += hbPoints;
            breakdownParts.push(`Hb ${hb} (Clamped: ${hbClamped}) -> +${hbPoints.toFixed(2)}`);
        }
    }

    // --- eGFR ---
    // Range 5 - 100. If < 100: + (100 - eGFR) × 0.055
    let egfrClamped = egfr;
    if (egfr < 5) egfrClamped = 5;
    if (egfr > 100) egfrClamped = 100;

    if (egfr < 100) {
        const egfrPoints = (100 - egfrClamped) * 0.055;
        if (egfrPoints > 0) {
            score += egfrPoints;
            breakdownParts.push(
                `eGFR ${egfr} (Clamped: ${egfrClamped}) -> +${egfrPoints.toFixed(2)}`
            );
        }
    }

    // --- WBC ---
    // Upper limit 15.0. If > 3: + (WBC - 3) * 0.8
    let wbcClamped = wbc;
    if (wbc > 15.0) wbcClamped = 15.0;

    if (wbcClamped > 3) {
        const wbcPoints = (wbcClamped - 3) * 0.8;
        score += wbcPoints;
        breakdownParts.push(`WBC ${wbc} (Clamped: ${wbcClamped}) -> +${wbcPoints.toFixed(2)}`);
    }

    // --- Categorical ---
    if (priorBleeding) {
        score += 7;
        breakdownParts.push('Prior Bleeding (+7)');
    }
    if (oralAnticoagulation) {
        score += 5;
        breakdownParts.push('Oral Anticoagulation (+5)');
    }
    if (arcHbrRisk) {
        score += 3;
        breakdownParts.push('ARC-HBR Risk Factor (+3)');
    }

    // Round to integer (image says "最後四捨五入取整數")
    const finalScore = Math.round(score);

    if (Math.abs(finalScore - score) > 0.001) {
        breakdownParts.push(`Total Raw: ${score.toFixed(2)} -> Rounded: ${finalScore}`);
    } else {
        breakdownParts.push(`Total: ${finalScore}`);
    }

    return { score: finalScore, breakdown: breakdownParts.join('<br>') };
}

/**
 * PRECISE-HBR Main Calculation Function
 *
 * @param getValue - Get raw value function
 * @param getStdValue - Get standardized value function (unused)
 * @param getRadioValue - Get radio value function
 * @returns Calculation result
 */
export function preciseHbrCalculation(
    getValue: GetValueFn,
    getStdValue: (id: string, unit: string) => number | null,
    getRadioValue: GetRadioValueFn
): ComplexCalculationResult | null {
    const age = getValue('precise-hbr-age');
    const hb = getValue('precise-hbr-hb');
    const wbc = getValue('precise-hbr-wbc');
    const egfr = getValue('precise-hbr-egfr');

    const priorBleeding = getRadioValue('prior_bleeding') === '1';
    const oralAnticoagulation = getRadioValue('oral_anticoagulation') === '1';

    // ARC-HBR Risk Factors
    const hbrPlt = getRadioValue('arc_hbr_plt') === '1';
    const hbrDiathesis = getRadioValue('arc_hbr_diathesis') === '1';
    const hbrCirrhosis = getRadioValue('arc_hbr_cirrhosis') === '1';
    const hbrMalignancy = getRadioValue('arc_hbr_malignancy') === '1';
    const hbrSurgery = getRadioValue('arc_hbr_surgery') === '1';
    const hbrNsaids = getRadioValue('arc_hbr_nsaids') === '1';

    const arcHbrRisk =
        hbrPlt || hbrDiathesis || hbrCirrhosis || hbrMalignancy || hbrSurgery || hbrNsaids;

    if (age === null || hb === null || wbc === null || egfr === null) {
        return null;
    }

    const result = calculatePreciseHbrScore(
        age,
        hb,
        egfr,
        wbc,
        priorBleeding,
        oralAnticoagulation,
        arcHbrRisk
    );

    // Risk calculation via cloglog formula
    const s = result.score;
    const riskPercent = calculateRiskPercent(s);
    const bleedingRisk = `${riskPercent}%`;

    // Risk stratification per PRECISE-HBR thresholds
    let riskLevel: string;
    let severity: 'success' | 'warning' | 'danger';

    if (s <= 22) {
        riskLevel = 'Non-HBR (Low Risk)';
        severity = 'success';
    } else if (s <= 26) {
        riskLevel = 'HBR (High Risk)';
        severity = 'warning';
    } else {
        riskLevel = 'Very HBR (Very High Risk)';
        severity = 'danger';
    }

    return {
        score: s,
        interpretation: riskLevel,
        severity,
        additionalResults: [
            { label: 'Risk Group', value: riskLevel },
            { label: '1-Year Bleeding Risk', value: bleedingRisk }
        ],
        breakdown: result.breakdown
    };
}
