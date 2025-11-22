import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const paduaVTE = {
    id: 'padua-vte',
    title: 'Padua Prediction Score for Risk of VTE',
    description: 'Determines anticoagulation need in hospitalized patients by risk of VTE.',
    generateHTML: function () {
        const riskFactors = [
            { id: 'padua-cancer', label: 'Active cancer', points: 3 },
            { id: 'padua-prev-vte', label: 'Previous VTE (excluding superficial vein thrombosis)', points: 3 },
            { id: 'padua-mobility', label: 'Reduced mobility (bedrest with bathroom privileges for ≥3 days)', points: 3 },
            { id: 'padua-thromb', label: 'Known thrombophilic condition', points: 3 },
            { id: 'padua-trauma', label: 'Recent (≤1 month) trauma and/or surgery', points: 2 },
            { id: 'padua-age', label: 'Age ≥70 years', points: 1 },
            { id: 'padua-heart-resp', label: 'Heart and/or respiratory failure', points: 1 },
            { id: 'padua-mi-stroke', label: 'Acute MI or ischemic stroke', points: 1 },
            { id: 'padua-infection', label: 'Acute infection and/or rheumatologic disorder', points: 1 },
            { id: 'padua-obesity', label: 'Obesity (BMI ≥30 kg/m²)', points: 1 },
            { id: 'padua-hormonal', label: 'Ongoing hormonal treatment', points: 1 }
        ];

        const inputs = uiBuilder.createSection({
            title: 'Risk Factors',
            content: riskFactors.map(factor => 
                uiBuilder.createRadioGroup({
                    name: factor.id,
                    label: factor.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: factor.points.toString(), label: `Yes (+${factor.points})` }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${inputs}
            
            ${uiBuilder.createResultBox({ id: 'padua-result', title: 'Padua Score Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            let score = 0;
            const radios = container.querySelectorAll('input[type="radio"]:checked');
            
            radios.forEach(radio => {
                score += parseInt(radio.value);
            });

            let alertClass = '';
            let riskLevel = '';
            let recommendation = '';
            let type = '';

            if (score >= 4) {
                alertClass = 'ui-alert-danger';
                riskLevel = 'High Risk for VTE';
                recommendation = 'Pharmacologic prophylaxis is recommended.';
                type = 'danger';
            } else {
                alertClass = 'ui-alert-success';
                riskLevel = 'Low Risk for VTE';
                recommendation = 'Pharmacologic prophylaxis may not be necessary.';
                type = 'success';
            }

            const resultBox = container.querySelector('#padua-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                
                ${uiBuilder.createAlert({
                    type: type === 'danger' ? 'warning' : 'info',
                    message: `<strong>Recommendation:</strong> ${recommendation}`,
                    icon: type === 'danger' ? '⚠️' : '✓'
                })}
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 70) {
                setRadioValue('padua-age', '1');
            }
        }

        // Auto-populate BMI
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
                if (obs?.valueQuantity?.value >= 30) {
                    setRadioValue('padua-obesity', '1');
                }
            });
        }

        // Initial calculation
        calculate();
    }
};