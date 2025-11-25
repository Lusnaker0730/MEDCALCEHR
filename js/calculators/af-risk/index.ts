import { calculateAge, getMostRecentObservation } from '../../utils';
import { LOINC_CODES } from '../../fhir-codes';
import { uiBuilder } from '../../ui-builder';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Patient, Observation } from '../../types/fhir';

export const afRisk: Calculator = {
    id: 'af-risk',
    title: 'AF Stroke/Bleed Risk (CHA₂DS₂-VASc & HAS-BLED)',
    description: 'Combined assessment of stroke and bleeding risk in atrial fibrillation patients.',
    generateHTML: function (): string {
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
            content: cha2ds2vascFactors.map(factor =>
                uiBuilder.createRadioGroup({
                    name: factor.id,
                    label: factor.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: factor.points.toString(), label: 'Yes' }
                    ]
                })
            ).join('')
        });

        const hasBledSection = uiBuilder.createSection({
            title: '🩸 HAS-BLED Score (Bleeding Risk)',
            content: hasBledFactors.map(factor =>
                uiBuilder.createRadioGroup({
                    name: factor.id,
                    label: factor.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${cha2ds2vascSection}
            ${hasBledSection}
            
            ${uiBuilder.createResultBox({ id: 'af-risk-result', title: 'Assessment Results' })}
        `;
    },
    initialize: function (client: FHIRClient, patient: Patient, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            // Calculate CHA₂DS₂-VASc Score
            let cha2ds2vasc_score = 0;
            const cha2Ids = ['chf', 'htn', 'age75', 'dm', 'stroke', 'vasc', 'age65', 'female'];

            cha2Ids.forEach(id => {
                const checked = container.querySelector(`input[name="${id}"]:checked`) as HTMLInputElement;
                if (checked) cha2ds2vasc_score += parseInt(checked.value);
            });

            // Handle age overlap logic
            const age75Radio = container.querySelector('input[name="age75"][value="2"]') as HTMLInputElement;
            const age65Radio = container.querySelector('input[name="age65"][value="1"]') as HTMLInputElement;

            if (age75Radio?.checked && age65Radio?.checked) {
                cha2ds2vasc_score -= 1; // Correct for double counting
            }

            // Calculate HAS-BLED Score
            let hasbled_score = 0;
            const hasBledIds = ['hasbled-htn', 'hasbled-renal', 'hasbled-liver', 'hasbled-stroke', 'hasbled-bleed', 'hasbled-inr', 'hasbled-elderly', 'hasbled-drugs', 'hasbled-alcohol'];

            hasBledIds.forEach(id => {
                const checked = container.querySelector(`input[name="${id}"]:checked`) as HTMLInputElement;
                if (checked) hasbled_score += parseInt(checked.value);
            });

            // Generate Treatment Recommendation
            const isMale = patient && patient.gender === 'male';
            const strokeRiskScoreForOAC = isMale ? cha2ds2vasc_score : cha2ds2vasc_score - 1;

            let recommendation = '';
            let alertClass = 'ui-alert-info';
            if (strokeRiskScoreForOAC >= 2) {
                recommendation = 'Oral anticoagulation is recommended.';
                alertClass = 'ui-alert-warning';
            } else if (strokeRiskScoreForOAC === 1) {
                recommendation = 'Oral anticoagulation should be considered.';
                alertClass = 'ui-alert-warning';
            } else {
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

            const resultBox = container.querySelector('#af-risk-result') as HTMLElement;
            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                label: 'CHA₂DS₂-VASc Score (Stroke Risk)',
                value: cha2ds2vasc_score,
                unit: '/ 9 points'
            })}
                ${uiBuilder.createResultItem({
                label: 'HAS-BLED Score (Bleeding Risk)',
                value: hasbled_score,
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

            resultBox.classList.add('show');
        };

        // Pre-fill Logic
        const age = patient && patient.birthDate ? calculateAge(patient.birthDate) : 0;

        if (age >= 75) {
            setRadioValue('age75', '2');
        } else if (age >= 65) {
            setRadioValue('age65', '1');
        }

        if (patient && patient.gender === 'female') {
            setRadioValue('female', '1');
        }

        if (age > 65) {
            setRadioValue('hasbled-elderly', '1');
        }

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Async data population
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BP_PANEL).then((bpPanel: Observation | null) => {
                if (bpPanel && bpPanel.component) {
                    const sbpComp = bpPanel.component.find(c => c.code.coding && c.code.coding[0].code === LOINC_CODES.SYSTOLIC_BP);
                    if (sbpComp && sbpComp.valueQuantity && sbpComp.valueQuantity.value > 160) {
                        setRadioValue('hasbled-htn', '1');
                    }
                }
            });
        }

        calculate();
    }
};
