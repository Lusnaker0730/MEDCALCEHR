import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
export const hepScore = {
    id: '4ts-hit',
    title: 'HIT Expert Probability (HEP) Score for Heparin-Induced Thrombocytopenia',
    description: 'Pre-test clinical scoring model for HIT based on broad expert opinion.',
    generateHTML: () => `
        <div class="calculator-header">
            <h3>HIT Expert Probability (HEP) Score</h3>
            <p class="description">Pre-test clinical scoring model for Heparin-Induced Thrombocytopenia (HIT).</p>
        </div>

        ${uiBuilder.createAlert({
        type: 'info',
        message: '<strong>📋 HIT Assessment</strong><br>Select the type of HIT onset and complete all clinical criteria below.'
    })}

        ${uiBuilder.createSection({
        title: 'Type of HIT onset suspected',
        content: uiBuilder.createRadioGroup({
            name: 'hit_onset_type',
            options: [
                { value: 'typical', label: 'Typical onset', checked: true },
                { value: 'rapid', label: 'Rapid onset (re-exposure)' }
            ]
        })
    })}

        <div id="hep-score-criteria">
            <!-- JS will populate this section based on onset type -->
        </div>

        ${uiBuilder.createResultBox({ id: 'hep-score-result', title: 'HEP Score Results' })}

        <div class="chart-container" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
            <img src="js/calculators/4ts-hit/4HIT.png" alt="HEP Score Table 1" class="reference-image" style="max-width: 100%; border-radius: 8px;" />
            <img src="js/calculators/4ts-hit/6-Table3-1.png" alt="HEP Score Table 2" class="reference-image" style="max-width: 100%; border-radius: 8px;" />
        </div>

        <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
            <h4>📚 Reference</h4>
            <p>Cuker, A., et al. (2010). The HIT Expert Probability (HEP) Score. <em>J Thromb Haemost</em>.</p>
        </div>
    `,
    initialize: async (client, patient, container) => {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const criteriaContainer = container.querySelector('#hep-score-criteria');
        const onsetInputs = container.querySelectorAll('input[name="hit_onset_type"]');
        const criteria = {
            platelet_fall_magnitude: {
                label: 'Magnitude of platelet count fall',
                options: [
                    { label: '<30% (-1)', value: '-1' },
                    { label: '30-50% (+1)', value: '1' },
                    { label: '>50% (+3)', value: '3' }
                ]
            },
            timing_typical: {
                label: 'Timing of platelet count fall',
                condition: (type) => type === 'typical',
                options: [
                    { label: 'Fall begins <4 days after heparin exposure (-2)', value: '-2' },
                    { label: 'Fall begins 4 days after heparin exposure (+2)', value: '2' },
                    { label: 'Fall begins 5-10 days after heparin exposure (+3)', value: '3' },
                    { label: 'Fall begins 11-14 days after heparin exposure (-2)', value: '-2' },
                    { label: 'Fall begins >14 days after heparin exposure (-1)', value: '-1' }
                ]
            },
            timing_rapid: {
                label: 'Timing of platelet count fall',
                condition: (type) => type === 'rapid',
                options: [
                    { label: 'Fall begins <48 hours after heparin re-exposure (-1)', value: '-1' },
                    { label: 'Fall begins ≥48 hours after heparin re-exposure (+2)', value: '2' }
                ]
            },
            nadir_platelet: {
                label: 'Nadir platelet count',
                options: [
                    { label: '<20 x 10⁹/L (-2)', value: '-2' },
                    { label: '≥20 x 10⁹/L (+2)', value: '2' }
                ]
            },
            thrombosis_typical: {
                label: 'Thrombosis',
                condition: (type) => type === 'typical',
                options: [
                    { label: 'New VTE/ATE ≥4 days after heparin exposure (+3)', value: '3' },
                    { label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)', value: '2' },
                    { label: 'None (0)', value: '0', checked: true }
                ]
            },
            thrombosis_rapid: {
                label: 'Thrombosis',
                condition: (type) => type === 'rapid',
                options: [
                    { label: 'New VTE/ATE after heparin exposure (+3)', value: '3' },
                    { label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)', value: '2' },
                    { label: 'None (0)', value: '0', checked: true }
                ]
            },
            skin_necrosis: { label: 'Skin necrosis at subcutaneous heparin injection sites', yes: '3', no: '0' },
            systemic_reaction: { label: 'Acute systemic reaction after IV heparin bolus', yes: '2', no: '0' },
            bleeding: { label: 'Presence of bleeding, petechiae or extensive bruising', yes: '-1', no: '0' },
            chronic_thrombocytopenia: { label: 'Presence of chronic thrombocytopenic disorder', yes: '-1', no: '0' },
            new_medication: { label: 'Newly initiated non-heparin medication known to cause thrombocytopenia', yes: '-1', no: '0' },
            severe_infection: { label: 'Severe infection', yes: '-2', no: '0' },
            dic: { label: 'Severe disseminated intravascular coagulation (DIC)', yes: '-2', no: '0' },
            arterial_device: { label: 'Indwelling intra-arterial device', yes: '-2', no: '0' },
            cardiopulmonary_bypass: { label: 'Cardiopulmonary bypass within previous 96 hours', yes: '-1', no: '0' },
            no_other_cause: { label: 'No other apparent cause', yes: '3', no: '0' }
        };
        const calculateScore = () => {
            let score = 0;
            if (criteriaContainer) {
                criteriaContainer.querySelectorAll('.ui-radio-group').forEach(group => {
                    const selected = group.querySelector('input[type="radio"]:checked');
                    if (selected) {
                        score += parseInt(selected.value);
                    }
                });
            }
            let interpretation = '';
            let probability = '';
            let alertType = 'info';
            if (score <= -1) {
                interpretation = 'Scores ≤ -1 suggest a lower probability of HIT.';
                probability = 'Low';
                alertType = 'success';
            }
            else if (score >= 4) {
                interpretation = 'Scores ≥ 4 are >90% sensitive for HIT.';
                probability = 'High (>90% sensitive)';
                alertType = 'danger';
            }
            else {
                interpretation = 'Intermediate probability of HIT.';
                probability = 'Intermediate';
                alertType = 'warning';
            }
            const resultBox = container.querySelector('#hep-score-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'HEP Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: probability,
                        alertClass: `ui-alert-${alertType}`
                    })}
                    ${uiBuilder.createAlert({
                        type: alertType,
                        message: interpretation
                    })}
                `;
                }
                resultBox.classList.add('show');
            }
        };
        const renderCriteria = (onsetType = 'typical') => {
            if (criteriaContainer) {
                criteriaContainer.innerHTML = '';
                Object.entries(criteria).forEach(([key, data]) => {
                    if (data.condition && !data.condition(onsetType)) {
                        return;
                    }
                    let options = [];
                    if (data.options) {
                        options = data.options;
                    }
                    else if (data.yes && data.no) {
                        options = [
                            { label: `No (${data.no})`, value: data.no, checked: true },
                            { label: `Yes (${parseInt(data.yes) > 0 ? '+' : ''}${data.yes})`, value: data.yes }
                        ];
                    }
                    const sectionHtml = uiBuilder.createSection({
                        title: data.label,
                        content: uiBuilder.createRadioGroup({
                            name: key,
                            options: options
                        })
                    });
                    criteriaContainer.innerHTML += sectionHtml;
                });
                // Re-initialize listeners for new elements
                criteriaContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', calculateScore);
                });
                calculateScore();
            }
        };
        onsetInputs.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const target = e.target;
                renderCriteria(target.value);
            });
        });
        // Initial render
        renderCriteria('typical');
        // FHIR auto-population logic
        try {
            if (client) {
                // LOINC code for Platelets is 26515-7, commonly
                // We shouldn't hardcode magic string if possible, use LOINC_CODES if available
                // 26515-7 is Platelets [#/volume] in Blood
                const plateletObs = await getMostRecentObservation(client, '26515-7');
                if (plateletObs && plateletObs.valueQuantity && plateletObs.valueQuantity.value !== undefined) {
                    if (criteriaContainer) {
                        const nadirGroup = criteriaContainer.querySelector('input[name="nadir_platelet"]');
                        if (nadirGroup) { // Check if rendered (always rendered as condition is undefined)
                            const radioValue = plateletObs.valueQuantity.value < 20 ? '-2' : '2';
                            const radioToCheck = criteriaContainer.querySelector(`input[name="nadir_platelet"][value="${radioValue}"]`);
                            if (radioToCheck) {
                                radioToCheck.checked = true;
                                stalenessTracker.trackObservation(`input[name="nadir_platelet"][value="${radioValue}"]`, plateletObs, '26515-7', 'Platelets');
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Error auto-populating HEP score:', error);
        }
        finally {
            calculateScore();
        }
    }
};
