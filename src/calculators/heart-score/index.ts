/**
 * HEART Score for Major Cardiac Events Calculator
 * 
 * 使用 Radio Score Calculator 工廠函數遷移
 * Predicts 6-week risk of major adverse cardiac events in patients with chest pain.
 */

import { createRadioScoreCalculator, RadioScoreCalculatorConfig } from '../shared/radio-score-calculator.js';
import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';

const config: RadioScoreCalculatorConfig = {
    id: 'heart-score',
    title: 'HEART Score for Major Cardiac Events',
    description: 'Predicts 6-week risk of major adverse cardiac events in patients with chest pain.',
    infoAlert: '<strong>Inclusion Criteria:</strong> Patients ≥21 years old with symptoms suggestive of ACS. <strong>Do not use if:</strong> new ST-elevation ≥1 mm, hypotension, life expectancy <1 year, or noncardiac illness requiring admission.',
    sections: [
        {
            id: 'heart-history',
            title: 'History',
            icon: '📋',
            options: [
                { value: '0', label: 'Slightly suspicious (low risk features)', checked: true },
                { value: '1', label: 'Moderately suspicious (mixture)' },
                { value: '2', label: 'Highly suspicious (classic angina)' }
            ]
        },
        {
            id: 'heart-ecg',
            title: 'EKG',
            icon: '📊',
            options: [
                { value: '0', label: 'Normal', checked: true },
                { value: '1', label: 'Non-specific repolarization disturbance' },
                { value: '2', label: 'Significant ST deviation' }
            ]
        },
        {
            id: 'heart-age',
            title: 'Age',
            icon: '👤',
            options: [
                { value: '0', label: '< 45 years', checked: true },
                { value: '1', label: '45-64 years' },
                { value: '2', label: '≥ 65 years' }
            ]
        },
        {
            id: 'heart-risk',
            title: 'Risk Factors',
            icon: '⚡',
            subtitle: 'HTN, hyperlipidemia, DM, obesity (BMI>30), smoking, family history, atherosclerotic disease',
            options: [
                { value: '0', label: 'No known risk factors', checked: true },
                { value: '1', label: '1-2 risk factors' },
                { value: '2', label: '≥3 risk factors or history of atherosclerotic disease' }
            ]
        },
        {
            id: 'heart-troponin',
            title: 'Initial Troponin',
            icon: '🔬',
            subtitle: 'Use local assay cutoffs',
            options: [
                { value: '0', label: '≤ normal limit', checked: true },
                { value: '1', label: '1-3× normal limit' },
                { value: '2', label: '> 3× normal limit' }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 3, label: 'Low Risk (0-3)', severity: 'success', description: '0.9-1.7% MACE risk. Supports early discharge.' },
        { minScore: 4, maxScore: 6, label: 'Moderate Risk (4-6)', severity: 'warning', description: '12-16.6% MACE risk. Admit for clinical observation and further testing.' },
        { minScore: 7, maxScore: 10, label: 'High Risk (7-10)', severity: 'danger', description: '50-65% MACE risk. Candidate for early invasive measures.' }
    ],
    customResultRenderer: (score: number, sectionScores: Record<string, number>): string => {
        let riskCategory = '';
        let maceRate = '';
        let recommendation = '';
        let alertClass: 'success' | 'warning' | 'danger' = 'success';

        if (score <= 3) {
            riskCategory = 'Low Risk (0-3)';
            maceRate = '0.9-1.7%';
            recommendation = 'Supports early discharge.';
            alertClass = 'success';
        } else if (score <= 6) {
            riskCategory = 'Moderate Risk (4-6)';
            maceRate = '12-16.6%';
            recommendation = 'Admit for clinical observation and further testing.';
            alertClass = 'warning';
        } else {
            riskCategory = 'High Risk (7-10)';
            maceRate = '50-65%';
            recommendation = 'Candidate for early invasive measures.';
            alertClass = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total HEART Score',
                value: score.toString(),
                unit: '/ 10 points',
                interpretation: riskCategory,
                alertClass: `ui-alert-${alertClass}`
            })}
            ${uiBuilder.createResultItem({
                label: 'Risk of Major Adverse Cardiac Event (6-week)',
                value: maceRate,
                alertClass: `ui-alert-${alertClass}`
            })}
            
            <div class="ui-alert ui-alert-${alertClass} mt-10">
                <span class="ui-alert-icon">💡</span>
                <div class="ui-alert-content">
                    <strong>Recommendation:</strong> ${recommendation}
                </div>
            </div>
        `;
    }
};

// 創建基礎計算器
const baseCalculator = createRadioScoreCalculator(config);

// 導出帶有年齡自動填入的計算器
export const heartScore = {
    ...baseCalculator,
    
    initialize(client: unknown, patient: any, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);
        
        const setRadioValue = (name: string, value: string): void => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        
        // 計算函數
        const calculate = (): void => {
            let totalScore = 0;
            const sectionScores: Record<string, number> = {};
            
            config.sections.forEach(section => {
                const radio = container.querySelector(`input[name="${section.id}"]:checked`) as HTMLInputElement | null;
                if (radio) {
                    const value = parseInt(radio.value) || 0;
                    sectionScores[section.id] = value;
                    totalScore += value;
                }
            });
            
            const resultBox = document.getElementById('heart-score-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent && config.customResultRenderer) {
                    resultContent.innerHTML = config.customResultRenderer(totalScore, sectionScores);
                }
                resultBox.classList.add('show');
            }
        };
        
        // 綁定事件
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        
        // FHIR 自動填入年齡
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age < 45) {
                setRadioValue('heart-age', '0');
            } else if (age <= 64) {
                setRadioValue('heart-age', '1');
            } else {
                setRadioValue('heart-age', '2');
            }
        }
        
        // 初始計算
        calculate();
    }
};
