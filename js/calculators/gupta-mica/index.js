import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
export const guptaMica = {
    id: 'gupta-mica',
    title: 'Gupta Perioperative Risk for Myocardial Infarction or Cardiac Arrest (MICA)',
    description: 'Predicts risk of MI or cardiac arrest after surgery. Formula: Cardiac risk, % = [1/(1+e^-x)] × 100 where x = -5.25 + sum of selected variables.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Patient Demographics',
            content: uiBuilder.createInput({
                id: 'mica-age',
                label: 'Age',
                unit: 'years',
                type: 'number',
                placeholder: 'Enter age'
            })
        })}

            ${uiBuilder.createSection({
            title: 'Clinical Status',
            content: `
                    ${uiBuilder.createSelect({
                id: 'mica-status',
                label: 'Functional Status',
                options: [
                    { value: '0', label: 'Independent' },
                    { value: '0.65', label: 'Partially Dependent' },
                    { value: '1.03', label: 'Totally Dependent' }
                ]
            })}
                    ${uiBuilder.createSelect({
                id: 'mica-asa',
                label: 'ASA Class',
                helpText: 'Physical status classification',
                options: [
                    { value: '-6.17', label: 'Class 1 - Normal healthy patient' },
                    { value: '-3.29', label: 'Class 2 - Mild systemic disease' },
                    { value: '1.80', label: 'Class 3 - Severe systemic disease' },
                    { value: '4.29', label: 'Class 4 - Severe systemic disease (threat to life)' },
                    { value: '0', label: 'Class 5 - Moribund' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Laboratory Values',
            content: uiBuilder.createInput({
                id: 'mica-creat',
                label: 'Creatinine',
                unit: 'mg/dL',
                type: 'number',
                step: 0.1,
                placeholder: 'Enter creatinine'
            })
        })}

            ${uiBuilder.createSection({
            title: 'Type of Procedure',
            content: uiBuilder.createSelect({
                id: 'mica-procedure',
                label: 'Surgical Procedure Type',
                options: [
                    { value: '-0.74', label: 'Urology' },
                    { value: '-1.63', label: 'Breast' },
                    { value: '-0.25', label: 'Bariatric' },
                    { value: '0', label: 'Hernia (ventral, inguinal, femoral)' },
                    { value: '0.14', label: 'Skin' },
                    { value: '0.59', label: 'Neck (thyroid/parathyroid)' },
                    { value: '0.59', label: 'Gallbladder, appendix, intestine, or colon' },
                    { value: '0.60', label: 'Orthopedic and non-vascular extremity' },
                    { value: '0.63', label: 'Non-neurological thoracic' },
                    { value: '0.71', label: 'ENT (except thyroid/parathyroid)' },
                    { value: '0.74', label: 'Spine' },
                    { value: '0.96', label: 'Peripheral vascular' },
                    { value: '1.13', label: 'Other abdominal' },
                    { value: '1.14', label: 'Intestinal' },
                    { value: '1.31', label: 'Cardiac' },
                    { value: '1.39', label: 'Foregut or hepatopancreaticobiliary' },
                    { value: '1.48', label: 'Brain' }
                ]
            })
        })}

            ${uiBuilder.createResultBox({ id: 'mica-result', title: 'Gupta MICA Risk Assessment' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const ageInput = container.querySelector('#mica-age');
        const statusSelect = container.querySelector('#mica-status');
        const asaSelect = container.querySelector('#mica-asa');
        const creatInput = container.querySelector('#mica-creat');
        const procedureSelect = container.querySelector('#mica-procedure');
        const resultEl = container.querySelector('#mica-result');
        const calculate = () => {
            const age = parseInt(ageInput.value);
            const functionalStatus = parseFloat(statusSelect.value);
            const asaClass = parseFloat(asaSelect.value);
            const creat = parseFloat(creatInput.value);
            const procedure = parseFloat(procedureSelect.value);
            if (isNaN(age) || isNaN(creat)) {
                if (resultEl)
                    resultEl.classList.remove('show');
                return;
            }
            let x = -5.25;
            x += age * 0.02;
            x += functionalStatus;
            x += asaClass;
            if (creat >= 1.5) {
                x += 0.61;
            }
            x += procedure;
            const risk = (1 / (1 + Math.exp(-x))) * 100;
            const riskPercent = risk.toFixed(2);
            let riskLevel = 'Low Risk';
            let riskDescription = 'Low risk of postoperative MI or cardiac arrest';
            let alertType = 'success';
            if (risk > 5) {
                riskLevel = 'High Risk';
                riskDescription = 'High risk - Consider risk modification strategies';
                alertType = 'danger';
            }
            else if (risk > 2) {
                riskLevel = 'Intermediate Risk';
                riskDescription = 'Intermediate risk - Consider perioperative optimization';
                alertType = 'warning';
            }
            if (resultEl) {
                const resultContent = resultEl.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'Cardiac Risk',
                        value: riskPercent,
                        unit: '%',
                        interpretation: riskLevel,
                        alertClass: `ui-alert-${alertType}`
                    })}
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: riskDescription
                    })}
                        ${uiBuilder.createSection({
                        title: 'Formula Components',
                        content: `
                                <div class="text-sm text-muted">
                                    <p>Age Component: ${(age * 0.02).toFixed(2)}</p>
                                    <p>Functional Status: ${functionalStatus.toFixed(2)}</p>
                                    <p>ASA Class: ${asaClass.toFixed(2)}</p>
                                    <p>Creatinine (≥1.5 mg/dL): ${creat >= 1.5 ? '0.61' : '0.00'}</p>
                                    <p>Procedure Type: ${procedure.toFixed(2)}</p>
                                    <p><strong>X Value: ${x.toFixed(2)}</strong></p>
                                </div>
                            `
                    })}
                    `;
                }
                resultEl.classList.add('show');
            }
        };
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age > 0)
                ageInput.value = age.toString();
        }
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs && obs.valueQuantity) {
                    let crValue = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                        crValue = crValue / 88.4;
                    }
                    creatInput.value = crValue.toFixed(2);
                    calculate();
                    stalenessTracker.trackObservation('#mica-creat', obs, LOINC_CODES.CREATININE, 'Creatinine');
                }
            });
        }
        container.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });
        calculate();
    }
};
