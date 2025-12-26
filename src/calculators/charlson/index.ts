/**
 * Charlson Comorbidity Index (CCI) Calculator
 *
 * 已整合 FHIRDataService 進行自動填充
 *
 * 這是一個複雜的計算器，包含：
 * - 年齡分層評分
 * - 多個 Yes/No 條件
 * - 多層級條件（肝病、糖尿病、腫瘤）
 * - 大量的 FHIR ICD 代碼自動填充
 */

import { fhirDataService } from '../../fhir-data-service.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';

interface ConditionMapItem {
    codes: string[];
    value: number;
}

interface ConditionMap {
    [key: string]: ConditionMapItem;
}

const config: MixedInputCalculatorConfig = {
    id: 'charlson',
    title: 'Charlson Comorbidity Index (CCI)',
    description: 'Predicts 10-year survival in patients with multiple comorbidities.',
    infoAlert: 'The Charlson Comorbidity Index predicts 10-year mortality based on age and 17 comorbid conditions. Higher scores indicate more severe comorbidity burden.',
    sections: [
        {
            title: 'Age',
            icon: '🎂',
            inputs: [
                {
                    name: 'age',
                    label: 'Age Group',
                    type: 'radio',
                    options: [
                        { value: '0', label: '< 50 years (+0)', checked: true },
                        { value: '1', label: '50-59 years (+1)' },
                        { value: '2', label: '60-69 years (+2)' },
                        { value: '3', label: '70-79 years (+3)' },
                        { value: '4', label: '≥ 80 years (+4)' }
                    ]
                }
            ]
        },
        {
            title: 'Comorbidities',
            icon: '🏥',
            inputs: [
                {
                    name: 'mi',
                    label: 'Myocardial infarction',
                    helpText: 'History of definite or probable MI',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'chf',
                    label: 'CHF',
                    helpText: 'Exertional or paroxysmal nocturnal dyspnea',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'pvd',
                    label: 'Peripheral vascular disease',
                    helpText: 'Intermittent claudication, past bypass, gangrene, or aneurysm',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'cva',
                    label: 'CVA or TIA',
                    helpText: 'History of a cerebrovascular accident',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'dementia',
                    label: 'Dementia',
                    helpText: 'Chronic cognitive deficit',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'cpd',
                    label: 'Chronic pulmonary disease',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'ctd',
                    label: 'Connective tissue disease',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'pud',
                    label: 'Peptic ulcer disease',
                    helpText: 'Any history of treatment for ulcer disease',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                },
                {
                    name: 'liver',
                    label: 'Liver disease',
                    helpText: 'Mild = chronic hepatitis. Moderate/Severe = cirrhosis and portal hypertension.',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'None (+0)', checked: true },
                        { value: '1', label: 'Mild (+1)' },
                        { value: '3', label: 'Moderate to severe (+3)' }
                    ]
                },
                {
                    name: 'diabetes',
                    label: 'Diabetes mellitus',
                    helpText: 'End-organ damage includes retinopathy, nephropathy, or neuropathy.',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'None/Diet-controlled (+0)', checked: true },
                        { value: '1', label: 'Uncomplicated (+1)' },
                        { value: '2', label: 'End-organ damage (+2)' }
                    ]
                },
                {
                    name: 'hemiplegia',
                    label: 'Hemiplegia',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    name: 'ckd',
                    label: 'Moderate to severe CKD',
                    helpText: 'Severe on dialysis, uremia, or creatinine >3 mg/dL',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    name: 'tumor',
                    label: 'Solid tumor',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'None (+0)', checked: true },
                        { value: '2', label: 'Localized (+2)' },
                        { value: '6', label: 'Metastatic (+6)' }
                    ]
                },
                {
                    name: 'leukemia',
                    label: 'Leukemia',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    name: 'lymphoma',
                    label: 'Lymphoma',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    name: 'aids',
                    label: 'AIDS',
                    helpText: 'Not just HIV positive, but "full-blown" AIDS',
                    type: 'radio',
                    options: [
                        { value: '0', label: 'No (+0)', checked: true },
                        { value: '6', label: 'Yes (+6)' }
                    ]
                }
            ]
        }
    ],
    calculate: (values) => {
        let score = 0;
        // Access values by name (which are radio values, so strings)
        Object.values(values).forEach(val => {
            const num = parseInt(val as string, 10);
            if (!isNaN(num)) {
                score += num;
            }
        });
        return score;
    },
    customResultRenderer: (score) => {
        // Adjusted formula from literature
        const survival = 100 * Math.pow(0.983, Math.exp(score * 0.9));

        return `
            ${uiBuilder.createResultItem({
            label: 'Charlson Comorbidity Index',
            value: score.toString(),
            unit: 'points'
        })}
            
            ${uiBuilder.createResultItem({
            label: 'Estimated 10-year survival',
            value: `${survival.toFixed(0)}%`,
            unit: ''
        })}
            
             <div class="info-section mt-20">
                <h4>📚 References</h4>
                <p>Charlson ME, Pompei P, Ales KL, MacKenzie CR. A new method of classifying prognostic comorbidity in longitudinal studies: development and validation. <em>J Chronic Dis</em>. 1987;40(5):373-383.</p>
            </div>
        `;
    },
    customInitialize: async (client, patient, container, calculate) => {
        // fhirDataService.initialize and uiBuilder.initializeComponents are handled by createMixedInputCalculator
        const stalenessTracker = fhirDataService.getStalenessTracker();

        // Auto-populate age using FHIRDataService
        if (fhirDataService.isReady()) {
            const age = fhirDataService.getPatientAge();
            if (age !== null) {
                let ageValue = 0;
                if (age >= 80) {
                    ageValue = 4;
                } else if (age >= 70) {
                    ageValue = 3;
                } else if (age >= 60) {
                    ageValue = 2;
                } else if (age >= 50) {
                    ageValue = 1;
                }
                const ageRadio = container.querySelector(
                    `input[name="age"][value="${ageValue}"]`
                ) as HTMLInputElement | null;
                if (ageRadio) {
                    ageRadio.checked = true;
                    // Trigger change manually since factory listeners are on 'change'
                    ageRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            const conditionMap: ConditionMap = {
                mi: { codes: ['I21', 'I22'], value: 1 },
                chf: { codes: ['I50'], value: 1 },
                pvd: { codes: ['I73.9', 'I70'], value: 1 },
                cva: { codes: ['I60', 'I61', 'I62', 'I63', 'I64', 'G45'], value: 1 },
                dementia: { codes: ['F00', 'F01', 'F02', 'F03', 'G30'], value: 1 },
                cpd: { codes: ['J40', 'J41', 'J42', 'J43', 'J44', 'J45', 'J46', 'J47'], value: 1 },
                ctd: { codes: ['M32', 'M34', 'M05', 'M06'], value: 1 },
                pud: { codes: ['K25', 'K26', 'K27', 'K28'], value: 1 },
                hemiplegia: { codes: ['G81'], value: 2 },
                leukemia: { codes: ['C91', 'C92', 'C93', 'C94', 'C95'], value: 2 },
                lymphoma: { codes: ['C81', 'C82', 'C83', 'C84', 'C85'], value: 2 },
                aids: { codes: ['B20', 'B21', 'B22', 'B24'], value: 6 }
            };

            for (const [key, { codes, value }] of Object.entries(conditionMap)) {
                fhirDataService
                    .hasCondition(codes)
                    .then(hasCondition => {
                        if (hasCondition) {
                            const radio = container.querySelector(
                                `input[name="${key}"][value="${value}"]`
                            ) as HTMLInputElement | null;
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    })
                    .catch(e => console.warn(`Error fetching ${key} conditions:`, e));
            }

            // Special handling for multi-level conditions
            // Liver disease (moderate/severe first, then mild)
            fhirDataService
                .hasCondition(['K70.3', 'K74', 'I85'])
                .then(hasSevere => {
                    if (hasSevere) {
                        const radio = container.querySelector(
                            'input[name="liver"][value="3"]'
                        ) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        fhirDataService
                            .hasCondition(['K73', 'B18'])
                            .then(hasMild => {
                                if (hasMild) {
                                    const radio = container.querySelector(
                                        'input[name="liver"][value="1"]'
                                    ) as HTMLInputElement | null;
                                    if (radio) {
                                        radio.checked = true;
                                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }
                            })
                            .catch(e => console.warn('Error fetching mild liver conditions:', e));
                    }
                })
                .catch(e => console.warn('Error fetching severe liver conditions:', e));

            // Diabetes (with end-organ damage first, then uncomplicated)
            fhirDataService
                .hasCondition([
                    'E10.2',
                    'E10.3',
                    'E10.4',
                    'E10.5',
                    'E11.2',
                    'E11.3',
                    'E11.4',
                    'E11.5'
                ])
                .then(hasEOD => {
                    if (hasEOD) {
                        const radio = container.querySelector(
                            'input[name="diabetes"][value="2"]'
                        ) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        fhirDataService
                            .hasCondition(['E10', 'E11'])
                            .then(hasUncomplicated => {
                                if (hasUncomplicated) {
                                    const radio = container.querySelector(
                                        'input[name="diabetes"][value="1"]'
                                    ) as HTMLInputElement | null;
                                    if (radio) {
                                        radio.checked = true;
                                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }
                            })
                            .catch(e =>
                                console.warn('Error fetching uncomplicated diabetes conditions:', e)
                            );
                    }
                })
                .catch(e => console.warn('Error fetching diabetes w/ EOD conditions:', e));

            // Solid tumor (check for metastatic vs localized)
            interface FhirCondition {
                code?: {
                    coding?: Array<{
                        code: string;
                        system?: string;
                    }>;
                };
            }

            fhirDataService
                .getConditions(['C00-C75', 'C76-C80'])
                .then(conditions => {
                    if (conditions.length > 0) {
                        const metastaticCodes = ['C77', 'C78', 'C79', 'C80'];
                        const isMetastatic = conditions.some(
                            (c: FhirCondition) =>
                                c.code?.coding?.[0]?.code &&
                                metastaticCodes.includes(c.code.coding[0].code.substring(0, 3))
                        );
                        const value = isMetastatic ? 6 : 2;
                        const radio = container.querySelector(
                            `input[name="tumor"][value="${value}"]`
                        ) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                })
                .catch(e => console.warn('Error fetching tumor conditions:', e));

            // CKD via conditions
            fhirDataService
                .hasCondition(['N18.3', 'N18.4', 'N18.5', 'Z99.2'])
                .then(hasCKD => {
                    if (hasCKD) {
                        const radio = container.querySelector(
                            'input[name="ckd"][value="2"]'
                        ) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                })
                .catch(e => console.warn('Error fetching CKD conditions:', e));

            // CKD via Creatinine > 3 mg/dL
            fhirDataService
                .getObservation(LOINC_CODES.CREATININE, {
                    trackStaleness: true,
                    stalenessLabel: 'Creatinine'
                })
                .then(result => {
                    if (result.value !== null && result.value > 3) {
                        const radio = container.querySelector(
                            'input[name="ckd"][value="2"]'
                        ) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        if (stalenessTracker && result.observation) {
                            stalenessTracker.trackObservation(
                                'input[name="ckd"][value="2"]',
                                result.observation,
                                LOINC_CODES.CREATININE,
                                'Creatinine > 3 mg/dL'
                            );
                        }
                    }
                })
                .catch(e => console.warn('Error fetching creatinine:', e));

        }

        // Initial calculation
        calculate();
    }
};

export const charlson = createMixedInputCalculator(config);
