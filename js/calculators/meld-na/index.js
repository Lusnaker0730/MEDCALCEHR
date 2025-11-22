import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

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
                    unit: 'mEq/L',
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
            
            ${uiBuilder.createResultBox({ id: 'meld-na-result', title: 'MELD-Na Score Result' })}
            
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
            const biliInput = container.querySelector('#meld-na-bili');
            const inrInput = container.querySelector('#meld-na-inr');
            const creatInput = container.querySelector('#meld-na-creat');
            const sodiumInput = container.querySelector('#meld-na-sodium');
            const dialysisCheckbox = container.querySelector('#meld-na-dialysis');
            
            const bili = UnitConverter.getStandardValue(biliInput, 'mg/dL');
            const inr = parseFloat(inrInput.value);
            const creat = UnitConverter.getStandardValue(creatInput, 'mg/dL');
            const sodium = parseFloat(sodiumInput.value);
            const onDialysis = dialysisCheckbox.checked;

            const resultBox = container.querySelector('#meld-na-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            // Check if all values are valid
            if (bili === null || isNaN(bili) || isNaN(inr) || creat === null || isNaN(creat) || isNaN(sodium)) {
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
            
            if (meldNaScore < 17) {
                riskCategory = 'Low Risk';
                mortalityRate = '<2%';
                alertClass = 'ui-alert-success';
            } else if (meldNaScore < 21) {
                riskCategory = 'Low-Moderate Risk';
                mortalityRate = '3-4%';
                alertClass = 'ui-alert-info';
            } else if (meldNaScore < 23) {
                riskCategory = 'Moderate Risk';
                mortalityRate = '7-10%';
                alertClass = 'ui-alert-warning';
            } else if (meldNaScore < 27) {
                riskCategory = 'Moderate-High Risk';
                mortalityRate = '14-15%';
                alertClass = 'ui-alert-warning';
            } else if (meldNaScore < 32) {
                riskCategory = 'High Risk';
                mortalityRate = '27-32%';
                alertClass = 'ui-alert-danger';
            } else {
                riskCategory = 'Very High Risk';
                mortalityRate = '65-66%';
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
        };

        // Helper to safely set value
        const setInputValue = (id, val) => {
            const input = container.querySelector(id);
            if (input && val) {
                input.value = val;
                input.dispatchEvent(new Event('input'));
            }
        };

        // Auto-populate from FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BILIRUBIN_TOTAL).then(obs => {
                if (obs?.valueQuantity) setInputValue('#meld-na-bili', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.INR_COAG).then(obs => {
                if (obs?.valueQuantity) setInputValue('#meld-na-inr', obs.valueQuantity.value.toFixed(2));
            });
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) setInputValue('#meld-na-creat', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs?.valueQuantity) setInputValue('#meld-na-sodium', obs.valueQuantity.value.toFixed(0));
            });
        }

        // Add event listeners
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            const eventType = input.type === 'checkbox' ? 'change' : 'input';
            input.addEventListener(eventType, calculateAndUpdate);
        });
        
        // Initial calculation
        calculateAndUpdate();
    }
};