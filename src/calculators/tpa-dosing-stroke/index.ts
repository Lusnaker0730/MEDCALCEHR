import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const tpaDosing = createFormulaCalculator({
    id: 'tpa-dosing-stroke',
    title: 'tPA Dosing for Acute Stroke',
    description: 'Calculates tissue plasminogen activator (tPA) dosing for acute ischemic stroke.',
    inputs: [
        {
            id: 'tpa-stroke-weight',
            label: 'Weight',
            type: 'number',
            standardUnit: 'kg',
            min: 2,
            max: 200,
            step: 0.1,
            unitConfig: {
                type: 'weight',
                units: ['kg', 'lbs'],
                default: 'kg'
            },
            validationType: 'weight',
            loincCode: LOINC_CODES.WEIGHT
        },
        {
            id: 'tpa-stroke-onset',
            label: 'Time from symptom onset',
            type: 'number',
            standardUnit: 'hours',
            min: 0,
            max: 24,
            step: 0.1,
            helpText: 'Must be ≤ 4.5 hours for IV tPA eligibility'
        }
    ],
    formulas: [
        {
            label: 'Total Dose',
            formula: '0.9 mg/kg (Max 90 mg)'
        },
        {
            label: 'Bolus',
            formula: '10% of Total Dose (over 1 min)'
        },
        {
            label: 'Infusion',
            formula: '90% of Total Dose (over 60 min)'
        }
    ],
    calculate: (values) => {
        const weight = values['tpa-stroke-weight'] as number;
        const onset = values['tpa-stroke-onset'] as number;

        if (!weight || weight <= 0) return null;

        // Dosing Logic
        const effectiveWeight = weight > 100 ? 100 : weight;
        const totalDose = effectiveWeight * 0.9;
        const bolusDose = totalDose * 0.1;
        const infusionDose = totalDose * 0.9;
        const infusionRate = infusionDose; // mg/hour (since it's over 60 mins)

        const isCapped = weight > 100;

        // Eligibility Logic
        let eligibilityStatus: 'eligible' | 'ineligible' | 'unknown' = 'unknown';
        if (onset !== undefined && onset !== null) {
            eligibilityStatus = onset <= 4.5 ? 'eligible' : 'ineligible';
        }

        return [
            {
                label: 'Eligibility Status',
                value: eligibilityStatus,
                unit: '',
                // Use alertClass to carry status info to renderer
                alertClass: eligibilityStatus === 'eligible' ? 'success' : (eligibilityStatus === 'ineligible' ? 'danger' : 'warning')
            },
            {
                label: 'Total Dose',
                value: totalDose.toFixed(1),
                unit: 'mg',
                interpretation: isCapped ? '0.9 mg/kg, max 90 mg (Capped)' : '0.9 mg/kg, max 90 mg'
            },
            {
                label: 'Step 1: IV Bolus',
                value: bolusDose.toFixed(1),
                unit: 'mg',
                interpretation: 'IV push over 1 minute'
            },
            {
                label: 'Step 2: Continuous Infusion',
                value: infusionDose.toFixed(1),
                unit: 'mg',
                interpretation: `Rate: ${infusionRate.toFixed(1)} mg/hr over 60 minutes`
            }
        ];
    },
    customResultRenderer: (results) => {
        // Extract Eligibility Item
        const eligibilityItem = results.find(r => r.label === 'Eligibility Status');
        const dosingItems = results.filter(r => r.label !== 'Eligibility Status');

        let eligibilityHtml = '';
        if (eligibilityItem) {
            if (eligibilityItem.value === 'eligible') {
                eligibilityHtml = uiBuilder.createAlert({
                    type: 'success',
                    message: '<strong>Eligibility:</strong> Within time window for IV tPA (≤ 4.5 hours)'
                });
            } else if (eligibilityItem.value === 'ineligible') {
                eligibilityHtml = uiBuilder.createAlert({
                    type: 'danger',
                    message: '<strong>Eligibility:</strong> Outside time window for IV tPA (> 4.5 hours)'
                });
            } else {
                eligibilityHtml = uiBuilder.createAlert({
                    type: 'warning',
                    message: '<strong>Note:</strong> Please enter time from symptom onset to check eligibility.'
                });
            }
        }

        // Static Reminders
        const remindersHtml = uiBuilder.createAlert({
            type: 'warning',
            message: `
                <h4>Important Reminders</h4>
                <ul>
                    <li>Verify all inclusion/exclusion criteria before administration</li>
                    <li>Obtain informed consent when possible</li>
                    <li>Ensure BP < 185/110 mmHg before treatment</li>
                    <li>Have reversal agents available (cryoprecipitate, aminocaproic acid)</li>
                </ul>
            `
        });

        // Helper to generate result item HTML (reusing standard style)
        const renderItem = (res: any) => `
            <div class="ui-result-item">
                <div class="ui-result-label">${res.label}</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${res.value}</span>
                    ${res.unit ? `<span class="ui-result-unit">${res.unit}</span>` : ''}
                </div>
                ${res.interpretation ? `<div class="ui-result-interpretation">${res.interpretation}</div>` : ''}
            </div>
        `;

        // Render Total Dose separate from Steps if desired, or just list them
        // The original had "Total Dose" then divider then Steps
        const totalDoseItem = dosingItems.find(r => r.label === 'Total Dose');
        const stepItems = dosingItems.filter(r => r.label !== 'Total Dose');

        return `
            ${remindersHtml}
            ${eligibilityHtml}
            
            ${totalDoseItem ? renderItem(totalDoseItem) : ''}
            
            ${stepItems.length > 0 ? '<hr>' : ''}
            
            ${stepItems.map(item => renderItem(item)).join('')}
            
            <div class="ui-alert ui-alert-info mt-10">
                <div class="ui-alert-content">
                    Maximum dose is 90 mg regardless of weight.
                </div>
            </div>
        `;
    }
});
