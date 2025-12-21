import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const caprini = {
    id: 'caprini',
    title: 'Caprini Score for Venous Thromboembolism (2005)',
    description: 'Stratifies VTE risk in surgical patients, guiding prophylaxis decisions.',
    generateHTML: function (): string {
        const riskFactors = {
            '1 Point': [
                { id: 'caprini-age41', label: 'Age 41-60 years' },
                { id: 'caprini-minor-surgery', label: 'Minor surgery planned' },
                { id: 'caprini-major-surgery', label: 'Major open surgery (>45 min)' },
                { id: 'caprini-laparoscopy', label: 'Laparoscopic surgery (>45 min)' },
                { id: 'caprini-arthroscopy', label: 'Arthroscopic surgery' },
                { id: 'caprini-bmi', label: 'BMI > 25 kg/m²' },
                { id: 'caprini-swollen-legs', label: 'Swollen legs (current)' },
                { id: 'caprini-varicose', label: 'Varicose veins' },
                { id: 'caprini-sepsis', label: 'Sepsis (<1 month)' },
                { id: 'caprini-pneumonia', label: 'Serious lung disease incl. pneumonia (<1 month)' },
                { id: 'caprini-bed-rest', label: 'Confined to bed (>72 hours)' },
                { id: 'caprini-cast', label: 'Immobilizing plaster cast' },
                { id: 'caprini-central-venous', label: 'Central venous access' }
            ],
            '2 Points': [
                { id: 'caprini-age61', label: 'Age 61-74 years' },
                { id: 'caprini-malignancy', label: 'Malignancy (present or previous)' }
            ],
            '3 Points': [
                { id: 'caprini-age75', label: 'Age ≥ 75 years' },
                { id: 'caprini-history-vte', label: 'History of VTE' },
                { id: 'caprini-family-history-vte', label: 'Family history of VTE' },
                { id: 'caprini-thrombophilia', label: 'Thrombophilia (e.g., Factor V Leiden)' }
            ],
            '5 Points': [
                { id: 'caprini-stroke-paralysis', label: 'Stroke with paralysis (<1 month)' },
                { id: 'caprini-elective-hip-knee', label: 'Elective major lower extremity arthroplasty' },
                { id: 'caprini-hip-pelvis-fracture', label: 'Hip, pelvis, or leg fracture (<1 month)' },
                { id: 'caprini-spinal-cord-injury', label: 'Acute spinal cord injury (<1 month)' }
            ]
        };

        let sections: string[] = [];

        // Create Age Section manually to make it a single choice radio group
        const ageOptions = [
            { value: '0', label: 'Age < 41', checked: true },
            { value: '1', label: 'Age 41-60 (+1)' },
            { value: '2', label: 'Age 61-74 (+2)' },
            { value: '3', label: 'Age ≥ 75 (+3)' }
        ];

        sections.push(uiBuilder.createSection({
            title: 'Age',
            content: uiBuilder.createRadioGroup({
                name: 'caprini-age',
                options: ageOptions
            })
        }));

        for (const [points, factors] of Object.entries(riskFactors)) {
            // Skip age items as we handled them separately
            const filteredFactors = factors.filter(f => !f.id.includes('age'));

            if (filteredFactors.length > 0) {
                const sectionContent = filteredFactors.map(factor =>
                    uiBuilder.createRadioGroup({
                        name: factor.id,
                        label: factor.label,
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: String(points.split(' ')[0]), label: `Yes (+${points.split(' ')[0]})` }
                        ]
                    })
                ).join('');

                sections.push(uiBuilder.createSection({
                    title: `${points} Risk Factors`,
                    content: sectionContent
                }));
            }
        }

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${sections.join('')}
            
            <div id="caprini-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'caprini-result', title: 'Caprini Score Result' })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#caprini-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            try {
                let score = 0;

                // Sum all checked radio buttons
                const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked');
                radios.forEach(radio => {
                    score += parseInt(radio.value);
                });

                if (isNaN(score)) throw new Error("Calculation Error");

                let riskCategory = '';
                let recommendation = '';
                let alertClass = '';

                if (score === 0) {
                    riskCategory = 'Lowest Risk';
                    recommendation = 'Early ambulation.';
                    alertClass = 'ui-alert-success';
                } else if (score >= 1 && score <= 2) {
                    riskCategory = 'Low Risk';
                    recommendation = 'Mechanical prophylaxis (e.g., intermittent pneumatic compression devices).';
                    alertClass = 'ui-alert-info';
                } else if (score >= 3 && score <= 4) {
                    riskCategory = 'Moderate Risk';
                    recommendation = 'Pharmacologic prophylaxis (e.g., LMWH or UFH) OR Mechanical prophylaxis.';
                    alertClass = 'ui-alert-warning';
                } else {
                    riskCategory = 'High Risk';
                    recommendation = 'Pharmacologic prophylaxis (e.g., LMWH or UFH) AND Mechanical prophylaxis.';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#caprini-result') as HTMLElement;
                const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total Score',
                    value: score,
                    unit: 'points',
                    interpretation: riskCategory,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">💊</span>
                        <div class="ui-alert-content">
                            <strong>Recommendation:</strong> ${recommendation}
                        </div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error: any) {
                logError(error, { calculator: 'caprini', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error);
            }
        };

        // Pre-fill based on patient data
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 75) {
                setRadioValue('caprini-age', '3');
            } else if (age >= 61) {
                setRadioValue('caprini-age', '2');
            } else if (age >= 41) {
                setRadioValue('caprini-age', '1');
            } else {
                setRadioValue('caprini-age', '0');
            }
        }

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};
