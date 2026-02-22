/**
 * NIH Stroke Scale/Score (NIHSS) Calculator
 *
 * 使用 Radio Score Calculator 工廠函數遷移
 * Quantifies stroke severity and monitors for neurological changes over time.
 */

import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

const config: ScoringCalculatorConfig = {
    id: 'nihss',
    title: 'NIH Stroke Scale/Score (NIHSS)',
    description: 'Quantifies stroke severity and monitors for neurological changes over time.',
    infoAlert:
        '<strong>Clinical Use:</strong> Perform assessments within 24 hours of symptom onset and repeat serially to monitor progression or recovery.',
    sections: [
        {
            id: 'nihss-1a',
            title: '1A: Level of consciousness',
            subtitle: 'May be assessed casually while taking history',
            options: [
                { value: '0', label: 'Alert; keenly responsive', checked: true },
                { value: '1', label: 'Arouses to minor stimulation' },
                { value: '2', label: 'Requires repeated stimulation to arouse' },
                { value: '2', label: 'Movements to pain' },
                { value: '3', label: 'Postures or unresponsive' }
            ]
        },
        {
            id: 'nihss-1b',
            title: '1B: Ask month and age',
            options: [
                { value: '0', label: 'Both questions right', checked: true },
                { value: '1', label: '1 question right' },
                { value: '2', label: '0 questions right' },
                { value: '1', label: 'Dysarthric/intubated/trauma/language barrier' },
                { value: '2', label: 'Aphasic' }
            ]
        },
        {
            id: 'nihss-1c',
            title: "1C: 'Blink eyes' & 'squeeze hands'",
            subtitle: 'Pantomime commands if communication barrier',
            options: [
                { value: '0', label: 'Performs both tasks', checked: true },
                { value: '1', label: 'Performs 1 task' },
                { value: '2', label: 'Performs 0 tasks' }
            ]
        },
        {
            id: 'nihss-2',
            title: '2: Horizontal extraocular movements',
            subtitle: 'Only assess horizontal gaze',
            options: [
                { value: '0', label: 'Normal', checked: true },
                { value: '1', label: 'Partial gaze palsy: can be overcome' },
                { value: '1', label: 'Partial gaze palsy: corrects with oculocephalic reflex' },
                { value: '2', label: 'Forced gaze palsy: cannot be overcome' }
            ]
        },
        {
            id: 'nihss-3',
            title: '3: Visual fields',
            options: [
                { value: '0', label: 'No visual loss', checked: true },
                { value: '1', label: 'Partial hemianopia' },
                { value: '2', label: 'Complete hemianopia' },
                { value: '3', label: 'Patient is bilaterally blind' },
                { value: '3', label: 'Bilateral hemianopia' }
            ]
        },
        {
            id: 'nihss-4',
            title: '4: Facial palsy',
            subtitle: 'Use grimace if obtunded',
            options: [
                { value: '0', label: 'Normal symmetry', checked: true },
                { value: '1', label: 'Minor paralysis (flat nasolabial fold, smile asymmetry)' },
                { value: '2', label: 'Partial paralysis (lower face)' },
                { value: '3', label: 'Unilateral complete paralysis (upper/lower face)' },
                { value: '3', label: 'Bilateral complete paralysis (upper/lower face)' }
            ]
        },
        {
            id: 'nihss-5a',
            title: '5A: Left arm motor drift',
            subtitle: 'Count out loud and use your fingers to show the patient your count',
            options: [
                { value: '0', label: 'No drift for 10 seconds', checked: true },
                { value: '1', label: "Drift, but doesn't hit bed" },
                { value: '2', label: 'Drift, hits bed' },
                { value: '2', label: 'Some effort against gravity' },
                { value: '3', label: 'No effort against gravity' },
                { value: '4', label: 'No movement' },
                { value: '0', label: 'Amputation/joint fusion' }
            ]
        },
        {
            id: 'nihss-5b',
            title: '5B: Right arm motor drift',
            subtitle: 'Count out loud and use your fingers to show the patient your count',
            options: [
                { value: '0', label: 'No drift for 10 seconds', checked: true },
                { value: '1', label: "Drift, but doesn't hit bed" },
                { value: '2', label: 'Drift, hits bed' },
                { value: '2', label: 'Some effort against gravity' },
                { value: '3', label: 'No effort against gravity' },
                { value: '4', label: 'No movement' },
                { value: '0', label: 'Amputation/joint fusion' }
            ]
        },
        {
            id: 'nihss-6a',
            title: '6A: Left leg motor drift',
            subtitle: 'Count out loud and use your fingers to show the patient your count',
            options: [
                { value: '0', label: 'No drift for 5 seconds', checked: true },
                { value: '1', label: "Drift, but doesn't hit bed" },
                { value: '2', label: 'Drift, hits bed' },
                { value: '2', label: 'Some effort against gravity' },
                { value: '3', label: 'No effort against gravity' },
                { value: '4', label: 'No movement' },
                { value: '0', label: 'Amputation/joint fusion' }
            ]
        },
        {
            id: 'nihss-6b',
            title: '6B: Right leg motor drift',
            subtitle: 'Count out loud and use your fingers to show the patient your count',
            options: [
                { value: '0', label: 'No drift for 5 seconds', checked: true },
                { value: '1', label: "Drift, but doesn't hit bed" },
                { value: '2', label: 'Drift, hits bed' },
                { value: '2', label: 'Some effort against gravity' },
                { value: '3', label: 'No effort against gravity' },
                { value: '4', label: 'No movement' },
                { value: '0', label: 'Amputation/joint fusion' }
            ]
        },
        {
            id: 'nihss-7',
            title: '7: Limb Ataxia',
            subtitle: 'FNF/heel-shin',
            options: [
                { value: '0', label: 'No ataxia', checked: true },
                { value: '1', label: 'Ataxia in 1 Limb' },
                { value: '2', label: 'Ataxia in 2 Limbs' },
                { value: '0', label: 'Does not understand' },
                { value: '0', label: 'Paralyzed' },
                { value: '0', label: 'Amputation/joint fusion' }
            ]
        },
        {
            id: 'nihss-8',
            title: '8: Sensation',
            options: [
                { value: '0', label: 'Normal; no sensory loss', checked: true },
                { value: '1', label: 'Mild-moderate loss: less sharp/more dull' },
                { value: '1', label: 'Mild-moderate loss: can sense being touched' },
                { value: '2', label: 'Complete loss: cannot sense being touched at all' },
                { value: '2', label: 'No response and quadriplegic' },
                { value: '2', label: 'Coma/unresponsive' }
            ]
        },
        {
            id: 'nihss-9',
            title: '9: Language/aphasia',
            subtitle: 'Describe the scene; name the items; read the sentences',
            options: [
                { value: '0', label: 'Normal; no aphasia', checked: true },
                { value: '1', label: 'Mild-moderate aphasia: some obvious changes, without significant limitation' },
                { value: '2', label: 'Severe aphasia: fragmentary expression, inference needed, cannot identify materials' },
                { value: '3', label: 'Mute/global aphasia: no usable speech/auditory comprehension' },
                { value: '3', label: 'Coma/unresponsive' }
            ]
        },
        {
            id: 'nihss-10',
            title: '10: Dysarthria',
            subtitle: 'Read the words',
            options: [
                { value: '0', label: 'Normal', checked: true },
                { value: '1', label: 'Mild-moderate dysarthria: slurring but can be understood' },
                { value: '2', label: 'Severe dysarthria: unintelligible slurring or out of proportion to dysphasia' },
                { value: '2', label: 'Mute/anarthric' },
                { value: '0', label: 'Intubated/unable to test' }
            ]
        },
        {
            id: 'nihss-11',
            title: '11: Extinction/inattention',
            options: [
                { value: '0', label: 'No abnormality', checked: true },
                { value: '1', label: 'Visual/tactile/auditory/spatial/personal inattention' },
                { value: '1', label: 'Extinction to bilateral simultaneous stimulation' },
                { value: '2', label: 'Profound hemi-inattention (ex: does not recognize own hand)' },
                { value: '2', label: 'Extinction to >1 modality' }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 0,
            label: 'No Stroke',
            severity: 'success',
            description: 'No stroke symptoms detected.'
        },
        {
            minScore: 1,
            maxScore: 4,
            label: 'Minor Stroke',
            severity: 'info',
            description: 'Minor stroke. Consider outpatient management with close follow-up.'
        },
        {
            minScore: 5,
            maxScore: 15,
            label: 'Moderate Stroke',
            severity: 'warning',
            description: 'Moderate stroke. Requires inpatient monitoring and treatment.'
        },
        {
            minScore: 16,
            maxScore: 20,
            label: 'Moderate-to-Severe Stroke',
            severity: 'danger',
            description:
                'Moderate-to-severe stroke. Intensive monitoring and intervention required.'
        },
        {
            minScore: 21,
            maxScore: 999,
            label: 'Severe Stroke',
            severity: 'danger',
            description: 'Severe stroke. Critical care and aggressive intervention needed.'
        }
    ],
    references: [
        'Brott T, Adams HP Jr, Olinger CP, et al. Measurements of acute cerebral infarction: a clinical examination scale. <em>Stroke</em>. 1989;20(7):864-870.'
    ],
    customResultRenderer: (score: number, sectionScores: Record<string, number>): string => {
        let severity = '';
        let alertClass: 'success' | 'info' | 'warning' | 'danger' = 'success';
        let interpretation = '';

        if (score === 0) {
            severity = 'No Stroke';
            alertClass = 'success';
            interpretation = 'No stroke symptoms detected.';
        } else if (score <= 4) {
            severity = 'Minor Stroke';
            alertClass = 'info';
            interpretation = 'Minor stroke. Consider outpatient management with close follow-up.';
        } else if (score <= 15) {
            severity = 'Moderate Stroke';
            alertClass = 'warning';
            interpretation = 'Moderate stroke. Requires inpatient monitoring and treatment.';
        } else if (score <= 20) {
            severity = 'Moderate-to-Severe Stroke';
            alertClass = 'danger';
            interpretation =
                'Moderate-to-severe stroke. Intensive monitoring and intervention required.';
        } else {
            severity = 'Severe Stroke';
            alertClass = 'danger';
            interpretation = 'Severe stroke. Critical care and aggressive intervention needed.';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: '/ 42 points',
            interpretation: severity,
            alertClass: `ui-alert-${alertClass}`
        })}
            
            ${uiBuilder.createAlert({
            type: alertClass,
            message: interpretation
        })}
        `;
    }
};

export const nihss = createScoringCalculator(config);
