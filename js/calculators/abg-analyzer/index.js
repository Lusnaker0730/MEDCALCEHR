import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const abgAnalyzer = {
    id: 'abg-analyzer',
    title: 'Arterial Blood Gas (ABG) Analyzer',
    description: 'Interprets arterial blood gas values to identify acid-base disorders.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>⚠️ Important</strong><br>This analyzer should not substitute for clinical context. Sodium, Chloride, and Albumin are required for accurate anion gap calculation.'
        })}

            ${uiBuilder.createSection({
            title: 'ABG Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'abg-ph',
                label: 'pH',
                type: 'number',
                step: '0.01',
                placeholder: 'e.g., 7.40'
            })}
                    ${uiBuilder.createInput({
                id: 'abg-pco2',
                label: 'PaCO₂',
                type: 'number',
                placeholder: 'e.g., 40'
            })}
                    ${uiBuilder.createInput({
                id: 'abg-hco3',
                label: 'HCO₃⁻',
                type: 'number',
                placeholder: 'e.g., 24'
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Electrolytes & Albumin (for Anion Gap)',
            icon: '🧂',
            content: `
                    ${uiBuilder.createInput({
                id: 'abg-sodium',
                label: 'Sodium (Na⁺)',
                type: 'number',
                placeholder: 'e.g., 140'
            })}
                    ${uiBuilder.createInput({
                id: 'abg-chloride',
                label: 'Chloride (Cl⁻)',
                type: 'number',
                placeholder: 'e.g., 100'
            })}
                    ${uiBuilder.createInput({
                id: 'abg-albumin',
                label: 'Albumin',
                type: 'number',
                step: '0.1',
                placeholder: 'e.g., 4.0'
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Chronicity (if respiratory)',
            icon: '⏱️',
            content: uiBuilder.createRadioGroup({
                name: 'chronicity',
                options: [
                    { value: 'acute', label: 'Acute', checked: true },
                    { value: 'chronic', label: 'Chronic' }
                ]
            })
        })}

            <div id="abg-result" class="ui-result-box">
                <div class="ui-result-header">ABG Interpretation</div>
                <div class="ui-result-content"></div>
            </div>

            <div class="chart-container" style="margin-top: 20px; text-align: center;">
                <img src="js/calculators/abg-analyzer/ABG-interpretation.avif" alt="ABG Interpretation Reference Image" class="reference-image" style="max-width: 100%; border-radius: 8px;" />
            </div>

            <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                <h4>📚 Reference</h4>
                <p>Baillie, J K. (2008). Simple, easily memorised "rules of thumb" for the rapid assessment of physiological compensation for respiratory acid-base disorders. <em>Thorax</em>.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const fields = {
            ph: container.querySelector('#abg-ph'),
            pco2: container.querySelector('#abg-pco2'),
            hco3: container.querySelector('#abg-hco3'),
            sodium: container.querySelector('#abg-sodium'),
            chloride: container.querySelector('#abg-chloride'),
            albumin: container.querySelector('#abg-albumin')
        };
        const resultBox = container.querySelector('#abg-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        // Initialize Unit Converters
        UnitConverter.enhanceInput(fields.pco2, 'pressure', ['mmHg', 'kPa']);
        UnitConverter.enhanceInput(fields.hco3, 'electrolyte', ['mEq/L', 'mmol/L']);
        UnitConverter.enhanceInput(fields.sodium, 'electrolyte', ['mEq/L', 'mmol/L']);
        UnitConverter.enhanceInput(fields.chloride, 'electrolyte', ['mEq/L', 'mmol/L']);
        UnitConverter.enhanceInput(fields.albumin, 'albumin', ['g/dL', 'g/L']);

        const interpret = () => {
            // Clear previous errors
            const existingError = container.querySelector('#abg-error');
            if (existingError) existingError.remove();

            const vals = {
                ph: parseFloat(fields.ph.value),
                pco2: UnitConverter.getStandardValue(fields.pco2, 'mmHg'),
                hco3: UnitConverter.getStandardValue(fields.hco3, 'mEq/L'),
                sodium: UnitConverter.getStandardValue(fields.sodium, 'mEq/L'),
                chloride: UnitConverter.getStandardValue(fields.chloride, 'mEq/L'),
                albumin: UnitConverter.getStandardValue(fields.albumin, 'g/dL')
            };

            try {
                // Validation inputs
                const inputs = {
                    ph: vals.ph,
                    paCO2: vals.pco2,
                    bicarbonate: vals.hco3,
                    sodium: vals.sodium,
                    chloride: vals.chloride,
                    albumin: vals.albumin
                };

                const schema = {
                    ph: ValidationRules.pH,
                    paCO2: ValidationRules.arterialGas.paCO2,
                    bicarbonate: ValidationRules.bicarbonate
                };

                if (!isNaN(vals.sodium) || fields.sodium.value !== '') schema.sodium = ValidationRules.sodium;
                if (!isNaN(vals.chloride) || fields.chloride.value !== '') schema.chloride = ValidationRules.chloride;
                if (!isNaN(vals.albumin) || fields.albumin.value !== '') schema.albumin = ValidationRules.albumin;

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Check if at least one field has input to avoid error on empty load
                    const hasInput = Object.values(fields).some(f => f.value !== '');

                    if (hasInput) {
                        const corePresent = !isNaN(vals.ph) && !isNaN(vals.pco2) && !isNaN(vals.hco3);
                        if (corePresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'abg-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                let primaryDisorder = '';
                let anionGapInfo = '';
                let alertType = 'info';
                let alertClass = 'ui-alert-info';

                // Primary Disorder
                if (vals.ph < 7.35) {
                    alertType = 'danger';
                    alertClass = 'ui-alert-danger';
                    if (vals.pco2 > 45) primaryDisorder = 'Respiratory Acidosis';
                    else if (vals.hco3 < 22) primaryDisorder = 'Metabolic Acidosis';
                    else primaryDisorder = 'Mixed Acidosis';
                } else if (vals.ph > 7.45) {
                    alertType = 'danger';
                    alertClass = 'ui-alert-danger';
                    if (vals.pco2 < 35) primaryDisorder = 'Respiratory Alkalosis';
                    else if (vals.hco3 > 26) primaryDisorder = 'Metabolic Alkalosis';
                    else primaryDisorder = 'Mixed Alkalosis';
                } else {
                    alertType = 'success';
                    alertClass = 'ui-alert-success';
                    if (vals.pco2 > 45 && vals.hco3 > 26) primaryDisorder = 'Compensated Respiratory Acidosis/Metabolic Alkalosis';
                    else if (vals.pco2 < 35 && vals.hco3 < 22) primaryDisorder = 'Compensated Metabolic Acidosis/Respiratory Alkalosis';
                    else primaryDisorder = 'Normal Acid-Base Status';
                }

                // Anion Gap
                if (!isNaN(vals.sodium) && !isNaN(vals.chloride) && !isNaN(vals.hco3)) {
                    const anionGap = vals.sodium - (vals.chloride + vals.hco3);
                    let correctedAG = anionGap;

                    if (!isNaN(vals.albumin)) {
                        correctedAG = anionGap + 2.5 * (4.0 - vals.albumin);
                    }

                    if (correctedAG > 12) {
                        anionGapInfo = `High Anion Gap (${correctedAG.toFixed(1)})`;
                        const deltaDelta = correctedAG - 12 + vals.hco3;
                        if (deltaDelta > 28) anionGapInfo += ' + Metabolic Alkalosis';
                        else if (deltaDelta < 22) anionGapInfo += ' + Non-Gap Acidosis';
                    } else {
                        anionGapInfo = `Normal Anion Gap (${correctedAG.toFixed(1)})`;
                    }
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Primary Disorder',
                    value: primaryDisorder,
                    alertClass: alertClass
                })}
                    ${anionGapInfo ? uiBuilder.createResultItem({
                    label: 'Anion Gap Assessment',
                    value: anionGapInfo
                }) : ''}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'abg-analyzer', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#abg-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'abg-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', interpret);
        });
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', interpret);
        });

        // FHIR Auto-populate
        if (client) {
            const mapping = {
                '11558-4': fields.ph,
                '11557-6': fields.pco2,
                '14627-4': fields.hco3,
                [LOINC_CODES.SODIUM]: fields.sodium,
                '2075-0': fields.chloride,
                [LOINC_CODES.ALBUMIN]: fields.albumin
            };

            Object.entries(mapping).forEach(([code, field]) => {
                getMostRecentObservation(client, code).then(obs => {
                    if (obs && obs.valueQuantity) {
                        let val = obs.valueQuantity.value;
                        field.value = val.toFixed(2);
                        field.dispatchEvent(new Event('input')); // Trigger update
                    }
                });
            });
        }
    }
};
