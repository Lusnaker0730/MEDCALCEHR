/**
 * Padua Prediction Score for Risk of VTE Calculator
 *
 * 使用 Yes/No Calculator 工廠函數遷移
 * Determines anticoagulation need in hospitalized patients by risk of VTE.
 */
import { createYesNoCalculator } from '../shared/yes-no-calculator.js';
import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
export const paduaVTE = createYesNoCalculator({
    id: 'padua-vte',
    title: 'Padua Prediction Score for Risk of VTE',
    description: 'Determines anticoagulation need in hospitalized patients by risk of VTE.',
    sectionTitle: 'Risk Factors',
    sectionIcon: '🩸',
    questions: [
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
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 3,
            label: 'Low Risk for VTE',
            severity: 'success',
            recommendation: 'Pharmacologic prophylaxis may not be necessary.'
        },
        {
            minScore: 4,
            maxScore: 999,
            label: 'High Risk for VTE',
            severity: 'danger',
            recommendation: 'Pharmacologic prophylaxis is recommended.'
        }
    ]
});
// 為了支援 FHIR 自動填入，覆寫 initialize
const baseInitialize = paduaVTE.initialize;
paduaVTE.initialize = function (client, patient, container) {
    uiBuilder.initializeComponents(container);
    const stalenessTracker = createStalenessTracker();
    stalenessTracker.setContainer(container);
    const setRadioValue = (name, value, obs, loinc, label) => {
        const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
            if (obs && loinc && label) {
                stalenessTracker.trackObservation(`input[name="${name}"]`, obs, loinc, label);
            }
        }
    };
    // 計算函數
    const calculate = () => {
        let score = 0;
        const radios = container.querySelectorAll('input[type="radio"]:checked');
        radios.forEach(radio => {
            score += parseInt(radio.value);
        });
        const isHighRisk = score >= 4;
        const alertClass = isHighRisk ? 'ui-alert-danger' : 'ui-alert-success';
        const riskLevel = isHighRisk ? 'High Risk for VTE' : 'Low Risk for VTE';
        const recommendation = isHighRisk
            ? 'Pharmacologic prophylaxis is recommended.'
            : 'Pharmacologic prophylaxis may not be necessary.';
        const resultBox = document.getElementById('padua-vte-result');
        if (resultBox) {
            const resultContent = resultBox.querySelector('.ui-result-content');
            if (resultContent) {
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total Score',
                    value: score.toString(),
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                    
                    ${uiBuilder.createAlert({
                    type: isHighRisk ? 'warning' : 'info',
                    message: `<strong>Recommendation:</strong> ${recommendation}`
                })}
                `;
            }
            resultBox.classList.add('show');
        }
    };
    // 綁定事件
    container.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', calculate);
    });
    // FHIR 自動填入
    if (patient && patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        if (age >= 70) {
            setRadioValue('padua-age', '1');
        }
    }
    if (client) {
        getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
            if (obs?.valueQuantity?.value >= 30) {
                setRadioValue('padua-obesity', '1', obs, LOINC_CODES.BMI, 'BMI ≥ 30');
            }
        });
    }
    // 初始計算
    calculate();
};
