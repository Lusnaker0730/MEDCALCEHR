import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const ransonScore = {
    id: 'ranson-score',
    title: 'Ranson Score for Pancreatitis',
    description: 'Predicts severity and mortality of acute pancreatitis (for non-gallstone cases).',
    generateHTML: function () {
        const admissionCriteria = [
            { id: 'ranson-age', label: 'Age > 55 years' },
            { id: 'ranson-wbc', label: 'WBC count > 16,000/mm³' },
            { id: 'ranson-glucose', label: 'Blood glucose > 200 mg/dL (>11 mmol/L)' },
            { id: 'ranson-ast', label: 'Serum AST > 250 IU/L' },
            { id: 'ranson-ldh', label: 'Serum LDH > 350 IU/L' }
        ];
        const hours48Criteria = [
            { id: 'ranson-calcium', label: 'Serum calcium < 8.0 mg/dL (<2.0 mmol/L)' },
            { id: 'ranson-hct', label: 'Hematocrit fall > 10%' },
            { id: 'ranson-paO2', label: 'PaO₂ < 60 mmHg' },
            { id: 'ranson-bun', label: 'BUN increase > 5 mg/dL (>1.8 mmol/L)' },
            { id: 'ranson-base', label: 'Base deficit > 4 mEq/L' },
            { id: 'ranson-fluid', label: 'Fluid sequestration > 6 L' }
        ];
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Note:</strong> This score applies to non-gallstone pancreatitis. Different criteria exist for gallstone pancreatitis.'
        })}

            ${uiBuilder.createSection({
            title: 'At Admission or Diagnosis',
            icon: '🏥',
            content: uiBuilder.createCheckboxGroup({
                name: 'ranson-admission',
                options: admissionCriteria.map(c => ({ ...c, value: '1' }))
            })
        })}

            ${uiBuilder.createSection({
            title: 'During Initial 48 Hours',
            icon: '⏱️',
            content: uiBuilder.createCheckboxGroup({
                name: 'ranson-48h',
                options: hours48Criteria.map(c => ({ ...c, value: '1' }))
            })
        })}

            <div id="ranson-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'ranson-result', title: 'Ranson Score Result' })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Mortality Estimation</h4>
                    <div class="ui-data-table">
                        <table>
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
                    </div>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const resultBox = container.querySelector('#ranson-result');
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#ranson-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                let score = 0;
                container.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    score += 1;
                });
                let mortality = '';
                let severity = '';
                let alertType = 'info';
                if (score <= 2) {
                    mortality = '0-3%';
                    severity = 'Low Risk';
                    alertType = 'success';
                }
                else if (score <= 4) {
                    mortality = '15-20%';
                    severity = 'Moderate Risk';
                    alertType = 'warning';
                }
                else if (score <= 6) {
                    mortality = '~40%';
                    severity = 'High Risk';
                    alertType = 'danger';
                }
                else {
                    mortality = '>50%';
                    severity = 'Very High Risk';
                    alertType = 'danger';
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total Ranson Score',
                            value: score,
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
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#ranson-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'ranson', action: 'calculate' });
            }
        };
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', calculate);
        });
        // Auto-populate
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age > 55) {
                const box = container.querySelector('#ranson-age');
                if (box)
                    box.checked = true;
            }
        }
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WBC).then(obs => {
                if (obs?.valueQuantity) {
                    // WBC usually 10^3/uL. 16,000/mm3 = 16 10^3/uL.
                    // Need to check unit or magnitude.
                    // If value > 1000, assume cells/uL?
                    // Standard FHIR often K/uL.
                    let val = obs.valueQuantity.value;
                    if (val > 1000)
                        val = val / 1000; // Convert to K/uL if raw count
                    if (val > 16) {
                        const box = container.querySelector('#ranson-wbc');
                        if (box)
                            box.checked = true;
                    }
                    calculate();
                    stalenessTracker.trackObservation('#ranson-wbc', obs, LOINC_CODES.WBC, 'WBC Count');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.GLUCOSE).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'mmol/L')
                        val = val * 18.0182;
                    if (val > 200) {
                        const box = container.querySelector('#ranson-glucose');
                        if (box)
                            box.checked = true;
                    }
                    calculate();
                    stalenessTracker.trackObservation('#ranson-glucose', obs, LOINC_CODES.GLUCOSE, 'Blood Glucose');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.AST).then(obs => {
                if (obs?.valueQuantity) {
                    if (obs.valueQuantity.value > 250) {
                        const box = container.querySelector('#ranson-ast');
                        if (box)
                            box.checked = true;
                    }
                    calculate();
                    stalenessTracker.trackObservation('#ranson-ast', obs, LOINC_CODES.AST, 'AST');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.LDH).then(obs => {
                if (obs?.valueQuantity) {
                    if (obs.valueQuantity.value > 350) {
                        const box = container.querySelector('#ranson-ldh');
                        if (box)
                            box.checked = true;
                    }
                    calculate();
                    stalenessTracker.trackObservation('#ranson-ldh', obs, LOINC_CODES.LDH, 'LDH');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.CALCIUM).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'mmol/L')
                        val = val * 4.008;
                    if (val < 8.0) {
                        const box = container.querySelector('#ranson-calcium');
                        if (box)
                            box.checked = true;
                    }
                    calculate();
                    stalenessTracker.trackObservation('#ranson-calcium', obs, LOINC_CODES.CALCIUM, 'Calcium');
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
