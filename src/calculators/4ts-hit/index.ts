import {
    createScoringCalculator,
    ScoringCalculatorConfig
} from '../shared/scoring-calculator.js';

export const fourTsHitConfig: ScoringCalculatorConfig = {
    inputType: 'radio',
    id: '4ts-hit',
    title: '4Ts Score for Heparin-Induced Thrombocytopenia',
    description:
        'Clinical scoring system to determine the pre-test probability of heparin-induced thrombocytopenia (HIT).',
    sections: [
        {
            id: '4ts-thrombocytopenia',
            title: 'Thrombocytopenia',
            options: [
                {
                    label: 'Platelet count fall >50% AND platelet nadir ≥20 x 10⁹ L⁻¹ (+2)',
                    value: '2'
                },
                {
                    label: 'Platelet count fall 30%–50% OR platelet nadir 10–19 x 10⁹ L⁻¹ (+1)',
                    value: '1'
                },
                {
                    label: 'Platelet count fall <30% OR platelet nadir <10 x 10⁹ L⁻¹ (0)',
                    value: '0',
                    checked: true
                }
            ]
        },
        {
            id: '4ts-timing',
            title: 'Timing of platelet count fall',
            options: [
                {
                    label:
                        'Clear onset between days 5 and 10 OR platelet fall ≤1 day (prior heparin exposure within 30 days) (+2)',
                    value: '2'
                },
                {
                    label:
                        'Consistent with days 5–10 fall, but not clear (e.g. missing platelet counts) OR onset after day 10 OR fall ≤1 day (prior heparin exposure 30–100 days ago) (+1)',
                    value: '1'
                },
                {
                    label: 'Platelet count fall <4 days without recent heparin exposure (0)',
                    value: '0',
                    checked: true
                }
            ]
        },
        {
            id: '4ts-thrombosis',
            title: 'Thrombosis or other sequelae',
            options: [
                {
                    label:
                        'New thrombosis (confirmed) OR skin necrosis at heparin injection sites OR acute systemic reaction after intravenous heparin bolus (+2)',
                    value: '2'
                },
                {
                    label:
                        'Progressive or recurrent thrombosis or nonnecrotizing (erythematous) skin lesions or suspected thrombosis (not proven) (+1)',
                    value: '1'
                },
                {
                    label: 'None (0)',
                    value: '0',
                    checked: true
                }
            ]
        },
        {
            id: '4ts-other_causes',
            title: 'Other causes for thrombocytopenia',
            options: [
                {
                    label: 'None apparent (+2)',
                    value: '2'
                },
                {
                    label: 'Possible (+1)',
                    value: '1'
                },
                {
                    label: 'Definite (0)',
                    value: '0',
                    checked: true
                }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 3,
            category: 'Low Probability',
            risk: '≤5%',
            severity: 'success',
            description: 'Low probability for HIT (≤5% in original study, <1% in meta-analysis).'
        },
        {
            minScore: 4,
            maxScore: 5,
            category: 'Intermediate Probability',
            risk: '~14%',
            severity: 'warning',
            description: 'Intermediate probability (~14% probability of HIT).'
        },
        {
            minScore: 6,
            maxScore: 8,
            category: 'High Probability',
            risk: '~64%',
            severity: 'danger',
            description: 'High probability (~64% probability of HIT).'
        }
    ],
    formulaSection: {
        show: true,
        title: '4TS HIT Score Table',
        tableHeaders: ['Category', '2 points', '1 point', '0 points'],
        scoringCriteria: [
            { criteria: 'Thrombocytopenia', isHeader: true },
            { criteria: 'Fall >50% AND nadir ≥20', points: '2 pts' },
            { criteria: 'Fall 30%–50% OR nadir 10–19', points: '1 pt' },
            { criteria: 'Fall <30% OR nadir <10', points: '0 pts' },
            { criteria: 'Timing of platelet count fall', isHeader: true },
            { criteria: 'Clear onset Days 5-10 OR fall ≤1 day (recent heparin)', points: '2 pts' },
            { criteria: 'Consistent with Days 5-10 fall (not clear) OR >Day 10 fall OR ≤1 day (prior exposure)', points: '1 pt' },
            { criteria: 'Fall <4 days without recent exposure', points: '0 pts' },
            { criteria: 'Thrombosis or other sequelae', isHeader: true },
            { criteria: 'New thrombosis, skin necrosis, or systemic reaction', points: '2 pts' },
            { criteria: 'Progressive/recurrent, skin lesions, or suspected', points: '1 pt' },
            { criteria: 'None', points: '0 pts' },
            { criteria: 'Other causes for thrombocytopenia', isHeader: true },
            { criteria: 'None apparent', points: '2 pts' },
            { criteria: 'Possible', points: '1 pt' },
            { criteria: 'Definite', points: '0 pts' }
        ],
        interpretations: [
            {
                score: '≤3',
                category: 'Low probability',
                interpretation: '≤5% (original), <1% (meta-analysis)',
                severity: 'success'
            },
            {
                score: '4-5',
                category: 'Intermediate probability',
                interpretation: '~14%',
                severity: 'warning'
            },
            {
                score: '6-8',
                category: 'High probability',
                interpretation: '~64%',
                severity: 'danger'
            }
        ]
    }
};

export const hepScore = createScoringCalculator(fourTsHitConfig);
export default hepScore;
