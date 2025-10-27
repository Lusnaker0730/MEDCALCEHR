import { getMostRecentObservation, getPatientConditions } from '../../utils.js';

export const hepScore = {
    id: '4ts-hit',
    title: 'HIT Expert Probability (HEP) Score for Heparin-Induced Thrombocytopenia',
    description: 'Pre-test clinical scoring model for HIT based on broad expert opinion.',
    generateHTML: () => `
        <div class="calculator-container hep-score">
            <div class="input-row-new">
                <div class="input-label-new">
                    Type of heparin-induced thrombocytopenia (HIT) onset suspected
                </div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="hit_onset_type">
                        <button data-value="typical" class="active">Typical</button>
                        <button data-value="rapid">Rapid</button>
                    </div>
                </div>
            </div>

            <div id="hep-score-criteria">
                <!-- JS will populate this section based on onset type -->
            </div>

            <div class="result-box hep-score-result">
                <h3>HEP Score: <span id="hep-score-value">-</span></h3>
                <p id="hep-score-interpretation"></p>
            </div>
        </div>

        <div class="calculator-image-container" style="margin-top: 20px; display: flex; flex-direction: column; gap: 15px;">
            <img src="js/calculators/4ts-hit/4HIT.png" alt="HEP Score Table 1" style="max-width: 100%; width: 100%; border-radius: 8px;" />
            <img src="js/calculators/4ts-hit/6-Table3-1.png" alt="HEP Score Table 2" style="max-width: 100%; width: 100%; border-radius: 8px;" />
        </div>

        <div class="citation">
            <h4>Source:</h4>
            <p>Cuker, A., et al. (2010). The HIT Expert Probability (HEP) Score: a novel pre-test probability model for heparin-induced thrombocytopenia based on broad expert opinion. <em>Journal of thrombosis and haemostasis : JTH</em>, 8(12), 2642–2650. <a href="https://doi.org/10.1111/j.1538-7836.2010.04059.x" target="_blank">doi:10.1111/j.1538-7836.2010.04059.x</a>. PMID: 20854372.</p>
        </div>
    `,
    initialize: async client => {
        const criteriaContainer = document.getElementById('hep-score-criteria');
        const onsetToggle = document.querySelector('[data-name="hit_onset_type"]');

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
                    // Multi-button group
                    const buttons = data.options
                        .map(
                            (opt, index) =>
                                `<button data-value="${opt.value}" class="${index === 0 ? 'active' : ''}">${opt.text} <strong>${opt.value > 0 ? '+' : ''}${opt.value}</strong></button>`
                        )
                        .join('');
                    controlHTML = `<div class="segmented-control" data-name="${key}">${buttons}</div>`;
                } else {
                    // Yes/No button group
                    controlHTML = `
                        <div class="segmented-control" data-name="${key}">
                            <button data-value="${data.no}" class="active">No <strong>${data.no > 0 ? '+' : ''}${data.no}</strong></button>
                            <button data-value="${data.yes}">Yes <strong>${data.yes > 0 ? '+' : ''}${data.yes}</strong></button>
                        </div>`;
                }

                const row = `
                    <div class="input-row-new">
                        <div class="input-label-new">${data.label}</div>
                        <div class="input-control-new">${controlHTML}</div>
                    </div>`;
                criteriaContainer.innerHTML += row;
            });
            attachEventListeners();
            calculateScore();
        };

        const calculateScore = () => {
            let score = 0;
            criteriaContainer.querySelectorAll('.segmented-control').forEach(group => {
                const selected = group.querySelector('.active');
                if (selected) {
                    score += parseInt(selected.dataset.value);
                }
            });

            const scoreValueEl = document.getElementById('hep-score-value');
            const interpretationEl = document.getElementById('hep-score-interpretation');

            scoreValueEl.textContent = score;

            if (score <= -1) {
                interpretationEl.textContent = 'Scores ≤ -1 suggest a lower probability of HIT.';
            } else if (score >= 4) {
                interpretationEl.textContent = 'Scores ≥ 4 are >90% sensitive for HIT.';
            } else {
                interpretationEl.textContent = 'Intermediate probability.';
            }
        };

        const attachEventListeners = () => {
            criteriaContainer.querySelectorAll('.segmented-control').forEach(group => {
                group.addEventListener('click', event => {
                    const button = event.target.closest('button');
                    if (!button) {
                        return;
                    }
                    group.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    calculateScore();
                });
            });
        };

        onsetToggle.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button || button.classList.contains('active')) {
                return;
            }
            onsetToggle.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCriteria(button.dataset.value);
        });

        // Initial render
        renderCriteria('typical');

        // FHIR auto-population (conceptual)
        try {
            const plateletObs = await getMostRecentObservation(client, '26515-7'); // Platelets
            if (plateletObs && plateletObs.valueQuantity) {
                const nadirGroup = criteriaContainer.querySelector('[data-name="nadir_platelet"]');
                if (nadirGroup) {
                    const btn =
                        plateletObs.valueQuantity.value < 20
                            ? nadirGroup.querySelector('[data-value="-2"]')
                            : nadirGroup.querySelector('[data-value="2"]');
                    nadirGroup
                        .querySelectorAll('button')
                        .forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
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
                        dicGroup
                            .querySelectorAll('button')
                            .forEach(b => b.classList.remove('active'));
                        dicGroup.querySelector('[data-value="-2"]').classList.add('active');
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
