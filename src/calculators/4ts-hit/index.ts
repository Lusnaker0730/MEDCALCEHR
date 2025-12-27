/**
 * HIT Expert Probability (HEP) Score for Heparin-Induced Thrombocytopenia
 *
 * 使用 Conditional Score Calculator 工廠函數
 * 根據 HIT 發病類型（典型/快速）顯示不同評分項目
 */

import { createConditionalScoreCalculator } from '../shared/conditional-score-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const hepScore = createConditionalScoreCalculator({
    id: '4ts-hit',
    title: 'HIT Expert Probability (HEP) Score for Heparin-Induced Thrombocytopenia',
    description: 'Pre-test clinical scoring model for HIT based on broad expert opinion.',

    infoAlert: '<strong>📋 HIT Assessment</strong><br>Select the type of HIT onset and complete all clinical criteria below.',

    conditionSelector: {
        name: 'hit_onset_type',
        label: 'Type of HIT onset suspected',
        options: [
            { value: 'typical', label: 'Typical onset', checked: true },
            { value: 'rapid', label: 'Rapid onset (re-exposure)' }
        ]
    },

    categories: [
        {
            title: 'Thrombocytopenia Features',
            criteria: [
                {
                    id: 'platelet_fall_magnitude',
                    label: 'Magnitude of platelet count fall',
                    options: [
                        { label: '<30% (-1)', value: -1 },
                        { label: '30-50% (+1)', value: 1 },
                        { label: '>50% (+3)', value: 3 }
                    ]
                },
                {
                    id: 'timing_typical',
                    label: 'Timing of platelet count fall (typical onset)',
                    condition: (ctx) => ctx.hit_onset_type === 'typical',
                    options: [
                        { label: 'Fall begins <4 days after heparin exposure (-2)', value: -2 },
                        { label: 'Fall begins 4 days after heparin exposure (+2)', value: 2 },
                        { label: 'Fall begins 5-10 days after heparin exposure (+3)', value: 3 },
                        { label: 'Fall begins 11-14 days after heparin exposure (+2)', value: 2 },
                        { label: 'Fall begins >14 days after heparin exposure (-1)', value: -1 }
                    ]
                },
                {
                    id: 'timing_rapid',
                    label: 'Timing of platelet count fall (rapid onset)',
                    condition: (ctx) => ctx.hit_onset_type === 'rapid',
                    options: [
                        { label: 'Fall begins <48 hours after heparin re-exposure (+2)', value: 2 },
                        { label: 'Fall begins ≥48 hours after heparin re-exposure (-1)', value: -1 }
                    ]
                },
                {
                    id: 'nadir_platelet',
                    label: 'Nadir platelet count',
                    options: [
                        { label: '≤20 x 10⁹/L (-2)', value: -2 },
                        { label: '>20 x 10⁹/L (+2)', value: 2 }
                    ]
                },
                {
                    id: 'thrombosis_typical',
                    label: 'Thrombosis (typical onset)',
                    condition: (ctx) => ctx.hit_onset_type === 'typical',
                    options: [
                        { label: 'New VTE/ATE ≥4 days after heparin exposure (+3)', value: 3 },
                        { label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)', value: 2 },
                        { label: 'None (0)', value: 0, checked: true }
                    ]
                },
                {
                    id: 'thrombosis_rapid',
                    label: 'Thrombosis (rapid onset)',
                    condition: (ctx) => ctx.hit_onset_type === 'rapid',
                    options: [
                        { label: 'New VTE/ATE after heparin exposure (+3)', value: 3 },
                        { label: 'Progression of pre-existing VTE/ATE while receiving heparin (+2)', value: 2 },
                        { label: 'None (0)', value: 0, checked: true }
                    ]
                },
                {
                    id: 'skin_necrosis',
                    label: 'Skin necrosis at subcutaneous heparin injection sites',
                    yesScore: 3,
                    noScore: 0
                },
                {
                    id: 'systemic_reaction',
                    label: 'Acute systemic reaction after IV heparin bolus',
                    yesScore: 2,
                    noScore: 0
                },
                {
                    id: 'bleeding',
                    label: 'Presence of bleeding, petechiae or extensive bruising',
                    yesScore: -1,
                    noScore: 0
                }
            ]
        },
        {
            title: 'Other Causes of Thrombocytopenia',
            criteria: [
                {
                    id: 'chronic_thrombocytopenia',
                    label: 'Presence of chronic thrombocytopenic disorder',
                    yesScore: -1,
                    noScore: 0
                },
                {
                    id: 'new_medication',
                    label: 'Newly initiated non-heparin medication known to cause thrombocytopenia',
                    yesScore: -1,
                    noScore: 0
                },
                {
                    id: 'severe_infection',
                    label: 'Severe infection',
                    yesScore: -2,
                    noScore: 0
                },
                {
                    id: 'dic',
                    label: 'Severe DIC (fibrinogen <100 mg/dL and D-dimer >5 µg/mL)',
                    yesScore: -2,
                    noScore: 0
                },
                {
                    id: 'arterial_device',
                    label: 'Indwelling intra-arterial device (e.g. IABP, VAD, ECMO)',
                    yesScore: -2,
                    noScore: 0
                },
                {
                    id: 'cardiopulmonary_bypass',
                    label: 'Cardiopulmonary bypass within previous 96 hours',
                    yesScore: -1,
                    noScore: 0
                },
                {
                    id: 'no_other_cause',
                    label: 'No other apparent cause',
                    yesScore: 3,
                    noScore: 0
                }
            ]
        }
    ],

    interpretations: [
        {
            minScore: -Infinity,
            maxScore: -1,
            label: 'Low Probability',
            description: 'Scores ≤ -1 suggest a lower probability of HIT.',
            severity: 'success'
        },
        {
            minScore: 0,
            maxScore: 3,
            label: 'Intermediate Probability',
            description: 'Intermediate probability of HIT. Consider further testing.',
            severity: 'warning'
        },
        {
            minScore: 4,
            maxScore: Infinity,
            label: 'High Probability (>90% sensitive)',
            description: 'Scores ≥ 4 are >90% sensitive for HIT. Strongly consider HIT diagnosis.',
            severity: 'danger'
        }
    ],

    fhirAutoPopulate: [
        {
            criterionId: 'nadir_platelet',
            loincCode: LOINC_CODES.PLATELETS,
            valueMapper: (value: number) => value < 20 ? -2 : 2
        }
    ],

    scoringTable: `
        <div class="ui-section mt-20">
            <div class="ui-section-title">📐 FORMULA</div>
            <p class="calculation-note">Addition of the selected points:</p>
            <div class="ui-table-wrapper">
                <table class="ui-scoring-table">
                    <thead>
                        <tr>
                            <th class="ui-scoring-table__header ui-scoring-table__header--criteria">Criteria</th>
                            <th class="ui-scoring-table__header ui-scoring-table__header--points">Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="ui-scoring-table__category"><td colspan="2">Thrombocytopenia Features</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Magnitude of fall</strong>: <30% / 30-50% / >50%</td><td class="ui-scoring-table__points">-1 / +1 / +3</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Timing (typical)</strong>: <4d / 4d / 5-10d / 11-14d / >14d</td><td class="ui-scoring-table__points">-2 / +2 / +3 / +2 / -1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Timing (rapid)</strong>: <48h / ≥48h</td><td class="ui-scoring-table__points">+2 / -1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Nadir platelet</strong>: ≤20 / >20 x10⁹/L</td><td class="ui-scoring-table__points">-2 / +2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Thrombosis</strong>: New VTE/ATE / Progression / None</td><td class="ui-scoring-table__points">+3 / +2 / 0</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Skin necrosis</strong></td><td class="ui-scoring-table__points">+3</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Systemic reaction</strong></td><td class="ui-scoring-table__points">+2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Bleeding/petechiae</strong></td><td class="ui-scoring-table__points">-1</td></tr>
                        
                        <tr class="ui-scoring-table__category"><td colspan="2">Other Causes</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Chronic thrombocytopenia</strong></td><td class="ui-scoring-table__points">-1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>New medication</strong></td><td class="ui-scoring-table__points">-1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Severe infection</strong></td><td class="ui-scoring-table__points">-2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Severe DIC</strong></td><td class="ui-scoring-table__points">-2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>Intra-arterial device</strong></td><td class="ui-scoring-table__points">-2</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>CPB within 96h</strong></td><td class="ui-scoring-table__points">-1</td></tr>
                        <tr class="ui-scoring-table__item"><td class="ui-scoring-table__criteria"><strong>No other cause</strong></td><td class="ui-scoring-table__points">+3</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `,

    reference: `
        <div class="info-section mt-20 text-sm text-muted">
            <h4>📚 Reference</h4>
            <p>Cuker, A., et al. (2010). The HIT Expert Probability (HEP) Score. <em>J Thromb Haemost</em>.</p>
        </div>
    `
});
