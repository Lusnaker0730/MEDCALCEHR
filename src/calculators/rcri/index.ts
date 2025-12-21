/**
 * Revised Cardiac Risk Index (RCRI) for Pre-Operative Risk Calculator
 * 
 * 使用 Yes/No Calculator 工廠函數遷移
 * Estimates risk of cardiac complications after noncardiac surgery.
 */

import { createYesNoCalculator, YesNoCalculatorConfig } from '../shared/yes-no-calculator.js';
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';

const config: YesNoCalculatorConfig = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    description: 'Estimates risk of cardiac complications after noncardiac surgery.',
    sectionTitle: 'RCRI Factors',
    sectionIcon: '❤️',
    questions: [
        { id: 'rcri-surgery', label: 'High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)', points: 1 },
        { id: 'rcri-ihd', label: 'History of Ischemic Heart Disease (MI or positive stress test)', points: 1 },
        { id: 'rcri-hf', label: 'History of Congestive Heart Failure', points: 1 },
        { id: 'rcri-cvd', label: 'History of Cerebrovascular Disease (stroke or TIA)', points: 1 },
        { id: 'rcri-insulin', label: 'Preoperative treatment with insulin', points: 1 },
        { id: 'rcri-creatinine', label: 'Preoperative serum creatinine > 2.0 mg/dL', points: 1 }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'Class I (Low Risk)', severity: 'success', description: '0.4% risk of major cardiac complications' },
        { minScore: 1, maxScore: 1, label: 'Class II (Low Risk)', severity: 'success', description: '0.9% risk of major cardiac complications' },
        { minScore: 2, maxScore: 2, label: 'Class III (Moderate Risk)', severity: 'warning', description: '6.6% risk of major cardiac complications' },
        { minScore: 3, maxScore: 999, label: 'Class IV (High Risk)', severity: 'danger', description: '11% risk of major cardiac complications' }
    ],
    references: [
        'Lee, T. H., Marcantonio, E. R., Mangione, C. M., Thomas, E. J., Polanczyk, C. A., Cook, E. F., ... & Goldman, L. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.'
    ],
    customResultRenderer: (score: number): string => {
        const riskData: Record<number, { risk: string; rate: string; level: 'success' | 'warning' | 'danger' }> = {
            0: { risk: 'Class I (Low Risk)', rate: '0.4%', level: 'success' },
            1: { risk: 'Class II (Low Risk)', rate: '0.9%', level: 'success' },
            2: { risk: 'Class III (Moderate Risk)', rate: '6.6%', level: 'warning' }
        };
        
        const data = riskData[score] || { risk: 'Class IV (High Risk)', rate: '11%', level: 'danger' as const };
        const alertClass = `ui-alert-${data.level}`;
        
        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: '/ 6 points',
                interpretation: data.risk,
                alertClass: alertClass
            })}
            
            <div class="ui-alert ${alertClass} mt-10">
                <span class="ui-alert-icon">📊</span>
                <div class="ui-alert-content">
                    Major Cardiac Complications Rate: <strong>${data.rate}</strong>
                </div>
            </div>
        `;
    }
};

// 創建基礎計算器
const baseCalculator = createYesNoCalculator(config);

// 導出帶有 FHIR 自動填入的計算器
export const rcri = {
    ...baseCalculator,
    
    // 添加參考圖片
    generateHTML(): string {
        let html = baseCalculator.generateHTML();
        
        const referenceSection = `
            <div class="info-section mt-20">
                <h4>Reference</h4>
                <p>Lee, T. H., et al. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.</p>
                <img src="js/calculators/rcri/Lees-Revised-Cardiac-Risk-Index-RCRI_W640.jpg" alt="RCRI Risk Stratification Table" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
        `;
        
        return html + referenceSection;
    },
    
    initialize(client: unknown, patient: unknown, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);
        
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        
        const setRadioValue = (name: string, value: string, obs?: any, loinc?: string, label?: string): void => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
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
            
            const resultBox = document.getElementById('rcri-result');
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
        
        // FHIR 自動填入 Creatinine
        if (client) {
            getMostRecentObservation(client as any, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    const crValue = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    if (crValue !== undefined && crValue !== null) {
                        const convertedValue = UnitConverter.convert(crValue, unit, 'mg/dL', 'creatinine');

                        if (convertedValue !== null && convertedValue > 2.0) {
                            setRadioValue('rcri-creatinine', '1', obs, LOINC_CODES.CREATININE, 'Serum Creatinine');
                        }
                    }
                }
            }).catch(e => console.warn(e));
        }
        
        // 初始計算
        calculate();
    }
};
