import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const graceAcs = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description:
        'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
    generateHTML: function () {
        const vitalsSection = uiBuilder.createSection({
            title: 'Vital Signs & Demographics',
            icon: '🌡️',
            content: [
                uiBuilder.createInput({
                    id: 'grace-age',
                    label: 'Age',
                    type: 'number',
                    placeholder: 'Enter age',
                    unit: 'years'
                }),
                uiBuilder.createInput({
                    id: 'grace-hr',
                    label: 'Heart Rate',
                    type: 'number',
                    placeholder: 'Enter heart rate',
                    unit: 'bpm'
                }),
                uiBuilder.createInput({
                    id: 'grace-sbp',
                    label: 'Systolic BP',
                    type: 'number',
                    placeholder: 'Enter systolic BP',
                    unit: 'mmHg'
                }),
                uiBuilder.createInput({
                    id: 'grace-creatinine',
                    label: 'Creatinine',
                    type: 'number',
                    step: 0.1,
                    placeholder: 'Enter creatinine',
                    unit: 'mg/dL'
                })
            ].join('')
        });

        const clinicalSection = uiBuilder.createSection({
            title: 'Clinical Findings',
            icon: '🩺',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'grace-killip',
                    label: 'Killip Class (Heart Failure Classification)',
                    options: [
                        { value: '0', label: 'Class I - No heart failure', checked: true },
                        { value: '20', label: 'Class II - Mild HF (rales, S3)' },
                        { value: '39', label: 'Class III - Pulmonary edema' },
                        { value: '59', label: 'Class IV - Cardiogenic shock' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-cardiac-arrest',
                    label: 'Cardiac Arrest at Admission',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '39', label: 'Yes' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-st-deviation',
                    label: 'ST Segment Deviation',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '28', label: 'Yes' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-cardiac-enzymes',
                    label: 'Abnormal Cardiac Enzymes',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '14', label: 'Yes' }
                    ]
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${vitalsSection}
            ${clinicalSection}
            
            ${uiBuilder.createResultBox({ id: 'grace-result', title: 'GRACE ACS Risk Assessment' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const age = parseInt(container.querySelector('#grace-age').value);
            const hr = parseInt(container.querySelector('#grace-hr').value);
            const sbp = parseInt(container.querySelector('#grace-sbp').value);
            const creatinine = parseFloat(container.querySelector('#grace-creatinine').value);

            const killipRadio = container.querySelector('input[name="grace-killip"]:checked');
            const arrestRadio = container.querySelector('input[name="grace-cardiac-arrest"]:checked');
            const stRadio = container.querySelector('input[name="grace-st-deviation"]:checked');
            const enzymesRadio = container.querySelector('input[name="grace-cardiac-enzymes"]:checked');

            const killip = killipRadio ? parseInt(killipRadio.value) : 0;
            const arrest = arrestRadio ? parseInt(arrestRadio.value) : 0;
            const st = stRadio ? parseInt(stRadio.value) : 0;
            const enzymes = enzymesRadio ? parseInt(enzymesRadio.value) : 0;

            if (isNaN(age) || isNaN(hr) || isNaN(sbp) || isNaN(creatinine)) {
                container.querySelector('#grace-result').classList.remove('show');
                return;
            }

            let agePoints = 0;
            if (age >= 40 && age <= 49) agePoints = 18;
            else if (age >= 50 && age <= 59) agePoints = 36;
            else if (age >= 60 && age <= 69) agePoints = 55;
            else if (age >= 70 && age <= 79) agePoints = 73;
            else if (age >= 80) agePoints = 91;

            let hrPoints = 0;
            if (hr >= 50 && hr <= 69) hrPoints = 0;
            else if (hr >= 70 && hr <= 89) hrPoints = 3;
            else if (hr >= 90 && hr <= 109) hrPoints = 7;
            else if (hr >= 110 && hr <= 149) hrPoints = 13;
            else if (hr >= 150 && hr <= 199) hrPoints = 23;
            else if (hr >= 200) hrPoints = 36;

            let sbpPoints = 0;
            if (sbp >= 200) sbpPoints = 0;
            else if (sbp >= 160 && sbp <= 199) sbpPoints = 10;
            else if (sbp >= 140 && sbp <= 159) sbpPoints = 18;
            else if (sbp >= 120 && sbp <= 139) sbpPoints = 24;
            else if (sbp >= 100 && sbp <= 119) sbpPoints = 34;
            else if (sbp >= 80 && sbp <= 99) sbpPoints = 43;
            else if (sbp < 80) sbpPoints = 53;

            let crPoints = 0;
            if (creatinine >= 0 && creatinine <= 0.39) crPoints = 1;
            else if (creatinine >= 0.4 && creatinine <= 0.79) crPoints = 4;
            else if (creatinine >= 0.8 && creatinine <= 1.19) crPoints = 7;
            else if (creatinine >= 1.2 && creatinine <= 1.59) crPoints = 10;
            else if (creatinine >= 1.6 && creatinine <= 1.99) crPoints = 13;
            else if (creatinine >= 2.0 && creatinine <= 3.99) crPoints = 21;
            else if (creatinine >= 4.0) crPoints = 28;

            const totalScore = agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;

            let inHospitalMortality = '<1%';
            let riskLevel = 'Low Risk';
            let alertClass = 'ui-alert-success';
            let riskDescription = 'Low risk of in-hospital mortality';

            if (totalScore > 140) {
                inHospitalMortality = '>3%';
                riskLevel = 'High Risk';
                alertClass = 'ui-alert-danger';
                riskDescription = 'High risk of in-hospital mortality - Consider intensive monitoring and aggressive intervention';
            } else if (totalScore > 118) {
                inHospitalMortality = '1-3%';
                riskLevel = 'Intermediate Risk';
                alertClass = 'ui-alert-warning';
                riskDescription = 'Intermediate risk of in-hospital mortality - Close monitoring recommended';
            }

            const resultBox = container.querySelector('#grace-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total GRACE Score', 
                    value: totalScore, 
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                ${uiBuilder.createResultItem({ 
                    label: 'In-Hospital Mortality Risk', 
                    value: inHospitalMortality, 
                    alertClass: alertClass
                })}
                
                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">📋</span>
                    <div class="ui-alert-content">
                        <strong>Interpretation:</strong> ${riskDescription}
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate (only if client exists)
        if (client) {
            if (patient && patient.birthDate) {
                container.querySelector('#grace-age').value = calculateAge(patient.birthDate);
            }

            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs?.valueQuantity) container.querySelector('#grace-hr').value = Math.round(obs.valueQuantity.value);
            });

            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) container.querySelector('#grace-sbp').value = Math.round(obs.valueQuantity.value);
            });

            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                        val = val / 88.4;
                    }
                    container.querySelector('#grace-creatinine').value = val.toFixed(2);
                }
            });
            
            // Trigger calculation after a delay to allow async operations
            setTimeout(calculate, 1000);
        }
    }
};