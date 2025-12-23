import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

const getProbability = (score: number): string => {
    const probability = 1 / (1 + Math.exp(-(-4.3 + 0.03 * score)));
    return (probability * 100).toFixed(1);
};

export const hscore: CalculatorModule = {
    id: 'hscore',
    title: 'HScore for Reactive Hemophagocytic Syndrome',
    description: 'Diagnoses reactive hemophagocytic syndrome.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Clinical Features',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-immuno',
                label: 'Known underlying immunosuppression',
                helpText: 'HIV positive or receiving long-term immunosuppressive therapy',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '18', label: 'Yes (+18)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-temp',
                label: 'Temperature, °F (°C)',
                options: [
                    { value: '0', label: '<101.1 (<38.4) (0)', checked: true },
                    { value: '33', label: '101.1-102.9 (38.4-39.4) (+33)' },
                    { value: '49', label: '>102.9 (>39.4) (+49)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-organo',
                label: 'Organomegaly',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '23', label: 'Hepatosplenomegaly or splenomegaly (+23)' },
                    { value: '38', label: 'Hepatosplenomegaly and splenomegaly (+38)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-cytopenias',
                label: 'Number of cytopenias',
                helpText: 'Defined as hemoglobin ≤9.2 g/dL, WBC ≤5,000/mm³, and/or platelets ≤110,000/mm³',
                options: [
                    { value: '0', label: '1 lineage (0)', checked: true },
                    { value: '24', label: '2 lineages (+24)' },
                    { value: '34', label: '3 lineages (+34)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Laboratory Values',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-ferritin',
                label: 'Ferritin, ng/mL (or μg/L)',
                options: [
                    { value: '0', label: '<2,000 (0)', checked: true },
                    { value: '35', label: '2,000-6,000 (+35)' },
                    { value: '50', label: '>6,000 (+50)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-trig',
                label: 'Triglycerides, mg/dL (mmol/L)',
                options: [
                    { value: '0', label: '<132.7 (<1.5) (0)', checked: true },
                    { value: '44', label: '132.7-354 (1.5-4) (+44)' },
                    { value: '64', label: '>354 (>4) (+64)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-fibrinogen',
                label: 'Fibrinogen, mg/dL (g/L)',
                options: [
                    { value: '0', label: '>250 (>2.5) (0)', checked: true },
                    { value: '30', label: '≤250 (≤2.5) (+30)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'hscore-ast',
                label: 'AST, U/L',
                options: [
                    { value: '0', label: '<30 (0)', checked: true },
                    { value: '19', label: '≥30 (+19)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Bone Marrow',
            content: uiBuilder.createRadioGroup({
                name: 'hscore-bma',
                label: 'Hemophagocytosis features on bone marrow aspirate',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '35', label: 'Yes (+35)' }
                ]
            })
        })}
            
            <div id="hscore-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'hscore-result', title: 'HScore Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const groups = [
            'hscore-immuno',
            'hscore-temp',
            'hscore-organo',
            'hscore-cytopenias',
            'hscore-ferritin',
            'hscore-trig',
            'hscore-fibrinogen',
            'hscore-ast',
            'hscore-bma'
        ];

        const calculate = () => {
            const errorContainer = container.querySelector('#hscore-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            try {
                let score = 0;

                groups.forEach(group => {
                    const checked = container.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement;
                    if (checked) score += parseInt(checked.value);
                });

                const probability = getProbability(score);

                const resultBox = container.querySelector('#hscore-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'HScore',
                            value: score.toString(),
                            unit: 'points'
                        })}
                            ${uiBuilder.createResultItem({
                            label: 'Probability of Hemophagocytic Syndrome',
                            value: probability,
                            unit: '%'
                        })}
                            ${uiBuilder.createAlert({
                            type: 'info',
                            message: 'Best cutoff value was 169, corresponding to sensitivity of 93% and specificity of 86%.'
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'hscore', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
            }
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Helper to set radio based on value ranges
        const setRadioFromValue = (groupName: string, value: number | null | undefined, ranges: Array<{ condition: (v: number) => boolean; value: string }>) => {
            if (value === null || value === undefined) return;
            const range = ranges.find(r => r.condition(value));
            if (range) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${range.value}"]`) as HTMLInputElement;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        };

        if (client) {
            Promise.all([
                fhirDataService.getObservation(LOINC_CODES.HEMOGLOBIN, { trackStaleness: true, stalenessLabel: 'Hemoglobin' }),
                fhirDataService.getObservation(LOINC_CODES.WBC, { trackStaleness: true, stalenessLabel: 'WBC' }),
                fhirDataService.getObservation(LOINC_CODES.PLATELETS, { trackStaleness: true, stalenessLabel: 'Platelets' })
            ]).then(([hgbResult, wbcResult, plateletsResult]) => {
                let cytopeniaCount = 0;
                if (hgbResult.value !== null && hgbResult.value <= 9.2) cytopeniaCount++;
                if (wbcResult.value !== null && wbcResult.value <= 5) cytopeniaCount++;
                if (plateletsResult.value !== null && plateletsResult.value <= 110) cytopeniaCount++;

                setRadioFromValue('hscore-cytopenias', cytopeniaCount, [
                    { condition: v => v <= 1, value: '0' },
                    { condition: v => v === 2, value: '24' },
                    { condition: v => v >= 3, value: '34' }
                ]);
            }).catch(e => console.warn(e));

            // Temperature (convert to Fahrenheit)
            fhirDataService.getObservation(LOINC_CODES.TEMPERATURE, { trackStaleness: true, stalenessLabel: 'Temperature', targetUnit: 'degF', unitType: 'temperature' }).then(result => {
                if (result.value !== null) {
                    setRadioFromValue('hscore-temp', result.value, [
                        { condition: v => v < 101.1, value: '0' },
                        { condition: v => v >= 101.1 && v <= 102.9, value: '33' },
                        { condition: v => v > 102.9, value: '49' }
                    ]);
                }
            }).catch(e => console.warn(e));

            // Ferritin (LOINC 2276-4)
            fhirDataService.getObservation('2276-4', { trackStaleness: true, stalenessLabel: 'Ferritin' }).then(result => {
                if (result.value !== null) {
                    setRadioFromValue('hscore-ferritin', result.value, [
                        { condition: v => v < 2000, value: '0' },
                        { condition: v => v >= 2000 && v <= 6000, value: '35' },
                        { condition: v => v > 6000, value: '50' }
                    ]);
                }
            }).catch(e => console.warn(e));

            // Triglycerides
            fhirDataService.getObservation(LOINC_CODES.TRIGLYCERIDES, { trackStaleness: true, stalenessLabel: 'Triglycerides' }).then(result => {
                if (result.value !== null) {
                    setRadioFromValue('hscore-trig', result.value, [
                        { condition: v => v < 132.7, value: '0' },
                        { condition: v => v >= 132.7 && v <= 354, value: '44' },
                        { condition: v => v > 354, value: '64' }
                    ]);
                }
            }).catch(e => console.warn(e));

            // Fibrinogen (LOINC 3255-7) - convert to mg/dL
            fhirDataService.getObservation('3255-7', { trackStaleness: true, stalenessLabel: 'Fibrinogen', targetUnit: 'mg/dL', unitType: 'fibrinogen' }).then(result => {
                if (result.value !== null) {
                    setRadioFromValue('hscore-fibrinogen', result.value, [
                        { condition: v => v > 250, value: '0' },
                        { condition: v => v <= 250, value: '30' }
                    ]);
                }
            }).catch(e => console.warn(e));

            // AST
            fhirDataService.getObservation(LOINC_CODES.AST, { trackStaleness: true, stalenessLabel: 'AST' }).then(result => {
                if (result.value !== null) {
                    setRadioFromValue('hscore-ast', result.value, [
                        { condition: v => v < 30, value: '0' },
                        { condition: v => v >= 30, value: '19' }
                    ]);
                }
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};
