/**
 * Revised Cardiac Risk Index (RCRI) for Pre-Operative Risk Calculator
 *
 * 使用 Yes/No Calculator 工廠函數
 * 已整合 FHIRDataService 進行自動填充
 */

import { createYesNoCalculator, YesNoCalculatorConfig } from '../shared/yes-no-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';

const config: YesNoCalculatorConfig = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    description: 'Estimates risk of cardiac complications after noncardiac surgery.',
    sectionTitle: 'RCRI Factors',
    sectionIcon: '❤️',
    questions: [
        {
            id: 'rcri-surgery',
            label: 'High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)',
            points: 1
        },
        {
            id: 'rcri-ihd',
            label: 'History of Ischemic Heart Disease (MI or positive stress test)',
            points: 1
        },
        { id: 'rcri-hf', label: 'History of Congestive Heart Failure', points: 1 },
        { id: 'rcri-cvd', label: 'History of Cerebrovascular Disease (stroke or TIA)', points: 1 },
        { id: 'rcri-insulin', label: 'Preoperative treatment with insulin', points: 1 },
        { id: 'rcri-creatinine', label: 'Preoperative serum creatinine > 2.0 mg/dL', points: 1 }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 0,
            label: 'Class I (Low Risk)',
            severity: 'success',
            description: '0.4% risk of major cardiac complications'
        },
        {
            minScore: 1,
            maxScore: 1,
            label: 'Class II (Low Risk)',
            severity: 'success',
            description: '0.9% risk of major cardiac complications'
        },
        {
            minScore: 2,
            maxScore: 2,
            label: 'Class III (Moderate Risk)',
            severity: 'warning',
            description: '6.6% risk of major cardiac complications'
        },
        {
            minScore: 3,
            maxScore: 999,
            label: 'Class IV (High Risk)',
            severity: 'danger',
            description: '11% risk of major cardiac complications'
        }
    ],
    references: [
        'Lee, T. H., Marcantonio, E. R., Mangione, C. M., Thomas, E. J., Polanczyk, C. A., Cook, E. F., ... & Goldman, L. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.'
    ],
    customResultRenderer: (score: number): string => {
        const riskData: Record<
            number,
            { risk: string; rate: string; level: 'success' | 'warning' | 'danger' }
        > = {
            0: { risk: 'Class I (Low Risk)', rate: '0.4%', level: 'success' },
            1: { risk: 'Class II (Low Risk)', rate: '0.9%', level: 'success' },
            2: { risk: 'Class III (Moderate Risk)', rate: '6.6%', level: 'warning' }
        };

        const data = riskData[score] || {
            risk: 'Class IV (High Risk)',
            rate: '11%',
            level: 'danger' as const
        };
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
    },

    // 使用 customInitialize 處理 FHIR 自動填充
    customInitialize: async (client, patient, container, calculate) => {
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        if (!fhirDataService.isReady()) {
            return;
        }

        const stalenessTracker = fhirDataService.getStalenessTracker();

        try {
            // 自動填入 Creatinine > 2.0 mg/dL
            const crResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                trackStaleness: true,
                stalenessLabel: 'Creatinine'
            });

            if (crResult.value !== null) {
                const unit = crResult.unit || 'mg/dL';
                const crMgDl = UnitConverter.convert(crResult.value, unit, 'mg/dL', 'creatinine');

                if (crMgDl !== null && crMgDl > 2.0) {
                    setRadioValue('rcri-creatinine', '1');
                    if (stalenessTracker && crResult.observation) {
                        stalenessTracker.trackObservation(
                            'input[name="rcri-creatinine"]',
                            crResult.observation,
                            LOINC_CODES.CREATININE,
                            'Serum Creatinine'
                        );
                    }
                }
            }

            // 檢測相關病史
            const conditionsToCheck = [
                { codes: ['22298006', '410429000'], inputName: 'rcri-ihd' }, // IHD, MI
                { codes: ['84114007', '42343007'], inputName: 'rcri-hf' }, // Heart failure
                { codes: ['230690007', '266257000'], inputName: 'rcri-cvd' } // Stroke, TIA
            ];

            for (const condition of conditionsToCheck) {
                const hasCondition = await fhirDataService.hasCondition(condition.codes);
                if (hasCondition) {
                    setRadioValue(condition.inputName, '1');
                }
            }

            // 檢測胰島素使用
            const onInsulin = await fhirDataService.isOnMedication(['274783']); // Insulin RxNorm
            if (onInsulin) {
                setRadioValue('rcri-insulin', '1');
            }
        } catch (error) {
            console.warn('Error auto-populating RCRI:', error);
        }
    }
};

// 創建基礎計算器
const baseCalculator = createYesNoCalculator(config);

// 導出帶有參考圖片的計算器
export const rcri = {
    ...baseCalculator,

    generateHTML(): string {
        const html = baseCalculator.generateHTML();

        const referenceSection = `
            <div class="info-section mt-20">
                <h4>Reference</h4>
                <p>Lee, T. H., et al. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.</p>
                <img src="js/calculators/rcri/Lees-Revised-Cardiac-Risk-Index-RCRI_W640.jpg" alt="RCRI Risk Stratification Table" class="img-reference" />
            </div>
        `;

        return html + referenceSection;
    }
};
