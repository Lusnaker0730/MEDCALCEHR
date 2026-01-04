/**
 * Endotracheal Tube (ETT) Depth and Tidal Volume Calculator
 *
 * 使用 Formula Calculator 工廠函數
 * 根據身高和性別計算 ETT 深度和潮氣量
 */

import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const ett = createFormulaCalculator({
    id: 'ett',
    title: 'Endotracheal Tube (ETT) Depth and Tidal Volume Calculator',
    description:
        'Calculates estimated ETT depth and tidal volume based on patient height and gender.',

    inputs: [
        {
            type: 'number',
            id: 'height',
            label: 'Height',
            standardUnit: 'cm',
            unitConfig: {
                type: 'height',
                units: ['cm', 'in'],
                default: 'cm'
            },
            validationType: 'height',
            placeholder: 'e.g. 170',
            min: 50,
            max: 250,
            loincCode: LOINC_CODES.HEIGHT,
            required: true
        },
        {
            type: 'radio',
            id: 'gender',
            label: 'Gender',
            options: [
                { label: 'Male', value: 'male', checked: true },
                { label: 'Female', value: 'female' }
            ]
        }
    ],

    formulas: [
        {
            label: 'ETT Depth (at lips)',
            formula: 'Height (cm) / 10 + 5',
            notes: 'Estimates depth of tube at the lips in cm'
        },
        {
            label: 'Ideal Body Weight (Male)',
            formula: '50 + 2.3 × (Height in inches - 60)'
        },
        {
            label: 'Ideal Body Weight (Female)',
            formula: '45.5 + 2.3 × (Height in inches - 60)'
        },
        {
            label: 'Tidal Volume',
            formula: 'IBW × 6-8 mL/kg',
            notes: 'Lung-protective ventilation target'
        }
    ],

    calculate: values => {
        const heightCm = values.height as number;
        const gender = values.gender as string;

        if (!heightCm || isNaN(heightCm)) {
            return null;
        }

        // ETT Depth Calculation (Height/10 + 5)
        const ettDepth = heightCm / 10 + 5;

        // Ideal Body Weight (IBW) Calculation
        const heightIn = heightCm / 2.54;
        const heightInOver5Ft = Math.max(0, heightIn - 60);

        let ibw: number;
        if (gender === 'male') {
            ibw = 50 + 2.3 * heightInOver5Ft;
        } else {
            ibw = 45.5 + 2.3 * heightInOver5Ft;
        }

        // Tidal Volume Calculation (6-8 mL/kg of IBW)
        const tidalVolumeLow = ibw * 6;
        const tidalVolumeHigh = ibw * 8;

        return [
            {
                label: 'Estimated ETT Depth (at lips)',
                value: ettDepth.toFixed(1),
                unit: 'cm',
                interpretation: 'Verify with chest X-ray or capnography'
            },
            {
                label: 'Ideal Body Weight (IBW)',
                value: ibw.toFixed(1),
                unit: 'kg'
            },
            {
                label: 'Target Tidal Volume (6-8 mL/kg)',
                value: `${tidalVolumeLow.toFixed(0)} - ${tidalVolumeHigh.toFixed(0)}`,
                unit: 'mL',
                interpretation: 'Lung-protective ventilation range'
            }
        ];
    },

    infoAlert:
        '<strong>Note:</strong> These are initial estimates. Adjust based on chest X-ray, end-tidal CO₂, and clinical assessment.',

    footerHTML: `
        <div class="info-section">
            <h4>📋 Clinical Pearls</h4>
            <ul class="info-list">
                <li>Confirm ETT placement with capnography and chest X-ray</li>
                <li>Tube tip should be 3-5 cm above the carina</li>
                <li>Use lung-protective ventilation (6-8 mL/kg IBW) for ARDS patients</li>
            </ul>
        </div>
    `
});
