import { getMostRecentObservation, calculateAge, getPatientConditions } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

const getPoints = {
    age: (v: number) => v * 0.08,
    ef: (v: number) => v * -0.05,
    sbp: (v: number) => v * -0.02,
    bmi: (v: number) => {
        if (v < 20) return 2;
        if (v >= 20 && v < 25) return 1;
        if (v >= 25 && v < 30) return 0;
        if (v >= 30) return -1;
        return 0;
    },
    creatinine: (v: number) => { // v in mg/dL
        if (v <= 0.9) return 0;
        if (v > 0.9 && v <= 1.3) return 1;
        if (v > 1.3 && v <= 2.2) return 3;
        if (v > 2.2) return 5;
        return 0;
    }
};

const getMortality = (score: number) => {
    const linearPredictor = 0.047 * (score - 21.6);
    const prob1yr = 1 - Math.pow(0.92, Math.exp(linearPredictor));
    const prob3yr = 1 - Math.pow(0.79, Math.exp(linearPredictor));
    return { prob1yr: (prob1yr * 100).toFixed(1), prob3yr: (prob3yr * 100).toFixed(1) };
};

export const maggic: CalculatorModule = {
    id: 'maggic-hf',
    title: 'MAGGIC Risk Calculator for Heart Failure',
    description: 'Estimates 1- and 3- year mortality in heart failure.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Use in adult patients (≥18 years). Use with caution in patients with reduced ejection fraction (not yet externally validated in this population).'
        })}
            
            ${uiBuilder.createSection({
            title: 'Patient Characteristics',
            icon: '👤',
            content: `
                    ${uiBuilder.createInput({ id: 'maggic-age', label: 'Age', unit: 'years', type: 'number' })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-gender',
                label: 'Gender',
                options: [
                    { value: '0', label: 'Female', checked: true },
                    { value: '1', label: 'Male (+1)' }
                ]
            })}
                    ${uiBuilder.createInput({ id: 'maggic-bmi', label: 'BMI', unit: 'kg/m²', type: 'number', step: 0.1, placeholder: 'Norm: 20-25' })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-smoker',
                label: 'Current Smoker',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes (+1)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Clinical Parameters',
            icon: '🩺',
            content: `
                    ${uiBuilder.createInput({ id: 'maggic-ef', label: 'Ejection Fraction', unit: '%', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'maggic-sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number', placeholder: 'Norm: 100-120' })}
                    ${uiBuilder.createInput({
                id: 'maggic-creatinine',
                label: 'Creatinine',
                type: 'number',
                step: 0.1,
                unit: 'mg/dL',
                unitToggle: {
                    type: 'creatinine',
                    units: ['mg/dL', 'µmol/L'],
                    default: 'mg/dL'
                },
                helpText: 'Uses mg/dL for calculation (conversion applied if needed)'
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-nyha',
                label: 'NYHA Class',
                options: [
                    { value: '0', label: 'Class I (No limitation)' },
                    { value: '2', label: 'Class II (Slight limitation) (+2)' },
                    { value: '6', label: 'Class III (Marked limitation) (+6)' },
                    { value: '8', label: 'Class IV (Unable to carry on any physical activity) (+8)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Comorbidities & History',
            icon: '🏥',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-diabetes',
                label: 'Diabetes',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '3', label: 'Yes (+3)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-copd',
                label: 'COPD',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '2', label: 'Yes (+2)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-hfdx',
                label: 'Heart failure first diagnosed ≥18 months ago',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '2', label: 'Yes (+2)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Medications',
            icon: '💊',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-bb',
                label: 'Beta Blocker',
                options: [
                    { value: '3', label: 'No (+3)', checked: true },
                    { value: '0', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'maggic-acei',
                label: 'ACEi/ARB',
                options: [
                    { value: '1', label: 'No (+1)', checked: true },
                    { value: '0', label: 'Yes' }
                ]
            })}
                `
        })}

            ${uiBuilder.createResultBox({ id: 'maggic-result', title: 'MAGGIC Risk Score' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const fields = {
            age: container.querySelector('#maggic-age') as HTMLInputElement,
            ef: container.querySelector('#maggic-ef') as HTMLInputElement,
            sbp: container.querySelector('#maggic-sbp') as HTMLInputElement,
            bmi: container.querySelector('#maggic-bmi') as HTMLInputElement,
            creatinine: container.querySelector('#maggic-creatinine') as HTMLInputElement
        };
        const radios = ['nyha', 'gender', 'smoker', 'diabetes', 'copd', 'hfdx', 'bb', 'acei'];
        const resultBox = container.querySelector('#maggic-result');

        const calculate = () => {
            const age = parseFloat(fields.age.value);
            const ef = parseFloat(fields.ef.value);
            const sbp = parseFloat(fields.sbp.value);
            const bmi = parseFloat(fields.bmi.value);
            const creatinine = UnitConverter.getStandardValue(fields.creatinine, 'mg/dL');

            const radioValues: { [key: string]: number } = {};
            let allRadiosChecked = true;
            radios.forEach(r => {
                const checked = container.querySelector(`input[name="maggic-${r}"]:checked`) as HTMLInputElement;
                if (checked) {
                    radioValues[r] = parseInt(checked.value);
                } else {
                    allRadiosChecked = false;
                }
            });

            if (isNaN(age) || isNaN(ef) || isNaN(sbp) || isNaN(bmi) || creatinine === null || isNaN(creatinine) || !allRadiosChecked) {
                if (resultBox) resultBox.classList.remove('show');
                return;
            }

            try {
                let score = 0;
                score += getPoints.age(age);
                score += getPoints.ef(ef);
                score += getPoints.sbp(sbp);
                score += getPoints.bmi(bmi);
                score += getPoints.creatinine(creatinine);

                Object.values(radioValues).forEach(val => score += val);

                const mortality = getMortality(score);

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total MAGGIC Score',
                            value: score.toFixed(1),
                            unit: 'points'
                        })}
                            ${uiBuilder.createResultItem({
                            label: '1-Year Mortality Risk',
                            value: `${mortality.prob1yr}%`,
                            alertClass: 'ui-alert-warning'
                        })}
                            ${uiBuilder.createResultItem({
                            label: '3-Year Mortality Risk',
                            value: `${mortality.prob3yr}%`,
                            alertClass: 'ui-alert-danger'
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'maggic', action: 'calculate' });
                // If there were a dedicated error container for maggic, we would use it.
                // Assuming one isn't explicitly defined in HTML string above, just logging for now
                // or could insert one implicitly. The template above didn't include one, so sticking to console log or could append alert.
            }
        };

        // Event listeners
        Object.values(fields).forEach(input => input.addEventListener('input', calculate));
        radios.forEach(r => {
            container.querySelectorAll(`input[name="maggic-${r}"]`).forEach(radio => {
                radio.addEventListener('change', calculate);
            });
        });

        // Auto-populate
        if (patient && patient.birthDate) {
            fields.age.value = calculateAge(patient.birthDate).toString();
        }
        if (patient && patient.gender) {
            uiBuilder.setRadioValue('maggic-gender', patient.gender === 'male' ? '1' : '0');
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.bmi.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                    stalenessTracker.trackObservation('#maggic-bmi', obs, LOINC_CODES.BMI, 'BMI');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.sbp.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                    stalenessTracker.trackObservation('#maggic-sbp', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    fields.creatinine.value = val.toFixed(2);
                    calculate();
                    stalenessTracker.trackObservation('#maggic-creatinine', obs, LOINC_CODES.CREATININE, 'Creatinine');
                }
            }).catch(e => console.warn(e));

            getPatientConditions(client, ['414990002', '195967001']).then(conditions => {
                const hasDiabetes = conditions.some((c: any) => c.code.coding.some((co: any) => co.code === '414990002'));
                if (hasDiabetes) uiBuilder.setRadioValue('maggic-diabetes', '3');

                const hasCopd = conditions.some((c: any) => c.code.coding.some((co: any) => co.code === '195967001'));
                if (hasCopd) uiBuilder.setRadioValue('maggic-copd', '2');

                calculate();
            });
        }
    }
};
