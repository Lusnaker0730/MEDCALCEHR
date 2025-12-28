import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'fena',
    title: 'Fractional Excretion of Sodium (FENa)',
    description: 'Determines if renal failure is due to prerenal or intrinsic pathology.',
    infoAlert: `
        <p>Use in the context of acute kidney injury (AKI) / acute renal failure to differentiate prerenal azotemia from acute tubular necrosis (ATN).</p>
        <div class="ui-alert ui-alert-warning mt-10">
            <strong>Limitations:</strong> FENa is unreliable in patients on diuretics. Consider Fractional Excretion of Urea (FEUrea) instead.
        </div>
    `,
    sections: [
        {
            title: 'Laboratory Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'fena-urine-na',
                    label: 'Urine Sodium',
                    placeholder: 'e.g. 20',
                    unitToggle: {
                        type: 'urineSodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: '2955-3'
                },
                {
                    type: 'number',
                    id: 'fena-serum-na',
                    label: 'Serum Sodium',
                    placeholder: 'e.g. 140',
                    unitToggle: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.SODIUM
                },
                {
                    type: 'number',
                    id: 'fena-urine-creat',
                    label: 'Urine Creatinine',
                    placeholder: 'e.g., 100',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.URINE_CREATININE
                },
                {
                    type: 'number',
                    id: 'fena-serum-creat',
                    label: 'Serum Creatinine',
                    placeholder: 'e.g., 1.0',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.CREATININE
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'FENa (%)',
            formula:
                '<span class="formula-fraction"><span class="numerator">Urine Na × Serum Cr</span><span class="denominator">Serum Na × Urine Cr</span></span> × 100',
            notes: 'Units: Na (mEq/L), Cr (mg/dL or µmol/L)'
        }
    ],
    calculate: values => {
        const uNa = values['fena-urine-na'] as number | null;
        const sNa = values['fena-serum-na'] as number | null;
        const uCr = values['fena-urine-creat'] as number | null;
        const sCr = values['fena-serum-creat'] as number | null;

        if (uNa === null || sNa === null || uCr === null || sCr === null) {
            return null;
        }

        if (sNa === 0 || uCr === 0) return 0; // Avoid division by zero

        return (uNa / sNa / (uCr / sCr)) * 100;
    },
    customResultRenderer: (score, values) => {
        let interpretation = '';
        let alertClass = '';

        if (score < 1) {
            interpretation = 'Prerenal AKI (< 1%)';
            alertClass = 'ui-alert-success';
        } else if (score > 2) {
            interpretation = 'Intrinsic/ATN (> 2%)';
            alertClass = 'ui-alert-danger';
        } else {
            interpretation = 'Indeterminate (1-2%)';
            alertClass = 'ui-alert-warning';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Fractional Excretion of Sodium',
                value: score.toFixed(2),
                unit: '%',
                interpretation: interpretation,
                alertClass: alertClass
            })}
        `;
    }
};

export const fena = createMixedInputCalculator(config);
