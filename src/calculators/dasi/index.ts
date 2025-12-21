import { uiBuilder } from '../../ui-builder.js';
import { logError, displayError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

interface ActivityItem {
    id: string;
    label: string;
    weight: number;
}

export const dasi: CalculatorModule = {
    id: 'dasi',
    title: 'Duke Activity Status Index (DASI)',
    description: 'Estimates functional capacity.',
    generateHTML: function () {
        const activities: ActivityItem[] = [
            { id: 'care', label: 'Can you take care of yourself, (i.e., eating, dressing, bathing or using the toilet)?', weight: 2.75 },
            { id: 'walk-indoors', label: 'Can you walk indoors, such as around your house?', weight: 1.75 },
            { id: 'walk-flat', label: 'Can you walk a block or two on level ground?', weight: 2.75 },
            { id: 'climb-stairs', label: 'Can you climb a flight of stairs or walk up a hill?', weight: 5.5 },
            { id: 'run', label: 'Can you run a short distance?', weight: 8.0 },
            { id: 'light-housework', label: 'Can you do light work around the house like dusting or washing dishes?', weight: 2.7 },
            { id: 'moderate-housework', label: 'Can you do moderate work around the house like vacuuming, sweeping floors or carrying in groceries?', weight: 3.5 },
            { id: 'heavy-housework', label: 'Can you do heavy work around the house like scrubbing floors or lifting or moving heavy furniture?', weight: 8.0 },
            { id: 'yardwork', label: 'Can you do yardwork like raking leaves, weeding or pushing a power mower?', weight: 4.5 },
            { id: 'sex', label: 'Can you have sexual relations?', weight: 5.25 },
            { id: 'recreation-mild', label: 'Can you participate in mild recreational activities like bowling or dancing?', weight: 6.0 },
            { id: 'recreation-strenuous', label: 'Can you participate in strenuous sports like swimming, singles tennis, football, basketball or skiing?', weight: 7.5 }
        ];

        const questionsHTML = activities.map(act =>
            uiBuilder.createCheckbox({
                id: `dasi-${act.id}`,
                label: act.label,
                value: act.weight.toString()
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Please check all activities you are able to perform:'
        })}
            
            ${uiBuilder.createSection({
            title: 'Activity Assessment',
            icon: '🏃',
            content: questionsHTML
        })}
            
            <div id="dasi-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'dasi-result', title: 'DASI Result' })}
            
            <div class="info-section mt-20">
                <h4>📚 Interpretation</h4>
                <ul class="info-list">
                    <li><strong>Poor:</strong> < 4 METs</li>
                    <li><strong>Moderate:</strong> 4 - 7 METs</li>
                    <li><strong>Good:</strong> > 7 METs</li>
                </ul>
                <div class="text-sm text-muted mt-15">
                    <strong>Formula:</strong><br>
                    VO₂peak = (0.43 × DASI) + 9.6 mL/kg/min<br>
                    METs = VO₂peak / 3.5
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#dasi-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            try {
                let score = 0;
                container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked').forEach(box => {
                    score += parseFloat(box.value);
                });

                if (isNaN(score)) throw new Error("Calculation Error");

                const vo2peak = 0.43 * score + 9.6;
                const mets = vo2peak / 3.5;

                let interpretation = '';
                let alertClass = '';

                if (mets < 4) {
                    interpretation = 'Poor functional capacity';
                    alertClass = 'ui-alert-danger';
                } else if (mets < 7) {
                    interpretation = 'Moderate functional capacity';
                    alertClass = 'ui-alert-warning';
                } else {
                    interpretation = 'Good functional capacity';
                    alertClass = 'ui-alert-success';
                }

                const resultBox = container.querySelector('#dasi-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'DASI Score',
                            value: score.toFixed(2),
                            unit: '/ 58.2 points'
                        })}
                            ${uiBuilder.createResultItem({
                            label: 'Estimated VO₂ peak',
                            value: vo2peak.toFixed(1),
                            unit: 'mL/kg/min'
                        })}
                            ${uiBuilder.createResultItem({
                            label: 'Estimated Peak METs',
                            value: mets.toFixed(1),
                            unit: '',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }

            } catch (error) {
                logError(error as Error, { calculator: 'dasi', action: 'calculate' });
                const errorContainer = container.querySelector('#dasi-error-container');
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
            }
        };

        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });

        calculate();
    }
};
