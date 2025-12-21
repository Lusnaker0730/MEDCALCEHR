import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const gad7: CalculatorModule = {
    id: 'gad-7',
    title: 'GAD-7 (General Anxiety Disorder-7)',
    description: 'Screens for generalized anxiety disorder and monitors treatment response.',
    generateHTML: function () {
        const questions = [
            'Feeling nervous, anxious, or on edge',
            'Not being able to stop or control worrying',
            'Worrying too much about different things',
            'Trouble relaxing',
            'Being so restless that it is hard to sit still',
            'Becoming easily annoyed or irritable',
            'Feeling afraid as if something awful might happen'
        ];

        const sections = questions.map((q, index) =>
            uiBuilder.createSection({
                title: `${index + 1}. ${q}`,
                content: uiBuilder.createRadioGroup({
                    name: `gad7-q${index}`,
                    options: [
                        { value: '0', label: 'Not at all (+0)', checked: true },
                        { value: '1', label: 'Several days (+1)' },
                        { value: '2', label: 'More than half the days (+2)' },
                        { value: '3', label: 'Nearly every day (+3)' }
                    ]
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by the following problems?'
        })}
            
            ${sections}
            
            <div id="gad7-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'gad7-result', title: 'GAD-7 Result' })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#gad7-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                const radios = container.querySelectorAll('input[type="radio"]:checked');
                radios.forEach(radio => {
                    score += parseInt((radio as HTMLInputElement).value, 10);
                });

                let severity = '';
                let alertClass = '';
                let recommendation = '';

                if (score <= 4) {
                    severity = 'Minimal anxiety';
                    alertClass = 'ui-alert-success';
                    recommendation = 'Monitor, may not require treatment.';
                } else if (score <= 9) {
                    severity = 'Mild anxiety';
                    alertClass = 'ui-alert-info';
                    recommendation = 'Watchful waiting, reassessment in 4 weeks.';
                } else if (score <= 14) {
                    severity = 'Moderate anxiety';
                    alertClass = 'ui-alert-warning';
                    recommendation = 'Active treatment with counseling and/or pharmacotherapy.';
                } else {
                    severity = 'Severe anxiety';
                    alertClass = 'ui-alert-danger';
                    recommendation = 'Active treatment with pharmacotherapy and/or psychotherapy recommended.';
                }

                const resultBox = container.querySelector('#gad7-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score.toString(),
                            unit: '/ 21 points',
                            interpretation: severity,
                            alertClass: alertClass
                        })}
                            
                            <div class="ui-alert ${alertClass} mt-10">
                                <span class="ui-alert-icon">🩺</span>
                                <div class="ui-alert-content">
                                    <strong>Recommendation:</strong> ${recommendation}
                                </div>
                            </div>
                        `;
                        resultBox.classList.add('show');
                    }
                }
            } catch (error) {
                const errorContainer = container.querySelector('#gad7-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'gad-7', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};
