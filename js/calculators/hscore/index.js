import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
const getProbability = (score) => {
    const probability = 1 / (1 + Math.exp(-(-4.3 + 0.03 * score)));
    return (probability * 100).toFixed(1);
};
export const hscore = {
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
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
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
            if (errorContainer)
                errorContainer.innerHTML = '';
            try {
                let score = 0;
                groups.forEach(group => {
                    const checked = container.querySelector(`input[name="${group}"]:checked`);
                    if (checked)
                        score += parseInt(checked.value);
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
            }
            catch (error) {
                logError(error, { calculator: 'hscore', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
            }
        };
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // Helper to set radio based on value ranges
        const setRadioFromValue = (groupName, value, ranges) => {
            if (value === null || value === undefined)
                return;
            const range = ranges.find(r => r.condition(value));
            if (range) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${range.value}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        };
        if (client) {
            Promise.all([
                getMostRecentObservation(client, LOINC_CODES.HEMOGLOBIN),
                getMostRecentObservation(client, LOINC_CODES.WBC),
                getMostRecentObservation(client, '26515-7') // Platelets
            ]).then(([hgb, wbc, platelets]) => {
                let cytopeniaCount = 0;
                if (hgb && hgb.valueQuantity && hgb.valueQuantity.value <= 9.2)
                    cytopeniaCount++;
                if (wbc && wbc.valueQuantity && wbc.valueQuantity.value <= 5)
                    cytopeniaCount++; // Assuming K/uL or similar scale
                if (platelets && platelets.valueQuantity && platelets.valueQuantity.value <= 110)
                    cytopeniaCount++; // Assuming K/uL or similar scale
                setRadioFromValue('hscore-cytopenias', cytopeniaCount, [
                    { condition: v => v <= 1, value: '0' },
                    { condition: v => v === 2, value: '24' },
                    { condition: v => v >= 3, value: '34' }
                ]);
                if (platelets)
                    stalenessTracker.trackObservation('input[name="hscore-cytopenias"]', platelets, '26515-7', 'Platelets (for Cytopenias)');
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs && obs.valueQuantity) {
                    let tempF = obs.valueQuantity.value;
                    // Convert C to F if needed
                    if (obs.valueQuantity.unit && obs.valueQuantity.unit.includes('C')) {
                        tempF = (tempF * 9 / 5) + 32;
                    }
                    setRadioFromValue('hscore-temp', tempF, [
                        { condition: v => v < 101.1, value: '0' },
                        { condition: v => v >= 101.1 && v <= 102.9, value: '33' },
                        { condition: v => v > 102.9, value: '49' }
                    ]);
                    stalenessTracker.trackObservation('input[name="hscore-temp"]', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, '2276-4').then(obs => {
                if (obs && obs.valueQuantity) {
                    setRadioFromValue('hscore-ferritin', obs.valueQuantity.value, [
                        { condition: v => v < 2000, value: '0' },
                        { condition: v => v >= 2000 && v <= 6000, value: '35' },
                        { condition: v => v > 6000, value: '50' }
                    ]);
                    stalenessTracker.trackObservation('input[name="hscore-ferritin"]', obs, '2276-4', 'Ferritin');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.TRIGLYCERIDES).then(obs => {
                if (obs && obs.valueQuantity) {
                    setRadioFromValue('hscore-trig', obs.valueQuantity.value, [
                        { condition: v => v < 132.7, value: '0' },
                        { condition: v => v >= 132.7 && v <= 354, value: '44' },
                        { condition: v => v > 354, value: '64' }
                    ]);
                    stalenessTracker.trackObservation('input[name="hscore-trig"]', obs, LOINC_CODES.TRIGLYCERIDES, 'Triglycerides');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, '3255-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    // Convert g/L to mg/dL if needed (x100)
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'g/L')
                        val *= 100;
                    setRadioFromValue('hscore-fibrinogen', val, [
                        { condition: v => v > 250, value: '0' },
                        { condition: v => v <= 250, value: '30' }
                    ]);
                    stalenessTracker.trackObservation('input[name="hscore-fibrinogen"]', obs, '3255-7', 'Fibrinogen');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.AST).then(obs => {
                if (obs && obs.valueQuantity) {
                    setRadioFromValue('hscore-ast', obs.valueQuantity.value, [
                        { condition: v => v < 30, value: '0' },
                        { condition: v => v >= 30, value: '19' }
                    ]);
                    stalenessTracker.trackObservation('input[name="hscore-ast"]', obs, LOINC_CODES.AST, 'AST');
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
