import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { uiBuilder } from '../../ui-builder.js';

export const centorConfig: ScoringCalculatorConfig = {
    inputType: 'radio',
    id: 'centor',
    title: 'Centor Score (Modified/McIsaac) for Strep Pharyngitis',
    description:
        'Estimates probability that pharyngitis is streptococcal, and suggests management course.',
    sections: [
        {
            id: 'centor-exudates',
            title: 'Tonsillar exudates or swelling',
            options: [
                { value: '1', label: 'Yes (+1)' },
                { value: '0', label: 'No (+0)', checked: true }
            ]
        },
        {
            id: 'centor-nodes',
            title: 'Swollen, tender anterior cervical nodes',
            options: [
                { value: '1', label: 'Yes (+1)' },
                { value: '0', label: 'No (+0)', checked: true }
            ]
        },
        {
            id: 'centor-fever',
            title: 'Temperature > 38°C (100.4°F)',
            options: [
                { value: '1', label: 'Yes (+1)' },
                { value: '0', label: 'No (+0)', checked: true }
            ]
        },
        {
            id: 'centor-cough',
            title: 'Absence of cough',
            options: [
                { value: '1', label: 'Yes (+1)' },
                { value: '0', label: 'No (+0)', checked: true }
            ]
        },
        {
            id: 'centor-age',
            title: 'McIsaac Modification (Age)',
            icon: '🎂',
            options: [
                { value: '1', label: 'Age 3-14 years (+1)' },
                { value: '0', label: 'Age 15-44 years (+0)', checked: true },
                { value: '-1', label: 'Age ≥ 45 years (-1)' }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: -1,
            maxScore: 0,
            label: '1-2.5% probability',
            severity: 'success',
            recommendation: 'No further testing or antibiotics.'
        },
        {
            minScore: 1,
            maxScore: 1,
            label: '5-10% probability',
            severity: 'success',
            recommendation: 'No further testing or antibiotics.'
        },
        {
            minScore: 2,
            maxScore: 2,
            label: '11-17% probability',
            severity: 'warning',
            recommendation: 'Optional rapid strep testing and/or culture.'
        },
        {
            minScore: 3,
            maxScore: 3,
            label: '28-35% probability',
            severity: 'warning',
            recommendation: 'Consider rapid strep testing and/or culture.'
        },
        {
            minScore: 4,
            maxScore: 999,
            label: '51-53% probability',
            severity: 'danger',
            recommendation: 'Consider rapid strep testing and/or culture. Empiric antibiotics may be appropriate depending on the specific scenario.'
        }
    ],
    customResultRenderer: (score: number): string => {
        let probability = '';
        let recommendation = '';
        let alertClass: 'success' | 'warning' | 'danger' = 'success';

        if (score <= 0) {
            probability = '1-2.5%';
            recommendation = 'No further testing or antibiotics.';
            alertClass = 'success';
        } else if (score === 1) {
            probability = '5-10%';
            recommendation = 'No further testing or antibiotics.';
            alertClass = 'success';
        } else if (score === 2) {
            probability = '11-17%';
            recommendation = 'Optional rapid strep testing and/or culture.';
            alertClass = 'warning';
        } else if (score === 3) {
            probability = '28-35%';
            recommendation = 'Consider rapid strep testing and/or culture.';
            alertClass = 'warning';
        } else {
            probability = '51-53%';
            recommendation = 'Consider rapid strep testing and/or culture. Empiric antibiotics may be appropriate depending on the specific scenario.';
            alertClass = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: '/ 5 points',
            interpretation: `Probability of Strep: ${probability}`,
            alertClass: `ui-alert-${alertClass}`
        })}
            
            ${uiBuilder.createAlert({
            type: alertClass,
            message: `<strong>Recommendation:</strong> ${recommendation}`
        })}
        `;
    }
};

const baseCalculator = createScoringCalculator(centorConfig);

export const centor = {
    id: 'centor',
    title: centorConfig.title,
    description: centorConfig.description,

    generateHTML(): string {
        let html = baseCalculator.generateHTML();

        // Formula Section
        const formulaSection = uiBuilder.createSection({
            title: 'Formula',
            icon: '📐',
            content: `
                <p class="calculation-note mb-15">Addition of the selected points:</p>
                ${uiBuilder.createTable({
                headers: ['Criteria', 'Option', 'Points'],
                rows: [
                    ['<strong>Age</strong>', '3-14 years', '+1'],
                    ['', '15-44 years', '0'],
                    ['', '≥45 years', '-1'],
                    ['<strong>Exudate or swelling on tonsils</strong>', 'No', '0'],
                    ['', 'Yes', '+1'],
                    [
                        '<strong>Tender/swollen anterior cervical lymph nodes</strong>',
                        'No',
                        '0'
                    ],
                    ['', 'Yes', '+1'],
                    ['<strong>Temp >38°C (100.4°F)</strong>', 'No', '0'],
                    ['', 'Yes', '+1'],
                    ['<strong>Cough</strong>', 'Cough present', '0'],
                    ['', 'Cough absent', '+1']
                ]
            })}
            `
        });

        // Facts & Figures Section
        const factsSection = uiBuilder.createSection({
            title: 'Facts & Figures',
            icon: '📊',
            content: `
                <p class="mb-10"><strong>Interpretation:</strong></p>
                ${uiBuilder.createTable({
                headers: ['Centor Score', 'Probability of strep pharyngitis', 'Recommendation'],
                rows: [
                    ['0', '1-2.5%', 'No further testing or antibiotics.'],
                    ['1', '5-10%', 'No further testing or antibiotics.'],
                    ['2', '11-17%', 'Optional rapid strep testing and/or culture.'],
                    ['3', '28-35%', 'Consider rapid strep testing and/or culture.'],
                    [
                        '≥4',
                        '51-53%',
                        'Consider rapid strep testing and/or culture. Empiric antibiotics may be appropriate depending on the specific scenario.'
                    ]
                ],
                stickyFirstColumn: true
            })}
            `
        });

        html += formulaSection + factsSection;
        return html;
    },

    initialize(client: unknown, patient: any, container: HTMLElement): void {
        baseCalculator.initialize(client, patient, container);

        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            const setRadioValue = (name: string, value: string): void => {
                const radio = container.querySelector(
                    `input[name="${name}"][value="${value}"]`
                ) as HTMLInputElement | null;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            if (age >= 3 && age <= 14) {
                setRadioValue('centor-age', '1');
            } else if (age >= 45) {
                setRadioValue('centor-age', '-1');
            } else {
                setRadioValue('centor-age', '0');
            }
        }
    }
};
