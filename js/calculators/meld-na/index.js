import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const meldNa = {
    id: 'meld-na',
    title: 'MELD-Na (UNOS/OPTN)',
    description: 'Quantifies end-stage liver disease for transplant planning with sodium.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Laboratory Values',
            content: [
                uiBuilder.createInput({
                    id: 'meld-na-bili',
                    label: 'Bilirubin (Total)',
                    type: 'number',
                    step: 0.1,
                    unitToggle: { type: 'bilirubin', units: ['mg/dL', 'µmol/L'] }
                }),
                uiBuilder.createInput({
                    id: 'meld-na-inr',
                    label: 'INR',
                    type: 'number',
                    step: 0.01,
                    placeholder: 'e.g., 1.5'
                }),
                uiBuilder.createInput({
                    id: 'meld-na-creat',
                    label: 'Creatinine',
                    type: 'number',
                    step: 0.1,
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] }
                }),
                uiBuilder.createInput({
                    id: 'meld-na-sodium',
                    label: 'Sodium',
                    type: 'number',
                    step: 1,
                    unitToggle: { type: 'sodium', units: ['mEq/L', 'mmol/L'], defaultUnit: 'mEq/L' },
                    placeholder: '100 - 155'
                }),
                uiBuilder.createCheckbox({
                    id: 'meld-na-dialysis',
                    label: 'Patient on dialysis twice in the last week'
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'MELD Score', formula: '0.957 × ln(Creat) + 0.378 × ln(Bili) + 1.120 × ln(INR) + 0.643' },
                { label: 'MELD-Na Score (if MELD > 11)', formula: 'MELD + 1.32 × (137 - Na) - [0.033 × MELD × (137 - Na)]' },
                { label: 'Constraints', formula: 'Min lab values: 1.0; Max Creat: 4.0; Na capped: 125-137; Score range: 6-40' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p>MELD-Na has superior predictive accuracy compared to MELD alone for 90-day mortality. Enter laboratory values below for automatic calculation.</p>
                </div>
            </div>
            
            ${inputs}
            
            <div id="meld-na-error-container"></div>
            
            <div id="meld-na-result" class="ui-result-box">
                <div class="ui-result-header">MELD-Na Score Result</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${formulaSection}
            
            <div class="alert warning mt-20">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p><strong>Clinical Note:</strong> Used for liver transplant priority allocation. Scores should be updated regularly as clinical status changes.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#meld-na-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const biliInput = container.querySelector('#meld-na-bili');
            const inrInput = container.querySelector('#meld-na-inr');
            const creatInput = container.querySelector('#meld-na-creat');
            const sodiumInput = container.querySelector('#meld-na-sodium');
            const dialysisCheckbox = container.querySelector('#meld-na-dialysis');

            const resultBox = container.querySelector('#meld-na-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            try {
                // Get standard values
                const bili = UnitConverter.getStandardValue(biliInput, 'mg/dL');
                const inr = parseFloat(inrInput.value);
                const creat = UnitConverter.getStandardValue(creatInput, 'mg/dL');
                const sodium = UnitConverter.getStandardValue(sodiumInput, 'mEq/L');
                const onDialysis = dialysisCheckbox.checked;

                // Define validation schema
                const inputs = { bili, inr, creat, sodium };
                const schema = {
                    bili: ValidationRules.bilirubin,
                    inr: ValidationRules.inr,
                    creat: ValidationRules.creatinine,
                    sodium: ValidationRules.sodium
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (biliInput.value || inrInput.value || creatInput.value || sodiumInput.value);

                    if (hasInput) {
                        const meaningfulErrors = validation.errors.filter(() => true);

                        // Show error if we have data presence
                        const valuesPresent = !isNaN(bili) && !isNaN(inr) && !isNaN(creat) && !isNaN(sodium);

                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (meaningfulErrors.length > 0) {
                                if (errorContainer) displayError(errorContainer, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                            }
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                // Apply UNOS/OPTN rules
                const adjustedBili = Math.max(bili, 1.0);
                const adjustedInr = Math.max(inr, 1.0);
                let adjustedCreat = Math.max(creat, 1.0);
                if (onDialysis || adjustedCreat > 4.0) {
                    adjustedCreat = 4.0;
                }

                // Calculate original MELD
                let meldScore =
                    0.957 * Math.log(adjustedCreat) +
                    0.378 * Math.log(adjustedBili) +
                    1.12 * Math.log(adjustedInr) +
                    0.643;
                meldScore = Math.round(meldScore * 10) / 10;

                // Calculate MELD-Na
                let meldNaScore = meldScore;
                if (meldScore > 11) {
                    const adjustedSodium = Math.max(125, Math.min(137, sodium));
                    meldNaScore =
                        meldScore +
                        1.32 * (137 - adjustedSodium) -
                        0.033 * meldScore * (137 - adjustedSodium);
                }

                // Final score capping
                meldNaScore = Math.max(6, Math.min(40, meldNaScore));
                meldNaScore = Math.round(meldNaScore);

                // Determine risk category and mortality
                let riskCategory = '';
                let mortalityRate = '';
                let alertClass = '';

                if (meldNaScore < 10) {
                    riskCategory = 'Low Risk';
                    mortalityRate = '1.9%';
                    alertClass = 'ui-alert-success';
                } else if (meldNaScore <= 19) {
                    riskCategory = 'Low-Moderate Risk';
                    mortalityRate = '6.0%';
                    alertClass = 'ui-alert-info';
                } else if (meldNaScore <= 29) {
                    riskCategory = 'Moderate Risk';
                    mortalityRate = '19.6%';
                    alertClass = 'ui-alert-warning';
                } else if (meldNaScore <= 39) {
                    riskCategory = 'High Risk';
                    mortalityRate = '52.6%';
                    alertClass = 'ui-alert-danger';
                } else {
                    riskCategory = 'Very High Risk';
                    mortalityRate = '71.3%';
                    alertClass = 'ui-alert-danger';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'MELD-Na Score',
                    value: meldNaScore,
                    unit: 'points',
                    interpretation: `${riskCategory} (90-Day Mortality: ${mortalityRate})`,
                    alertClass: alertClass
                })}
                    
                    <div style="margin-top: 15px; font-size: 0.9em; color: #666; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                        <strong>Calculation Breakdown:</strong><br>
                        • Original MELD: ${meldScore.toFixed(1)}<br>
                        • Adjusted Bilirubin: ${adjustedBili.toFixed(1)} mg/dL<br>
                        • Adjusted INR: ${adjustedInr.toFixed(2)}<br>
                        • Adjusted Creatinine: ${adjustedCreat.toFixed(1)} mg/dL ${onDialysis ? '(capped for dialysis)' : ''}
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'meld-na', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultBox.classList.remove('show');
            }
        };

        // Helper to safely set value
        const setInputValue = (id, val, checkUnit = false) => {
            const input = container.querySelector(id);
            // Logic to handle conversion if needed is omitted for brevity but should be consistent
            if (input && val) {
                input.value = val;
                input.dispatchEvent(new Event('input'));
            }
        };

        // Auto-populate from FHIR data
        if (client) {
            const obsMap = [
                { code: LOINC_CODES.BILIRUBIN_TOTAL, id: '#meld-na-bili', type: 'bilirubin', unit: 'mg/dL' },
                { code: LOINC_CODES.INR_COAG, id: '#meld-na-inr', type: 'inr', unit: '' },
                { code: LOINC_CODES.CREATININE, id: '#meld-na-creat', type: 'creatinine', unit: 'mg/dL' },
                { code: LOINC_CODES.SODIUM, id: '#meld-na-sodium', type: 'sodium', unit: 'mEq/L' }
            ];

            obsMap.forEach(item => {
                getMostRecentObservation(client, item.code).then(obs => {
                    if (obs?.valueQuantity) {
                        const val = obs.valueQuantity.value;
                        const unit = obs.valueQuantity.unit || item.unit;
                        // Use unit converter to normalize if possible
                        if (item.type && item.type !== 'inr') {
                            const converted = UnitConverter.convert(val, unit, item.unit, item.type);
                            if (converted !== null) setInputValue(item.id, converted.toFixed(item.type === 'sodium' ? 0 : 1));
                        } else {
                            setInputValue(item.id, val.toFixed(2));
                        }
                    }
                }).catch(e => console.warn(e));
            });
        }

        // Add event listeners
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(eventType, calculateAndUpdate);
        });
        container.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateAndUpdate));

        // Initial calculation
        calculateAndUpdate();
    }
};