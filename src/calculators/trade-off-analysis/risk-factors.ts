/**
 * Trade-off Analysis Risk Factors Constants
 * Based on Urban P, Giustino G, et al. JAMA Cardiology 2021
 */

import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';

// Baseline 1-year event rates for ARC-HBR reference group (all predictors absent).
// Validated against official ARC-HBR app (25 golden-dataset cases, max error <0.01%).
// Source: Urban P, et al. JAMA Cardiology 2021
export const BASELINE_RATE_PERCENT = 1.4; // 1.4% for both bleeding and thrombotic

// Mortality hazard ratios after events
export const MORTALITY_HR = {
    MI_ST: 6.1, // HR for death after MI/ST
    BARC_3_5: 3.7 // HR for death after BARC 3-5 bleeding
};

// Trade-off line slopes
export const TRADE_OFF_SLOPES = {
    EQUAL: 1.0,
    MORTALITY_WEIGHTED: MORTALITY_HR.MI_ST / MORTALITY_HR.BARC_3_5 // ~1.65
};

// Risk factor definitions with hazard ratios
export interface RiskFactor {
    id: string;
    label: string;
    bleedingHR: number | null;
    ischemicHR: number | null;
    type: 'lab' | 'condition' | 'procedure' | 'manual';
    loincCode?: string;
    snomedCode?: string;
    /** Group name for mutually exclusive options (e.g., 'hemoglobin', 'egfr') */
    group?: string;
    threshold?: {
        field: string;
        operator: '<' | '>' | '<=' | '>=' | '==';
        value: number;
    };
}

export const RISK_FACTORS: RiskFactor[] = [
    // Age-based
    {
        id: 'age_65',
        label: 'Age ≥ 65 years',
        bleedingHR: 1.5,
        ischemicHR: null,
        type: 'condition'
    },

    // Lab-based factors - Hemoglobin (mutually exclusive group)
    {
        id: 'hb_lt_11',
        label: 'Hemoglobin < 11 g/dL',
        bleedingHR: 3.99,
        ischemicHR: 1.5,
        type: 'lab',
        group: 'hemoglobin',
        loincCode: LOINC_CODES.HEMOGLOBIN,
        threshold: { field: 'hemoglobin', operator: '<', value: 11 }
    },
    {
        id: 'hb_11_13',
        label: 'Hemoglobin 11-12.9 g/dL',
        bleedingHR: 1.69,
        ischemicHR: 1.27,
        type: 'lab',
        group: 'hemoglobin',
        loincCode: LOINC_CODES.HEMOGLOBIN,
        threshold: { field: 'hemoglobin', operator: '>=', value: 11 }
    },
    {
        id: 'hb_gte_13',
        label: 'Hemoglobin ≥ 13 g/dL (Reference)',
        bleedingHR: 1.0,
        ischemicHR: 1.0,
        type: 'lab',
        group: 'hemoglobin',
        loincCode: LOINC_CODES.HEMOGLOBIN,
        threshold: { field: 'hemoglobin', operator: '>=', value: 13 }
    },
    // Lab-based factors - eGFR (mutually exclusive group)
    {
        id: 'egfr_gte_60',
        label: 'eGFR ≥ 60 mL/min (Reference)',
        bleedingHR: 1.0,
        ischemicHR: 1.0,
        type: 'lab',
        group: 'egfr',
        loincCode: LOINC_CODES.EGFR,
        threshold: { field: 'egfr', operator: '>=', value: 60 }
    },
    {
        id: 'egfr_30_59',
        label: 'eGFR 30-59 mL/min',
        bleedingHR: 0.99,
        ischemicHR: 1.3,
        type: 'lab',
        group: 'egfr',
        loincCode: LOINC_CODES.EGFR,
        threshold: { field: 'egfr', operator: '>=', value: 30 }
    },
    {
        id: 'egfr_lt_30',
        label: 'eGFR < 30 mL/min',
        bleedingHR: 1.43,
        ischemicHR: 1.69,
        type: 'lab',
        group: 'egfr',
        loincCode: LOINC_CODES.EGFR,
        threshold: { field: 'egfr', operator: '<', value: 30 }
    },

    // Condition-based factors
    {
        id: 'diabetes',
        label: 'Diabetes (on treatment)',
        bleedingHR: null,
        ischemicHR: 1.56,
        type: 'condition',
        snomedCode: SNOMED_CODES.DIABETES_MELLITUS
    },
    {
        id: 'prior_mi',
        label: 'Prior myocardial infarction',
        bleedingHR: null,
        ischemicHR: 1.89,
        type: 'condition',
        snomedCode: SNOMED_CODES.MYOCARDIAL_INFARCTION
    },
    {
        id: 'liver_cancer_surgery',
        label: 'Liver disease, cancer, or surgery',
        bleedingHR: 1.63,
        ischemicHR: null,
        type: 'condition',
        snomedCode: SNOMED_CODES.CIRRHOSIS
    },
    {
        id: 'copd',
        label: 'COPD',
        bleedingHR: 1.39,
        ischemicHR: null,
        type: 'condition',
        snomedCode: SNOMED_CODES.COPD
    },
    {
        id: 'current_smoker',
        label: 'Current smoker',
        bleedingHR: 1.47,
        ischemicHR: 1.48,
        type: 'condition',
        snomedCode: SNOMED_CODES.SMOKING
    },

    // Procedure-based factors
    {
        id: 'nstemi_stemi',
        label: 'NSTEMI or STEMI presentation',
        bleedingHR: null,
        ischemicHR: 1.82,
        type: 'manual'
    },
    {
        id: 'complex_pci',
        label: 'Complex PCI procedure',
        bleedingHR: 1.32,
        ischemicHR: 1.5,
        type: 'manual'
    },
    {
        id: 'bare_metal_stent',
        label: 'Bare metal stent',
        bleedingHR: null,
        ischemicHR: 1.53,
        type: 'manual'
    },
    {
        id: 'oac_discharge',
        label: 'OAC at discharge',
        bleedingHR: 2.0,
        ischemicHR: null,
        type: 'manual'
    }
];

