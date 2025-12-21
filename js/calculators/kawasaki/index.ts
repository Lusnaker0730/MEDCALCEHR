import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const kawasaki: CalculatorModule = {
    id: 'kawasaki',
    title: 'Kawasaki Disease Diagnostic Criteria',
    description: 'Diagnoses Kawasaki Disease based on clinical criteria.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Clinical Criteria',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-fever',
                label: 'Fever for ≥5 days',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-extrem',
                label: 'Changes in extremities',
                helpText: 'Acute: Erythema of palms/soles, edema of hands/feet. Subacute: Periungual peeling.',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-exanthem',
                label: 'Polymorphous exanthem',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-conjunctival',
                label: 'Bilateral bulbar conjunctival injection',
                helpText: 'Without exudate',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-oral',
                label: 'Changes in lips and oral cavity',
                helpText: 'Erythema, lips cracking, strawberry tongue',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'kawasaki-lymph',
                label: 'Cervical lymphadenopathy',
                helpText: '>1.5 cm diameter, usually unilateral',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                `
        })}

            <div id="kawasaki-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'kawasaki-result', title: 'Diagnostic Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#kawasaki-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const feverEl = container.querySelector('input[name="kawasaki-fever"]:checked') as HTMLInputElement;
                const fever = feverEl?.value === '1';

                const features = [
                    'kawasaki-extrem',
                    'kawasaki-exanthem',
                    'kawasaki-conjunctival',
                    'kawasaki-oral',
                    'kawasaki-lymph'
                ];

                let featureCount = 0;
                features.forEach(feature => {
                    const input = container.querySelector(`input[name="${feature}"]:checked`) as HTMLInputElement;
                    if (input && input.value === '1') {
                        featureCount++;
                    }
                });

                const resultBox = container.querySelector('#kawasaki-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');

                    let interpretation = '';
                    let alertType: 'info' | 'warning' | 'danger' = 'info';

                    if (!fever) {
                        interpretation = 'Fever for ≥5 days is required for diagnosis of classic Kawasaki Disease.';
                        alertType = 'warning';
                    } else if (featureCount >= 4) {
                        interpretation = 'Positive for Kawasaki Disease (Fever + ≥4 principal features).';
                        alertType = 'danger';
                    } else {
                        interpretation = `Criteria Not Met (Fever + ${featureCount}/4 features). Consider Incomplete Kawasaki Disease if clinical suspicion is high.`;
                        alertType = 'warning';
                    }

                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Principal Features Present',
                            value: `${featureCount} / 5`,
                            unit: ''
                        })}
                            ${uiBuilder.createAlert({
                            type: alertType,
                            message: interpretation
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#kawasaki-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'kawasaki', action: 'calculate' });
            }
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};
