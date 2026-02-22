/**
 * GAD-7 (General Anxiety Disorder-7)
 *
 * 使用 Radio Group 工廠函數重構
 */

import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

// GAD-7 問題列表
const questions = [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid as if something awful might happen'
];

// 共用選項
const frequencyOptions = [
    { value: '0', label: 'Not at all (+0)', checked: true },
    { value: '1', label: 'Several days (+1)' },
    { value: '2', label: 'More than half the days (+2)' },
    { value: '3', label: 'Nearly every day (+3)' }
];

export const gad7Config: ScoringCalculatorConfig = {
    id: 'gad-7',
    title: 'GAD-7 (General Anxiety Disorder-7)',
    description: 'Screens for generalized anxiety disorder and monitors treatment response.',

    infoAlert:
        '<strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by the following problems?',

    // 動態生成 7 個問題區塊
    sections: [
        ...questions.map((q, i) => ({
            id: `gad7-q${i}`,
            title: `${i + 1}. ${q}`,
            options: frequencyOptions.map(opt => ({ ...opt }))
        })),
        {
            id: 'gad7-q7', // The 8th question (0-indexed)
            title: '8. If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
            subtitle: 'Optional, not included in final score but may help assess global impairment',
            options: [
                { value: '0', label: 'Not difficult at all', checked: true },
                { value: '0', label: 'Somewhat difficult' },
                { value: '0', label: 'Very difficult' },
                { value: '0', label: 'Extremely difficult' }
            ]
        }
    ],

    formulaSection: {
        show: true,
        title: 'FORMULA',
        calculationNote: 'Addition of the selected points. Each question is scored 0-3:',
        scoringCriteria: [
            { criteria: 'Not at all', points: '0' },
            { criteria: 'Several days', points: '1' },
            { criteria: 'More than half the days', points: '2' },
            { criteria: 'Nearly every day', points: '3' }
        ],
        footnotes: ['Total score range: 0-21 points'],
        interpretationTitle: 'FACTS & FIGURES',
        tableHeaders: ['GAD-7 Score', 'Severity', 'Proposed Action'],
        interpretations: [
            {
                score: '0-4',
                category: 'Minimal',
                interpretation: 'Monitor; may not require treatment',
                severity: 'success'
            },
            {
                score: '5-9',
                category: 'Mild',
                interpretation: 'Watchful waiting; reassessment in 4 weeks',
                severity: 'info'
            },
            {
                score: '10-14',
                category: 'Moderate',
                interpretation: 'Active treatment with counseling and/or pharmacotherapy',
                severity: 'warning'
            },
            {
                score: '15-21',
                category: 'Severe',
                interpretation: 'Active treatment with pharmacotherapy and/or psychotherapy',
                severity: 'danger'
            }
        ]
    },

    riskLevels: [
        {
            minScore: 0,
            maxScore: 4,
            label: 'Minimal anxiety',
            severity: 'success',
            description: 'Monitor, may not require treatment.'
        },
        {
            minScore: 5,
            maxScore: 9,
            label: 'Mild anxiety',
            severity: 'info',
            description: 'Watchful waiting, reassessment in 4 weeks.'
        },
        {
            minScore: 10,
            maxScore: 14,
            label: 'Moderate anxiety',
            severity: 'warning',
            description: 'Active treatment with counseling and/or pharmacotherapy.'
        },
        {
            minScore: 15,
            maxScore: 21,
            label: 'Severe anxiety',
            severity: 'danger',
            description: 'Active treatment with pharmacotherapy and/or psychotherapy recommended.'
        }
    ],

    // 自定義結果渲染器
    customResultRenderer: (score: number, sectionScores: Record<string, number>) => {
        let severity = '';
        let alertClass = '';
        let recommendation = '';

        if (score <= 4) {
            severity = 'Minimal anxiety disorder.';
            alertClass = 'ui-alert-success';
            recommendation = 'Monitor, may not require treatment.';
        } else if (score <= 9) {
            severity = 'Mild anxiety disorder.';
            alertClass = 'ui-alert-info';
            recommendation = 'Watchful waiting, reassessment in 4 weeks.';
        } else if (score <= 14) {
            severity = 'Moderate anxiety disorder.';
            alertClass = 'ui-alert-warning';
            recommendation = 'Active treatment with counseling and/or pharmacotherapy.';
        } else {
            severity = 'Severe anxiety disorder.';
            alertClass = 'ui-alert-danger';
            recommendation =
                'Active treatment with pharmacotherapy and/or psychotherapy recommended.';
        }

        let clinicalNoteHtml = '';
        if (score >= 8) {
            clinicalNoteHtml = uiBuilder.createAlert({
                type: 'info',
                message: 'Some studies that applied GAD-7 to Panic Disorder, Social Phobia, and PTSD would use a cutoff of 8, such that this would be Moderate Anxiety. See Next Steps section for more information.'
            });
        }

        // Q8 (index 7) functional impairment note
        // In the context of `scoring-calculator`, we don't directly have the raw string value of radio buttons if they all evaluate to 0 points.
        // Wait, the ScoringCalculator simply sums the numeric values. It doesn't pass the raw selected option label.
        // I will extract it from the DOM.

        let functionalNote = 'Functionally, the patient does not report limitations due to their symptoms.';
        if (typeof document !== 'undefined') {
            const q8Radio = document.querySelector('input[name="gad7-q7"]:checked') as HTMLInputElement;
            if (q8Radio) {
                const labelElement = q8Radio.nextElementSibling as HTMLLabelElement;
                if (labelElement) {
                    const labelText = labelElement.textContent?.trim() || '';
                    if (labelText === 'Somewhat difficult' || labelText === 'Very difficult' || labelText === 'Extremely difficult') {
                        functionalNote = `Functionally, the patient reports symptoms make things: <strong>${labelText.toLowerCase()}</strong>.`;
                    }
                }
            }
        }

        const functionalNoteHtml = uiBuilder.createAlert({
            type: 'info',
            message: functionalNote
        });

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: severity,
            alertClass: alertClass
        })}
            
            ${clinicalNoteHtml}
            ${functionalNoteHtml}

            ${uiBuilder.createAlert({
            type: alertClass.replace('ui-alert-', '') as
                | 'success'
                | 'info'
                | 'warning'
                | 'danger',
            message: `<strong>Recommendation:</strong> ${recommendation}`
        })}
        `;
    }
};

export const gad7 = createScoringCalculator(gad7Config);