/**
 * Convert a total HR product to 1-year event probability using Cox proportional hazards.
 *
 * Formula: P = 1 - exp(-baselineHazard × HR)
 * where baselineHazard = -ln(1 - baselineRate)
 */
export function convertHrToProbability(hrProduct: number, baselineRatePercent: number): number {
    if (baselineRatePercent <= 0 || hrProduct <= 0) return 0;
    if (baselineRatePercent >= 100) return 100;

    const baselineRate = baselineRatePercent / 100;
    const baselineHazard = -Math.log(1 - baselineRate);
    const risk = 1 - Math.exp(-baselineHazard * hrProduct);
    return Math.round(Math.min(risk * 100, 100) * 100) / 100;
}

/**
 * Calculate bleeding risk based on selected factors using Cox PH model.
 */
export function calculateBleedingRisk(selectedFactorIds: string[]): number {
    let hrProduct = 1.0;

    for (const factorId of selectedFactorIds) {
        const factor = RISK_FACTORS.find(f => f.id === factorId);
        if (factor && factor.bleedingHR !== null && factor.bleedingHR > 0) {
            hrProduct *= factor.bleedingHR;
        }
    }

    return convertHrToProbability(hrProduct, BASELINE_RATE_PERCENT);
}

/**
 * Calculate ischemic risk based on selected factors using Cox PH model.
 */
export function calculateIschemicRisk(selectedFactorIds: string[]): number {
    let hrProduct = 1.0;

    for (const factorId of selectedFactorIds) {
        const factor = RISK_FACTORS.find(f => f.id === factorId);
        if (factor && factor.ischemicHR !== null && factor.ischemicHR > 0) {
            hrProduct *= factor.ischemicHR;
        }
    }

    return convertHrToProbability(hrProduct, BASELINE_RATE_PERCENT);
}

/**
 * Determine risk zone based on bleeding and ischemic risks
 */
export function determineRiskZone(
    bleedingRisk: number,
    ischemicRisk: number
): {
    zone: 'ischemic_dominant' | 'equivalent' | 'bleeding_dominant';
    recommendation: string;
    color: string;
} {
    // Equal line: y = x
    // Mortality-weighted line: y = x / 1.65 (below this, bleeding dominates)
    const mortalityWeightedLine = bleedingRisk / TRADE_OFF_SLOPES.MORTALITY_WEIGHTED;

    if (ischemicRisk > bleedingRisk) {
        return {
            zone: 'ischemic_dominant',
            recommendation: 'Ischemic risk dominates. Consider standard or extended DAPT duration.',
            color: '#0d9488' // teal
        };
    } else if (ischemicRisk >= mortalityWeightedLine) {
        return {
            zone: 'equivalent',
            recommendation:
                'Risks are roughly equivalent considering mortality impact. Individualized decision needed.',
            color: '#6b7280' // gray
        };
    } else {
        return {
            zone: 'bleeding_dominant',
            recommendation:
                'Bleeding risk dominates when considering associated mortality. Consider shortened DAPT duration (1-3 months).',
            color: '#f97316' // orange
        };
    }
}
