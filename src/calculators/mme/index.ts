/**
 * Morphine Milligram Equivalents (MME) Calculator
 *
 * 使用 Dynamic List Calculator 工廠函數
 * 計算每日嗎啡毫克等效劑量
 */

import { createDynamicListCalculator } from '../shared/dynamic-list-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

export const mme = createDynamicListCalculator({
    id: 'mme',
    title: 'Morphine Milligram Equivalents (MME) Calculator',
    description: 'Calculates total daily morphine milligram equivalents.',

    itemOptions: [
        { value: 'codeine', label: 'Codeine', factor: 0.15 },
        { value: 'fentanyl-buccal', label: 'FentaNYL buccal or sublingual tablets (mcg)', factor: 0.13 },
        { value: 'fentanyl', label: 'FentaNYL patch/transdermal (mcg/hr)', factor: 2.4 },
        { value: 'hydrocodone', label: 'HYDROcodone (Vicodin, Norco, Lortab)', factor: 1 },
        { value: 'hydromorphone', label: 'HYDROmorphone (Dilaudid)', factor: 5 },
        { value: 'methadone-1-20', label: 'Methadone (1-20mg/day)', factor: 4 },
        { value: 'methadone-21-40', label: 'Methadone (21-40mg/day)', factor: 8 },
        { value: 'methadone-41-60', label: 'Methadone (41-60mg/day)', factor: 10 },
        { value: 'methadone-61-80', label: 'Methadone (>60mg/day)', factor: 12 },
        { value: 'morphine', label: 'Morphine', factor: 1 },
        { value: 'oxycodone', label: 'OxyCODONE (OxyCONTIN, Roxicodone)', factor: 1.5 },
        { value: 'oxymorphone', label: 'OxyMORphone', factor: 3 },
        { value: 'tapentadol', label: 'Tapentadol (Nucynta), mg', factor: 0.4 },
        { value: 'tramadol', label: 'TraMADol (Ultram), mg', factor: 0.2 },
        { value: 'buprenorphine', label: 'Buprenorphine', factor: 10 }
    ],

    itemLabel: 'Opioid',
    valueLabel: 'Daily Dose',
    valueUnit: 'mg/day (or mcg/hr)',
    resultLabel: 'Total Daily MME',
    resultUnit: 'MME/day',
    addButtonText: 'Add Opioid',

    riskLevels: [
        {
            minValue: 0,
            maxValue: 20,
            label: 'Reference (1 to <20 MME/day)',
            severity: 'success',
            recommendation: 'Acceptable therapeutic range for acute pain and opioid-naïve patients. Annual overdose rate: 0.2%.'
        },
        {
            minValue: 20,
            maxValue: 50,
            label: 'Moderate Risk (20 to <50 MME/day)',
            severity: 'warning',
            recommendation: 'There is no completely safe opioid dose; use caution when prescribing opioids at any dose and always prescribe the lowest effective dose. Annual overdose rate: data not available.'
        },
        {
            minValue: 50,
            maxValue: 100,
            label: 'High Risk (50 to <100 MME/day)',
            severity: 'danger',
            recommendation: 'Strongly consider non-opioid analgesics and decreasing daily opioid dose. 3.7x higher risk of overdose. Annual overdose rate: 0.7%.'
        },
        {
            minValue: 100,
            maxValue: Infinity,
            label: 'Very High Risk (≥100 MME/day)',
            severity: 'danger',
            recommendation: 'Consult pain specialist to reassess pain regimen and decrease dosage and/or wean off opioids. 8.9x higher risk of overdose. Annual overdose rate: 1.8%.'
        }
    ],

    additionalInfo: `
        ${uiBuilder.createFormulaSection({
        items: [
            {
                label: 'MME/day',
                formula: 'Dosage¹ × Doses per day × MME conversion factor²',
                notes: '¹Dosage in mcg/hr for fentaNYL patch, in mcg for fentaNYL buccal or sublingual tablets, and in mg for all other opioids. ²These dose conversions are estimated and cannot account for individual differences in genetics and pharmacokinetics.'
            }
        ]
    })}

        ${uiBuilder.createAlert({
        type: 'info',
        message:
            '<h4>📊 MME Conversion Factors</h4><div class="ui-data-table"><table><thead><tr><th>Opioid</th><th>Factor</th></tr></thead><tbody><tr><td>Codeine</td><td>0.15</td></tr><tr><td>FentaNYL buccal/sublingual (mcg)</td><td>0.13</td></tr><tr><td>FentaNYL patch (mcg/hr)</td><td>2.4</td></tr><tr><td>HYDROcodone</td><td>1</td></tr><tr><td>HYDROmorphone</td><td>5</td></tr><tr><td>Methadone (1-20 mg/day)</td><td>4</td></tr><tr><td>Methadone (21-40 mg/day)</td><td>8</td></tr><tr><td>Methadone (41-60 mg/day)</td><td>10</td></tr><tr><td>Methadone (&gt;60 mg/day)</td><td>12</td></tr><tr><td>Morphine</td><td>1</td></tr><tr><td>OxyCODONE</td><td>1.5</td></tr><tr><td>OxyMORphone</td><td>3</td></tr><tr><td>Tapentadol</td><td>0.4</td></tr><tr><td>TraMADol</td><td>0.2</td></tr><tr><td>Buprenorphine</td><td>10</td></tr></tbody></table></div>'
    })}

        ${uiBuilder.createAlert({
        type: 'warning',
        message:
            '<h4>⚠️ Risk Interpretation</h4><ul class="info-list"><li><strong>20 to &lt;50 MME/day:</strong> 2x higher risk of overdose — use caution and prescribe lowest effective dose.</li><li><strong>50 to &lt;100 MME/day:</strong> 3.7x higher risk — strongly consider non-opioid analgesics.</li><li><strong>≥100 MME/day:</strong> 8.9x higher risk — consult pain specialist.</li></ul>'
    })}
    `
});
