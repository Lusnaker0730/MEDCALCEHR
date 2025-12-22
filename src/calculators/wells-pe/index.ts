/**
 * Wells' Criteria for Pulmonary Embolism Calculator
 * 
 * 使用 Yes/No Calculator 工廠函數
 * 已整合 FHIRDataService 進行自動填充
 */

import { createYesNoCalculator, YesNoCalculatorConfig } from '../shared/yes-no-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { uiBuilder } from '../../ui-builder.js';

const config: YesNoCalculatorConfig = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    description: 'Estimates pre-test probability of pulmonary embolism (PE) to guide diagnostic workup.',
    infoAlert: 'Check all criteria that apply to the patient. Score interpretation helps guide D-dimer testing and CT angiography decisions.',
    sectionTitle: 'Clinical Criteria',
    sectionIcon: '🫁',
    questions: [
        { id: 'wells-dvt', label: 'Clinical signs and symptoms of DVT', points: 3 },
        { id: 'wells-alt', label: 'PE is #1 diagnosis OR equally likely', points: 3 },
        { id: 'wells-hr', label: 'Heart rate > 100 bpm', points: 1.5 },
        { id: 'wells-immo', label: 'Immobilization (at least 3 days) or surgery in previous 4 weeks', points: 1.5 },
        { id: 'wells-prev', label: 'Previous, objectively diagnosed PE or DVT', points: 1.5 },
        { id: 'wells-hemo', label: 'Hemoptysis', points: 1 },
        { id: 'wells-mal', label: 'Malignancy (with treatment within 6 months, or palliative)', points: 1 }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 1,
            label: 'Low Risk',
            severity: 'success',
            recommendation: 'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.'
        },
        {
            minScore: 1.5,
            maxScore: 4,
            label: 'Low-Moderate Risk',
            severity: 'warning',
            recommendation: 'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.'
        },
        {
            minScore: 4.5,
            maxScore: 6,
            label: 'Moderate-High Risk',
            severity: 'danger',
            recommendation: 'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.'
        },
        {
            minScore: 6.5,
            maxScore: 999,
            label: 'High Risk',
            severity: 'danger',
            recommendation: 'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.'
        }
    ],
    references: [
        'Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. <em>Thromb Haemost</em>. 2000;83(3):416-420.'
    ],
    customResultRenderer: (score: number): string => {
        let risk = '';
        let twoTierModel = '';
        let alertClass: 'success' | 'warning' | 'danger' = 'success';
        let interpretation = '';
        
        if (score <= 1) {
            risk = 'Low Risk';
            alertClass = 'success';
            interpretation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.';
            twoTierModel = 'PE Unlikely (Score < 2)';
        } else if (score <= 4) {
            risk = 'Low-Moderate Risk';
            alertClass = 'warning';
            interpretation = 'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.';
            twoTierModel = 'PE Unlikely (Score ≤ 4)';
        } else if (score <= 6) {
            risk = 'Moderate-High Risk';
            alertClass = 'danger';
            interpretation = 'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.';
            twoTierModel = 'PE Likely (Score > 4)';
        } else {
            risk = 'High Risk';
            alertClass = 'danger';
            interpretation = 'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.';
            twoTierModel = 'PE Likely (Score > 4)';
        }
        
        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: 'points',
                interpretation: risk,
                alertClass: `ui-alert-${alertClass}`
            })}
            
            <div class="result-item mt-15 p-10">
                <span class="result-item-label font-semibold text-muted">Two-Tier Model:</span>
                <span class="result-item-value font-bold">${twoTierModel}</span>
            </div>
            
            <div class="ui-alert ui-alert-${alertClass} mt-20">
                <span class="ui-alert-icon">${alertClass === 'danger' ? '⚠️' : 'ℹ️'}</span>
                <div class="ui-alert-content">
                    <p>${interpretation}</p>
                </div>
            </div>
        `;
    },
    
    // 使用 customInitialize 處理 FHIR 自動填充
    customInitialize: async (client, patient, container, calculate) => {
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        
        if (!fhirDataService.isReady()) return;
        
        const stalenessTracker = fhirDataService.getStalenessTracker();
        
        try {
            // 自動填入心率 > 100 bpm
            const hrResult = await fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Heart Rate'
            });
            
            if (hrResult.value !== null && hrResult.value > 100) {
                setRadioValue('wells-hr', '1.5');
                if (stalenessTracker && hrResult.observation) {
                    stalenessTracker.trackObservation('input[name="wells-hr"]', hrResult.observation, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }
            
            // 檢測 DVT/PE 病史
            const hasDVTPE = await fhirDataService.hasCondition(['128053003', '59282003']);  // DVT, PE
            if (hasDVTPE) {
                setRadioValue('wells-prev', '1.5');
            }
            
            // 檢測惡性腫瘤
            const hasMalignancy = await fhirDataService.hasCondition(['363346000', '86049000']);
            if (hasMalignancy) {
                setRadioValue('wells-mal', '1');
            }
        } catch (error) {
            console.warn('Error auto-populating Wells PE:', error);
        }
    }
};

export const wellsPE = createYesNoCalculator(config);
