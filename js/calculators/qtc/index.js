import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const qtc = {
    id: 'qtc',
    title: 'Corrected QT Interval (QTc)',
    description: 'Calculates corrected QT interval using various formulas to assess risk of arrhythmias.',
    generateHTML: function () {
        const inputSection = uiBuilder.createSection({
            title: 'Measurements',
            content: [
                uiBuilder.createInput({
                    id: 'qtc-qt',
                    label: 'QT Interval',
                    type: 'number',
                    placeholder: 'e.g., 400',
                    unit: 'ms'
                }),
                uiBuilder.createInput({
                    id: 'qtc-hr',
                    label: 'Heart Rate',
                    type: 'number',
                    placeholder: 'loading...',
                    unit: 'bpm'
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createSection({
            title: 'Correction Formula',
            content: uiBuilder.createRadioGroup({
                name: 'qtc-formula',
                options: [
                    { value: 'bazett', label: 'Bazett (most common)', checked: true },
                    { value: 'fridericia', label: 'Fridericia (better at extreme HR)' },
                    { value: 'hodges', label: 'Hodges (linear correction)' },
                    { value: 'framingham', label: 'Framingham' }
                ]
            })
        });

        const formulaRefSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'Bazett', formula: 'QTc = QT / √RR' },
                { label: 'Fridericia', formula: 'QTc = QT / ∛RR' },
                { label: 'Hodges', formula: 'QTc = QT + 1.75 × (HR - 60)' },
                { label: 'Framingham', formula: 'QTc = QT + 154 × (1 - RR)' },
                { label: 'Note', formula: 'RR = 60 / Heart Rate (in seconds)' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${inputSection}
            ${formulaSection}
            
            <div id="qtc-error-container"></div>
            
            <div id="qtc-result" class="ui-result-box">
                <div class="ui-result-header">QTc Results</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${formulaRefSection}
            
            <div class="info-section mt-20">
                <h4>📚 Normal Values</h4>
                <ul style="margin-top: 5px; padding-left: 20px;">
                    <li>Men: QTc &lt; 450 ms</li>
                    <li>Women: QTc &lt; 460 ms</li>
                    <li>Prolonged: &gt; 500 ms (increased risk of arrhythmias)</li>
                </ul>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const resultBox = container.querySelector('#qtc-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            try {
                // Clear previous errors
                const errorContainer = container.querySelector('#qtc-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const qtInput = container.querySelector('#qtc-qt');
                const hrInput = container.querySelector('#qtc-hr');
                const qt = parseFloat(qtInput.value);
                const hr = parseFloat(hrInput.value);
                const formulaRadio = container.querySelector('input[name="qtc-formula"]:checked');
                const formula = formulaRadio ? formulaRadio.value : 'bazett';

                // Validate inputs
                const inputs = { qtInterval: qt, heartRate: hr };
                const schema = {
                    qtInterval: ValidationRules.qtInterval,
                    heartRate: ValidationRules.heartRate
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (qtInput.value || hrInput.value);

                    if (hasInput && errorContainer) {
                        const valuesPresent = !isNaN(qt) && !isNaN(hr);
                        // Only show specific validation errors if values are present but invalid,
                        // or if required fields are missing but user started typing (simplistic check)
                        // Better: just if invalid, show first error.
                        if (validation.errors.some(e => !e.includes('required'))) {
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                const rr = 60 / hr;
                let qtcValue;
                let formulaName;

                switch (formula) {
                    case 'bazett':
                        qtcValue = qt / Math.sqrt(rr);
                        formulaName = 'Bazett';
                        break;
                    case 'fridericia':
                        qtcValue = qt / Math.cbrt(rr);
                        formulaName = 'Fridericia';
                        break;
                    case 'hodges':
                        qtcValue = qt + 1.75 * (hr - 60);
                        formulaName = 'Hodges';
                        break;
                    case 'framingham':
                        qtcValue = qt + 154 * (1 - rr);
                        formulaName = 'Framingham';
                        break;
                }

                if (!isFinite(qtcValue) || isNaN(qtcValue)) throw new Error("Calculation resulted in invalid value");

                // Determine risk level
                let alertClass = 'ui-alert-success';
                let riskText = 'Normal';
                let interpretation = 'Normal: Men <450ms, Women <460ms';

                if (qtcValue > 500) {
                    alertClass = 'ui-alert-danger';
                    riskText = 'Prolonged';
                    interpretation = 'QTc >500ms significantly increases risk of Torsades de Pointes and sudden cardiac death.';
                } else if (qtcValue > 460) {
                    alertClass = 'ui-alert-warning';
                    riskText = 'Borderline';
                    interpretation = 'Borderline prolonged QTc.';
                }

                // Update title dynamically
                resultBox.querySelector('.ui-result-header').textContent = `QTc Results (${formulaName})`;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Corrected QT Interval',
                    value: qtcValue.toFixed(0),
                    unit: 'ms',
                    interpretation: riskText,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">${alertClass.includes('success') ? '✓' : '⚠️'}</span>
                        <div class="ui-alert-content">
                            <p>${interpretation}</p>
                        </div>
                    </div>
                `;
                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#qtc-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'qtc', action: 'calculate' });
                resultBox.classList.remove('show');
            }
        };

        // Auto-populate heart rate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs && obs.valueQuantity) {
                    container.querySelector('#qtc-hr').value = obs.valueQuantity.value.toFixed(0);
                    // Explicitly trigger calculation if QT is already there or just to refresh state
                    // But we might not want to show errors immediately if QT is empty.
                    // Just set value.
                }
            }).catch(e => console.warn(e));
        }

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Initial calculation
        calculate();
    }
};