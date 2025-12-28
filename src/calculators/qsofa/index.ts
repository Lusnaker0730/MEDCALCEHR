/**
 * qSOFA Score for Sepsis
 *
 * 使用 Checkbox 工廠函數
 * 已整合 FHIRDataService 進行自動填充
 */

import { createScoreCalculator } from '../shared/score-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const qsofaScore = createScoreCalculator({
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description:
        'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥ 2 is positive.',

    infoAlert:
        'Check all criteria that apply. A score ≥ 2 suggests higher risk of mortality or prolonged ICU stay.',

    sections: [
        {
            title: 'qSOFA Criteria',
            icon: '📋',
            options: [
                { id: 'qsofa-rr', label: 'Respiratory Rate ≥ 22/min (+1)', value: 1 },
                { id: 'qsofa-ams', label: 'Altered Mental Status (GCS < 15) (+1)', value: 1 },
                { id: 'qsofa-sbp', label: 'Systolic Blood Pressure ≤ 100 mmHg (+1)', value: 1 }
            ]
        }
    ],

    riskLevels: [
        {
            minScore: 0,
            maxScore: 0,
            risk: 'Negative Screen',
            category: 'Lower Risk',
            severity: 'success',
            recommendation: 'Lower risk, but continue to monitor if infection is suspected.'
        },
        {
            minScore: 1,
            maxScore: 1,
            risk: 'Intermediate',
            category: 'Monitor Closely',
            severity: 'warning',
            recommendation:
                'Monitor closely. Consider early intervention if clinical suspicion is high.'
        },
        {
            minScore: 2,
            maxScore: 3,
            risk: 'Positive Screen',
            category: 'High Risk',
            severity: 'danger',
            recommendation:
                'Increased risk of poor outcomes. Consider further sepsis evaluation (SOFA score, lactate, blood cultures).'
        }
    ],

    formulaItems: [
        {
            title: 'Interpretation',
            content: `
                <ul class="info-list">
                    <li><strong>Score ≥ 2:</strong> Positive screen; higher risk of poor outcomes.</li>
                    <li><strong>Score < 2:</strong> Negative screen; lower risk but continue monitoring.</li>
                </ul>
            `
        },
        {
            title: 'Next Steps for Positive qSOFA',
            content: `
                <ul class="info-list">
                    <li>Calculate full SOFA score</li>
                    <li>Measure serum lactate</li>
                    <li>Obtain blood cultures</li>
                    <li>Consider early antibiotic therapy</li>
                    <li>Assess for organ dysfunction</li>
                </ul>
            `
        }
    ],

    // 使用 customInitialize 進行 FHIR 自動填充
    customInitialize: async (client, patient, container, calculate) => {
        if (!fhirDataService.isReady()) {
            return;
        }

        const stalenessTracker = fhirDataService.getStalenessTracker();

        const setCheckbox = (id: string, checked: boolean) => {
            const box = container.querySelector(`#${id}`) as HTMLInputElement;
            if (box) {
                box.checked = checked;
                box.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        try {
            // 獲取呼吸速率
            const rrResult = await fhirDataService.getObservation(LOINC_CODES.RESPIRATORY_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Respiratory Rate'
            });

            if (rrResult.value !== null && rrResult.value >= 22) {
                setCheckbox('qsofa-rr', true);
                if (stalenessTracker && rrResult.observation) {
                    stalenessTracker.trackObservation(
                        '#qsofa-rr',
                        rrResult.observation,
                        LOINC_CODES.RESPIRATORY_RATE,
                        'Respiratory Rate'
                    );
                }
            }

            // 獲取血壓（使用 blood pressure panel）
            const bpResult = await fhirDataService.getBloodPressure({
                trackStaleness: true
            });

            if (bpResult.systolic !== null && bpResult.systolic <= 100) {
                setCheckbox('qsofa-sbp', true);
            }
        } catch (error) {
            console.warn('Error auto-populating qSOFA:', error);
        }
    }
});
