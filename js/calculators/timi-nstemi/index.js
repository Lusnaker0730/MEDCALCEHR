import { getPatientConditions, getObservation, calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const timiNstemi = {
    id: 'timi-nstemi',
    title: 'TIMI Risk Score for UA/NSTEMI',
    description: 'Estimates mortality for patients with unstable angina and non-ST elevation MI.',
    generateHTML: () => {
        const criteria = [
            { id: 'timi-age', label: 'Age ≥ 65', icon: '👴', help: 'Patient is 65 years or older' },
            { id: 'timi-cad-risk', label: '≥ 3 CAD Risk Factors', icon: '⚠️', help: 'Hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker' },
            { id: 'timi-known-cad', label: 'Known CAD (Stenosis ≥ 50%)', icon: '❤️', help: 'Prior angiogram showing ≥ 50% stenosis' },
            { id: 'timi-asa', label: 'ASA Use in Past 7 Days', icon: '💊', help: 'Aspirin use within the last week' },
            { id: 'timi-angina', label: 'Severe Angina (≥ 2 episodes in 24h)', icon: '🫀', help: 'At least 2 angina episodes in the last 24 hours' },
            { id: 'timi-ekg', label: 'EKG ST Changes ≥ 0.5mm', icon: '📈', help: 'ST segment deviation of 0.5mm or more' },
            { id: 'timi-marker', label: 'Positive Cardiac Marker', icon: '🧪', help: 'Elevated Troponin or CK-MB' }
        ];
        const sections = criteria.map(item => uiBuilder.createSection({
            title: item.label,
            icon: item.icon,
            content: uiBuilder.createRadioGroup({
                name: item.id,
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes (+1)' }
                ],
                helpText: item.help
            })
        })).join('');
        return `
            <div class="calculator-header">
                <h3>TIMI Risk Score for UA/NSTEMI</h3>
                <p class="description">Estimates mortality for patients with unstable angina and non-ST elevation MI.</p>
            </div>
            
            ${sections}
            
            <div id="timi-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'timi-result', title: 'TIMI Risk Score' })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
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
                `
        })}
        `;
    },
    initialize: (client, patient, container) => {
        uiBuilder.initializeComponents(container);
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#timi-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                let score = 0;
                const radios = container.querySelectorAll('input[type="radio"]:checked');
                radios.forEach(radio => {
                    score += parseInt(radio.value, 10);
                });
                let risk = '';
                let eventRate = '';
                let alertClass = '';
                let recommendation = '';
                if (score <= 2) {
                    risk = 'Low Risk';
                    eventRate = '5-8%';
                    alertClass = 'ui-alert-success';
                    recommendation = 'Conservative management; medical therapy optimization; outpatient follow-up; consider stress testing.';
                }
                else if (score <= 4) {
                    risk = 'Intermediate Risk';
                    eventRate = '13-20%';
                    alertClass = 'ui-alert-warning';
                    recommendation = 'Intensive medical therapy; consider early invasive strategy; dual antiplatelet therapy; close monitoring.';
                }
                else {
                    risk = 'High Risk';
                    eventRate = '26-41%';
                    alertClass = 'ui-alert-danger';
                    recommendation = 'Early invasive strategy; urgent cardiology consultation; aggressive antiplatelet therapy; consider GP IIb/IIIa inhibitors.';
                }
                const resultBox = container.querySelector('#timi-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score.toString(),
                            unit: '/ 7 points',
                            interpretation: risk,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createResultItem({
                            label: '14-Day Event Rate',
                            value: eventRate,
                            unit: '',
                            alertClass: alertClass
                        })}
                        
                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">💡</span>
                            <div class="ui-alert-content">
                                <strong>Recommendation:</strong> ${recommendation}
                            </div>
                        </div>
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#timi-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'timi-nstemi', action: 'calculate' });
            }
        };
        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // Helper to set radio value
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        // FHIR Integration
        if (client) {
            // Age
            if (patient && patient.birthDate) {
                const age = calculateAge(patient.birthDate);
                if (age >= 65) {
                    setRadioValue('timi-age', '1');
                }
            }
            // Known CAD (simplified check)
            getPatientConditions(client, ['53741008']).then((conditions) => {
                if (conditions && conditions.length > 0) {
                    setRadioValue('timi-known-cad', '1');
                }
            }).catch(e => console.warn(e));
            // Smoking (simplified check for CAD risk factors)
            // 72166-2 is "Tobacco smoking status"
            // 449868002: Smoker on current inventory
            // 428041000124106: Current occasional tobacco smoker
            getObservation(client, '72166-2').then((obs) => {
                if (obs && obs.valueCodeableConcept && obs.valueCodeableConcept.coding) {
                    if (obs.valueCodeableConcept.coding.some((c) => ['449868002', '428041000124106'].includes(c.code))) {
                        // Logic place holder
                    }
                }
            }).catch((e) => console.warn(e));
        }
        calculate();
    }
};
