import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';

export const ariscat = {
    id: 'ariscat',
    title: 'ARISCAT Score for Postoperative Pulmonary Complications',
    description:
        'Predicts risk of pulmonary complications after surgery, including respiratory failure.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
                title: 'Patient Factors',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-age',
                        label: 'Age, years',
                        options: [
                            { value: '0', label: '≤50 (0)', checked: true },
                            { value: '3', label: '51-80 (+3)' },
                            { value: '16', label: '>80 (+16)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-spo2',
                        label: 'Preoperative SpO₂',
                        options: [
                            { value: '0', label: '≥96% (0)', checked: true },
                            { value: '8', label: '91-95% (+8)' },
                            { value: '24', label: '≤90% (+24)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-resp',
                        label: 'Respiratory infection in the last month',
                        helpText: 'Either upper or lower (i.e., URI, bronchitis, pneumonia), with fever and antibiotic treatment',
                        options: [
                            { value: '0', label: 'No (0)', checked: true },
                            { value: '17', label: 'Yes (+17)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-anemia',
                        label: 'Preoperative anemia (Hgb ≤10 g/dL)',
                        options: [
                            { value: '0', label: 'No (0)', checked: true },
                            { value: '11', label: 'Yes (+11)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Surgical Factors',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-site',
                        label: 'Surgical incision',
                        options: [
                            { value: '0', label: 'Peripheral (0)', checked: true },
                            { value: '15', label: 'Upper abdominal (+15)' },
                            { value: '24', label: 'Intrathoracic (+24)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-duration',
                        label: 'Duration of surgery',
                        options: [
                            { value: '0', label: '<2 hrs (0)', checked: true },
                            { value: '16', label: '2-3 hrs (+16)' },
                            { value: '23', label: '>3 hrs (+23)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'ariscat-emergency',
                        label: 'Emergency procedure?',
                        options: [
                            { value: '0', label: 'No (0)', checked: true },
                            { value: '8', label: 'Yes (+8)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createResultBox({ id: 'ariscat-result', title: 'ARISCAT Score Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const groups = ['ariscat-age', 'ariscat-spo2', 'ariscat-resp', 'ariscat-anemia', 'ariscat-site', 'ariscat-duration', 'ariscat-emergency'];
            let score = 0;

            groups.forEach(groupName => {
                const checkedRadio = container.querySelector(`input[name="${groupName}"]:checked`);
                if (checkedRadio) {
                    score += parseInt(checkedRadio.value);
                }
            });

            let riskCategory = '';
            let riskInfo = '';
            let alertType = 'success';

            if (score < 26) {
                riskCategory = 'Low risk';
                riskInfo = '1.6%';
                alertType = 'success';
            } else if (score <= 44) {
                riskCategory = 'Intermediate risk';
                riskInfo = '13.3%';
                alertType = 'warning';
            } else {
                riskCategory = 'High risk';
                riskInfo = '42.1%';
                alertType = 'danger';
            }

            const resultBox = container.querySelector('#ariscat-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'ARISCAT Score',
                    value: score,
                    unit: 'points',
                    interpretation: riskCategory,
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createResultItem({
                    label: 'Pulmonary Complication Risk',
                    value: riskInfo,
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createAlert({
                    type: alertType,
                    message: 'Risk of in-hospital post-op pulmonary complications (respiratory failure, infection, pleural effusion, atelectasis, pneumothorax, bronchospasm, aspiration pneumonitis).'
                })}
            `;
            resultBox.classList.add('show');
        };

        if (patient && patient.birthDate) {
            const patientAge = calculateAge(patient.birthDate);
            let ageValue = '0';
            if (patientAge > 80) ageValue = '16';
            else if (patientAge > 50) ageValue = '3';
            
            const ageRadio = container.querySelector(`input[name="ariscat-age"][value="${ageValue}"]`);
            if (ageRadio) {
                ageRadio.checked = true;
            }
        }

        container.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'radio') {
                calculate();
            }
        });

        calculate();
    }
};
