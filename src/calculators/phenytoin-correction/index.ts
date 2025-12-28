import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'phenytoin-correction',
    title: 'Phenytoin (Dilantin) Correction for Albumin/Renal Failure',
    description: 'Corrects serum phenytoin level for renal failure and/or hypoalbuminemia.',
    infoAlert: `
        <h4>Therapeutic Range:</h4>
        <ul class="info-list">
            <li>10-20 mcg/mL</li>
            <li>>20 mcg/mL: Toxic</li>
            <li><10 mcg/mL: Subtherapeutic</li>
        </ul>
    `,
    sections: [
        {
            title: 'Lab Values & Clinical Status',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'pheny-total',
                    label: 'Total Phenytoin Level',
                    placeholder: 'e.g., 8.0',
                    unitToggle: {
                        type: 'phenytoin',
                        units: ['mcg/mL', 'µmol/L', 'mg/L'],
                        default: 'mcg/mL'
                    },
                    loincCode: '4038-8'
                },
                {
                    type: 'number',
                    id: 'pheny-albumin',
                    label: 'Serum Albumin',
                    placeholder: 'e.g., 3.0',
                    unitToggle: {
                        type: 'albumin',
                        units: ['g/dL', 'g/L'],
                        default: 'g/dL'
                    },
                    loincCode: LOINC_CODES.ALBUMIN
                },
                {
                    type: 'radio',
                    name: 'pheny-renal',
                    label: 'Renal Status (CrCl < 10 mL/min)',
                    options: [
                        { value: 'no', label: 'No (Normal Function)', checked: true },
                        { value: 'yes', label: 'Yes (Renal Failure)' }
                    ],
                    helpText: 'Select Yes if CrCl < 10 mL/min, ESRD, or on dialysis.'
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Corrected Level',
            formula:
                '<span class="formula-fraction"><span class="numerator">Total Phenytoin</span><span class="denominator">((1 − K) × Albumin / 4.4) + K</span></span>'
        },
        {
            label: 'K',
            formula: '0.1 (Normal Renal Function) or 0.2 (Renal Failure)'
        }
    ],
    calculate: values => {
        const total = values['pheny-total'] as number | null;
        const albumin = values['pheny-albumin'] as number | null;
        const renalStatus = values['pheny-renal'] as string;

        if (total === null || albumin === null) {
            return null;
        }

        const K = renalStatus === 'yes' ? 0.2 : 0.1;
        return total / (((1 - K) * albumin) / 4.4 + K);
    },
    customResultRenderer: (score, values) => {
        const total = values['pheny-total'] as number;

        let status = '';
        let statusClass = 'ui-alert-success';
        let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
        let alertMsg = 'Within therapeutic range.';

        if (score < 10) {
            status = 'Subtherapeutic';
            statusClass = 'ui-alert-info';
            alertType = 'info';
            alertMsg = 'Level is below therapeutic range.';
        } else if (score > 20) {
            status = 'Potentially Toxic';
            statusClass = 'ui-alert-danger';
            alertType = 'danger';
            alertMsg = 'Level is above therapeutic range. Monitor for toxicity.';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Corrected Phenytoin',
                value: score.toFixed(1),
                unit: 'mcg/mL',
                interpretation: status,
                alertClass: statusClass
            })}
            ${uiBuilder.createResultItem({
                label: 'Measured Total',
                value: total.toFixed(1),
                unit: 'mcg/mL'
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: alertMsg
            })}
        `;
    }
};

export const phenytoinCorrection = createMixedInputCalculator(config);
