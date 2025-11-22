import { uiBuilder } from '../../ui-builder.js';

export const kawasaki = {
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

            ${uiBuilder.createResultBox({ id: 'kawasaki-result', title: 'Diagnostic Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const fever = container.querySelector('input[name="kawasaki-fever"]:checked')?.value === '1';
            
            const features = [
                'kawasaki-extrem',
                'kawasaki-exanthem',
                'kawasaki-conjunctival',
                'kawasaki-oral',
                'kawasaki-lymph'
            ];
            
            let featureCount = 0;
            features.forEach(feature => {
                if (container.querySelector(`input[name="${feature}"]:checked`)?.value === '1') {
                    featureCount++;
                }
            });

            const resultBox = container.querySelector('#kawasaki-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            let interpretation = '';
            let alertType = 'info';

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
            resultBox.classList.add('show');
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};
