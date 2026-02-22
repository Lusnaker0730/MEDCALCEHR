/**
 * Kawasaki Disease Diagnostic Criteria
 *
 * 使用 Radio Score Calculator 工廠函數
 * 根據臨床標準診斷川崎病
 */

import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

export const kawasakiConfig: ScoringCalculatorConfig = {
    id: 'kawasaki',
    title: 'Kawasaki Disease Diagnostic Criteria',
    description: 'Diagnoses Kawasaki Disease based on clinical criteria.',

    infoAlert:
        '<strong>Classic Kawasaki Disease:</strong> Fever for ≥5 days PLUS ≥4 of 5 principal clinical features.',

    sections: [
        {
            id: 'kawasaki-fever',
            title: 'Fever for ≥5 days',
            subtitle: 'Required for classic Kawasaki Disease diagnosis',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-extrem-acute',
            title: 'Acute change in extremities',
            subtitle: 'Erythema of palms and soles, or edema of hands and feet',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-extrem-subacute',
            title: 'Subacute change in extremities',
            subtitle: 'Periungual peeling of fingers and toes in weeks 2 and 3',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-exanthem',
            title: 'Polymorphous exanthem',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-conjunctival',
            title: 'Bilateral bulbar conjunctival injection without exudate',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-oral',
            title: 'Changes in lips and oral cavity',
            subtitle: 'Erythema, lips cracking, strawberry tongue, diffuse injection of oral/pharyngeal mucosae',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-lymph',
            title: 'Cervical lymphadenopathy',
            subtitle: '>1.5 cm diameter, usually unilateral',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'kawasaki-coronary',
            title: 'Coronary artery disease detected by 2D echo or coronary angiogram',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 4, label: 'Criteria Not Met', severity: 'warning' },
        { minScore: 5, maxScore: 8, label: 'Kawasaki Disease', severity: 'danger' }
    ],

    formulaSection: {
        show: true,
        title: 'FORMULA',
        calculationNote: 'Classic clinical features for diagnosis:',
        scoringCriteria: [
            { criteria: 'Fever persisting at least 5 days', points: 'Required' },
            { criteria: 'At least 4 of the following 5 principal features:', isHeader: true },
            { criteria: '1. Changes in extremities (Acute: erythema/edema; Subacute: periungual peeling wk 2-3)', points: '+1' },
            { criteria: '2. Polymorphous exanthem', points: '+1' },
            { criteria: '3. Bilateral bulbar conjunctival injection without exudate', points: '+1' },
            { criteria: '4. Changes in lips and oral cavity: erythema, cracking, strawberry tongue, pharyngeal injection', points: '+1' },
            { criteria: '5. Cervical lymphadenopathy (>1.5-cm diameter), usually unilateral', points: '+1' },
            { criteria: 'Exclusion of other diseases with similar findings', points: 'Required' }
        ],
        interpretationTitle: 'Diagnosis is made if any of the following is true',
        tableHeaders: ['Criteria', 'Diagnosis'],
        interpretations: [
            {
                score: 'Fever ≥5 days + ≥4 principal features',
                interpretation: 'Classic Kawasaki Disease',
                severity: 'danger'
            },
            {
                score: 'Fever ≥5 days + <4 features with coronary artery disease by 2D echo/angiogram',
                interpretation: 'Kawasaki Disease',
                severity: 'danger'
            },
            {
                score: 'Day 4 of illness + ≥4 principal features',
                interpretation: 'Classic Kawasaki Disease (early)',
                severity: 'danger'
            },
            {
                score: 'Fever + 2-3 features',
                interpretation: 'Consider Incomplete Kawasaki Disease',
                severity: 'warning'
            }
        ],
        footnotes: [
            'Incomplete Kawasaki Disease should be considered in all children with fever for ≥5 days and 2 or 3 of the principal features.',
            'Echocardiography should be performed in all suspected cases.'
        ]
    },

    customResultRenderer: (score: number, sectionScores: Record<string, number>) => {
        const hasFever = (sectionScores['kawasaki-fever'] || 0) === 1;
        const hasCoronary = (sectionScores['kawasaki-coronary'] || 0) === 1;

        // Count principal features (acute or subacute extremity changes count as 1 together)
        const hasExtremityChange =
            (sectionScores['kawasaki-extrem-acute'] || 0) === 1 ||
            (sectionScores['kawasaki-extrem-subacute'] || 0) === 1;

        const featureCount =
            (hasExtremityChange ? 1 : 0) +
            (sectionScores['kawasaki-exanthem'] || 0) +
            (sectionScores['kawasaki-conjunctival'] || 0) +
            (sectionScores['kawasaki-oral'] || 0) +
            (sectionScores['kawasaki-lymph'] || 0);

        let interpretation = '';
        let alertType: 'info' | 'warning' | 'danger' = 'info';

        if (!hasFever && !hasCoronary) {
            interpretation =
                'Fever for ≥5 days is required for diagnosis of classic Kawasaki Disease.';
            alertType = 'warning';
        } else if (hasFever && featureCount >= 4) {
            interpretation =
                '<strong>Positive for Kawasaki Disease</strong> (Fever + ≥4 principal features). Start IVIG treatment promptly.';
            alertType = 'danger';
        } else if (hasFever && hasCoronary) {
            interpretation =
                '<strong>Positive for Kawasaki Disease</strong> (Fever + coronary artery disease confirmed by 2D echo or angiogram). Start IVIG treatment promptly.';
            alertType = 'danger';
        } else if (hasFever && featureCount >= 2) {
            interpretation = `Fever + ${featureCount}/5 features. <strong>Consider Incomplete Kawasaki Disease</strong> if clinical suspicion is high. Obtain echocardiography.`;
            alertType = 'warning';
        } else {
            interpretation = `Criteria Not Met (Fever + ${featureCount}/5 features). Consider alternative diagnoses.`;
            alertType = 'info';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Fever Present',
            value: hasFever ? 'Yes' : 'No'
        })}
            ${uiBuilder.createResultItem({
            label: 'Principal Features Present',
            value: `${featureCount} / 5`
        })}
            ${hasCoronary ? uiBuilder.createResultItem({
            label: 'Coronary Artery Disease Confirmed',
            value: 'Yes'
        }) : ''}
            ${uiBuilder.createAlert({
            type: alertType,
            message: interpretation
        })}
        `;
    }
};

export const kawasaki = createScoringCalculator(kawasakiConfig);
