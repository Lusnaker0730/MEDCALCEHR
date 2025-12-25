/**
 * 範例：使用基類創建評分計算器
 * 
 * 這個範例展示了使用基類後，代碼變得多麼簡潔
 * 
 * 【改進前】每個計算器需要 150-250 行代碼
 * 【改進後】只需要 50-80 行代碼，專注於業務邏輯
 */

import { ScoreCalculator } from './base-calculator.js';
import { uiBuilder } from '../../ui-builder.js';
import type { CalculatorInput, ScoreResult } from '../../types/calculator.js';

/**
 * 範例：簡化版的 2HELPS2B 計算器
 * 
 * 使用基類後，開發者只需要關注：
 * 1. 定義輸入欄位
 * 2. 定義計算邏輯
 * 3. 定義結果解讀
 */
export class Helps2BCalculator extends ScoreCalculator {
    // 評分對應表
    private readonly riskTable = [
        { score: 0, risk: '< 5%', category: 'Very Low', severity: 'success' as const },
        { score: 1, risk: '12%', category: 'Low', severity: 'success' as const },
        { score: 2, risk: '27%', category: 'Moderate', severity: 'warning' as const },
        { score: 3, risk: '50%', category: 'Moderate-High', severity: 'warning' as const },
        { score: 4, risk: '73%', category: 'High', severity: 'danger' as const },
        { score: 5, risk: '88%', category: 'Very High', severity: 'danger' as const },
        { score: 6, risk: '> 95%', category: 'Extremely High', severity: 'danger' as const },
    ];

    constructor() {
        super({
            id: '2helps2b',
            title: '2HELPS2B Score',
            description: 'Estimates seizure risk in acutely ill patients undergoing continuous EEG',
            category: 'Neurology'
        });
    }

    /**
     * 定義輸入欄位 - 只需要列出選項
     */
    getInputConfig(): CalculatorInput[] {
        return [
            { id: 'freq-gt-2hz', label: 'Frequency > 2Hz (+1)', type: 'checkbox', options: [{ value: 1, label: '' }] },
            { id: 'sporadic-epileptiform', label: 'Sporadic epileptiform discharges (+1)', type: 'checkbox', options: [{ value: 1, label: '' }] },
            { id: 'lpd-bipd-lrda', label: 'LPD / BIPD / LRDA (+1)', type: 'checkbox', options: [{ value: 1, label: '' }] },
            { id: 'plus-features', label: 'Plus features (+1)', type: 'checkbox', options: [{ value: 1, label: '' }] },
            { id: 'prior-seizure', label: 'Prior seizure (+1)', type: 'checkbox', options: [{ value: 1, label: '' }] },
            { id: 'birds', label: 'Brief ictal rhythmic discharges (BIRDs) (+2)', type: 'checkbox', options: [{ value: 2, label: '' }] },
        ];
    }

    /**
     * 生成 HTML - 使用 uiBuilder 組件
     */
    generateHTML(): string {
        const checkboxes = this.getInputConfig()
            .map(input => uiBuilder.createCheckbox({
                id: input.id,
                label: input.label,
                value: input.options?.[0]?.value?.toString() || '1'
            }))
            .join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: '<strong>📋 EEG Risk Factors</strong><br>Select all that apply from the continuous EEG (cEEG) findings:'
            })}
            
            ${uiBuilder.createSection({
                title: 'EEG Findings',
                icon: '🧠',
                content: checkboxes
            })}
            
            ${uiBuilder.createResultBox({ id: `${this.id}-result`, title: '2HELPS2B Score Results' })}
        `;
    }

    /**
     * 解讀結果 - 根據分數返回風險等級
     */
    interpretResult(result: { score: number; value: number }): { severity: 'success' | 'warning' | 'danger' | 'info'; message: string } {
        const score = Math.min(result.score, 6);
        const riskData = this.riskTable.find(r => r.score === score) || this.riskTable[6];
        
        return {
            severity: riskData.severity,
            message: `${riskData.category} - Seizure Risk: ${riskData.risk}`
        };
    }

    /**
     * 自定義結果渲染
     */
    protected renderResult(
        result: { score: number; value: number },
        interpretation: { severity: string; message: string }
    ): string {
        const score = Math.min(result.score, 6);
        const riskData = this.riskTable.find(r => r.score === score) || this.riskTable[6];

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: result.score.toString(),
                unit: 'points',
                interpretation: riskData.category,
                alertClass: `ui-alert-${interpretation.severity}`
            })}
            ${uiBuilder.createResultItem({
                label: 'Risk of Seizure',
                value: riskData.risk,
                alertClass: `ui-alert-${interpretation.severity}`
            })}
        `;
    }
}

// 導出實例（保持向後兼容）
export const helps2bScore = new Helps2BCalculator();

