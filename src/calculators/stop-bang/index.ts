/**
 * STOP-BANG Score for Obstructive Sleep Apnea
 *
 * 使用 Score Calculator 工廠函數
 * 已整合 FHIRDataService 進行自動填充
 */

import { createScoreCalculator, ScoreCalculatorConfig } from '../shared/score-calculator.js';
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { uiBuilder } from '../../ui-builder.js';

const config: ScoreCalculatorConfig = {
    id: 'stop-bang',
    title: 'STOP-BANG Score for Obstructive Sleep Apnea',
    description: 'Screens for obstructive sleep apnea using validated clinical criteria.',
    infoAlert: 'Check all conditions that apply to the patient.',
    sections: [
        {
            title: 'STOP-BANG Criteria',
            icon: '😴',
            options: [
                {
                    id: 'sb-snoring',
                    label: 'Snoring - Do you snore loudly?',
                    value: 1,
                    description:
                        'Louder than talking or loud enough to be heard through closed doors'
                },
                {
                    id: 'sb-tired',
                    label: 'Tired - Do you often feel tired, fatigued, or sleepy during daytime?',
                    value: 1
                },
                {
                    id: 'sb-observed',
                    label: 'Observed - Has anyone observed you stop breathing during your sleep?',
                    value: 1
                },
                {
                    id: 'sb-pressure',
                    label: 'Pressure - Do you have or are you being treated for high blood pressure?',
                    value: 1,
                    // SNOMED code for hypertension
                    conditionCode: '38341003'
                },
                { id: 'sb-bmi', label: 'BMI more than 35 kg/m²', value: 1 },
                { id: 'sb-age', label: 'Age over 50 years old', value: 1 },
                { id: 'sb-neck', label: 'Neck circumference greater than 40 cm', value: 1 },
                { id: 'sb-gender', label: 'Male gender', value: 1 }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 2,
            risk: 'Low probability of moderate to severe OSA',
            category: 'Low Risk',
            severity: 'success'
        },
        {
            minScore: 3,
            maxScore: 4,
            risk: 'Intermediate probability of moderate to severe OSA',
            category: 'Intermediate Risk',
            severity: 'warning',
            recommendation: 'Consider polysomnography or home sleep apnea testing.'
        },
        {
            minScore: 5,
            maxScore: 8,
            risk: 'High probability of moderate to severe OSA',
            category: 'High Risk',
            severity: 'danger',
            recommendation: 'Strongly consider polysomnography. May benefit from CPAP therapy.'
        }
    ],
    formulaItems: [
        {
            title: 'Risk Categories',
            content: `
                <ul class="info-list">
                    <li><strong>Low Risk (0-2):</strong> Low probability of moderate to severe OSA</li>
                    <li><strong>Intermediate Risk (3-4):</strong> Intermediate probability of moderate to severe OSA</li>
                    <li><strong>High Risk (5-8):</strong> High probability of moderate to severe OSA</li>
                </ul>
            `
        }
    ],
    references: [
        'Chung F, et al. STOP questionnaire: a tool to screen patients for obstructive sleep apnea. <em>Anesthesiology</em>. 2008;108(5):812-821.',
        'Chung F, et al. High STOP-Bang score indicates a high probability of obstructive sleep apnoea. <em>Br J Anaesth</em>. 2012;108(5):768-775.'
    ],

    // 使用 customInitialize 進行 FHIR 自動填充
    customInitialize: async (client, patient, container, calculate) => {
        const setCheckbox = (id: string, checked: boolean) => {
            const checkbox = container.querySelector(`#${id}`) as HTMLInputElement;
            if (checkbox && !checkbox.checked && checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // 使用 FHIRDataService 獲取年齡
        const age = fhirDataService.getPatientAge();
        if (age !== null && age > 50) {
            setCheckbox('sb-age', true);
        }

        // 使用 FHIRDataService 獲取性別
        const gender = fhirDataService.getPatientGender();
        if (gender === 'male') {
            setCheckbox('sb-gender', true);
        }

        if (!fhirDataService.isReady()) {
            return;
        }

        const stalenessTracker = fhirDataService.getStalenessTracker();

        try {
            // 獲取 BMI
            const bmiResult = await fhirDataService.getObservation(LOINC_CODES.BMI, {
                trackStaleness: true,
                stalenessLabel: 'BMI'
            });

            if (bmiResult.value !== null && bmiResult.value > 35) {
                setCheckbox('sb-bmi', true);
                if (stalenessTracker && bmiResult.observation) {
                    stalenessTracker.trackObservation(
                        '#sb-bmi',
                        bmiResult.observation,
                        LOINC_CODES.BMI,
                        'BMI'
                    );
                }
            }

            // 獲取高血壓病史
            const hasHypertension = await fhirDataService.hasCondition(['38341003']);
            if (hasHypertension) {
                setCheckbox('sb-pressure', true);
            }
        } catch (error) {
            console.warn('Error auto-populating STOP-BANG:', error);
        }
    }
};

export const stopBang = createScoreCalculator(config);
