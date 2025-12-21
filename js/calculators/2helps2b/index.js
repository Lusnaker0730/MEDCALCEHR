/**
 * 2HELPS2B Score for Seizure Risk
 *
 * 使用新的工廠函數重構
 * 代碼從 183 行減少到約 80 行，更易維護
 *
 * 參考文獻：
 * Struck, A. F., et al. (2017). Association of an Electroencephalography-Based
 * Risk Score With Seizure Probability in Hospitalized Patients.
 * JAMA Neurology, 74(12), 1419–1424.
 */
import { createScoreCalculator } from '../shared/score-calculator.js';
export const helps2bScore = createScoreCalculator({
    id: '2helps2b',
    title: '2HELPS2B Score',
    description: 'Estimates seizure risk in acutely ill patients undergoing continuous EEG (cEEG), based on the 2HELPS2B score and seizure probability table.',
    // 提示訊息
    infoAlert: '<strong>📋 EEG Risk Factors</strong><br>Select all that apply from the continuous EEG (cEEG) findings:',
    // 評分區塊
    sections: [
        {
            title: 'EEG Findings',
            icon: '🧠',
            options: [
                { id: 'freq-gt-2hz', label: 'Frequency > 2Hz (+1)', value: 1 },
                { id: 'sporadic-epileptiform', label: 'Sporadic epileptiform discharges (+1)', value: 1 },
                { id: 'lpd-bipd-lrda', label: 'LPD / BIPD / LRDA (+1)', value: 1 },
                { id: 'plus-features', label: 'Plus features (+1)', value: 1 },
                { id: 'prior-seizure', label: 'Prior seizure (+1)', value: 1 },
                { id: 'birds', label: 'Brief ictal rhythmic discharges (BIRDs) (+2)', value: 2 }
            ]
        }
    ],
    // 風險等級對應表
    riskLevels: [
        { minScore: 0, maxScore: 0, risk: '< 5%', category: 'Very Low', severity: 'success' },
        { minScore: 1, maxScore: 1, risk: '12%', category: 'Low', severity: 'success' },
        { minScore: 2, maxScore: 2, risk: '27%', category: 'Moderate', severity: 'warning' },
        { minScore: 3, maxScore: 3, risk: '50%', category: 'Moderate-High', severity: 'warning' },
        { minScore: 4, maxScore: 4, risk: '73%', category: 'High', severity: 'danger' },
        { minScore: 5, maxScore: 5, risk: '88%', category: 'Very High', severity: 'danger' },
        { minScore: 6, maxScore: 999, risk: '> 95%', category: 'Extremely High', severity: 'danger' }
    ],
    // 公式說明
    formulaItems: [
        {
            title: 'Scoring Criteria',
            formulas: [
                'Frequency > 2 Hz: +1 point',
                'Sporadic epileptiform discharges: +1 point',
                'LPD (Lateralized Periodic Discharges) / BIPD / LRDA: +1 point',
                'Plus features (superimposed fast activity or rhythmic delta): +1 point',
                'Prior seizure (before cEEG monitoring): +1 point',
                'BIRDs (Brief Ictal Rhythmic Discharges): +2 points'
            ]
        },
        {
            title: 'Seizure Probability by Score',
            content: `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <thead>
                            <tr style="background: rgba(102, 126, 234, 0.1);">
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Score</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Seizure Risk</th>
                                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Risk Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">< 5%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Very Low</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">1</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">12%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Low</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">2</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">27%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Moderate</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">3</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">50%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Moderate-High</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">4</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">73%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">High</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">5</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">88%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Very High</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">≥6</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">> 95%</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Extremely High</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        }
    ],
    // 參考文獻
    references: [
        'Struck, A. F., et al. (2017). Association of an Electroencephalography-Based Risk Score With Seizure Probability in Hospitalized Patients. <em>JAMA Neurology</em>, 74(12), 1419–1424.'
    ]
});
