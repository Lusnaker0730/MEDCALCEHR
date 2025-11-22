import { getObservation, getPatient, convertToMmolL, convertToMgDl } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';

export const sexShock = {
    id: 'sex-shock',
    title: 'SEX-SHOCK Risk Score for Cardiogenic Shock',
    description: 'Calculates the risk of in-hospital cardiogenic shock in patients with acute coronary syndrome (ACS).',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
                type: 'warning',
                message: '<strong>Validation Notice:</strong> Use caution in patients who have not undergone PCI.'
            })}

            ${uiBuilder.createSection({
                title: 'Patient Characteristics',
                icon: '👤',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-age',
                        label: 'Age > 70 years',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-sex',
                        label: 'Sex',
                        options: [
                            { value: '0', label: 'Male', checked: true },
                            { value: '1', label: 'Female' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Clinical Presentation',
                icon: '🏥',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-arrest',
                        label: 'Cardiac Arrest at Presentation',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-killip',
                        label: 'Killip Class III (Acute Pulmonary Edema)',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-hr',
                        label: 'Heart Rate > 90 bpm',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-bp',
                        label: 'Low BP (SBP < 125) & Pulse Pressure < 45 mmHg',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Angiographic & ECG Findings',
                icon: '💓',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-pci',
                        label: 'PCI Not Performed',
                        options: [
                            { value: '0', label: 'PCI Done', checked: true },
                            { value: '1', label: 'No PCI' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-timi',
                        label: 'Post-PCI TIMI Flow < 3',
                        options: [
                            { value: '0', label: 'No (TIMI 3)', checked: true },
                            { value: '1', label: 'Yes (< 3)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-left-main',
                        label: 'Left Main Culprit Lesion',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-st',
                        label: 'ST-Elevation on ECG',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-lvef',
                        label: 'Left Ventricular EF',
                        options: [
                            { value: '55', label: '> 50%' },
                            { value: '42.5', label: '35-50%' },
                            { value: '30', label: '< 35%', checked: true }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Laboratory Values',
                icon: '🧪',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'sex-shock-glycemia',
                        label: 'Glucose > 10 mmol/L (> 180 mg/dL)',
                        options: [
                            { value: '0', label: 'No', checked: true },
                            { value: '1', label: 'Yes' }
                        ]
                    })}
                    ${uiBuilder.createInput({ id: 'sex-shock-creatinine', label: 'Creatinine', unit: 'mg/dL', type: 'number', step: '0.1' })}
                    ${uiBuilder.createInput({ id: 'sex-shock-crp', label: 'C-Reactive Protein', unit: 'mg/L', type: 'number', step: '0.1' })}
                `
            })}

            ${uiBuilder.createResultBox({ id: 'sex-shock-result', title: 'In-Hospital Cardiogenic Shock Risk' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const getVal = name => parseInt(container.querySelector(`input[name="sex-shock-${name}"]:checked`).value);
            
            const age = getVal('age');
            const sex = getVal('sex'); // 0=Male, 1=Female
            const arrest = getVal('arrest');
            const killip = getVal('killip');
            const hr = getVal('hr');
            const bp = getVal('bp');
            const pci = getVal('pci'); // 1=No PCI
            const timi = getVal('timi');
            const leftMain = getVal('left-main');
            const st = getVal('st');
            const lvef = parseFloat(container.querySelector('input[name="sex-shock-lvef"]:checked').value);
            const glycemia = getVal('glycemia');
            const creatinine = parseFloat(container.querySelector('#sex-shock-creatinine').value) || 0;
            const crp = parseFloat(container.querySelector('#sex-shock-crp').value) || 0;

            const isFemale = sex === 1;

            const coeffs = isFemale ? {
                intercept: -7.0804, crp: 0.0915, creatinine: 0.6092, st: 0.0328,
                lvef35to50: -1.0953, lvefLess50: -1.9474, age: 0.1825,
                arrest: 1.2567, killip: 1.0503, hr: 0.2408, bp: 0.8192,
                glycemia: 0.4019, leftMain: 0.6397, timi: 0.7198
            } : {
                intercept: -7.9666, crp: 0.0696, creatinine: 0.6040, st: 0.7680,
                lvef35to50: -1.2722, lvefLess50: -2.0153, age: 0.2635,
                arrest: 1.1459, killip: 0.6849, hr: 0.5386, bp: 0.7062,
                glycemia: 0.8375, leftMain: 0.9036, timi: 0.4966
            };

            let Y = coeffs.intercept;
            if (crp > 0) Y += coeffs.crp * Math.log2(crp + 1);
            if (creatinine > 0) Y += coeffs.creatinine * Math.log2(creatinine * 88.4); // Convert to umol/L
            
            Y += coeffs.st * st;
            if (lvef === 55) Y += coeffs.lvefLess50; // >50% (Protective)
            else if (lvef === 42.5) Y += coeffs.lvef35to50; // 35-50%
            
            Y += coeffs.age * age;
            Y += coeffs.arrest * arrest;
            Y += coeffs.killip * killip;
            Y += coeffs.hr * hr;
            Y += coeffs.bp * bp;
            Y += coeffs.glycemia * glycemia;
            Y += coeffs.leftMain * leftMain;
            Y += coeffs.timi * timi;

            const risk = (1 / (1 + Math.exp(-Y))) * 100;

            let riskLevel = '';
            let alertType = 'info';

            if (risk < 5) {
                riskLevel = 'Low Risk';
                alertType = 'success';
            } else if (risk < 15) {
                riskLevel = 'Moderate Risk';
                alertType = 'warning';
            } else if (risk < 30) {
                riskLevel = 'High Risk';
                alertType = 'danger';
            } else {
                riskLevel = 'Very High Risk';
                alertType = 'danger';
            }

            const resultBox = container.querySelector('#sex-shock-result');
            resultBox.querySelector('.ui-result-content').innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'In-Hospital Cardiogenic Shock Risk',
                    value: risk.toFixed(1),
                    unit: '%',
                    interpretation: riskLevel,
                    alertClass: `ui-alert-${alertType}`
                })}
            `;
            resultBox.classList.add('show');
        };

        container.addEventListener('change', calculate);
        container.addEventListener('input', calculate);

        // Auto-populate
        if (patient) {
            if (patient.birthDate) {
                const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
                if (age > 70) uiBuilder.setRadioValue('sex-shock-age', '1');
            }
            if (patient.gender === 'female') uiBuilder.setRadioValue('sex-shock-sex', '1');
        }

        // Populate from FHIR (simplified)
        getObservation(client, '8867-4').then(obs => { // HR
            if (obs?.valueQuantity?.value > 90) uiBuilder.setRadioValue('sex-shock-hr', '1');
            calculate();
        });
        
        calculate();
    }
};
