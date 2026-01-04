/**
 * QRISK3-Based CVD Risk Calculator
 *
 * 使用 Complex Formula Calculator 工廠函數
 * 預測 10 年心血管疾病風險
 */

import { createComplexFormulaCalculator } from '../shared/complex-formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

// ==========================================
// QRISK3 係數
// ==========================================

interface Coeffs {
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

const coefficients: { [key: string]: Coeffs } = {
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

export const preventCVD = createComplexFormulaCalculator({
    id: 'prevent-cvd',
    title: 'QRISK3-Based CVD Risk (UK)',
    description:
        'Predicts 10-year risk of cardiovascular disease in patients aged 25-84 without known CVD.',

    infoAlert:
        'Valid for ages 25-84. Not applicable to patients with established CVD. Cholesterol values use mmol/L by default (UK standard).',

    autoPopulateAge: 'qrisk-age',
    autoPopulateGender: 'qrisk-gender',

    sections: [
        {
            title: 'Patient Characteristics',
            icon: '👤',
            fields: [
                { id: 'qrisk-age', label: 'Age', unit: 'years', min: 25, max: 84, validationType: 'age' },
                `<div class="ui-input-group">
                    <label class="ui-label" for="qrisk-gender">Gender</label>
                    <select id="qrisk-gender" class="ui-select">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-smoker" class="ui-checkbox">
                        <span>Current Smoker</span>
                    </label>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-diabetes" class="ui-checkbox">
                        <span>Diabetes</span>
                    </label>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-bpad" class="ui-checkbox">
                        <span>On Blood Pressure Treatment</span>
                    </label>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-fhcvd" class="ui-checkbox">
                        <span>Family History of CVD (in 1st degree relative &lt;60)</span>
                    </label>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-chronic" class="ui-checkbox">
                        <span>Chronic Kidney Disease (Stage 3, 4 or 5)</span>
                    </label>
                </div>`,
                `<div class="ui-checkbox-group">
                    <label class="ui-checkbox-label">
                        <input type="checkbox" id="qrisk-rheum" class="ui-checkbox">
                        <span>Rheumatoid Arthritis</span>
                    </label>
                </div>`
            ]
        },
        {
            title: 'Clinical Measurements',
            icon: '🩺',
            fields: [
                { id: 'qrisk-sbp', label: 'Systolic BP', unit: 'mmHg', validationType: 'systolicBP' },
                {
                    id: 'qrisk-cholesterol',
                    label: 'Total Cholesterol',
                    step: 0.1,
                    unitToggle: {
                        type: 'cholesterol',
                        units: ['mmol/L', 'mg/dL'],
                        default: 'mmol/L'
                    },
                    validationType: 'totalCholesterol'
                },
                {
                    id: 'qrisk-hdl',
                    label: 'HDL Cholesterol',
                    step: 0.1,
                    unitToggle: {
                        type: 'cholesterol',
                        units: ['mmol/L', 'mg/dL'],
                        default: 'mmol/L'
                    },
                    validationType: 'hdl'
                },
                { id: 'qrisk-egfr', label: 'eGFR', unit: 'mL/min/1.73m²', validationType: 'egfr' }
            ]
        }
    ],

    resultTitle: 'QRISK3 10-Year Risk',

    calculate: (getValue, getStdValue, getRadioValue, getCheckboxValue) => {
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

        // Baseline survival S0 logic
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
    },

    fhirAutoPopulate: [
        {
            fieldId: 'qrisk-cholesterol',
            loincCode: LOINC_CODES.CHOLESTEROL_TOTAL,
            targetUnit: 'mmol/L',
            unitType: 'cholesterol',
            formatter: v => v.toFixed(2)
        },
        {
            fieldId: 'qrisk-hdl',
            loincCode: LOINC_CODES.HDL,
            targetUnit: 'mmol/L',
            unitType: 'cholesterol',
            formatter: v => v.toFixed(2)
        },
        { fieldId: 'qrisk-egfr', loincCode: LOINC_CODES.EGFR, formatter: v => v.toFixed(0) }
    ],

    // 使用 customInitialize 處理血壓 (因為 BP 是 panel observation)
    customInitialize: async (client, patient, container, calculate) => {
        if (!fhirDataService.isReady()) {
            return;
        }

        try {
            // 使用 getBloodPressure 獲取血壓 (處理 panel observation)
            const bpResult = await fhirDataService.getBloodPressure({ trackStaleness: true });

            if (bpResult.systolic !== null) {
                const sbpInput = container.querySelector('#qrisk-sbp') as HTMLInputElement;
                if (sbpInput) {
                    sbpInput.value = bpResult.systolic.toFixed(0);
                    sbpInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        } catch (error) {
            console.warn('Error fetching blood pressure for QRISK3:', error);
        }
    },

    reference: `
        ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'QRISK3 Calculation',
                    formula: 'Risk = 100 × (1 - S(t)^exp(index))',
                    notes: 'Uses gender-specific coefficients and baseline survival S(t). Index = Σ(Coefficients × Values) - Mean.'
                }
            ]
        })}
    `
});
