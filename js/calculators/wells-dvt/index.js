/**
 * Wells' Criteria for DVT Calculator
 *
 * 使用 Yes/No Calculator 工廠函數
 * 已整合 FHIRDataService，使用 dataRequirements 聲明式配置自動填充
 */
import { createYesNoCalculator } from '../shared/yes-no-calculator.js';
export const wellsDVT = createYesNoCalculator({
    id: 'wells-dvt',
    title: "Wells' Criteria for DVT",
    description: 'Calculates risk of deep vein thrombosis (DVT) based on clinical criteria.',
    infoAlert: '<strong>Instructions:</strong> Select all criteria that apply to the patient. Score ranges from -2 to +9 points.',
    sectionTitle: 'Clinical Criteria',
    sectionIcon: '🩸',
    scoreRange: 'points',
    questions: [
        {
            id: 'dvt-cancer',
            label: 'Active cancer (treatment or palliation within 6 months)',
            points: 1,
            // 使用 SNOMED 代碼自動檢測癌症
            conditionCode: '363346000' // Malignant neoplastic disease
        },
        {
            id: 'dvt-paralysis',
            label: 'Paralysis, paresis, or recent plaster immobilization of the lower extremities',
            points: 1,
            conditionCode: '166001' // Paralysis
        },
        {
            id: 'dvt-bedridden',
            label: 'Recently bedridden > 3 days or major surgery within 12 weeks requiring general or regional anesthesia',
            points: 1
        },
        {
            id: 'dvt-tenderness',
            label: 'Localized tenderness along the deep venous system',
            points: 1
        },
        {
            id: 'dvt-swelling',
            label: 'Entire leg swollen',
            points: 1
        },
        {
            id: 'dvt-calf',
            label: 'Calf swelling at least 3 cm larger than asymptomatic side',
            points: 1
        },
        {
            id: 'dvt-pitting',
            label: 'Pitting edema confined to the symptomatic leg',
            points: 1
        },
        {
            id: 'dvt-collateral',
            label: 'Collateral superficial veins (nonvaricose)',
            points: 1
        },
        {
            id: 'dvt-previous',
            label: 'Previously documented DVT',
            points: 1,
            // 使用 SNOMED 代碼自動檢測 DVT 病史
            conditionCode: '128053003' // Deep venous thrombosis
        },
        {
            id: 'dvt-alternative',
            label: 'Alternative diagnosis at least as likely as DVT',
            points: -2
        }
    ],
    // 聲明式 FHIR 數據需求配置
    dataRequirements: {
        // 自動從患者條件中檢測並勾選相關問題
        conditions: ['363346000', '166001', '128053003']
    },
    riskLevels: [
        {
            minScore: -2,
            maxScore: 0,
            label: 'Low Risk',
            severity: 'success',
            recommendation: 'DVT is unlikely. Consider D-dimer testing. If D-dimer is negative, DVT can be safely excluded in most cases.'
        },
        {
            minScore: 1,
            maxScore: 2,
            label: 'Moderate Risk',
            severity: 'warning',
            recommendation: 'Moderate probability of DVT. Consider D-dimer testing and/or ultrasound imaging based on clinical judgment and D-dimer availability.'
        },
        {
            minScore: 3,
            maxScore: 999,
            label: 'High Risk',
            severity: 'danger',
            recommendation: 'DVT is likely. Ultrasound imaging of the lower extremity is recommended. Consider anticoagulation while awaiting results if bleeding risk is low.'
        }
    ],
    references: [
        'Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. <em>Lancet</em>. 1997;350(9094):1795-1798.'
    ]
});
