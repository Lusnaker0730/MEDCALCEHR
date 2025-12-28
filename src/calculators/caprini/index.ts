import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';

const riskFactors = {
    '1 Point': [
        { id: 'minor-surgery', label: 'Minor surgery planned' },
        { id: 'major-surgery', label: 'Major open surgery (>45 min)' },
        { id: 'laparoscopy', label: 'Laparoscopic surgery (>45 min)' },
        { id: 'arthroscopy', label: 'Arthroscopic surgery' },
        { id: 'bmi', label: 'BMI > 25 kg/m²' },
        { id: 'swollen-legs', label: 'Swollen legs (current)' },
        { id: 'varicose', label: 'Varicose veins' },
        { id: 'sepsis', label: 'Sepsis (<1 month)' },
        {
            id: 'pneumonia',
            label: 'Serious lung disease incl. pneumonia (<1 month)'
        },
        { id: 'bed-rest', label: 'Confined to bed (>72 hours)' },
        { id: 'cast', label: 'Immobilizing plaster cast' },
        { id: 'central-venous', label: 'Central venous access' }
    ],
    '2 Points': [{ id: 'malignancy', label: 'Malignancy (present or previous)' }],
    '3 Points': [
        { id: 'history-vte', label: 'History of VTE' },
        { id: 'family-history-vte', label: 'Family history of VTE' },
        { id: 'thrombophilia', label: 'Thrombophilia (e.g., Factor V Leiden)' }
    ],
    '5 Points': [
        { id: 'stroke-paralysis', label: 'Stroke with paralysis (<1 month)' },
        {
            id: 'elective-hip-knee',
            label: 'Elective major lower extremity arthroplasty'
        },
        {
            id: 'hip-pelvis-fracture',
            label: 'Hip, pelvis, or leg fracture (<1 month)'
        },
        { id: 'spinal-cord-injury', label: 'Acute spinal cord injury (<1 month)' }
    ]
};

const sections = [
    {
        title: 'Age',
        icon: '📅',
        inputs: [
            {
                type: 'radio' as const,
                name: 'age',
                label: 'Patient Age',
                options: [
                    { value: '0', label: 'Age < 41', checked: true },
                    { value: '1', label: 'Age 41-60 (+1)' },
                    { value: '2', label: 'Age 61-74 (+2)' },
                    { value: '3', label: 'Age ≥ 75 (+3)' }
                ]
            }
        ]
    }
];

// Helper to generate input configs for risk factors
const generateRiskInputs = (factors: { id: string; label: string }[], points: number) => {
    return factors.map(f => ({
        type: 'radio' as const,
        name: f.id,
        label: f.label,
        options: [
            { value: '0', label: 'No', checked: true },
            { value: String(points), label: `Yes (+${points})` }
        ]
    }));
};

for (const [group, factors] of Object.entries(riskFactors)) {
    const points = parseInt(group.split(' ')[0]);
    sections.push({
        title: `${group} Risk Factors`,
        icon: '⚠️',
        inputs: generateRiskInputs(factors, points) as any
    });
}

const config: MixedInputCalculatorConfig = {
    id: 'caprini',
    title: 'Caprini Score for Venous Thromboembolism (2005)',
    description: 'Stratifies VTE risk in surgical patients, guiding prophylaxis decisions.',
    sections: sections,

    formulas: [
        {
            title: 'Facts & Figures',
            content: `
                ${uiBuilder.createTable({
                    headers: [
                        'Caprini Score',
                        'Risk category',
                        'Risk percent*',
                        'Recommended prophylaxis**',
                        'Duration of chemoprophylaxis'
                    ],
                    rows: [
                        [
                            '0',
                            'Lowest',
                            'Minimal',
                            'Early frequent ambulation only, OR at discretion of surgical team: Pneumatic compression devices OR graduated compression stockings',
                            'During hospitalization'
                        ],
                        [
                            '1–2',
                            'Low',
                            'Minimal',
                            'Pneumatic compression devices ± graduated compression stockings',
                            'During hospitalization'
                        ],
                        [
                            '3–4',
                            'Moderate',
                            '0.7%',
                            'Pneumatic compression devices ± graduated compression stockings',
                            'During hospitalization'
                        ],
                        [
                            '5–6',
                            'High',
                            '1.8%',
                            'Pneumatic compression devices AND low dose heparin OR low molecular weight heparin',
                            '7–10 days total'
                        ],
                        [
                            '7–8',
                            'High',
                            '4.0%',
                            'Pneumatic compression devices AND low dose heparin OR low molecular weight heparin',
                            '7–10 days total'
                        ],
                        [
                            '≥9',
                            'Highest',
                            '10.7%',
                            'Pneumatic compression devices AND low dose heparin OR low molecular weight heparin',
                            '30 days total'
                        ]
                    ],
                    stickyFirstColumn: true
                })}
                <div class="footnotes-section mt-15">
                    <p class="footnote-item text-sm text-muted">*Percent represents VTE risk without prophylaxis. From Bahl 2010, which looked at 8,216 general, vascular, and urological surgery patients.</p>
                    <p class="footnote-item text-sm text-muted">**Adapted from Gould 2012.</p>
                </div>
            `
        }
    ],

    calculate: values => {
        let score = 0;
        for (const key in values) {
            if (values[key]) {
                score += parseInt(values[key] as string);
            }
        }
        return score;
    },
    customResultRenderer: (score, values) => {
        let riskCategory = '';
        let recommendation = '';
        let alertClass = '';

        if (score === 0) {
            riskCategory = 'Lowest Risk';
            recommendation = 'Early ambulation.';
            alertClass = 'ui-alert-success';
        } else if (score >= 1 && score <= 2) {
            riskCategory = 'Low Risk';
            recommendation =
                'Mechanical prophylaxis (e.g., intermittent pneumatic compression devices).';
            alertClass = 'ui-alert-info';
        } else if (score >= 3 && score <= 4) {
            riskCategory = 'Moderate Risk';
            recommendation =
                'Pharmacologic prophylaxis (e.g., LMWH or UFH) OR Mechanical prophylaxis.';
            alertClass = 'ui-alert-warning';
        } else {
            riskCategory = 'High Risk';
            recommendation =
                'Pharmacologic prophylaxis (e.g., LMWH or UFH) AND Mechanical prophylaxis.';
            alertClass = 'ui-alert-danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: 'points',
                interpretation: riskCategory,
                alertClass: alertClass
            })}
            ${uiBuilder.createAlert({
                type:
                    alertClass === 'ui-alert-success'
                        ? 'success'
                        : alertClass === 'ui-alert-info'
                          ? 'info'
                          : alertClass === 'ui-alert-warning'
                            ? 'warning'
                            : 'danger',
                message: `<strong>Recommendation:</strong> ${recommendation}`
            })}
        `;
    },
    customInitialize: (client, patient, container, calculate, setValue) => {
        if (patient && (patient as any).birthDate) {
            const age = calculateAge((patient as any).birthDate);
            let ageScore = '0';
            if (age >= 75) {
                ageScore = '3';
            } else if (age >= 61) {
                ageScore = '2';
            } else if (age >= 41) {
                ageScore = '1';
            }

            const radio = container.querySelector(
                `input[name="age"][value="${ageScore}"]`
            ) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        }
    }
};

export const caprini = createMixedInputCalculator(config);
