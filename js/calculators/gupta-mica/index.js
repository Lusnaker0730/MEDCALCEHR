/**
 * Gupta Perioperative Risk for Myocardial Infarction or Cardiac Arrest (MICA)
 *
 * 使用 createMixedInputCalculator 工廠函數遷移
 */
import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
const config = {
    id: 'gupta-mica',
    title: 'Gupta Perioperative Risk for Myocardial Infarction or Cardiac Arrest (MICA)',
    description: 'Predicts risk of MI or cardiac arrest after surgery. Formula: Cardiac risk, % = [1/(1+e^-x)] × 100 where x = -5.25 + sum of selected variables.',
    sections: [
        {
            title: 'Patient Demographics',
            inputs: [
                {
                    type: 'number',
                    id: 'mica-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'Enter age'
                }
            ]
        },
        {
            title: 'Clinical Status',
            inputs: [
                {
                    type: 'select',
                    id: 'mica-status',
                    label: 'Functional Status',
                    options: [
                        { value: '0', label: 'Independent' },
                        { value: '0.65', label: 'Partially Dependent' },
                        { value: '1.03', label: 'Totally Dependent' }
                    ]
                },
                {
                    type: 'select',
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
                }
            ]
        },
        {
            title: 'Laboratory Values',
            inputs: [
                {
                    type: 'number',
                    id: 'mica-creat',
                    label: 'Creatinine',
                    unit: 'mg/dL',
                    step: 0.1,
                    placeholder: 'Enter creatinine'
                }
            ]
        },
        {
            title: 'Type of Procedure',
            inputs: [
                {
                    type: 'select',
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
                }
            ]
        }
    ],
    resultTitle: 'Gupta MICA Risk Assessment',
    calculate: (values) => {
        const age = values['mica-age'];
        const creat = values['mica-creat'];
        if (age === null || creat === null) {
            return null;
        }
        const functionalStatus = parseFloat(values['mica-status'] || '0');
        const asaClass = parseFloat(values['mica-asa'] || '-6.17');
        const procedure = parseFloat(values['mica-procedure'] || '-0.74');
        let x = -5.25;
        x += age * 0.02;
        x += functionalStatus;
        x += asaClass;
        if (creat >= 1.5) {
            x += 0.61;
        }
        x += procedure;
        // 返回 x 值以便在結果渲染器中計算風險百分比
        // 使用一個技巧：返回 x 乘以一個大數，然後在渲染器中還原
        return x;
    },
    customResultRenderer: (x, values) => {
        const age = values['mica-age'];
        const creat = values['mica-creat'];
        const functionalStatus = parseFloat(values['mica-status'] || '0');
        const asaClass = parseFloat(values['mica-asa'] || '-6.17');
        const procedure = parseFloat(values['mica-procedure'] || '-0.74');
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
        return `
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
    },
    customInitialize: async (client, patient, container, calculate, setValue) => {
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        // Age from patient
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age > 0)
                setValue('mica-age', age.toString());
        }
        if (client) {
            try {
                const obs = await getMostRecentObservation(client, LOINC_CODES.CREATININE);
                if (obs?.valueQuantity) {
                    let crValue = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                        crValue = crValue / 88.4;
                    }
                    setValue('mica-creat', crValue.toFixed(2));
                    stalenessTracker.trackObservation('#mica-creat', obs, LOINC_CODES.CREATININE, 'Creatinine');
                }
            }
            catch (e) {
                console.warn('Error fetching creatinine for Gupta MICA', e);
            }
        }
        calculate();
    }
};
export const guptaMica = createMixedInputCalculator(config);
