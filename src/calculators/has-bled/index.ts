/**
 * HAS-BLED Score for Major Bleeding Risk Calculator
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
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description: 'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    infoAlert: 'Select all risk factors that apply. Score automatically calculates.',
    sectionTitle: 'HAS-BLED Risk Factors',
    sectionIcon: '🩸',
    questions: [
        { 
            id: 'hasbled-hypertension', 
            label: '<strong>H</strong>ypertension (Uncontrolled, >160 mmHg systolic)', 
            points: 1,
            conditionCode: '38341003'  // Hypertensive disorder
        },
        { 
            id: 'hasbled-renal', 
            label: 'Abnormal <strong>R</strong>enal function (Dialysis, transplant, Cr >2.26 mg/dL)', 
            points: 1,
            conditionCode: '80294001'  // Chronic kidney disease
        },
        { 
            id: 'hasbled-liver', 
            label: 'Abnormal <strong>L</strong>iver function (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)', 
            points: 1,
            conditionCode: '19943007'  // Cirrhosis
        },
        { 
            id: 'hasbled-stroke', 
            label: '<strong>S</strong>troke history', 
            points: 1,
            conditionCode: '230690007'  // Cerebrovascular accident
        },
        { 
            id: 'hasbled-bleeding', 
            label: '<strong>B</strong>leeding history or predisposition', 
            points: 1,
            conditionCode: '131148009'  // Bleeding
        },
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
    },
    
    // 使用 customInitialize 處理年齡和複雜的 FHIR 邏輯
    customInitialize: async (client, patient, container, calculate) => {
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        
        // 自動填充年齡
        const age = fhirDataService.getPatientAge();
        if (age !== null && age > 65) {
            setRadioValue('hasbled-age', '1');
        }
        
        if (!fhirDataService.isReady()) return;
        
        const stalenessTracker = fhirDataService.getStalenessTracker();
        
        try {
            // SBP > 160
            const sbpResult = await fhirDataService.getObservation(LOINC_CODES.SYSTOLIC_BP, {
                trackStaleness: true,
                stalenessLabel: 'Systolic BP'
            });
            
            if (sbpResult.value !== null && sbpResult.value > 160) {
                setRadioValue('hasbled-hypertension', '1');
                if (stalenessTracker && sbpResult.observation) {
                    stalenessTracker.trackObservation('input[name="hasbled-hypertension"]', sbpResult.observation, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP > 160');
                }
            }
            
            // Creatinine > 2.26 mg/dL
            const crResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                trackStaleness: true,
                stalenessLabel: 'Creatinine'
            });
            
            if (crResult.value !== null) {
                const unit = crResult.unit || 'mg/dL';
                const crMgDl = UnitConverter.convert(crResult.value, unit, 'mg/dL', 'creatinine');
                if (crMgDl !== null && crMgDl > 2.26) {
                    setRadioValue('hasbled-renal', '1');
                    if (stalenessTracker && crResult.observation) {
                        stalenessTracker.trackObservation('input[name="hasbled-renal"]', crResult.observation, LOINC_CODES.CREATININE, 'Creatinine > 2.26');
                    }
                }
            }
            
            // 檢查抗血小板藥物 (Aspirin, Clopidogrel, NSAIDs)
            const hasMeds = await fhirDataService.isOnMedication(['1191', '32953', '5640']);
            if (hasMeds) {
                setRadioValue('hasbled-meds', '1');
            }
        } catch (error) {
            console.warn('Error auto-populating HAS-BLED:', error);
        }
    }
};

export const hasBled = createYesNoCalculator(config);
