import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const getPoints = {
    sbp: v => {
        if (v < 90) return 28;
        if (v < 100) return 23;
        if (v < 110) return 18;
        if (v < 120) return 14;
        if (v < 130) return 9;
        if (v < 140) return 5;
        return 0;
    },
    bun: v => {
        if (v < 20) return 0;
        if (v < 30) return 4;
        if (v < 40) return 9;
        if (v < 50) return 13;
        if (v < 60) return 18;
        if (v < 70) return 22;
        return 28;
    },
    sodium: v => {
        if (v > 140) return 4;
        if (v > 135) return 2;
        return 0;
    },
    age: v => {
        if (v < 40) return 0;
        if (v < 50) return 7;
        if (v < 60) return 14;
        if (v < 70) return 21;
        if (v < 80) return 28;
        return 28;
    },
    hr: v => {
        if (v < 70) return 0;
        if (v < 80) return 1;
        if (v < 90) return 3;
        if (v < 100) return 5;
        if (v < 110) return 6;
        return 8;
    }
};

const getMortality = score => {
    if (score <= 32) return '<1%';
    if (score <= 41) return '1-2%';
    if (score <= 50) return '2-5%';
    if (score <= 56) return '5-10%';
    if (score <= 61) return '10-15%';
    if (score <= 65) return '15-20%';
    if (score <= 72) return '20-30%';
    if (score <= 74) return '30-40%';
    if (score <= 79) return '40-50%';
    return '>50%';
};

export const gwtgHf = {
    id: 'gwtg-hf',
    title: 'GWTG-Heart Failure Risk Score',
    description: 'Predicts in-hospital all-cause heart failure mortality.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
                type: 'warning',
                message: '<strong>IMPORTANT:</strong> This calculator includes inputs based on race, which may or may not provide better estimates.'
            })}

            ${uiBuilder.createSection({
                title: 'Clinical Parameters',
                content: `
                    ${uiBuilder.createInput({ id: 'gwtg-sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number', placeholder: '120' })}
                    ${uiBuilder.createInput({ id: 'gwtg-bun', label: 'BUN', unit: 'mg/dL', type: 'number', placeholder: '30' })}
                    ${uiBuilder.createInput({ id: 'gwtg-sodium', label: 'Sodium', unit: 'mEq/L', type: 'number', placeholder: '140' })}
                    ${uiBuilder.createInput({ id: 'gwtg-age', label: 'Age', unit: 'years', type: 'number', placeholder: '65' })}
                    ${uiBuilder.createInput({ id: 'gwtg-hr', label: 'Heart Rate', unit: 'bpm', type: 'number', placeholder: '80' })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Risk Factors',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'copd',
                        label: 'COPD History',
                        options: [
                            { value: '0', label: 'No (0)', checked: true },
                            { value: '2', label: 'Yes (+2)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'race',
                        label: 'Black Race',
                        helpText: 'Race may/may not provide better estimates of in-hospital mortality; optional',
                        options: [
                            { value: '0', label: 'No (0)', checked: true },
                            { value: '-3', label: 'Yes (-3)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createResultBox({ id: 'gwtg-hf-result', title: 'GWTG-HF Score Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const fields = {
            sbp: container.querySelector('#gwtg-sbp'),
            bun: container.querySelector('#gwtg-bun'),
            sodium: container.querySelector('#gwtg-sodium'),
            age: container.querySelector('#gwtg-age'),
            hr: container.querySelector('#gwtg-hr')
        };

        const calculate = () => {
            const copd = container.querySelector('input[name="copd"]:checked');
            const race = container.querySelector('input[name="race"]:checked');
            
            const allFilled = Object.values(fields).every(el => el && el.value !== '') && copd;

            if (!allFilled) {
                container.querySelector('#gwtg-hf-result').classList.remove('show');
                return;
            }

            let score = 0;
            score += getPoints.sbp(parseFloat(fields.sbp.value));
            score += getPoints.bun(parseFloat(fields.bun.value));
            score += getPoints.sodium(parseFloat(fields.sodium.value));
            score += getPoints.age(parseFloat(fields.age.value));
            score += getPoints.hr(parseFloat(fields.hr.value));
            score += parseInt(copd.value);
            if (race) {
                score += parseInt(race.value);
            }

            const mortality = getMortality(score);

            let riskLevel = 'Low Risk';
            let alertType = 'success';
            
            if (mortality.includes('>50%') || mortality.includes('40-50') || mortality.includes('30-40')) {
                riskLevel = 'High Risk';
                alertType = 'danger';
            } else if (mortality.includes('20-30') || mortality.includes('15-20') || mortality.includes('10-15')) {
                riskLevel = 'Moderate Risk';
                alertType = 'warning';
            }

            const resultBox = container.querySelector('#gwtg-hf-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'GWTG-HF Score',
                    value: score,
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createResultItem({
                    label: 'In-hospital Mortality',
                    value: mortality,
                    alertClass: `ui-alert-${alertType}`
                })}
            `;
            resultBox.classList.add('show');
        };

        if (patient && patient.birthDate) {
            fields.age.value = calculateAge(patient.birthDate);
        }
        getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
            if (obs && obs.valueQuantity) fields.sbp.value = obs.valueQuantity.value.toFixed(0);
            calculate();
        });
        getMostRecentObservation(client, LOINC_CODES.BUN).then(obs => {
            if (obs && obs.valueQuantity) fields.bun.value = obs.valueQuantity.value.toFixed(0);
            calculate();
        });
        getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
            if (obs && obs.valueQuantity) fields.sodium.value = obs.valueQuantity.value.toFixed(0);
            calculate();
        });
        getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
            if (obs && obs.valueQuantity) fields.hr.value = obs.valueQuantity.value.toFixed(0);
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        calculate();
    }
};
