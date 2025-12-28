/**
 * Fractional Excretion of Urea (FEUrea) Calculator
 *
 * 使用 MixedInputCalculator 工廠函數
 * 用於評估急性腎損傷（AKI）的病因，特別是在使用利尿劑的患者中
 */

import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'feurea',
    title: 'Fractional Excretion of Urea (FEUrea)',
    description:
        'Determines if renal failure is due to prerenal or intrinsic pathology, especially useful in patients on diuretics.',
    infoAlert: `
        <p>FEUrea is particularly useful when FENa is unreliable (e.g., patients on diuretics, contrast nephropathy, or early obstruction).</p>
        <div class="ui-alert ui-alert-info mt-10">
            <strong>Advantage:</strong> Unlike FENa, FEUrea is not significantly affected by diuretic use.
        </div>
    `,
    sections: [
        {
            title: 'Laboratory Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'feurea-serum-cr',
                    label: 'Serum Creatinine',
                    placeholder: 'e.g., 1.0',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.CREATININE
                },
                {
                    type: 'number',
                    id: 'feurea-urine-urea',
                    label: 'Urine Urea Nitrogen',
                    placeholder: 'e.g., 200',
                    unitToggle: {
                        type: 'bun',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: '3095-7' // Urine Urea Nitrogen
                },
                {
                    type: 'number',
                    id: 'feurea-serum-urea',
                    label: 'Serum Urea Nitrogen (BUN)',
                    placeholder: 'e.g., 20',
                    unitToggle: {
                        type: 'bun',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.BUN
                },
                {
                    type: 'number',
                    id: 'feurea-urine-cr',
                    label: 'Urine Creatinine',
                    placeholder: 'e.g., 100',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.URINE_CREATININE
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'FEUrea (%)',
            formula:
                '<span class="formula-fraction"><span class="numerator">Serum<sub>Cr</sub> × U<sub>Urea</sub></span><span class="denominator">Serum<sub>Urea</sub> × U<sub>Cr</sub></span></span> × 100'
        }
    ],
    calculate: values => {
        const serumCr = values['feurea-serum-cr'] as number | null;
        const urineUrea = values['feurea-urine-urea'] as number | null;
        const serumUrea = values['feurea-serum-urea'] as number | null;
        const urineCr = values['feurea-urine-cr'] as number | null;

        if (serumCr === null || urineUrea === null || serumUrea === null || urineCr === null) {
            return null;
        }

        if (serumUrea === 0 || urineCr === 0) return null; // Avoid division by zero

        return ((serumCr * urineUrea) / (serumUrea * urineCr)) * 100;
    },
    customResultRenderer: (score, values) => {
        let interpretation = '';
        let alertClass = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score <= 35) {
            interpretation = 'Prerenal AKI (≤ 35%)';
            alertClass = 'ui-alert-success';
            alertType = 'success';
        } else if (score > 50) {
            interpretation = 'Intrinsic Renal AKI (> 50%)';
            alertClass = 'ui-alert-danger';
            alertType = 'danger';
        } else {
            interpretation = 'Indeterminate (35-50%)';
            alertClass = 'ui-alert-warning';
            alertType = 'warning';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Fractional Excretion of Urea',
                value: score.toFixed(2),
                unit: '%',
                interpretation: interpretation,
                alertClass: alertClass
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message:
                    score <= 35
                        ? 'Suggests prerenal etiology. Consider volume resuscitation.'
                        : score > 50
                          ? 'Suggests intrinsic renal injury (ATN). Consider nephrology consultation.'
                          : 'Further evaluation needed. Clinical correlation required.'
            })}
        `;
    },
    references: [
        'Carvounis CP, Nisar S, Guro-Razuman S. Significance of the fractional excretion of urea in the differential diagnosis of acute renal failure. Kidney Int. 2002;62(6):2223-9.'
    ]
};

// 創建基礎計算器
const baseCalculator = createMixedInputCalculator(config);

// 導出帶有比較表格的計算器
export const feurea = {
    ...baseCalculator,

    generateHTML(): string {
        const html = baseCalculator.generateHTML();

        // 添加 Facts & Figures 區塊
        const factsSection = `
            ${uiBuilder.createSection({
                title: 'FACTS & FIGURES',
                icon: '📊',
                content: `
                    <p class="mb-15">This test can provide similar information to the <a href="#fena" class="text-link">FENa</a> equation, but can still be used in patients on diuretic therapy (diuretics alter the sodium concentration, making the FENa equation unusable).</p>
                    ${uiBuilder.createTable({
                        headers: ['', 'Prerenal', 'Intrinsic renal', 'Postrenal'],
                        rows: [
                            ['FENa', '<1%', '>1%', '>4%'],
                            ['FEUrea', '≤ 35%', '>50%', 'N/A']
                        ],
                        stickyFirstColumn: true
                    })}
                `
            })}
        `;

        return html + factsSection;
    }
};
