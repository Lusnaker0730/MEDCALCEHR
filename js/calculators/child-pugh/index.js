import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const childPugh = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    description: 'Estimates cirrhosis severity.',
    generateHTML: function () {
        const labSection = uiBuilder.createSection({
            title: 'Laboratory Parameters',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'bilirubin',
                    label: 'Bilirubin (Total)',
                    options: [
                        { value: '1', label: '< 2 mg/dL (< 34.2 μmol/L) (+1)' },
                        { value: '2', label: '2-3 mg/dL (34.2-51.3 μmol/L) (+2)' },
                        { value: '3', label: '> 3 mg/dL (> 51.3 μmol/L) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'albumin',
                    label: 'Albumin',
                    options: [
                        { value: '1', label: '> 3.5 g/dL (> 35 g/L) (+1)' },
                        { value: '2', label: '2.8-3.5 g/dL (28-35 g/L) (+2)' },
                        { value: '3', label: '< 2.8 g/dL (< 28 g/L) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'inr',
                    label: 'INR',
                    options: [
                        { value: '1', label: '< 1.7 (+1)' },
                        { value: '2', label: '1.7-2.3 (+2)' },
                        { value: '3', label: '> 2.3 (+3)' }
                    ]
                })
            ].join('')
        });
        const clinicalSection = uiBuilder.createSection({
            title: 'Clinical Parameters',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'ascites',
                    label: 'Ascites',
                    helpText: 'Fluid accumulation in peritoneal cavity',
                    options: [
                        { value: '1', label: 'Absent (+1)' },
                        { value: '2', label: 'Slight (controlled with diuretics) (+2)' },
                        { value: '3', label: 'Moderate (despite diuretic therapy) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'encephalopathy',
                    label: 'Hepatic Encephalopathy',
                    helpText: 'Neuropsychiatric abnormalities',
                    options: [
                        { value: '1', label: 'No Encephalopathy (+1)' },
                        { value: '2', label: 'Grade 1-2 (mild confusion, asterixis) (+2)' },
                        { value: '3', label: 'Grade 3-4 (severe confusion, coma) (+3)' }
                    ]
                })
            ].join('')
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>About Child-Pugh Score:</strong> Assesses the prognosis of chronic liver disease, mainly cirrhosis. Uses five clinical measures to classify patients into three categories (A, B, C) with different survival rates and surgical risks.</p>
                </div>
            </div>

            <div class="lab-values-summary">
                <h4>📋 Current Lab Values</h4>
                <div class="lab-values-grid">
                    <div class="lab-value-item">
                        <div class="lab-label">Bilirubin (Total)</div>
                        <div class="lab-value" id="current-bilirubin">Loading...</div>
                    </div>
                    <div class="lab-value-item">
                        <div class="lab-label">Albumin</div>
                        <div class="lab-value" id="current-albumin">Loading...</div>
                    </div>
                    <div class="lab-value-item">
                        <div class="lab-label">INR</div>
                        <div class="lab-value" id="current-inr">Loading...</div>
                    </div>
                </div>
            </div>

            ${labSection}
            ${clinicalSection}
            
            <div id="child-pugh-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'child-pugh-result', title: 'Child-Pugh Score Assessment' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const groups = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy'];
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#child-pugh-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                let score = 0;
                const allAnswered = groups.every(group => container.querySelector(`input[name="${group}"]:checked`));
                groups.forEach(group => {
                    const selected = container.querySelector(`input[name="${group}"]:checked`);
                    if (selected) {
                        const value = parseInt(selected.value);
                        score += value;
                    }
                });
                const resultBox = container.querySelector('#child-pugh-result');
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (!allAnswered) {
                    resultBox.classList.remove('show');
                    return;
                }
                let classification = '';
                let prognosis = '';
                let alertClass = 'ui-alert-info';
                if (score <= 6) {
                    classification = 'Child Class A';
                    prognosis = 'Well-compensated disease - Good prognosis\nLife Expectancy: 15-20 years\nSurgical Mortality: 10%';
                    alertClass = 'ui-alert-success';
                }
                else if (score <= 9) {
                    classification = 'Child Class B';
                    prognosis = 'Significant functional compromise - Moderate prognosis\nLife Expectancy: 4-14 years\nSurgical Mortality: 30%';
                    alertClass = 'ui-alert-warning';
                }
                else {
                    classification = 'Child Class C';
                    prognosis = 'Decompensated disease - Poor prognosis\nLife Expectancy: 1-3 years\nSurgical Mortality: 82%';
                    alertClass = 'ui-alert-danger';
                }
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total Points',
                    value: score,
                    unit: 'points'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Classification',
                    value: classification,
                    interpretation: prognosis.replace(/\n/g, '<br>'),
                    alertClass: alertClass
                })}
                `;
                resultBox.classList.add('show');
            }
            catch (error) {
                const errorContainer = container.querySelector('#child-pugh-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'child-pugh', action: 'calculate' });
            }
        };
        const setRadioFromValue = (groupName, value, ranges, displayValue, unit) => {
            if (value === null || value === undefined) {
                const displayEl = container.querySelector(`#current-${groupName}`);
                if (displayEl) {
                    displayEl.textContent = 'Not available';
                }
                return;
            }
            // Update display
            const displayEl = container.querySelector(`#current-${groupName}`);
            if (displayEl) {
                displayEl.textContent = `${displayValue} ${unit}`;
            }
            // Select appropriate radio
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${radioToSelect.value}"]`);
                if (radio) {
                    radio.checked = true;
                    // Trigger change event to update UI (if needed) and recalculate
                    radio.dispatchEvent(new Event('change'));
                }
            }
        };
        // Fetch and set lab values
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BILIRUBIN_TOTAL)
                .then(obs => {
                if (obs && obs.valueQuantity) {
                    const value = obs.valueQuantity.value;
                    setRadioFromValue('bilirubin', value, [
                        { condition: v => v < 2, value: '1' },
                        { condition: v => v >= 2 && v <= 3, value: '2' },
                        { condition: v => v > 3, value: '3' }
                    ], value.toFixed(1), 'mg/dL');
                    // Track staleness
                    stalenessTracker.trackObservation('#current-bilirubin', obs, LOINC_CODES.BILIRUBIN_TOTAL, 'Bilirubin');
                }
                else {
                    const el = container.querySelector('#current-bilirubin');
                    if (el)
                        el.textContent = 'Not available';
                }
            })
                .catch(error => {
                console.error('Error fetching bilirubin:', error);
                const el = container.querySelector('#current-bilirubin');
                if (el)
                    el.textContent = 'Not available';
            });
            getMostRecentObservation(client, LOINC_CODES.ALBUMIN)
                .then(obs => {
                if (obs && obs.valueQuantity) {
                    // Check unit. If g/L, convert to g/dL. If g/dL, use as is.
                    let valueGdL = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'g/dL';
                    if (unit.toLowerCase().includes('l') && !unit.toLowerCase().includes('dl')) {
                        // Assuming g/L
                        valueGdL = valueGdL / 10;
                    }
                    setRadioFromValue('albumin', valueGdL, [
                        { condition: v => v > 3.5, value: '1' },
                        { condition: v => v >= 2.8 && v <= 3.5, value: '2' },
                        { condition: v => v < 2.8, value: '3' }
                    ], valueGdL.toFixed(1), 'g/dL');
                    // Track staleness
                    stalenessTracker.trackObservation('#current-albumin', obs, LOINC_CODES.ALBUMIN, 'Albumin');
                }
                else {
                    const el = container.querySelector('#current-albumin');
                    if (el)
                        el.textContent = 'Not available';
                }
            })
                .catch(error => {
                console.error('Error fetching albumin:', error);
                const el = container.querySelector('#current-albumin');
                if (el)
                    el.textContent = 'Not available';
            });
            getMostRecentObservation(client, LOINC_CODES.INR_COAG)
                .then(obs => {
                if (obs && obs.valueQuantity) {
                    const value = obs.valueQuantity.value;
                    setRadioFromValue('inr', value, [
                        { condition: v => v < 1.7, value: '1' },
                        { condition: v => v >= 1.7 && v <= 2.3, value: '2' },
                        { condition: v => v > 2.3, value: '3' }
                    ], value.toFixed(2), '');
                    // Track staleness
                    stalenessTracker.trackObservation('#current-inr', obs, LOINC_CODES.INR_COAG, 'INR');
                }
                else {
                    const el = container.querySelector('#current-inr');
                    if (el)
                        el.textContent = 'Not available';
                }
            })
                .catch(error => {
                console.error('Error fetching INR:', error);
                const el = container.querySelector('#current-inr');
                if (el)
                    el.textContent = 'Not available';
            });
        }
        // Event listeners for all radio buttons
        container.addEventListener('change', (e) => {
            const target = e.target;
            if (target.type === 'radio') {
                calculate();
            }
        });
        // Initial calculation
        calculate();
    }
};
