import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';

export const calculateTpaDosing = (values: Record<string, any>): any[] | null => {
    const weightInput = values['tpa-weight'];
    const indication = values['tpa-indication']; // 'pe' | 'stemi'

    if (weightInput === undefined || weightInput === null || weightInput === '' || !indication) {
        return null;
    }

    const weight = Number(weightInput);
    if (isNaN(weight) || weight <= 0) return null;

    const results: any[] = [];

    if (indication === 'pe') {
        // Acute Massive PE
        // FDA prescribing information: 100 mg continuous IV over 2 hours, regardless of weight.
        const totalDose = 100;
        const alertMsg =
            'Standard dose: 100 mg continuous IV over 2 hours per FDA prescribing information.';

        results.push({
            label: 'Indication',
            value: 'Acute Massive Pulmonary Embolism (PE)',
            unit: ''
        });

        results.push({
            label: 'Total Administration',
            value: `${totalDose.toFixed(1)} mg`,
            unit: '',
            alertClass: 'success',
            interpretation: alertMsg
        });

    } else if (indication === 'stemi') {
        // STEMI (Accelerated Infusion)
        let bolus = 15;
        let infusion1 = 50;
        let infusion2 = 35;
        let total = bolus + infusion1 + infusion2;

        if (weight <= 67) {
            infusion1 = Math.min(50, weight * 0.75);
            infusion2 = Math.min(35, weight * 0.5);
            total = bolus + infusion1 + infusion2;
        }

        bolus = Number(bolus.toFixed(1));
        infusion1 = Number(infusion1.toFixed(1));
        infusion2 = Number(infusion2.toFixed(1));
        total = Number(total.toFixed(1));

        results.push({
            label: 'Indication',
            value: 'STEMI (Accelerated Infusion)',
            unit: ''
        });

        results.push({
            label: 'Total Dose',
            value: total.toFixed(1),
            unit: 'mg',
            interpretation: weight <= 67 ? 'Weight ≤ 67 kg: Weight-adjusted dose.' : 'Weight > 67 kg: Standard accelerated dose.',
            alertClass: 'success'
        });

        results.push({
            label: '1. IV Bolus',
            value: bolus.toFixed(1),
            unit: 'mg',
            interpretation: 'Administer over 1-2 minutes'
        });

        results.push({
            label: '2. First Infusion',
            value: infusion1.toFixed(1),
            unit: 'mg',
            interpretation: 'Administer over 30 minutes'
        });

        results.push({
            label: '3. Second Infusion',
            value: infusion2.toFixed(1),
            unit: 'mg',
            interpretation: 'Administer over 60 minutes'
        });
    }

    return results;
};

export const tpaDosingConfig: FormulaCalculatorConfig = {
    id: 'tpa-dosing',
    title: 'tPA Dosing for PE and MI',
    description:
        'Calculates tissue plasminogen activator (tPA/Alteplase) dosing for Acute Massive Pulmonary Embolism (PE) and acute Myocardial Infarction (STEMI).',
    infoAlert:
        uiBuilder.createAlert({
            type: 'warning',
            message:
                '<strong>⚠️ Important:</strong> Verify all inclusion and exclusion criteria before alteplase administration. <br>For <strong>Acute Ischemic Stroke</strong>, please use the dedicated Stroke tPA calculator.'
        }),
    sections: [
        {
            title: 'Patient Data',
            icon: '📋',
            fields: [
                {
                    type: 'radio',
                    id: 'tpa-indication',
                    label: 'Indication',
                    options: [
                        { value: 'pe', label: 'Acute Massive Pulmonary Embolism (PE)', checked: true },
                        { value: 'stemi', label: 'STEMI (Accelerated Infusion)' }
                    ]
                },
                {
                    type: 'number',
                    id: 'tpa-weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
                    validationType: 'weight',
                    loincCode: LOINC_CODES.WEIGHT,
                    standardUnit: 'kg',
                    required: true
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Acute Massive PE',
            formula: '100 mg continuous IV infusion over 2 hours.'
        },
        {
            label: 'STEMI (Accelerated Infusion)',
            formula: 'For weight > 67 kg: 15 mg bolus, then 50 mg over 30 min, then 35 mg over 60 min (Total: 100 mg).<br>For weight ≤ 67 kg: 15 mg bolus, then 0.75 mg/kg over 30 min (max 50 mg), then 0.50 mg/kg over 60 min (max 35 mg).'
        }
    ],
    reference: uiBuilder.createReference({
        citations: [
            'Activase (alteplase) prescribing information. Genentech, Inc.',
            'O\'Gara PT, et al. 2013 ACCF/AHA guideline for the management of ST-elevation myocardial infarction. <em>Circulation</em>. 2013;127(4):e362-e425.'
        ]
    }),
    calculate: calculateTpaDosing,
    customResultRenderer: results => {
        if (!results || results.length === 0) return '';

        let html = '';
        const ind = results.find(r => r.label === 'Indication');
        if (ind) {
            html += uiBuilder.createAlert({
                type: 'info',
                message: `<strong>Selected Indication:</strong> ${ind.value}`
            });
            html += '<hr class="mt-10 mb-10">';
        }

        const items = results.filter(r => r.label !== 'Indication');

        html += items.map(res => uiBuilder.createResultItem({
            label: res.label,
            value: res.value?.toString() || '',
            unit: res.unit,
            interpretation: res.interpretation,
            alertClass: res.alertClass ? `ui-alert-${res.alertClass}` : ''
        })).join('');

        return html;
    }
};

export const tpaDosing = createUnifiedFormulaCalculator(tpaDosingConfig);
