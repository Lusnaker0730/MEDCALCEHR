import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const qtc: CalculatorModule = {
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
                <ul class="info-list">
                    <li>Men: QTc &lt; 450 ms</li>
                    <li>Women: QTc &lt; 460 ms</li>
                    <li>Prolonged: &gt; 500 ms (increased risk of arrhythmias)</li>
                </ul>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const resultBox = container.querySelector('#qtc-result') as HTMLElement;
        const resultContent = resultBox?.querySelector('.ui-result-content') as HTMLElement;

        const calculate = () => {
            try {
                // Clear previous errors
                const errorContainer = container.querySelector('#qtc-error-container') as HTMLElement;
                if (errorContainer) errorContainer.innerHTML = '';

                const qtInput = container.querySelector('#qtc-qt') as HTMLInputElement;
                const hrInput = container.querySelector('#qtc-hr') as HTMLInputElement;

                if (!qtInput || !hrInput) return;

                const qt = parseFloat(qtInput.value);
                const hr = parseFloat(hrInput.value);
                const formulaRadio = container.querySelector('input[name="qtc-formula"]:checked') as HTMLInputElement;
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
                        if (validation.errors.some(e => !e.includes('required'))) {
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                const rr = 60 / hr;
                let qtcValue = 0;
                let formulaName = '';

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
                const resultHeader = resultBox?.querySelector('.ui-result-header');
                if (resultHeader) resultHeader.textContent = `QTc Results (${formulaName})`;

                if (resultContent) {
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
                    resultBox?.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#qtc-error-container') as HTMLElement;
                if (errorContainer) {
                    displayError(errorContainer, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'qtc', action: 'calculate' });
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate heart rate from FHIR using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    const hrResult = await fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                        trackStaleness: true,
                        stalenessLabel: 'Heart Rate'
                    });

                    if (hrResult.value !== null) {
                        const hrInput = container.querySelector('#qtc-hr') as HTMLInputElement;
                        if (hrInput) {
                            hrInput.value = hrResult.value.toFixed(0);
                            hrInput.dispatchEvent(new Event('input'));
                        }
                    }
                } catch (e) {
                    console.warn('Error auto-populating QTc:', e);
                }
            }
            calculate();
        };

        autoPopulate();
    }
};
