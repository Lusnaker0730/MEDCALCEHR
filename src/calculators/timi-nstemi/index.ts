/**
 * TIMI Risk Score for UA/NSTEMI Calculator
 * 
 * 使用 Yes/No Calculator 工廠函數遷移
 * Estimates mortality for patients with unstable angina and non-ST elevation MI.
 */

import { createYesNoCalculator, YesNoCalculatorConfig } from '../shared/yes-no-calculator.js';
import { calculateAge, getPatientConditions, getObservation } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';

const config: YesNoCalculatorConfig = {
    id: 'timi-nstemi',
    title: 'TIMI Risk Score for UA/NSTEMI',
    description: 'Estimates mortality for patients with unstable angina and non-ST elevation MI.',
    infoAlert: `
        <h4>📊 Risk Stratification (14-day events)</h4>
        <table class="ui-data-table">
            <thead>
                <tr><th>Score</th><th>Risk</th><th>Event Rate</th></tr>
            </thead>
            <tbody>
                <tr><td>0-2</td><td>Low</td><td>5-8%</td></tr>
                <tr><td>3-4</td><td>Intermediate</td><td>13-20%</td></tr>
                <tr><td>5-7</td><td>High</td><td>26-41%</td></tr>
            </tbody>
        </table>
    `,
    questions: [
        { id: 'timi-age', label: 'Age ≥ 65', points: 1, description: 'Patient is 65 years or older' },
        { id: 'timi-cad-risk', label: '≥ 3 CAD Risk Factors', points: 1, description: 'Hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker' },
        { id: 'timi-known-cad', label: 'Known CAD (Stenosis ≥ 50%)', points: 1, description: 'Prior angiogram showing ≥ 50% stenosis' },
        { id: 'timi-asa', label: 'ASA Use in Past 7 Days', points: 1, description: 'Aspirin use within the last week' },
        { id: 'timi-angina', label: 'Severe Angina (≥ 2 episodes in 24h)', points: 1, description: 'At least 2 angina episodes in the last 24 hours' },
        { id: 'timi-ekg', label: 'EKG ST Changes ≥ 0.5mm', points: 1, description: 'ST segment deviation of 0.5mm or more' },
        { id: 'timi-marker', label: 'Positive Cardiac Marker', points: 1, description: 'Elevated Troponin or CK-MB' }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 2, label: 'Low Risk', severity: 'success', description: '14-Day Event Rate: 5-8%. Conservative management; medical therapy optimization; outpatient follow-up; consider stress testing.' },
        { minScore: 3, maxScore: 4, label: 'Intermediate Risk', severity: 'warning', description: '14-Day Event Rate: 13-20%. Intensive medical therapy; consider early invasive strategy; dual antiplatelet therapy; close monitoring.' },
        { minScore: 5, maxScore: 7, label: 'High Risk', severity: 'danger', description: '14-Day Event Rate: 26-41%. Early invasive strategy; urgent cardiology consultation; aggressive antiplatelet therapy; consider GP IIb/IIIa inhibitors.' }
    ],
    references: [
        'Antman EM, et al. The TIMI risk score for unstable angina/non-ST elevation MI: A method for prognostication and therapeutic decision making. <em>JAMA</em>. 2000;284(7):835-842.'
    ],
    customResultRenderer: (score: number): string => {
        let risk = '';
        let eventRate = '';
        let alertClass: 'success' | 'warning' | 'danger' = 'success';
        let recommendation = '';

        if (score <= 2) {
            risk = 'Low Risk';
            eventRate = '5-8%';
            alertClass = 'success';
            recommendation = 'Conservative management; medical therapy optimization; outpatient follow-up; consider stress testing.';
        } else if (score <= 4) {
            risk = 'Intermediate Risk';
            eventRate = '13-20%';
            alertClass = 'warning';
            recommendation = 'Intensive medical therapy; consider early invasive strategy; dual antiplatelet therapy; close monitoring.';
        } else {
            risk = 'High Risk';
            eventRate = '26-41%';
            alertClass = 'danger';
            recommendation = 'Early invasive strategy; urgent cardiology consultation; aggressive antiplatelet therapy; consider GP IIb/IIIa inhibitors.';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: '/ 7 points',
                interpretation: risk,
                alertClass: `ui-alert-${alertClass}`
            })}
            ${uiBuilder.createResultItem({
                label: '14-Day Event Rate',
                value: eventRate,
                unit: '',
                alertClass: `ui-alert-${alertClass}`
            })}
            
            <div class="ui-alert ui-alert-${alertClass} mt-10">
                <span class="ui-alert-icon">💡</span>
                <div class="ui-alert-content">
                    <strong>Recommendation:</strong> ${recommendation}
                </div>
            </div>
        `;
    },
    customInitialize: (client: unknown, patient: unknown, container: HTMLElement, calculate: () => void): void => {
        const setYes = (name: string): void => {
            // Yes/No calculator 的 Yes 選項使用點數作為 value (在這個例子中是 "1")
            const radio = container.querySelector(`input[name="${name}"][value="1"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        // Age (不需要 client)
        const typedPatient = patient as { birthDate?: string } | null;
        if (typedPatient?.birthDate) {
            const age = calculateAge(typedPatient.birthDate);
            if (age >= 65) {
                setYes('timi-age');
            }
        }

        if (!client) return;

        // Known CAD (simplified check using SNOMED code)
        getPatientConditions(client, ['53741008']).then((conditions: unknown[]) => {
            if (conditions && conditions.length > 0) {
                setYes('timi-known-cad');
            }
        }).catch(e => console.warn('Error fetching CAD conditions:', e));

        // Smoking status check (LOINC 72166-2)
        getObservation(client, '72166-2').then((obs: unknown) => {
            const typedObs = obs as { valueCodeableConcept?: { coding?: Array<{ code: string }> } };
            if (typedObs?.valueCodeableConcept?.coding) {
                const smokerCodes = ['449868002', '428041000124106'];
                if (typedObs.valueCodeableConcept.coding.some(c => smokerCodes.includes(c.code))) {
                    // Could be used as part of CAD risk factors
                    console.log('Patient is a current smoker');
                }
            }
        }).catch(e => console.warn('Error fetching smoking status:', e));
    }
};

export const timiNstemi = createYesNoCalculator(config);
