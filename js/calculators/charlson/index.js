import { getMostRecentObservation, calculateAge, getPatientConditions } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const charlson = {
    id: 'charlson',
    title: 'Charlson Comorbidity Index (CCI)',
    description: 'Predicts 10-year survival in patients with multiple comorbidities.',
    generateHTML: function () {
        const createConditionToggle = (id, title, subtitle, points) => {
            return uiBuilder.createRadioGroup({
                name: id,
                label: title,
                helpText: subtitle,
                options: [
                    { value: '0', label: 'No (+0)', checked: true },
                    { value: String(points), label: `Yes (+${points})` }
                ]
            });
        };
        const ageSection = uiBuilder.createSection({
            title: 'Age',
            content: uiBuilder.createRadioGroup({
                name: 'age',
                options: [
                    { value: '0', label: '< 50 years (+0)', checked: true },
                    { value: '1', label: '50-59 years (+1)' },
                    { value: '2', label: '60-69 years (+2)' },
                    { value: '3', label: '70-79 years (+3)' },
                    { value: '4', label: '≥ 80 years (+4)' }
                ]
            })
        });
        const conditionsContent = [
            createConditionToggle('mi', 'Myocardial infarction', 'History of definite or probable MI', 1),
            createConditionToggle('chf', 'CHF', 'Exertional or paroxysmal nocturnal dyspnea', 1),
            createConditionToggle('pvd', 'Peripheral vascular disease', 'Intermittent claudication, past bypass, gangrene, or aneurysm', 1),
            createConditionToggle('cva', 'CVA or TIA', 'History of a cerebrovascular accident', 1),
            createConditionToggle('dementia', 'Dementia', 'Chronic cognitive deficit', 1),
            createConditionToggle('cpd', 'Chronic pulmonary disease', '', 1),
            createConditionToggle('ctd', 'Connective tissue disease', '', 1),
            createConditionToggle('pud', 'Peptic ulcer disease', 'Any history of treatment for ulcer disease', 1),
            uiBuilder.createRadioGroup({
                name: 'liver',
                label: 'Liver disease',
                helpText: 'Mild = chronic hepatitis. Moderate/Severe = cirrhosis and portal hypertension.',
                options: [
                    { value: '0', label: 'None (+0)', checked: true },
                    { value: '1', label: 'Mild (+1)' },
                    { value: '3', label: 'Moderate to severe (+3)' }
                ]
            }),
            uiBuilder.createRadioGroup({
                name: 'diabetes',
                label: 'Diabetes mellitus',
                helpText: 'End-organ damage includes retinopathy, nephropathy, or neuropathy.',
                options: [
                    { value: '0', label: 'None/Diet-controlled (+0)', checked: true },
                    { value: '1', label: 'Uncomplicated (+1)' },
                    { value: '2', label: 'End-organ damage (+2)' }
                ]
            }),
            createConditionToggle('hemiplegia', 'Hemiplegia', '', 2),
            createConditionToggle('ckd', 'Moderate to severe CKD', 'Severe on dialysis, uremia, or creatinine >3 mg/dL', 2),
            uiBuilder.createRadioGroup({
                name: 'tumor',
                label: 'Solid tumor',
                options: [
                    { value: '0', label: 'None (+0)', checked: true },
                    { value: '2', label: 'Localized (+2)' },
                    { value: '6', label: 'Metastatic (+6)' }
                ]
            }),
            createConditionToggle('leukemia', 'Leukemia', '', 2),
            createConditionToggle('lymphoma', 'Lymphoma', '', 2),
            createConditionToggle('aids', 'AIDS', 'Not just HIV positive, but "full-blown" AIDS', 6)
        ].join('');
        const conditionsSection = uiBuilder.createSection({
            title: 'Comorbidities',
            content: conditionsContent
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${ageSection}
            ${conditionsSection}
            
            <div id="cci-error-container"></div>

            <div class="result-container show" id="cci-result">
                <div class="score-section">
                    <div class="score-value" id="cci-score">0</div>
                    <div class="score-label">Charlson Comorbidity Index</div>
                </div>
                <div class="interpretation-section mt-15 text-center">
                     <div class="score-value" id="cci-survival">98%</div>
                    <div class="score-label">Estimated 10-year survival</div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#cci-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            try {
                let score = 0;
                container.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                    score += parseInt(radio.value, 10);
                });
                if (isNaN(score))
                    throw new Error("Calculation Error");
                const survival = 100 * Math.pow(0.983, Math.exp(score * 0.9)); // Adjusted formula from literature
                const scoreEl = container.querySelector('#cci-score');
                const survivalEl = container.querySelector('#cci-survival');
                if (scoreEl)
                    scoreEl.textContent = score.toString();
                if (survivalEl)
                    survivalEl.textContent = `${survival.toFixed(0)}%`;
            }
            catch (error) {
                logError(error, { calculator: 'charlson', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
            }
        };
        // Attach change listener to container for event delegation
        container.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'radio') {
                calculate();
            }
        });
        // Auto-populate age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            let ageValue = 0;
            if (age >= 80) {
                ageValue = 4;
            }
            else if (age >= 70) {
                ageValue = 3;
            }
            else if (age >= 60) {
                ageValue = 2;
            }
            else if (age >= 50) {
                ageValue = 1;
            }
            const ageRadio = container.querySelector(`input[name="age"][value="${ageValue}"]`);
            if (ageRadio) {
                ageRadio.checked = true;
                ageRadio.dispatchEvent(new Event('change'));
            }
        }
        // Auto-populate conditions from FHIR
        if (client) {
            const conditionMap = {
                mi: { codes: ['I21', 'I22'], value: 1 },
                chf: { codes: ['I50'], value: 1 },
                pvd: { codes: ['I73.9', 'I70'], value: 1 },
                cva: { codes: ['I60', 'I61', 'I62', 'I63', 'I64', 'G45'], value: 1 },
                dementia: { codes: ['F00', 'F01', 'F02', 'F03', 'G30'], value: 1 },
                cpd: { codes: ['J40', 'J41', 'J42', 'J43', 'J44', 'J45', 'J46', 'J47'], value: 1 },
                ctd: { codes: ['M32', 'M34', 'M05', 'M06'], value: 1 },
                pud: { codes: ['K25', 'K26', 'K27', 'K28'], value: 1 },
                hemiplegia: { codes: ['G81'], value: 2 },
                leukemia: { codes: ['C91', 'C92', 'C93', 'C94', 'C95'], value: 2 },
                lymphoma: { codes: ['C81', 'C82', 'C83', 'C84', 'C85'], value: 2 },
                aids: { codes: ['B20', 'B21', 'B22', 'B24'], value: 6 }
            };
            for (const [key, { codes, value }] of Object.entries(conditionMap)) {
                getPatientConditions(client, codes).then(conditions => {
                    if (conditions.length > 0) {
                        const radio = container.querySelector(`input[name="${key}"][value="${value}"]`);
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change'));
                        }
                    }
                }).catch(e => console.warn(e));
            }
            // Special handling for multi-level conditions
            getPatientConditions(client, ['K70.3', 'K74', 'I85']).then(conditions => {
                // Moderate/Severe Liver
                if (conditions.length > 0) {
                    const radio = container.querySelector('input[name="liver"][value="3"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
                else {
                    getPatientConditions(client, ['K73', 'B18']).then(conditions => {
                        // Mild Liver
                        if (conditions.length > 0) {
                            const radio = container.querySelector('input[name="liver"][value="1"]');
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                    }).catch(e => console.warn(e));
                }
            }).catch(e => console.warn(e));
            getPatientConditions(client, [
                'E10.2', 'E10.3', 'E10.4', 'E10.5',
                'E11.2', 'E11.3', 'E11.4', 'E11.5'
            ]).then(conditions => {
                // Diabetes w/ end-organ damage
                if (conditions.length > 0) {
                    const radio = container.querySelector('input[name="diabetes"][value="2"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
                else {
                    getPatientConditions(client, ['E10', 'E11']).then(conditions => {
                        // Uncomplicated Diabetes
                        if (conditions.length > 0) {
                            const radio = container.querySelector('input[name="diabetes"][value="1"]');
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                    }).catch(e => console.warn(e));
                }
            }).catch(e => console.warn(e));
            getPatientConditions(client, ['C00-C75', 'C76-C80']).then(conditions => {
                // Solid tumor
                if (conditions.length > 0) {
                    const metastaticCodes = ['C77', 'C78', 'C79', 'C80'];
                    const isMetastatic = conditions.some((c) => c.code.coding && c.code.coding[0] &&
                        metastaticCodes.includes(c.code.coding[0].code.substring(0, 3)));
                    const value = isMetastatic ? 6 : 2;
                    const radio = container.querySelector(`input[name="tumor"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
            }).catch(e => console.warn(e));
            // Check for CKD via labs or conditions
            getPatientConditions(client, ['N18.3', 'N18.4', 'N18.5', 'Z99.2']).then(conditions => {
                if (conditions.length > 0) {
                    const radio = container.querySelector('input[name="ckd"][value="2"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                // Creatinine
                if (obs && obs.valueQuantity && obs.valueQuantity.value > 3) {
                    const radio = container.querySelector('input[name="ckd"][value="2"]');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                    stalenessTracker.trackObservation('input[name="ckd"][value="2"]', obs, LOINC_CODES.CREATININE, 'Creatinine > 3 mg/dL');
                }
            }).catch(e => console.warn(e));
        }
        // Calculate initially
        calculate();
    }
};
