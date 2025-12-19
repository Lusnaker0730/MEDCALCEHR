import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const map = {
    id: 'map',
    title: 'Mean Arterial Pressure (MAP)',
    description: 'Calculates the average arterial pressure during one cardiac cycle, important for organ perfusion assessment.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Blood Pressure Measurements',
            content: [
                uiBuilder.createInput({
                    id: 'map-sbp',
                    label: 'Systolic BP',
                    type: 'number',
                    placeholder: 'e.g., 120',
                    unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'], defaultUnit: 'mmHg' }
                }),
                uiBuilder.createInput({
                    id: 'map-dbp',
                    label: 'Diastolic BP',
                    type: 'number',
                    placeholder: 'e.g., 80',
                    unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'], defaultUnit: 'mmHg' }
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'Formula', formula: 'MAP = DBP + (1/3 × (SBP - DBP))' },
                { label: 'Or equivalently', formula: 'MAP = (SBP + 2 × DBP) / 3' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${inputs}
            
            <div id="map-error-container"></div>
            
            <div id="map-result" class="ui-result-box">
                <div class="ui-result-header">MAP Results</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${formulaSection}
            
            <div class="alert info mt-20">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Clinical Note:</strong> MAP > 65 mmHg is generally required to maintain adequate organ perfusion.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const sbpInput = container.querySelector('#map-sbp');
        const dbpInput = container.querySelector('#map-dbp');
        const resultBox = container.querySelector('#map-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#map-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const sbp = UnitConverter.getStandardValue(sbpInput, 'mmHg');
            const dbp = UnitConverter.getStandardValue(dbpInput, 'mmHg');

            try {
                // Validate inputs
                const schema = {
                    systolic: ValidationRules.bloodPressure.systolic,
                    diastolic: ValidationRules.bloodPressure.diastolic
                };

                const flatInputs = {
                    systolic: sbp,
                    diastolic: dbp
                };

                const validation = validateCalculatorInput(flatInputs, schema);

                if (!validation.isValid) {
                    const hasInput = (sbpInput.value || dbpInput.value);
                    if (hasInput && errorContainer) {
                        const valuesPresent = !isNaN(sbp) && !isNaN(dbp);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                if (sbp < dbp) {
                    throw new ValidationError('Systolic BP must be greater than Diastolic BP', 'VALIDATION_ERROR');
                }

                const mapCalc = dbp + (sbp - dbp) / 3;

                if (!isFinite(mapCalc) || isNaN(mapCalc)) throw new Error("Calculation Error");

                let severity = '';
                let interpretation = '';
                let alertClass = '';

                if (mapCalc < 60) {
                    severity = 'Critically Low (Shock Risk)';
                    interpretation = 'MAP <60 mmHg indicates severe hypotension and risk of organ hypoperfusion.';
                    alertClass = 'ui-alert-danger';
                } else if (mapCalc < 70) {
                    severity = 'Below Normal';
                    interpretation = 'Borderline low MAP. Monitor closely.';
                    alertClass = 'ui-alert-warning';
                } else if (mapCalc <= 100) {
                    severity = 'Normal';
                    interpretation = 'Normal MAP (70-100 mmHg) indicates adequate organ perfusion.';
                    alertClass = 'ui-alert-success';
                } else {
                    severity = 'Elevated (Hypertension)';
                    interpretation = 'Sustained MAP >100 mmHg requires management.';
                    alertClass = 'ui-alert-danger';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Mean Arterial Pressure',
                    value: mapCalc.toFixed(1),
                    unit: 'mmHg',
                    interpretation: severity,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass.replace('ui-alert-', '') === 'success' ? 'ui-alert-info' : alertClass} mt-10">
                        <span class="ui-alert-icon">${mapCalc < 60 ? '⚠️' : 'ℹ️'}</span>
                        <div class="ui-alert-content">${interpretation}</div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#map-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'map', action: 'calculate' });
                resultBox.classList.remove('show');
            }
        };

        // Add event listeners for automatic calculation on input change
        sbpInput.addEventListener('input', calculateAndUpdate);
        dbpInput.addEventListener('input', calculateAndUpdate);

        // Listen for unit changes too if possible, but unitToggle doesn't emit 'input' on change usually. 
        // Need to check unitToggle implementation or just rely on 'change' bubbling?
        // uiBuilder unitToggle might need inspection if it emits events. 
        // Typically select change triggers logic if we listen to it.
        container.querySelectorAll('select').forEach(sel => sel.addEventListener('change', calculateAndUpdate));


        // Auto-populate from FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BP_PANEL)
                .then(bpPanel => {
                    if (bpPanel && bpPanel.component) {
                        const sbpComp = bpPanel.component.find(c =>
                            c.code.coding && c.code.coding.some(coding => coding.code === LOINC_CODES.SYSTOLIC_BP || coding.code === '8480-6')
                        ); // Systolic
                        const dbpComp = bpPanel.component.find(c =>
                            c.code.coding && c.code.coding.some(coding => coding.code === LOINC_CODES.DIASTOLIC_BP || coding.code === '8462-4')
                        ); // Diastolic

                        if (sbpComp && sbpComp.valueQuantity) {
                            sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                            sbpInput.dispatchEvent(new Event('input'));

                            // Track staleness (using panel observation if available, or just not tracking component timestamp easily without obj access)
                            // Ideally track the specific component, but we only have bpPanel object here handy usually.
                            // Actually sbpComp is an object inside bpPanel, but observation timestamp is on bpPanel usually.
                            stalenessTracker.trackObservation('#map-sbp', bpPanel, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                        }

                        if (dbpComp && dbpComp.valueQuantity) {
                            dbpInput.value = dbpComp.valueQuantity.value.toFixed(0);
                            dbpInput.dispatchEvent(new Event('input'));

                            stalenessTracker.trackObservation('#map-dbp', bpPanel, LOINC_CODES.DIASTOLIC_BP, 'Diastolic BP');
                        }
                    }
                })
                .catch(err => console.log('BP data not available'));
        }
    }
};