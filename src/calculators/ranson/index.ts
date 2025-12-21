/**
 * Ranson Score for Pancreatitis Calculator
 * 
 * 使用 Score Calculator 工廠函數遷移
 * Predicts severity and mortality of acute pancreatitis.
 */

import { createScoreCalculator, ScoreCalculatorConfig } from '../shared/score-calculator.js';
import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';

const config: ScoreCalculatorConfig = {
    id: 'ranson',
    title: 'Ranson Score for Pancreatitis',
    description: 'Predicts severity and mortality of acute pancreatitis (for non-gallstone cases).',
    infoAlert: '<strong>Note:</strong> This score applies to non-gallstone pancreatitis. Different criteria exist for gallstone pancreatitis.',
    sections: [
        {
            title: 'At Admission or Diagnosis',
            icon: '🏥',
            options: [
                { id: 'ranson-age', label: 'Age > 55 years', value: 1 },
                { id: 'ranson-wbc', label: 'WBC count > 16,000/mm³', value: 1 },
                { id: 'ranson-glucose', label: 'Blood glucose > 200 mg/dL (>11 mmol/L)', value: 1 },
                { id: 'ranson-ast', label: 'Serum AST > 250 IU/L', value: 1 },
                { id: 'ranson-ldh', label: 'Serum LDH > 350 IU/L', value: 1 }
            ]
        },
        {
            title: 'During Initial 48 Hours',
            icon: '⏱️',
            options: [
                { id: 'ranson-calcium', label: 'Serum calcium < 8.0 mg/dL (<2.0 mmol/L)', value: 1 },
                { id: 'ranson-hct', label: 'Hematocrit fall > 10%', value: 1 },
                { id: 'ranson-paO2', label: 'PaO₂ < 60 mmHg', value: 1 },
                { id: 'ranson-bun', label: 'BUN increase > 5 mg/dL (>1.8 mmol/L)', value: 1 },
                { id: 'ranson-base', label: 'Base deficit > 4 mEq/L', value: 1 },
                { id: 'ranson-fluid', label: 'Fluid sequestration > 6 L', value: 1 }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 2, risk: 'Low Risk', category: 'Low', severity: 'success', recommendation: 'Mortality: 0-3%' },
        { minScore: 3, maxScore: 4, risk: 'Moderate Risk', category: 'Moderate', severity: 'warning', recommendation: 'Mortality: 15-20%' },
        { minScore: 5, maxScore: 6, risk: 'High Risk', category: 'High', severity: 'danger', recommendation: 'Mortality: ~40%' },
        { minScore: 7, maxScore: 11, risk: 'Very High Risk', category: 'Very High', severity: 'danger', recommendation: 'Mortality: >50%' }
    ],
    formulaItems: [
        {
            title: 'Mortality Estimation',
            content: `
                <table class="ui-data-table">
                    <thead>
                        <tr><th>Score</th><th>Mortality</th><th>Severity</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>0-2</td><td>0-3%</td><td>Low Risk</td></tr>
                        <tr><td>3-4</td><td>15-20%</td><td>Moderate Risk</td></tr>
                        <tr><td>5-6</td><td>~40%</td><td>High Risk</td></tr>
                        <tr><td>≥7</td><td>>50%</td><td>Very High Risk</td></tr>
                    </tbody>
                </table>
            `
        }
    ],
    customResultRenderer: (score: number, sectionScores: Record<string, number>): string => {
        let mortality = '';
        let severity = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score <= 2) {
            mortality = '0-3%';
            severity = 'Low Risk';
            alertType = 'success';
        } else if (score <= 4) {
            mortality = '15-20%';
            severity = 'Moderate Risk';
            alertType = 'warning';
        } else if (score <= 6) {
            mortality = '~40%';
            severity = 'High Risk';
            alertType = 'danger';
        } else {
            mortality = '>50%';
            severity = 'Very High Risk';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Ranson Score',
                value: score.toString(),
                unit: '/ 11 points',
                interpretation: severity,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createResultItem({
                label: 'Estimated Mortality',
                value: mortality,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    },
    customInitialize: (client: unknown, patient: unknown, container: HTMLElement, calculate: () => void): void => {
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        // Auto-populate age
        const typedPatient = patient as { birthDate?: string } | null;
        if (typedPatient?.birthDate) {
            const age = calculateAge(typedPatient.birthDate);
            if (age > 55) {
                const box = container.querySelector('#ranson-age') as HTMLInputElement;
                if (box) {
                    box.checked = true;
                    box.dispatchEvent(new Event('change'));
                }
            }
        }

        if (!client) return;

        // WBC
        getMostRecentObservation(client, LOINC_CODES.WBC).then(obs => {
            if (obs?.valueQuantity) {
                let val = obs.valueQuantity.value;
                // Normalize to K/uL
                if (val > 1000) val = val / 1000;
                if (val > 16) {
                    const box = container.querySelector('#ranson-wbc') as HTMLInputElement;
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                    }
                }
                stalenessTracker.trackObservation('#ranson-wbc', obs, LOINC_CODES.WBC, 'WBC Count');
            }
        }).catch(e => console.warn('Error fetching WBC:', e));

        // Glucose
        getMostRecentObservation(client, LOINC_CODES.GLUCOSE).then(obs => {
            if (obs?.valueQuantity) {
                let val = obs.valueQuantity.value;
                // Convert mmol/L to mg/dL if needed
                if (obs.valueQuantity.unit === 'mmol/L') val = val * 18.0182;
                if (val > 200) {
                    const box = container.querySelector('#ranson-glucose') as HTMLInputElement;
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                    }
                }
                stalenessTracker.trackObservation('#ranson-glucose', obs, LOINC_CODES.GLUCOSE, 'Blood Glucose');
            }
        }).catch(e => console.warn('Error fetching glucose:', e));

        // AST
        getMostRecentObservation(client, LOINC_CODES.AST).then(obs => {
            if (obs?.valueQuantity && obs.valueQuantity.value > 250) {
                const box = container.querySelector('#ranson-ast') as HTMLInputElement;
                if (box) {
                    box.checked = true;
                    box.dispatchEvent(new Event('change'));
                }
                stalenessTracker.trackObservation('#ranson-ast', obs, LOINC_CODES.AST, 'AST');
            }
        }).catch(e => console.warn('Error fetching AST:', e));

        // LDH
        getMostRecentObservation(client, LOINC_CODES.LDH).then(obs => {
            if (obs?.valueQuantity && obs.valueQuantity.value > 350) {
                const box = container.querySelector('#ranson-ldh') as HTMLInputElement;
                if (box) {
                    box.checked = true;
                    box.dispatchEvent(new Event('change'));
                }
                stalenessTracker.trackObservation('#ranson-ldh', obs, LOINC_CODES.LDH, 'LDH');
            }
        }).catch(e => console.warn('Error fetching LDH:', e));

        // Calcium
        getMostRecentObservation(client, LOINC_CODES.CALCIUM).then(obs => {
            if (obs?.valueQuantity) {
                let val = obs.valueQuantity.value;
                // Convert mmol/L to mg/dL if needed
                if (obs.valueQuantity.unit === 'mmol/L') val = val * 4.008;
                if (val < 8.0) {
                    const box = container.querySelector('#ranson-calcium') as HTMLInputElement;
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                    }
                }
                stalenessTracker.trackObservation('#ranson-calcium', obs, LOINC_CODES.CALCIUM, 'Calcium');
            }
        }).catch(e => console.warn('Error fetching calcium:', e));
    }
};

export const ransonScore = createScoreCalculator(config);
