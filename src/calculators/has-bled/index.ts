/**
 * HAS-BLED Score for Major Bleeding Risk Calculator
 * 
 * 使用 Yes/No Calculator 工廠函數遷移
 * Estimates risk of major bleeding for patients on anticoagulation.
 */

import { createYesNoCalculator, YesNoCalculatorConfig } from '../shared/yes-no-calculator.js';
import { getPatient, getMostRecentObservation, getPatientConditions, getMedicationRequests, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';

const config: YesNoCalculatorConfig = {
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description: 'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    infoAlert: 'Select all risk factors that apply. Score automatically calculates.',
    sectionTitle: 'HAS-BLED Risk Factors',
    sectionIcon: '🩸',
    questions: [
        { id: 'hasbled-hypertension', label: '<strong>H</strong>ypertension (Uncontrolled, >160 mmHg systolic)', points: 1 },
        { id: 'hasbled-renal', label: 'Abnormal <strong>R</strong>enal function (Dialysis, transplant, Cr >2.26 mg/dL)', points: 1 },
        { id: 'hasbled-liver', label: 'Abnormal <strong>L</strong>iver function (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)', points: 1 },
        { id: 'hasbled-stroke', label: '<strong>S</strong>troke history', points: 1 },
        { id: 'hasbled-bleeding', label: '<strong>B</strong>leeding history or predisposition', points: 1 },
        { id: 'hasbled-inr', label: '<strong>L</strong>abile INR (Unstable/high INRs, time in therapeutic range <60%)', points: 1 },
        { id: 'hasbled-age', label: '<strong>E</strong>lderly (Age >65)', points: 1 },
        { id: 'hasbled-meds', label: '<strong>D</strong>rugs predisposing to bleeding (Aspirin, clopidogrel, NSAIDs)', points: 1 },
        { id: 'hasbled-alcohol', label: 'Alcohol use (≥8 drinks/week)', points: 1 }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'Low risk', severity: 'success', recommendation: 'Anticoagulation can be considered. Relatively low risk for major bleeding.' },
        { minScore: 1, maxScore: 1, label: 'Low-moderate risk', severity: 'success', recommendation: 'Anticoagulation can be considered. Relatively low risk for major bleeding.' },
        { minScore: 2, maxScore: 2, label: 'Moderate risk', severity: 'warning', recommendation: 'Anticoagulation can be considered. Relatively low risk for major bleeding.' },
        { minScore: 3, maxScore: 999, label: 'High risk', severity: 'danger', recommendation: 'Consider alternatives to anticoagulation or more frequent monitoring. High bleeding risk.' }
    ],
    customResultRenderer: (score: number): string => {
        const riskData: Record<number, { risk: string; level: string; bleeds: string }> = {
            0: { risk: 'Low risk', level: 'success', bleeds: '0.9% (1.13 bleeds/100 patient-years)' },
            1: { risk: 'Low-moderate risk', level: 'success', bleeds: '1.02 bleeds/100 patient-years' },
            2: { risk: 'Moderate risk', level: 'warning', bleeds: '1.88 bleeds/100 patient-years' },
            3: { risk: 'Moderate-high risk', level: 'warning', bleeds: '3.74 bleeds/100 patient-years' },
            4: { risk: 'High risk', level: 'danger', bleeds: '8.70 bleeds/100 patient-years' }
        };
        
        const data = riskData[Math.min(score, 4)] || { risk: 'Very high risk', level: 'danger', bleeds: '12.50 bleeds/100 patient-years' };
        const alertClass = `ui-alert-${data.level}`;
        const recommendation = score >= 3 
            ? 'Consider alternatives to anticoagulation or more frequent monitoring. High bleeding risk.'
            : 'Anticoagulation can be considered. Relatively low risk for major bleeding.';
        
        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: '/ 9 points',
                interpretation: data.risk,
                alertClass: alertClass
            })}
            
            <div class="result-item mt-10 text-center">
                <span class="label text-muted">Annual Bleeding Risk:</span>
                <span class="value font-semibold">${data.bleeds}</span>
            </div>

            <div class="ui-alert ${alertClass} mt-10">
                <span class="ui-alert-icon">${score >= 3 ? '⚠️' : 'ℹ️'}</span>
                <div class="ui-alert-content">
                    <strong>Recommendation:</strong> ${recommendation}
                </div>
            </div>
        `;
    }
};

// 創建基礎計算器
const baseCalculator = createYesNoCalculator(config);

// 導出帶有 FHIR 自動填入的計算器
export const hasBled = {
    ...baseCalculator,
    
    initialize(client: unknown, patient: any, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);
        
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        
        const setRadioValue = (name: string, value: string, obs?: any, loinc?: string, label?: string): void => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                if (obs && loinc && label) {
                    stalenessTracker.trackObservation(`input[name="${name}"]`, obs, loinc, label);
                }
            }
        };
        
        // 計算函數
        const calculate = (): void => {
            let score = 0;
            config.questions.forEach(q => {
                const radio = container.querySelector(`input[name="${q.id}"]:checked`) as HTMLInputElement | null;
                if (radio) {
                    score += parseInt(radio.value) || 0;
                }
            });
            
            const resultBox = document.getElementById('has-bled-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent && config.customResultRenderer) {
                    resultContent.innerHTML = config.customResultRenderer(score);
                }
                resultBox.classList.add('show');
            }
        };
        
        // 綁定事件
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        
        // 初始計算
        calculate();
        
        // FHIR 自動填入
        if (client) {
            // Age > 65
            if (patient && patient.birthDate) {
                const age = calculateAge(patient.birthDate);
                if (age > 65) {
                    setRadioValue('hasbled-age', '1');
                }
            }

            // Conditions
            getPatientConditions(client as any, ['38341003', '80294001', '19943007', '230690007', '131148009']).then(conditions => {
                if (conditions) {
                    const checkCondition = (codes: string[], targetId: string) => {
                        if (conditions.some((c: any) => c.code?.coding && codes.includes(c.code.coding[0].code))) {
                            setRadioValue(targetId, '1');
                        }
                    };
                    checkCondition(['38341003'], 'hasbled-hypertension');
                    checkCondition(['80294001'], 'hasbled-renal');
                    checkCondition(['19943007'], 'hasbled-liver');
                    checkCondition(['230690007'], 'hasbled-stroke');
                    checkCondition(['131148009'], 'hasbled-bleeding');
                }
            }).catch(e => console.warn(e));

            // SBP > 160
            getMostRecentObservation(client as any, LOINC_CODES.SYSTOLIC_BP).then(sbp => {
                if (sbp?.valueQuantity?.value > 160) {
                    setRadioValue('hasbled-hypertension', '1', sbp, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP > 160');
                }
            }).catch(console.warn);

            // Creatinine > 2.26
            getMostRecentObservation(client as any, LOINC_CODES.CREATININE).then(creatinine => {
                if (creatinine?.valueQuantity) {
                    const val = creatinine.valueQuantity.value;
                    const unit = creatinine.valueQuantity.unit || 'mg/dL';
                    const normalizedVal = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');

                    if (normalizedVal !== null && normalizedVal > 2.26) {
                        setRadioValue('hasbled-renal', '1', creatinine, LOINC_CODES.CREATININE, 'Creatinine > 2.26 mg/dL');
                    }
                }
            }).catch(console.warn);

            // Medications
            getMedicationRequests(client as any, ['1191', '32953', '5640']).then(meds => {
                if (meds && meds.length > 0) {
                    setRadioValue('hasbled-meds', '1');
                }
            }).catch(console.warn);
        }
    }
};
