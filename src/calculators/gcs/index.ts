/**
 * Glasgow Coma Scale (GCS)
 *
 * 使用 Radio Group 工廠函數重構
 * 代碼從 172 行減少到約 80 行
 */

import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

export const gcs = createRadioScoreCalculator({
    id: 'gcs',
    title: 'Glasgow Coma Scale (GCS)',
    description: 'Coma severity based on Eye (4), Verbal (5), and Motor (6) criteria.',

    sections: [
        {
            id: 'eye',
            title: 'Eye Opening Response',
            icon: '👁️',
            options: [
                {
                    value: '4',
                    label: 'Spontaneous - open with blinking at baseline (4)',
                    checked: true
                },
                { value: '3', label: 'To verbal stimuli, command, speech (3)' },
                { value: '2', label: 'To pain only (not applied to face) (2)' },
                { value: '1', label: 'No response (1)' }
            ]
        },
        {
            id: 'verbal',
            title: 'Verbal Response',
            icon: '💬',
            options: [
                { value: '5', label: 'Oriented (5)', checked: true },
                { value: '4', label: 'Confused speech, but able to answer questions (4)' },
                { value: '3', label: 'Inappropriate words (3)' },
                { value: '2', label: 'Incomprehensible speech (2)' },
                { value: '1', label: 'No response (1)' }
            ]
        },
        {
            id: 'motor',
            title: 'Motor Response',
            icon: '💪',
            options: [
                { value: '6', label: 'Obeys commands for movement (6)', checked: true },
                { value: '5', label: 'Purposeful movement to painful stimulus (5)' },
                { value: '4', label: 'Withdraws from pain (4)' },
                { value: '3', label: 'Abnormal (spastic) flexion, decorticate posture (3)' },
                { value: '2', label: 'Extensor (rigid) response, decerebrate posture (2)' },
                { value: '1', label: 'No response (1)' }
            ]
        }
    ],

    riskLevels: [
        { minScore: 13, maxScore: 15, label: 'Mild Brain Injury', severity: 'success' },
        { minScore: 9, maxScore: 12, label: 'Moderate Brain Injury', severity: 'warning' },
        { minScore: 3, maxScore: 8, label: 'Severe Brain Injury (Coma)', severity: 'danger' }
    ],

    interpretationInfo: `
        <h4>📊 Interpretation</h4>
        <ul class="info-list">
            <li><strong>13-15:</strong> Mild Brain Injury</li>
            <li><strong>9-12:</strong> Moderate Brain Injury</li>
            <li><strong>3-8:</strong> Severe Brain Injury (Coma)</li>
        </ul>
    `,

    // 自定義結果渲染器，顯示各組件分數
    customResultRenderer: (score, sectionScores) => `
        ${uiBuilder.createResultItem({
            label: 'Total GCS Score',
            value: score.toString(),
            unit: 'points',
            interpretation:
                score >= 13
                    ? 'Mild Brain Injury'
                    : score >= 9
                      ? 'Moderate Brain Injury'
                      : 'Severe Brain Injury (Coma)',
            alertClass:
                score >= 13
                    ? 'ui-alert-success'
                    : score >= 9
                      ? 'ui-alert-warning'
                      : 'ui-alert-danger'
        })}
        <div class="mt-15 text-center font-semibold text-muted">
            Component Breakdown: E${sectionScores['eye'] || 0} V${sectionScores['verbal'] || 0} M${sectionScores['motor'] || 0}
        </div>
    `
});
