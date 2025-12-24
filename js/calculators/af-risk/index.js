import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
export const afRisk = {
    id: 'af-risk',
    title: 'AF Stroke/Bleed Risk (CHA₂DS₂-VASc & HAS-BLED)',
    description: 'Combined assessment of stroke and bleeding risk in atrial fibrillation patients.',
    generateHTML: function () {
        const cha2ds2vascFactors = [
            { id: 'chf', label: 'Congestive Heart Failure (+1)', points: 1 },
            { id: 'htn', label: 'Hypertension (+1)', points: 1 },
            { id: 'age75', label: 'Age ≥ 75 years (+2)', points: 2 },
            { id: 'dm', label: 'Diabetes Mellitus (+1)', points: 1 },
            { id: 'stroke', label: 'Stroke / TIA / Thromboembolism (+2)', points: 2 },
            { id: 'vasc', label: 'Vascular Disease (+1)', points: 1 },
            { id: 'age65', label: 'Age 65-74 years (+1)', points: 1 },
            { id: 'female', label: 'Female Gender (+1)', points: 1 }
        ];
        const hasBledFactors = [
            { id: 'hasbled-htn', label: 'Hypertension (uncontrolled, SBP > 160)', points: 1 },
            { id: 'hasbled-renal', label: 'Abnormal renal function', points: 1 },
            { id: 'hasbled-liver', label: 'Abnormal liver function', points: 1 },
            { id: 'hasbled-stroke', label: 'Stroke', points: 1 },
            { id: 'hasbled-bleed', label: 'Bleeding history or predisposition', points: 1 },
            { id: 'hasbled-inr', label: 'Labile INRs', points: 1 },
            { id: 'hasbled-elderly', label: 'Elderly (age > 65 years)', points: 1 },
            { id: 'hasbled-drugs', label: 'Concomitant drugs (e.g., NSAIDs, antiplatelets)', points: 1 },
            { id: 'hasbled-alcohol', label: 'Alcohol abuse', points: 1 }
        ];
        const cha2ds2vascSection = uiBuilder.createSection({
            title: '💓 CHA₂DS₂-VASc Score (Stroke Risk)',
            content: cha2ds2vascFactors.map(factor => uiBuilder.createRadioGroup({
                name: factor.id,
                label: factor.label,
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: factor.points.toString(), label: 'Yes' }
                ]
            })).join('')
        });
        const hasBledSection = uiBuilder.createSection({
            title: '🩸 HAS-BLED Score (Bleeding Risk)',
            content: hasBledFactors.map(factor => uiBuilder.createRadioGroup({
                name: factor.id,
                label: factor.label,
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes (+1)' }
                ]
            })).join('')
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${cha2ds2vascSection}
            ${hasBledSection}
            
            <div id="af-risk-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'af-risk-result', title: 'Assessment Results' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#af-risk-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                // Calculate CHA₂DS₂-VASc Score
                let cha2ds2vasc_score = 0;
                const cha2Ids = ['chf', 'htn', 'age75', 'dm', 'stroke', 'vasc', 'age65', 'female'];
                cha2Ids.forEach(id => {
                    const checked = container.querySelector(`input[name="${id}"]:checked`);
                    if (checked)
                        cha2ds2vasc_score += parseInt(checked.value);
                });
                // Double counting correction
                const age75Radio = container.querySelector('input[name="age75"][value="2"]');
                const age65Radio = container.querySelector('input[name="age65"][value="1"]');
                const age75Yes = age75Radio && age75Radio.checked;
                const age65Yes = age65Radio && age65Radio.checked;
                if (age75Yes && age65Yes) {
                    cha2ds2vasc_score -= 1; // Prioritize higher points but remove double count if both selected
                }
                // If 75 is selected, it's 2 points. If 65 is selected, it's 1. 
                // CHA2DS2-VASc defines age criteria as mutually exclusive tiers.
                // If user selected both YES, current logic substracts 1 point (2+1-1 = 2). Correct, giving max points for age category.
                // Calculate HAS-BLED Score
                let hasbled_score = 0;
                const hasBledIds = ['hasbled-htn', 'hasbled-renal', 'hasbled-liver', 'hasbled-stroke', 'hasbled-bleed', 'hasbled-inr', 'hasbled-elderly', 'hasbled-drugs', 'hasbled-alcohol'];
                hasBledIds.forEach(id => {
                    const checked = container.querySelector(`input[name="${id}"]:checked`);
                    if (checked)
                        hasbled_score += parseInt(checked.value);
                });
                // Treatment Recommendation
                const isMale = patient && patient.gender === 'male';
                // Adjust threshold logic? Original: male score, female score-1
                const strokeRiskScoreForOAC = (patient && !isMale) ? cha2ds2vasc_score - 1 : cha2ds2vasc_score;
                // Note: female gender adds 1 point in score itself.
                // Standard guideline: Men score >=2, Women score >=3 OAC recommended.
                // If female, score is at least 1.
                // score-1 means removing gender point for 'non-sex risk factors'.
                // If non-sex factors >= 2, OAC recommended. Correct.
                let recommendation = '';
                let alertClass = 'ui-alert-info';
                if (strokeRiskScoreForOAC >= 2) {
                    recommendation = 'Oral anticoagulation is recommended.';
                    alertClass = 'ui-alert-warning';
                }
                else if (strokeRiskScoreForOAC === 1) {
                    recommendation = 'Oral anticoagulation should be considered.';
                    alertClass = 'ui-alert-warning';
                }
                else {
                    recommendation = 'Antithrombotic therapy may be omitted.';
                    alertClass = 'ui-alert-success';
                }
                let bleedNote = '';
                if (hasbled_score >= 3) {
                    bleedNote = uiBuilder.createAlert({
                        type: 'danger',
                        message: '<strong>High Bleeding Risk:</strong> HAS-BLED score is ≥3. Use anticoagulants with caution, address modifiable bleeding risk factors, and schedule regular follow-up.',
                        icon: '⚠️'
                    });
                }
                const resultBox = container.querySelector('#af-risk-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'CHA₂DS₂-VASc Score (Stroke Risk)',
                            value: cha2ds2vasc_score.toString(),
                            unit: '/ 9 points'
                        })}
                            ${uiBuilder.createResultItem({
                            label: 'HAS-BLED Score (Bleeding Risk)',
                            value: hasbled_score.toString(),
                            unit: '/ 9 points'
                        })}
                            
                            <div class="ui-alert ${alertClass} mt-10">
                                <span class="ui-alert-icon">${alertClass.includes('success') ? '✓' : '⚠️'}</span>
                                <div class="ui-alert-content">
                                    <strong>Recommendation:</strong> ${recommendation}
                                </div>
                            </div>
                            ${bleedNote}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#af-risk-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'af-risk', action: 'calculate' });
            }
        };
        // Pre-fill Logic using FHIRDataService
        const age = fhirDataService.getPatientAge() || 0;
        if (age >= 75) {
            setRadioValue('age75', '2');
        }
        else if (age >= 65) {
            setRadioValue('age65', '1');
        }
        const gender = fhirDataService.getPatientGender();
        if (gender === 'female') {
            setRadioValue('female', '1');
        }
        if (age > 65) {
            setRadioValue('hasbled-elderly', '1');
        }
        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // Async data population using FHIRDataService
        if (client) {
            fhirDataService.getBloodPressure({ trackStaleness: true }).then(result => {
                if (result.systolic !== null && result.systolic > 160) {
                    setRadioValue('hasbled-htn', '1');
                    setRadioValue('htn', '1');
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
