import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const qsofaScore = {
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description: 'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥ 2 is positive.',
    generateHTML: function () {
        const criteria = [
            { id: 'qsofa-rr', label: 'Respiratory Rate ≥ 22/min', points: 1 },
            { id: 'qsofa-ams', label: 'Altered Mental Status (GCS < 15)', points: 1 },
            { id: 'qsofa-sbp', label: 'Systolic Blood Pressure ≤ 100 mmHg', points: 1 }
        ];
        const criteriaSection = uiBuilder.createSection({
            title: 'qSOFA Criteria',
            subtitle: 'Check all that apply',
            icon: '📋',
            content: criteria.map(item => uiBuilder.createCheckbox({
                id: item.id,
                label: item.label,
                value: item.points.toString()
            })).join('')
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Check all criteria that apply. A score ≥ 2 suggests higher risk of mortality or prolonged ICU stay.'
        })}
            
            ${criteriaSection}
            
            <div id="qsofa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'qsofa-result', title: 'qSOFA Score Results' })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Interpretation</h4>
                    <ul class="info-list">
                        <li><strong>Score ≥ 2:</strong> Positive screen; higher risk of poor outcomes.</li>
                        <li><strong>Score < 2:</strong> Negative screen; lower risk but continue monitoring.</li>
                    </ul>
                    <h4 class="mt-15">Next Steps for Positive qSOFA:</h4>
                    <ul class="info-list">
                        <li>Calculate full SOFA score</li>
                        <li>Measure serum lactate</li>
                        <li>Obtain blood cultures</li>
                        <li>Consider early antibiotic therapy</li>
                        <li>Assess for organ dysfunction</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const calculate = () => {
            try {
                // Clear any previous errors
                const errorContainer = container.querySelector('#qsofa-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                let score = 0;
                checkboxes.forEach(box => {
                    if (box.checked) {
                        score += parseInt(box.value);
                    }
                });
                let riskLevel = '';
                let interpretation = '';
                let alertClass = '';
                if (score >= 2) {
                    riskLevel = 'Positive Screen';
                    interpretation = 'Increased risk of poor outcomes. Consider further sepsis evaluation (SOFA score, lactate, blood cultures).';
                    alertClass = 'ui-alert-danger';
                }
                else if (score === 1) {
                    riskLevel = 'Intermediate';
                    interpretation = 'Monitor closely. Consider early intervention if clinical suspicion is high.';
                    alertClass = 'ui-alert-warning';
                }
                else {
                    riskLevel = 'Negative Screen';
                    interpretation = 'Lower risk, but continue to monitor if infection is suspected.';
                    alertClass = 'ui-alert-success';
                }
                const resultBox = container.querySelector('#qsofa-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total qSOFA Score',
                            value: score,
                            unit: '/ 3 points',
                            interpretation: riskLevel,
                            alertClass: alertClass
                        })}
                        
                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">${alertClass.includes('danger') ? '🚨' : 'ℹ️'}</span>
                            <div class="ui-alert-content">
                                <strong>Interpretation:</strong> ${interpretation}
                            </div>
                        </div>
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                // Error Handling
                const errorContainer = container.querySelector('#qsofa-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'qsofa', action: 'calculate' });
            }
        };
        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });
        // Auto-populate
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity?.value >= 22) {
                    const box = container.querySelector('#qsofa-rr');
                    if (box) {
                        box.checked = true;
                        // Use dispatchEvent to trigger listener if needed, but manual call to calculate works too
                        box.dispatchEvent(new Event('change'));
                        // Staleness check
                        stalenessTracker.trackObservation('#qsofa-rr', obs, LOINC_CODES.RESPIRATORY_RATE, 'Respiratory Rate');
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity?.value <= 100) {
                    const box = container.querySelector('#qsofa-sbp');
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                        // Staleness check
                        stalenessTracker.trackObservation('#qsofa-sbp', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    }
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
