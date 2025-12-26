import { uiBuilder } from '../../ui-builder.js';
// import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { LOINC_CODES } from '../../fhir-codes.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

interface CriterionConfig {
    label: string;
    condition?: (type: string) => boolean;
    options?: { label: string; value: string; checked?: boolean }[];
    no?: string;
    yes?: string;
}

export const hepScore: CalculatorModule = {
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
            message:
                '<strong>📋 HIT Assessment</strong><br>Select the type of HIT onset and complete all clinical criteria below.'
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

        <div class="ui-section" style="margin-top: 20px;">
            <div class="ui-section-title">📐 FORMULA</div>
            <p style="margin-bottom: 10px; color: #555;">Addition of the selected points:</p>
            <div class="ui-table-wrapper">
                <table class="ui-scoring-table">
                    <thead>
                        <tr>
                            <th class="ui-scoring-table__header ui-scoring-table__header--criteria">Criteria</th>
                            <th class="ui-scoring-table__header ui-scoring-table__header--points">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Thrombocytopenia Features -->
                        <tr class="ui-scoring-table__category">
                            <td colspan="2">Thrombocytopenia Features</td>
                        </tr>
                        
                        <!-- Magnitude of fall -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Magnitude of fall in platelet count</strong> (peak to nadir)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;<30%</td><td class="ui-scoring-table__points">-1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;30-50%</td><td class="ui-scoring-table__points">1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;>50%</td><td class="ui-scoring-table__points">3</td></tr>

                        <!-- Timing (Typical) -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Timing of platelet count fall</strong> (typical HIT onset suspected)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins <4 days after heparin exposure</td><td class="ui-scoring-table__points">-2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins 4 days after heparin exposure</td><td class="ui-scoring-table__points">2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins 5-10 days after heparin exposure</td><td class="ui-scoring-table__points">3</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins 11-14 days after heparin exposure</td><td class="ui-scoring-table__points">2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins >14 days after heparin exposure</td><td class="ui-scoring-table__points">-1</td></tr>

                        <!-- Timing (Rapid) -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Timing of platelet count fall</strong> (prior heparin exposure within 100 days)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins <48 hours after heparin re-exposure</td><td class="ui-scoring-table__points">2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Fall begins >48 hours after heparin re-exposure</td><td class="ui-scoring-table__points">-1</td></tr>

                        <!-- Nadir -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Nadir platelet count</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;≤20 x 10⁹/L</td><td class="ui-scoring-table__points">-2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;>20 x 10⁹/L</td><td class="ui-scoring-table__points">2</td></tr>

                        <!-- Thrombosis (Typical) -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Thrombosis</strong> (typical HIT onset suspected)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;New VTE or ATE ≥4 days after heparin exposure</td><td class="ui-scoring-table__points">3</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Progression of pre-existing VTE or ATE while receiving heparin</td><td class="ui-scoring-table__points">2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;None</td><td class="ui-scoring-table__points">0</td></tr>

                        <!-- Thrombosis (Rapid) -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Thrombosis</strong> (prior heparin exposure within 100 days)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;New VTE or ATE after heparin exposure</td><td class="ui-scoring-table__points">3</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Progression of pre-existing VTE or ATE while receiving heparin</td><td class="ui-scoring-table__points">2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;None</td><td class="ui-scoring-table__points">0</td></tr>

                        <!-- Skin Necrosis -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Skin necrosis at subcutaneous heparin injection sites</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">3</td></tr>

                        <!-- Systemic Reaction -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Acute systemic reaction after IV heparin bolus</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">2</td></tr>

                        <!-- Bleeding -->
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Presence of bleeding, petechiae or extensive bruising</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-1</td></tr>

                        <!-- Other Causes -->
                        <tr class="ui-scoring-table__category">
                            <td colspan="2">Other Causes of Thrombocytopenia</td>
                        </tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Presence of chronic thrombocytopenic disorder</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-1</td></tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Newly initiated non-heparin medication known to cause thrombocytopenia</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-1</td></tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Severe infection</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-2</td></tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Severe DIC</strong> (fibrinogen <100 mg/dL and D-dimer >5 µg/mL)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-2</td></tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Indwelling intra-arterial device</strong> (e.g. IABP, VAD, ECMO)</td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-2</td></tr>

                         <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Cardiopulmonary bypass within previous 96 hours</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">-1</td></tr>

                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>No other apparent cause</strong></td><td></td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;No</td><td class="ui-scoring-table__points">0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria">&nbsp;&nbsp;Yes</td><td class="ui-scoring-table__points">3</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="info-section mt-20 text-sm text-muted">
            <h4>📚 Reference</h4>
            <p>Cuker, A., et al. (2010). The HIT Expert Probability (HEP) Score. <em>J Thromb Haemost</em>.</p>
        </div>
    `,
    initialize: async (client: any, patient: any, container: HTMLElement) => {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const criteriaContainer = container.querySelector('#hep-score-criteria') as HTMLElement;
        const onsetInputs = container.querySelectorAll('input[name="hit_onset_type"]');

        const criteria: { [key: string]: CriterionConfig } = {
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
                condition: (type: string) => type === 'typical',
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
                condition: (type: string) => type === 'rapid',
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
                condition: (type: string) => type === 'typical',
                options: [
                    { label: 'New VTE/ATE ≥4 days after heparin exposure (+3)', value: '3' },
                    {
                        label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)',
                        value: '2'
                    },
                    { label: 'None (0)', value: '0', checked: true }
                ]
            },
            thrombosis_rapid: {
                label: 'Thrombosis',
                condition: (type: string) => type === 'rapid',
                options: [
                    { label: 'New VTE/ATE after heparin exposure (+3)', value: '3' },
                    {
                        label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)',
                        value: '2'
                    },
                    { label: 'None (0)', value: '0', checked: true }
                ]
            },
            skin_necrosis: {
                label: 'Skin necrosis at subcutaneous heparin injection sites',
                yes: '3',
                no: '0'
            },
            systemic_reaction: {
                label: 'Acute systemic reaction after IV heparin bolus',
                yes: '2',
                no: '0'
            },
            bleeding: {
                label: 'Presence of bleeding, petechiae or extensive bruising',
                yes: '-1',
                no: '0'
            },
            chronic_thrombocytopenia: {
                label: 'Presence of chronic thrombocytopenic disorder',
                yes: '-1',
                no: '0'
            },
            new_medication: {
                label: 'Newly initiated non-heparin medication known to cause thrombocytopenia',
                yes: '-1',
                no: '0'
            },
            severe_infection: { label: 'Severe infection', yes: '-2', no: '0' },
            dic: {
                label: 'Severe disseminated intravascular coagulation (DIC)',
                yes: '-2',
                no: '0'
            },
            arterial_device: { label: 'Indwelling intra-arterial device', yes: '-2', no: '0' },
            cardiopulmonary_bypass: {
                label: 'Cardiopulmonary bypass within previous 96 hours',
                yes: '-1',
                no: '0'
            },
            no_other_cause: { label: 'No other apparent cause', yes: '3', no: '0' }
        };

        const calculateScore = () => {
            let score = 0;
            if (criteriaContainer) {
                criteriaContainer.querySelectorAll('.ui-radio-group').forEach(group => {
                    const selected = group.querySelector(
                        'input[type="radio"]:checked'
                    ) as HTMLInputElement;
                    if (selected) {
                        score += parseInt(selected.value);
                    }
                });
            }

            let interpretation = '';
            let probability = '';
            let alertType: 'success' | 'warning' | 'danger' | 'info' = 'info';

            if (score <= -1) {
                interpretation = 'Scores ≤ -1 suggest a lower probability of HIT.';
                probability = 'Low';
                alertType = 'success';
            } else if (score >= 4) {
                interpretation = 'Scores ≥ 4 are >90% sensitive for HIT.';
                probability = 'High (>90% sensitive)';
                alertType = 'danger';
            } else {
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

                    let options: { label: string; value: string; checked?: boolean }[] = [];
                    if (data.options) {
                        options = data.options;
                    } else if (data.yes && data.no) {
                        options = [
                            { label: `No (${data.no})`, value: data.no, checked: true },
                            {
                                label: `Yes (${parseInt(data.yes) > 0 ? '+' : ''}${data.yes})`,
                                value: data.yes
                            }
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
            radio.addEventListener('change', e => {
                const target = e.target as HTMLInputElement;
                renderCriteria(target.value);
            });
        });

        // Initial render
        renderCriteria('typical');

        // FHIR auto-population logic
        try {
            if (client) {
                // Use fhirDataService to get platelets
                const plateletResult = await fhirDataService.getObservation(LOINC_CODES.PLATELETS, {
                    trackStaleness: true,
                    stalenessLabel: 'Platelets'
                });
                if (plateletResult.value !== null) {
                    if (criteriaContainer) {
                        const nadirGroup = criteriaContainer.querySelector(
                            'input[name="nadir_platelet"]'
                        );
                        if (nadirGroup) {
                            const radioValue = plateletResult.value < 20 ? '-2' : '2';
                            const radioToCheck = criteriaContainer.querySelector(
                                `input[name="nadir_platelet"][value="${radioValue}"]`
                            ) as HTMLInputElement;
                            if (radioToCheck) {
                                radioToCheck.checked = true;
                            }
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
