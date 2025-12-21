import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const wellsDVT: CalculatorModule = {
    id: 'wells-dvt',
    title: "Wells' Criteria for DVT",
    description: 'Calculates risk of deep vein thrombosis (DVT) based on clinical criteria.',
    generateHTML: function () {
        const criteria = [
            { id: 'dvt-cancer', label: 'Active cancer (treatment or palliation within 6 months)', points: 1 },
            { id: 'dvt-paralysis', label: 'Paralysis, paresis, or recent plaster immobilization of the lower extremities', points: 1 },
            { id: 'dvt-bedridden', label: 'Recently bedridden > 3 days or major surgery within 12 weeks requiring general or regional anesthesia', points: 1 },
            { id: 'dvt-tenderness', label: 'Localized tenderness along the deep venous system', points: 1 },
            { id: 'dvt-swelling', label: 'Entire leg swollen', points: 1 },
            { id: 'dvt-calf', label: 'Calf swelling at least 3 cm larger than asymptomatic side', points: 1 },
            { id: 'dvt-pitting', label: 'Pitting edema confined to the symptomatic leg', points: 1 },
            { id: 'dvt-collateral', label: 'Collateral superficial veins (nonvaricose)', points: 1 },
            { id: 'dvt-previous', label: 'Previously documented DVT', points: 1 },
            { id: 'dvt-alternative', label: 'Alternative diagnosis at least as likely as DVT', points: -2 }
        ];

        const inputs = uiBuilder.createSection({
            title: 'Clinical Criteria',
            content: criteria.map(item =>
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: item.points.toString(), label: `Yes (${item.points > 0 ? '+' : ''}${item.points})` }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Select all criteria that apply to the patient. Score ranges from -2 to +9 points.'
        })}
            
            ${inputs}
            
            <div id="wells-dvt-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'wells-dvt-result', title: "Wells' DVT Score Results" })}
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. <em>Lancet</em>. 1997;350(9094):1795-1798.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#wells-dvt-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                const radios = container.querySelectorAll('input[type="radio"]:checked');
                radios.forEach(radio => {
                    score += parseInt((radio as HTMLInputElement).value, 10);
                });

                let risk = '';
                let alertClass = '';
                let interpretation = '';

                if (score >= 3) {
                    risk = 'High Risk';
                    alertClass = 'ui-alert-danger';
                    interpretation = 'DVT is likely. Ultrasound imaging of the lower extremity is recommended. Consider anticoagulation while awaiting results if bleeding risk is low.';
                } else if (score >= 1) {
                    risk = 'Moderate Risk';
                    alertClass = 'ui-alert-warning';
                    interpretation = 'Moderate probability of DVT. Consider D-dimer testing and/or ultrasound imaging based on clinical judgment and D-dimer availability.';
                } else {
                    risk = 'Low Risk';
                    alertClass = 'ui-alert-success';
                    interpretation = 'DVT is unlikely. Consider D-dimer testing. If D-dimer is negative, DVT can be safely excluded in most cases.';
                }

                const resultBox = container.querySelector('#wells-dvt-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score.toString(),
                            unit: 'points',
                            interpretation: risk,
                            alertClass: alertClass
                        })}
                        
                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">${score >= 3 ? '⚠️' : 'ℹ️'}</span>
                            <div class="ui-alert-content">
                                <strong>Recommendation:</strong> ${interpretation}
                            </div>
                        </div>
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#wells-dvt-error-container') as HTMLElement;
                if (errorContainer) {
                    displayError(errorContainer, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'wells-dvt', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};
