import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const map: CalculatorModule = {
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
                    unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'], default: 'mmHg' }
                }),
                uiBuilder.createInput({
                    id: 'map-dbp',
                    label: 'Diastolic BP',
                    type: 'number',
                    placeholder: 'e.g., 80',
                    unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'], default: 'mmHg' }
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
            
            ${uiBuilder.createResultBox({ id: 'map-result', title: 'MAP Results' })}
            
            ${formulaSection}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<p><strong>Clinical Note:</strong> MAP > 65 mmHg is generally required to maintain adequate organ perfusion.</p>'
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const sbpInput = container.querySelector('#map-sbp') as HTMLInputElement;
        const dbpInput = container.querySelector('#map-dbp') as HTMLInputElement;
        const resultBox = container.querySelector('#map-result');

        const calculateAndUpdate = () => {
            const errorContainer = container.querySelector('#map-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const sbp = UnitConverter.getStandardValue(sbpInput, 'mmHg');
            const dbp = UnitConverter.getStandardValue(dbpInput, 'mmHg');

            try {
                const schema = {
                    systolic: ValidationRules.bloodPressure.systolic,
                    diastolic: ValidationRules.bloodPressure.diastolic
                };

                const flatInputs = {
                    systolic: sbp,
                    diastolic: dbp
                };

                // @ts-ignore
                const validation = validateCalculatorInput(flatInputs, schema);

                if (!validation.isValid) {
                    const hasInput = (sbpInput.value || dbpInput.value);
                    if (hasInput && errorContainer) {
                        const valuesPresent = sbp !== null && !isNaN(sbp) && dbp !== null && !isNaN(dbp);
                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                if (sbp === null || dbp === null) return;

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

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
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
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#map-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'map', action: 'calculate' });
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        sbpInput.addEventListener('input', calculateAndUpdate);
        dbpInput.addEventListener('input', calculateAndUpdate);
        container.querySelectorAll('select').forEach(sel => sel.addEventListener('change', calculateAndUpdate));

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BP_PANEL)
                .then(bpPanel => {
                    if (bpPanel && bpPanel.component) {
                        const sbpComp = bpPanel.component.find((c: any) =>
                            c.code.coding && c.code.coding.some((coding: any) => coding.code === LOINC_CODES.SYSTOLIC_BP || coding.code === '8480-6')
                        );
                        const dbpComp = bpPanel.component.find((c: any) =>
                            c.code.coding && c.code.coding.some((coding: any) => coding.code === LOINC_CODES.DIASTOLIC_BP || coding.code === '8462-4')
                        );

                        if (sbpComp && sbpComp.valueQuantity) {
                            sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                            sbpInput.dispatchEvent(new Event('input'));
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
