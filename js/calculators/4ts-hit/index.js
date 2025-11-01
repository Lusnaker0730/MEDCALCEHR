import { getMostRecentObservation, getPatientConditions } from '../../utils.js';

export const hepScore = {
    id: '4ts-hit',
    title: 'HIT Expert Probability (HEP) Score for Heparin-Induced Thrombocytopenia',
    description: 'Pre-test clinical scoring model for HIT based on broad expert opinion.',
    generateHTML: () => `
        <div class="calculator-header">
            <h3>HIT Expert Probability (HEP) Score</h3>
            <p class="description">Pre-test clinical scoring model for Heparin-Induced Thrombocytopenia (HIT) based on broad expert opinion.</p>
        </div>

        <div class="alert info">
            <strong>📋 HIT Assessment</strong>
            <p>Select the type of HIT onset and complete all clinical criteria below.</p>
        </div>

        <div class="section">
            <div class="section-title">Type of HIT onset suspected</div>
            <div class="radio-group" data-name="hit_onset_type">
                <label class="radio-option selected">
                    <input type="radio" name="hit_onset_type" value="typical" checked>
                    <span class="radio-label">Typical onset</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="hit_onset_type" value="rapid">
                    <span class="radio-label">Rapid onset (re-exposure)</span>
                </label>
            </div>
        </div>

        <div id="hep-score-criteria">
            <!-- JS will populate this section based on onset type -->
        </div>

        <div class="result-container">
            <div class="result-header">HEP Score Results</div>
            <div class="result-score">
                <span id="hep-score-value" style="font-size: 4rem; font-weight: bold; color: #667eea;">-</span>
                <span style="font-size: 1.2rem; color: #718096; margin-left: 10px;">points</span>
            </div>
            <div class="result-item">
                <span class="label">Interpretation</span>
                <span class="value" id="hep-score-interpretation">Select criteria above</span>
            </div>
            <div class="result-item">
                <span class="label">HIT Probability</span>
                <span class="value risk-badge" id="hep-score-probability">-</span>
            </div>
        </div>

        <div class="chart-container" style="display: flex; flex-direction: column; gap: 15px;">
            <img src="js/calculators/4ts-hit/4HIT.png" alt="HEP Score Table 1" class="reference-image" />
            <img src="js/calculators/4ts-hit/6-Table3-1.png" alt="HEP Score Table 2" class="reference-image" />
        </div>

        <div class="info-section">
            <h4>📚 Reference</h4>
            <p>Cuker, A., et al. (2010). The HIT Expert Probability (HEP) Score: a novel pre-test probability model for heparin-induced thrombocytopenia based on broad expert opinion. <em>Journal of thrombosis and haemostasis : JTH</em>, 8(12), 2642–2650. <a href="https://doi.org/10.1111/j.1538-7836.2010.04059.x" target="_blank">doi:10.1111/j.1538-7836.2010.04059.x</a>. PMID: 20854372.</p>
        </div>
    `,
    initialize: async (client, patient, container) => {
        const root = container || document;
        const criteriaContainer = root.querySelector('#hep-score-criteria');
        const onsetToggle = root.querySelector('[data-name="hit_onset_type"]');

        const criteria = {
            platelet_fall_magnitude: {
                label: 'Magnitude of platelet count fall',
                options: [
                    { text: '<30%', value: -1 },
                    { text: '30-50%', value: 1 },
                    { text: '>50%', value: 3 }
                ]
            },
            timing_typical: {
                label: 'Timing of platelet count fall',
                condition: type => type === 'typical',
                options: [
                    { text: 'Fall begins <4 days after heparin exposure', value: -2 },
                    { text: 'Fall begins 4 days after heparin exposure', value: 2 },
                    { text: 'Fall begins 5-10 days after heparin exposure', value: 3 },
                    { text: 'Fall begins 11-14 days after heparin exposure', value: -2 },
                    { text: 'Fall begins >14 days after heparin exposure', value: -1 }
                ]
            },
            timing_rapid: {
                label: 'Timing of platelet count fall',
                condition: type => type === 'rapid',
                options: [
                    { text: 'Fall begins <48 hours after heparin re-exposure', value: -1 },
                    { text: 'Fall begins ≥48 hours after heparin re-exposure', value: 2 }
                ]
            },
            nadir_platelet: {
                label: 'Nadir platelet count',
                options: [
                    { text: '<20 x 10⁹/L', value: -2 },
                    { text: '≥20 x 10⁹/L', value: 2 }
                ]
            },
            thrombosis_typical: {
                label: 'Thrombosis',
                condition: type => type === 'typical',
                options: [
                    {
                        text: 'New venous thromboembolism (VTE) or arterial thromboembolism (ATE) ≥4 days after heparin exposure',
                        value: 3
                    },
                    {
                        text: 'Progression of pre-existing VTE or ATE while receiving heparin',
                        value: 2
                    },
                    { text: 'None', value: 0 }
                ]
            },
            thrombosis_rapid: {
                label: 'Thrombosis',
                condition: type => type === 'rapid',
                options: [
                    {
                        text: 'New venous thromboembolism (VTE) or arterial thromboembolism (ATE) after heparin exposure',
                        value: 3
                    },
                    {
                        text: 'Progression of pre-existing VTE or ATE while receiving heparin',
                        value: 2
                    },
                    { text: 'None', value: 0 }
                ]
            },
            skin_necrosis: {
                label: 'Skin necrosis at subcutaneous heparin injection sites',
                yes: 3,
                no: 0
            },
            systemic_reaction: {
                label: 'Acute systemic reaction after IV heparin bolus',
                yes: 2,
                no: 0
            },
            bleeding: {
                label: 'Presence of bleeding, petechiae or extensive bruising',
                yes: -1,
                no: 0
            },
            chronic_thrombocytopenia: {
                label: 'Presence of chronic thrombocytopenic disorder',
                yes: -1,
                no: 0
            },
            new_medication: {
                label: 'Newly initiated non-heparin medication known to cause thrombocytopenia',
                yes: -1,
                no: 0
            },
            severe_infection: { label: 'Severe infection', yes: -2, no: 0 },
            dic: { label: 'Severe disseminated intravascular coagulation (DIC)', yes: -2, no: 0 },
            arterial_device: { label: 'Indwelling intra-arterial device', yes: -2, no: 0 },
            cardiopulmonary_bypass: {
                label: 'Cardiopulmonary bypass within previous 96 hours',
                yes: -1,
                no: 0
            },
            no_other_cause: { label: 'No other apparent cause', yes: 3, no: 0 }
        };

        const renderCriteria = (onsetType = 'typical') => {
            criteriaContainer.innerHTML = '';
            Object.entries(criteria).forEach(([key, data]) => {
                if (data.condition && !data.condition(onsetType)) {
                    return;
                }

                let controlHTML = '';
                if (data.options) {
                    // Multi-option radio group
                    const options = data.options
                        .map(
                            (opt, index) =>
                                `<label class="radio-option ${index === 0 ? 'selected' : ''}">
                                    <input type="radio" name="${key}" value="${opt.value}" ${index === 0 ? 'checked' : ''}>
                                    <span class="radio-label">${opt.text} <strong>${opt.value > 0 ? '+' : ''}${opt.value}</strong></span>
                                </label>`
                        )
                        .join('');
                    controlHTML = `<div class="radio-group" data-name="${key}">${options}</div>`;
                } else {
                    // Yes/No radio group
                    controlHTML = `
                        <div class="radio-group" data-name="${key}">
                            <label class="radio-option selected">
                                <input type="radio" name="${key}" value="${data.no}" checked>
                                <span class="radio-label">No <strong>${data.no > 0 ? '+' : ''}${data.no}</strong></span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="${key}" value="${data.yes}">
                                <span class="radio-label">Yes <strong>${data.yes > 0 ? '+' : ''}${data.yes}</strong></span>
                            </label>
                        </div>`;
                }

                const row = `
                    <div class="section">
                        <div class="section-title">${data.label}</div>
                        ${controlHTML}
                    </div>`;
                criteriaContainer.innerHTML += row;
            });
            attachEventListeners();
            calculateScore();
        };

        const calculateScore = () => {
            let score = 0;
            criteriaContainer.querySelectorAll('.radio-group').forEach(group => {
                const selected = group.querySelector('input[type="radio"]:checked');
                if (selected) {
                    score += parseInt(selected.value);
                }
            });

            const resultContainer = root.querySelector('.result-container');
            const scoreValueEl = root.querySelector('#hep-score-value');
            const interpretationEl = root.querySelector('#hep-score-interpretation');
            const probabilityEl = root.querySelector('#hep-score-probability');

            if (resultContainer) {
                resultContainer.classList.add('show');
            }

            if (scoreValueEl) {
                scoreValueEl.textContent = score;
            }

            let interpretation = '';
            let probability = '';
            let probabilityLevel = '';

            if (score <= -1) {
                interpretation = 'Scores ≤ -1 suggest a lower probability of HIT.';
                probability = 'Low';
                probabilityLevel = 'risk-low';
            } else if (score >= 4) {
                interpretation = 'Scores ≥ 4 are >90% sensitive for HIT.';
                probability = 'High (>90% sensitive)';
                probabilityLevel = 'risk-high';
            } else {
                interpretation = 'Intermediate probability of HIT.';
                probability = 'Intermediate';
                probabilityLevel = 'risk-moderate';
            }

            if (interpretationEl) {
                interpretationEl.textContent = interpretation;
            }

            if (probabilityEl) {
                probabilityEl.textContent = probability;
                probabilityEl.classList.remove('risk-low', 'risk-moderate', 'risk-high');
                probabilityEl.classList.add(probabilityLevel);
            }
        };

        const attachEventListeners = () => {
            criteriaContainer.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    // Add visual feedback
                    const parent = radio.closest('.radio-option');
                    const siblings = parent.parentElement.querySelectorAll('.radio-option');
                    siblings.forEach(s => s.classList.remove('selected'));
                    parent.classList.add('selected');
                    
                    calculateScore();
                });
            });
        };

        onsetToggle.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Add visual feedback
                const parent = radio.closest('.radio-option');
                const siblings = parent.parentElement.querySelectorAll('.radio-option');
                siblings.forEach(s => s.classList.remove('selected'));
                parent.classList.add('selected');
                
                // Re-render criteria
                renderCriteria(radio.value);
            });
        });

        // Initial render
        renderCriteria('typical');

        // FHIR auto-population
        try {
            const plateletObs = await getMostRecentObservation(client, '26515-7'); // Platelets
            if (plateletObs && plateletObs.valueQuantity) {
                const nadirGroup = criteriaContainer.querySelector('[data-name="nadir_platelet"]');
                if (nadirGroup) {
                    const radioValue = plateletObs.valueQuantity.value < 20 ? '-2' : '2';
                    const radioToCheck = nadirGroup.querySelector(`input[value="${radioValue}"]`);
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                        const parent = radioToCheck.closest('.radio-option');
                        nadirGroup.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                        parent.classList.add('selected');
                    }
                }
            }

            const conditionCodes = [
                '451574005', // VTE
                '110483000', // ATE
                '67751000' // DIC
            ];
            const conditions = await getPatientConditions(client, conditionCodes);
            if (conditions) {
                if (conditions.some(c => c.code.coding[0].code === '67751000')) {
                    const dicGroup = criteriaContainer.querySelector('[data-name="dic"]');
                    if (dicGroup) {
                        const radioToCheck = dicGroup.querySelector('input[value="-2"]');
                        if (radioToCheck) {
                            radioToCheck.checked = true;
                            const parent = radioToCheck.closest('.radio-option');
                            dicGroup.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                            parent.classList.add('selected');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error auto-populating HEP score:', error);
        } finally {
            calculateScore();
        }
    }
};
