import { uiBuilder } from '../../ui-builder.js';

export const phq9 = {
    id: 'phq-9',
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    description: 'Screens for depression and monitors treatment response.',
    generateHTML: function () {
        const questions = [
            'Little interest or pleasure in doing things',
            'Feeling down, depressed, or hopeless',
            'Trouble falling or staying asleep, or sleeping too much',
            'Feeling tired or having little energy',
            'Poor appetite or overeating',
            'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
            'Trouble concentrating on things, such as reading the newspaper or watching television',
            'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
            'Thoughts that you would be better off dead or of hurting yourself in some way'
        ];

        const sections = questions.map((q, i) => 
            uiBuilder.createSection({
                title: `${i + 1}. ${q}`,
                content: uiBuilder.createRadioGroup({
                    name: `phq9-q${i}`,
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
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                </div>
            </div>
            
            ${sections}
            
            ${uiBuilder.createResultBox({ id: 'phq9-result', title: 'PHQ-9 Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            let score = 0;
            const radios = container.querySelectorAll('input[type="radio"]:checked');
            radios.forEach(radio => {
                score += parseInt(radio.value);
            });

            let severity = '';
            let alertClass = '';
            let recommendation = '';
            
            if (score <= 4) {
                severity = 'Minimal depression';
                alertClass = 'ui-alert-success';
                recommendation = 'Monitor, may not require treatment.';
            } else if (score <= 9) {
                severity = 'Mild depression';
                alertClass = 'ui-alert-info';
                recommendation = 'Consider counseling, follow-up, and/or pharmacotherapy.';
            } else if (score <= 14) {
                severity = 'Moderate depression';
                alertClass = 'ui-alert-warning';
                recommendation = 'Consider counseling, follow-up, and/or pharmacotherapy.';
            } else if (score <= 19) {
                severity = 'Moderately severe depression';
                alertClass = 'ui-alert-danger';
                recommendation = 'Active treatment with pharmacotherapy and/or psychotherapy recommended.';
            } else {
                severity = 'Severe depression';
                alertClass = 'ui-alert-danger';
                recommendation = 'Active treatment with pharmacotherapy and/or psychotherapy recommended.';
            }

            const resultBox = container.querySelector('#phq9-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: '/ 27 points',
                    interpretation: severity,
                    alertClass: alertClass
                })}
                
                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">🧠</span>
                    <div class="ui-alert-content">
                        <strong>Recommendation:</strong> ${recommendation}
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};