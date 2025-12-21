/**
 * Revised Geneva Score (Simplified) Calculator
 * 
 * 這是一個混合計算器 - 有 checkbox 評分和 input 輸入（心率）
 * 需要自定義處理，因此不完全使用工廠函數
 */

import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: unknown, patient: unknown, container: HTMLElement) => void;
}

export const genevaScore: CalculatorModule = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',

    generateHTML: function () {
        const assessmentSection = uiBuilder.createSection({
            title: 'Clinical Assessment',
            icon: '📋',
            content: [
                uiBuilder.createCheckbox({ id: 'geneva-age', label: 'Age > 65 years (+1)', value: '1' }),
                uiBuilder.createCheckbox({ id: 'geneva-prev-dvt', label: 'Previous DVT or PE (+1)', value: '1' }),
                uiBuilder.createCheckbox({ id: 'geneva-surgery', label: 'Surgery or fracture within 1 month (+1)', value: '1' }),
                uiBuilder.createCheckbox({ id: 'geneva-malignancy', label: 'Active malignancy (+1)', value: '1' })
            ].join('')
        });

        const signsSection = uiBuilder.createSection({
            title: 'Clinical Signs',
            icon: '⚕️',
            content: [
                uiBuilder.createCheckbox({ id: 'geneva-limb-pain', label: 'Unilateral lower limb pain (+1)', value: '1' }),
                uiBuilder.createCheckbox({ id: 'geneva-hemoptysis', label: 'Hemoptysis (+1)', value: '1' }),
                uiBuilder.createCheckbox({ id: 'geneva-palpation', label: 'Pain on deep vein palpation AND unilateral edema (+1)', value: '1' })
            ].join('')
        });

        const vitalsSection = uiBuilder.createSection({
            title: 'Vital Signs',
            icon: '🩺',
            content: uiBuilder.createInput({
                id: 'geneva-hr',
                label: 'Heart Rate',
                type: 'number',
                placeholder: 'Enter heart rate',
                unit: 'bpm',
                helpText: '75-94 bpm (+1), ≥ 95 bpm (+2)'
            })
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Note:</strong> This is the Simplified (Modified) Revised Geneva Score. Each criterion is worth 1 point (except heart rate scoring).</p>
                </div>
            </div>
            
            ${assessmentSection}
            ${signsSection}
            ${vitalsSection}
            
            ${uiBuilder.createResultBox({ id: 'geneva-result', title: 'Geneva Score Result' })}
            
            <div class="info-section mt-20">
                <h4>📚 References</h4>
                <p>Klok FA, et al. Simplification of the revised Geneva score for assessing clinical probability of pulmonary embolism. <em>Arch Intern Med</em>. 2008;168(19):2131-2136.</p>
            </div>
        `;
    },

    initialize: function (client: unknown, patient: unknown, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const calculate = (): void => {
            let score = 0;

            // Sum checkbox values
            const checkedBoxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
            checkedBoxes.forEach(box => {
                score += parseInt(box.value, 10);
            });

            // Add heart rate score
            const hrInput = container.querySelector('#geneva-hr') as HTMLInputElement;
            const hr = parseInt(hrInput?.value, 10);
            if (!isNaN(hr)) {
                if (hr >= 75 && hr <= 94) {
                    score += 1;
                } else if (hr >= 95) {
                    score += 2;
                }
            }

            // Display result if heart rate is valid
            const resultBox = container.querySelector('#geneva-result');
            if (!hrInput || isNaN(hr)) {
                if (resultBox) resultBox.classList.remove('show');
                return;
            }

            // Determine risk level
            let riskLevel: string, alertClass: string, prevalence: string, recommendation: string;

            if (score <= 1) {
                riskLevel = 'Low Risk';
                alertClass = 'ui-alert-success';
                prevalence = '8%';
                recommendation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be excluded.';
            } else if (score <= 4) {
                riskLevel = 'Intermediate Risk';
                alertClass = 'ui-alert-warning';
                prevalence = '28%';
                recommendation = 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.';
            } else {
                riskLevel = 'High Risk';
                alertClass = 'ui-alert-danger';
                prevalence = '74%';
                recommendation = 'PE is likely. Proceed directly to CT pulmonary angiography.';
            }

            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score.toString(),
                            unit: 'points',
                            interpretation: riskLevel,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'PE Prevalence',
                            value: prevalence,
                            unit: '',
                            alertClass: alertClass
                        })}
                        
                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">💡</span>
                            <div class="ui-alert-content">
                                <strong>Recommendation:</strong> ${recommendation}
                            </div>
                        </div>
                    `;
                }
                resultBox.classList.add('show');
            }
        };

        // Bind events
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', calculate);
            input.addEventListener('input', calculate);
        });

        // Load FHIR data
        if (client && patient) {
            // Auto-populate age checkbox
            const typedPatient = patient as { birthDate?: string };
            if (typedPatient.birthDate) {
                const age = calculateAge(typedPatient.birthDate);
                const ageCheckbox = container.querySelector('#geneva-age') as HTMLInputElement;
                if (age > 65 && ageCheckbox) {
                    ageCheckbox.checked = true;
                    ageCheckbox.dispatchEvent(new Event('change'));
                }
            }

            // Load heart rate
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                const hrInput = container.querySelector('#geneva-hr') as HTMLInputElement;
                if (hrInput && obs?.valueQuantity) {
                    hrInput.value = Math.round(obs.valueQuantity.value).toString();
                    hrInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#geneva-hr', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }).catch(e => console.warn('Error loading heart rate:', e));
        }

        // Initial calculation
        calculate();
    }
};
