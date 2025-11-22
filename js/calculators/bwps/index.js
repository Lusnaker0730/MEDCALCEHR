import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const bwps = {
    id: 'bwps',
    title: 'Burch-Wartofsky Point Scale (BWPS) for Thyrotoxicosis',
    description: 'Predicts likelihood that biochemical thyrotoxicosis is thyroid storm.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: '<strong>INSTRUCTIONS:</strong> Use in patients >18 years old with biochemical thyrotoxicosis.'
            })}
            
            ${uiBuilder.createSection({
                title: 'Clinical Parameters',
                content: `
                    ${uiBuilder.createSelect({
                        id: 'bwps-temp',
                        label: 'Temperature °F (°C)',
                        options: [
                            { value: '0', label: '<99' },
                            { value: '5', label: '99-99.9 (37.2-37.7)' },
                            { value: '10', label: '100-100.9 (37.8-38.2)' },
                            { value: '15', label: '101-101.9 (38.3-38.8)' },
                            { value: '20', label: '102-102.9 (38.9-39.2)' },
                            { value: '25', label: '103-103.9 (39.3-39.9)' },
                            { value: '30', label: '≥104.0 (≥40.0)' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-cns',
                        label: 'Central nervous system effects',
                        options: [
                            { value: '0', label: 'Absent' },
                            { value: '10', label: 'Mild (agitation)' },
                            { value: '20', label: 'Moderate (delirium, psychosis, extreme lethargy)' },
                            { value: '30', label: 'Severe (seizures, coma)' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-gi',
                        label: 'Gastrointestinal-hepatic dysfunction',
                        options: [
                            { value: '0', label: 'Absent' },
                            { value: '10', label: 'Moderate (diarrhea, nausea/vomiting, abdominal pain)' },
                            { value: '20', label: 'Severe (unexplained jaundice)' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-hr',
                        label: 'Heart Rate (beats/minute)',
                        options: [
                            { value: '0', label: '<90' },
                            { value: '5', label: '90-109' },
                            { value: '10', label: '110-119' },
                            { value: '15', label: '120-129' },
                            { value: '20', label: '130-139' },
                            { value: '25', label: '≥140' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-chf',
                        label: 'Congestive Heart Failure',
                        options: [
                            { value: '0', label: 'Absent' },
                            { value: '5', label: 'Mild (pedal edema)' },
                            { value: '10', label: 'Moderate (bibasilar rales)' },
                            { value: '15', label: 'Severe (pulmonary edema)' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-afib',
                        label: 'Atrial fibrillation present',
                        options: [
                            { value: '0', label: 'No' },
                            { value: '10', label: 'Yes' }
                        ]
                    })}
                    
                    ${uiBuilder.createSelect({
                        id: 'bwps-precip',
                        label: 'Precipitating event',
                        options: [
                            { value: '0', label: 'No' },
                            { value: '10', label: 'Yes' }
                        ]
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'bwps-result', title: 'BWPS Result' })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>📚 Reference</h4>
                    <p>Burch, H. B., & Wartofsky, L. (1993). Life-threatening thyrotoxicosis. Thyroid storm. <em>Endocrinology and metabolism clinics of North America</em>, 22(2), 263-277.</p>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        const fields = ['temp', 'cns', 'gi', 'hr', 'chf', 'afib', 'precip'];
        
        const calculate = () => {
            let score = 0;
            let allAnswered = true;
            fields.forEach(id => {
                const el = container.querySelector(`#bwps-${id}`);
                if (el.value === '') {
                    allAnswered = false;
                } else {
                    score += parseInt(el.value);
                }
            });

            const resultBox = container.querySelector('#bwps-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            // if (!allAnswered) {
            //     resultBox.classList.remove('show');
            //     return;
            // }

            let interpretation = '';
            let alertType = 'info';
            
            if (score >= 45) {
                interpretation = 'Highly suggestive of thyroid storm';
                alertType = 'danger';
            } else if (score >= 25) {
                interpretation = 'Suggests impending storm';
                alertType = 'warning';
            } else {
                interpretation = 'Unlikely to represent thyroid storm';
                alertType = 'success';
            }

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Total Score',
                    value: score,
                    unit: 'points',
                    interpretation: interpretation,
                    alertClass: `ui-alert-${alertType}`
                })}
            `;
            resultBox.classList.add('show');
        };

        // Auto-populate data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs && obs.valueQuantity) {
                    let tempF = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit;
                    if (unit === 'Cel' || unit === 'C' || unit === 'degC') {
                         tempF = (tempF * 9/5) + 32;
                    }

                    const tempSelect = container.querySelector('#bwps-temp');
                    if (tempF < 99) tempSelect.value = '0';
                    else if (tempF < 100) tempSelect.value = '5';
                    else if (tempF < 101) tempSelect.value = '10';
                    else if (tempF < 102) tempSelect.value = '15';
                    else if (tempF < 103) tempSelect.value = '20';
                    else if (tempF < 104) tempSelect.value = '25';
                    else tempSelect.value = '30';
                }
                calculate();
            });
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs && obs.valueQuantity) {
                    const hr = obs.valueQuantity.value;
                    const hrSelect = container.querySelector('#bwps-hr');
                    if (hr < 90) hrSelect.value = '0';
                    else if (hr < 110) hrSelect.value = '5';
                    else if (hr < 120) hrSelect.value = '10';
                    else if (hr < 130) hrSelect.value = '15';
                    else if (hr < 140) hrSelect.value = '20';
                    else hrSelect.value = '25';
                }
                calculate();
            });
        }

        fields.forEach(id => {
            container.querySelector(`#bwps-${id}`).addEventListener('change', calculate);
        });

        calculate();
    }
};
