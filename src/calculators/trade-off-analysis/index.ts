/**
 * Trade-off Analysis Calculator
 * 
 * Based on: Urban P, Giustino G, et al.
 * "Trade-Off in Thrombotic Risk Between Bleeding and Stent Thrombosis 
 *  or Myocardial Infarction After PCI in High Bleeding Risk Patients"
 * JAMA Cardiology, 2021
 */

import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import type { CalculatorModule } from '../../types/index.js';
import {
    RISK_FACTORS,
    calculateBleedingRisk,
    calculateIschemicRisk,
    determineRiskZone,
    TRADE_OFF_SLOPES
} from './risk-factors.js';
import { createTradeOffChart, updateChartPosition, renderZoneLegend } from './chart-renderer.js';

let currentChart: any = null;

/**
 * Generate the calculator HTML
 */
function generateHTML(): string {
    // Risk factor checkboxes grouped by affected risk type
    const bleedingOnlyFactors = RISK_FACTORS.filter(f => f.bleedingHR !== null && f.ischemicHR === null && !f.group);
    const ischemicOnlyFactors = RISK_FACTORS.filter(f => f.ischemicHR !== null && f.bleedingHR === null && !f.group);
    const bothFactors = RISK_FACTORS.filter(f => f.bleedingHR !== null && f.ischemicHR !== null && !f.group);

    // Grouped factors (mutually exclusive)
    const hbFactors = RISK_FACTORS.filter(f => f.group === 'hemoglobin');
    const egfrFactors = RISK_FACTORS.filter(f => f.group === 'egfr');

    const renderFactorCheckbox = (factor: typeof RISK_FACTORS[0]) => {
        const bleedingBadge = factor.bleedingHR !== null && factor.bleedingHR !== 1.0
            ? `<span class="hr-badge hr-badge-bleeding">Bleeding HR: ${factor.bleedingHR}</span>`
            : '';
        const ischemicBadge = factor.ischemicHR !== null && factor.ischemicHR !== 1.0
            ? `<span class="hr-badge hr-badge-ischemic">Thrombotic HR: ${factor.ischemicHR}</span>`
            : '';

        return `
            <div class="risk-factor-item">
                <label class="risk-factor-label">
                    <input type="checkbox" id="factor-${factor.id}" data-factor-id="${factor.id}">
                    <span class="factor-text">${factor.label}</span>
                </label>
                <div class="hr-badges">
                    ${bleedingBadge}
                    ${ischemicBadge}
                </div>
            </div>
        `;
    };

    const renderGroupedRadio = (factor: typeof RISK_FACTORS[0], groupName: string, isDefault: boolean = false) => {
        const bleedingBadge = factor.bleedingHR !== null && factor.bleedingHR !== 1.0
            ? `<span class="hr-badge hr-badge-bleeding">Bleeding HR: ${factor.bleedingHR}</span>`
            : '';
        const ischemicBadge = factor.ischemicHR !== null && factor.ischemicHR !== 1.0
            ? `<span class="hr-badge hr-badge-ischemic">Thrombotic HR: ${factor.ischemicHR}</span>`
            : '';

        return `
            <div class="risk-factor-item">
                <label class="risk-factor-label">
                    <input type="radio" name="${groupName}" id="factor-${factor.id}" data-factor-id="${factor.id}" ${isDefault ? 'checked' : ''}>
                    <span class="factor-text">${factor.label}</span>
                </label>
                <div class="hr-badges">
                    ${bleedingBadge}
                    ${ischemicBadge}
                </div>
            </div>
        `;
    };

    return `
        <style>
            .trade-off-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                margin-top: 1rem;
            }
            
            @media (max-width: 1024px) {
                .trade-off-container {
                    grid-template-columns: 1fr;
                }
            }
            
            .chart-container {
                position: relative;
                width: 100%;
                max-width: 500px;
                margin: 0 auto;
            }
            
            .factors-container {
                max-height: 600px;
                overflow-y: auto;
            }
            
            .risk-factor-item {
                padding: 0.75rem;
                border: 1px solid var(--border-color, #e5e7eb);
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
                transition: background 0.2s;
            }
            
            .risk-factor-item:hover {
                background: var(--bg-hover, #f9fafb);
            }
            
            .risk-factor-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-weight: 500;
            }
            
            .risk-factor-label input[type="checkbox"] {
                width: 1.25rem;
                height: 1.25rem;
            }
            
            .hr-badges {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
                margin-left: 1.75rem;
            }
            
            .hr-badge {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
            }
            
            .hr-badge-bleeding {
                background: rgba(249, 115, 22, 0.15);
                color: #c2410c;
            }
            
            .hr-badge-ischemic {
                background: rgba(13, 148, 136, 0.15);
                color: #0f766e;
            }
            
            .trade-off-legend {
                margin-top: 1rem;
                padding: 1rem;
                background: var(--bg-secondary, #f9fafb);
                border-radius: 0.5rem;
                font-size: 0.875rem;
            }
            
            .legend-item {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .legend-color {
                flex-shrink: 0;
                width: 1rem;
                height: 1rem;
                border-radius: 0.25rem;
                margin-top: 0.125rem;
            }
            
            .result-zone {
                padding: 1rem;
                border-radius: 0.5rem;
                margin-top: 1rem;
                font-weight: 500;
            }
            
            .result-zone.ischemic_dominant {
                background: rgba(13, 148, 136, 0.15);
                border: 1px solid #0d9488;
                color: #0f766e;
            }
            
            .result-zone.equivalent {
                background: rgba(107, 114, 128, 0.15);
                border: 1px solid #6b7280;
                color: #374151;
            }
            
            .result-zone.bleeding_dominant {
                background: rgba(249, 115, 22, 0.15);
                border: 1px solid #f97316;
                color: #c2410c;
            }
            
            .result-zone p {
                margin-top: 0.5rem;
                font-weight: normal;
            }
            
            .risk-values {
                display: flex;
                gap: 2rem;
                justify-content: center;
                margin: 1rem 0;
                font-size: 1.125rem;
            }
            
            .risk-value {
                text-align: center;
            }
            
            .risk-value .value {
                font-size: 1.5rem;
                font-weight: 700;
            }
            
            .risk-value.bleeding .value {
                color: #f97316;
            }
            
            .risk-value.ischemic .value {
                color: #0d9488;
            }
            
            .factor-group-title {
                font-weight: 600;
                margin: 1rem 0 0.5rem;
                padding-bottom: 0.25rem;
                border-bottom: 2px solid var(--border-color, #e5e7eb);
            }
            
            .vertical-bar-chart {
                display: flex;
                justify-content: center;
                align-items: flex-end;
                gap: 3rem;
                height: 360px;
                margin: 1.5rem 0;
                padding: 1.5rem 3rem;
                background: var(--bg-secondary, #f9fafb);
                border-radius: 0.75rem;
            }
            
            .vertical-bar-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                width: 120px;
            }
            
            .vertical-bar-wrapper {
                width: 100%;
                height: 280px;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                background: #e5e7eb;
                border-radius: 0.5rem 0.5rem 0 0;
                overflow: hidden;
            }
            
            .vertical-bar-fill {
                width: 100%;
                height: 7%;
                transition: height 0.5s ease-out;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 0.75rem;
                font-size: 1.1rem;
                font-weight: 700;
                color: white;
            }
            
            .vertical-bar-fill.bleeding {
                background: linear-gradient(180deg, #fb923c, #ea580c);
            }
            
            .vertical-bar-fill.ischemic {
                background: linear-gradient(180deg, #14b8a6, #0d9488);
            }
            
            .vertical-bar-label {
                font-size: 1rem;
                font-weight: 600;
                text-align: center;
                margin-top: 0.75rem;
                color: #374151;
            }
            
            .vertical-bar-value {
                font-size: 1.75rem;
                font-weight: 700;
                margin-top: 0.5rem;
            }
            
            .vertical-bar-value.bleeding {
                color: var(--color-bleeding, #ea580c);
            }
            
            .vertical-bar-value.ischemic {
                color: var(--color-ischemic, #0d9488);
            }
            
            .calculator-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .calculator-header h1 {
                margin: 0;
                font-size: 2.25rem;
                font-weight: 700;
            }
            
            .calculator-header .subtitle {
                margin: 0.5rem 0 0;
                font-size: 1.75rem;
                font-weight: 600;
                opacity: 0.95;
            }
            
            .calculator-header .description {
                margin: 0.5rem 0 0;
                font-size: 1rem;
                opacity: 0.85;
            }
            
            .loading-text {
                text-align: center;
                color: var(--text-muted, #6b7280);
            }
        </style>
        
        <div class="calculator-header">
            <h1>Risk Trade-off Analysis</h1>
            <p class="subtitle">Bleeding vs. Ischemic Risk</p>
            <p class="description">Calculates and visualizes the trade-off between bleeding and ischemic risks after PCI in high bleeding risk patients.</p>
        </div>
        
        ${uiBuilder.createAlert({
        type: 'info',
        message: 'Select the applicable risk factors below. The chart will update in real-time to show patient position relative to trade-off lines.'
    })}
        
        <div class="trade-off-container">
            <div class="chart-section">
                <div class="chart-container" id="trade-off-chart-container">
                    <p class="loading-text">Loading chart...</p>
                </div>
                
                <div class="vertical-bar-chart">
                    <div class="vertical-bar-item">
                        <div class="vertical-bar-wrapper">
                            <div class="vertical-bar-fill bleeding" id="bleeding-risk-bar">
                                <span id="bleeding-bar-text">5.7%</span>
                            </div>
                        </div>
                        <div class="vertical-bar-label">1-Year Bleeding Risk</div>
                        <div class="vertical-bar-value bleeding" id="bleeding-risk-value">5.7%</div>
                    </div>
                    <div class="vertical-bar-item">
                        <div class="vertical-bar-wrapper">
                            <div class="vertical-bar-fill ischemic" id="ischemic-risk-bar">
                                <span id="ischemic-bar-text">5.3%</span>
                            </div>
                        </div>
                        <div class="vertical-bar-label">1-Year Ischemic Risk</div>
                        <div class="vertical-bar-value ischemic" id="ischemic-risk-value">5.3%</div>
                    </div>
                </div>
                
                <div id="result-zone-container"></div>
                
                ${renderZoneLegend()}
            </div>
            
            <div class="factors-container">
                <h3 class="factor-group-title">🧪 Hemoglobin Level</h3>
                ${hbFactors.map((f, i) => renderGroupedRadio(f, 'hemoglobin-group', f.id === 'hb_gte_13')).join('')}
                
                <h3 class="factor-group-title">🧪 eGFR Level</h3>
                ${egfrFactors.map(f => renderGroupedRadio(f, 'egfr-group', f.id === 'egfr_gte_60')).join('')}
                
                <h3 class="factor-group-title">🩸 Affects Bleeding Risk Only</h3>
                ${bleedingOnlyFactors.map(renderFactorCheckbox).join('')}
                
                <h3 class="factor-group-title">💔 Affects Ischemic Risk Only</h3>
                ${ischemicOnlyFactors.map(renderFactorCheckbox).join('')}
                
                <h3 class="factor-group-title">⚠️ Affects Both Risks</h3>
                ${bothFactors.map(renderFactorCheckbox).join('')}
            </div>
        </div>
        
        ${uiBuilder.createSection({
        title: 'Reference',
        icon: '📚',
        content: `
                <p><strong>Source:</strong> Urban P, Giustino G, et al. "Trade-Off in Thrombotic Risk Between Bleeding and Stent Thrombosis or Myocardial Infarction After PCI in High Bleeding Risk Patients." <em>JAMA Cardiology</em>, 2021.</p>
                <p><strong>Mortality Hazard Ratios:</strong></p>
                <ul>
                    <li>MI/ST → HR for death: 6.1 (95% CI: 4.8-7.7)</li>
                    <li>BARC 3-5 bleeding → HR for death: 3.7 (95% CI: 2.9-4.8)</li>
                </ul>
                <p><strong>Mortality-weighted slope:</strong> ${TRADE_OFF_SLOPES.MORTALITY_WEIGHTED.toFixed(2)}</p>
            `
    })}
    `;
}

/**
 * Get selected factor IDs from checkboxes
 */
function getSelectedFactorIds(): string[] {
    const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-factor-id]:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.factorId || '');
}

/**
 * Update the calculation and chart
 */
function updateCalculation(): void {
    const selectedFactors = getSelectedFactorIds();

    const bleedingRisk = calculateBleedingRisk(selectedFactors);
    const ischemicRisk = calculateIschemicRisk(selectedFactors);

    // Update displayed values
    const bleedingEl = document.getElementById('bleeding-risk-value');
    const ischemicEl = document.getElementById('ischemic-risk-value');

    if (bleedingEl) bleedingEl.textContent = `${bleedingRisk.toFixed(1)}%`;
    if (ischemicEl) ischemicEl.textContent = `${ischemicRisk.toFixed(1)}%`;

    // Update vertical bar visualization
    const bleedingBar = document.getElementById('bleeding-risk-bar');
    const ischemicBar = document.getElementById('ischemic-risk-bar');
    const bleedingBarText = document.getElementById('bleeding-bar-text');
    const ischemicBarText = document.getElementById('ischemic-bar-text');

    // Scale bars: 80% risk = 100% height
    const bleedingHeight = Math.min(bleedingRisk / 80 * 100, 100);
    const ischemicHeight = Math.min(ischemicRisk / 80 * 100, 100);

    if (bleedingBar) {
        bleedingBar.style.height = `${bleedingHeight}%`;
    }
    if (bleedingBarText) {
        bleedingBarText.textContent = `${bleedingRisk.toFixed(1)}%`;
    }
    if (ischemicBar) {
        ischemicBar.style.height = `${ischemicHeight}%`;
    }
    if (ischemicBarText) {
        ischemicBarText.textContent = `${ischemicRisk.toFixed(1)}%`;
    }

    // Update chart
    if (currentChart) {
        updateChartPosition(currentChart, bleedingRisk, ischemicRisk);
    }

    // Update result zone
    const zoneResult = determineRiskZone(bleedingRisk, ischemicRisk);
    const resultContainer = document.getElementById('result-zone-container');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="result-zone ${zoneResult.zone}">
                <strong>${zoneResult.zone === 'ischemic_dominant' ? '💔 Ischemic Dominant' :
                zoneResult.zone === 'bleeding_dominant' ? '🩸 Bleeding Dominant' :
                    '⚖️ Equivalent Risk'}</strong>
                <p>${zoneResult.recommendation}</p>
            </div>
        `;
    }
}

/**
 * Initialize the calculator
 */
function initialize(
    _client: unknown,
    _patient: unknown,
    _container: HTMLElement
): void {
    // Add change listeners to all checkboxes
    const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-factor-id]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateCalculation);
    });

    // Initialize chart
    setTimeout(() => {
        currentChart = createTradeOffChart({
            containerId: 'trade-off-chart-container',
            bleedingRisk: 5.7, // baseline
            ischemicRisk: 5.3  // baseline
        });
        updateCalculation();

        // Auto-populate after chart is ready
        autoPopulate();
    }, 100);
}

/**
 * Auto-populate from FHIR data
 */
async function autoPopulate(): Promise<void> {
    try {
        // Get age
        const patient = await fhirDataService.getPatient();
        if (patient?.birthDate) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age >= 65) {
                const ageCheckbox = document.getElementById('factor-age_65') as HTMLInputElement;
                if (ageCheckbox) ageCheckbox.checked = true;
            }
        }

        // Get all SNOMED codes we care about
        const snomedCodesToCheck = [
            SNOMED_CODES.DIABETES_MELLITUS,
            SNOMED_CODES.DIABETES_TYPE_1,
            SNOMED_CODES.DIABETES_TYPE_2,
            SNOMED_CODES.MYOCARDIAL_INFARCTION,
            SNOMED_CODES.CIRRHOSIS,
            SNOMED_CODES.MALIGNANCY,
            SNOMED_CODES.COPD,
            SNOMED_CODES.SMOKING
        ];
        const conditions = await fhirDataService.getConditions(snomedCodesToCheck) || [];

        for (const condition of conditions) {
            const code = condition.code?.coding?.[0]?.code;
            if (!code) continue;

            // Map SNOMED codes to factor checkboxes
            const snomedToFactor: Record<string, string> = {
                [SNOMED_CODES.DIABETES_MELLITUS]: 'diabetes',
                [SNOMED_CODES.DIABETES_TYPE_1]: 'diabetes',
                [SNOMED_CODES.DIABETES_TYPE_2]: 'diabetes',
                [SNOMED_CODES.MYOCARDIAL_INFARCTION]: 'prior_mi',
                [SNOMED_CODES.CIRRHOSIS]: 'liver_cancer_surgery',
                [SNOMED_CODES.MALIGNANCY]: 'liver_cancer_surgery',
                [SNOMED_CODES.COPD]: 'copd',
                [SNOMED_CODES.SMOKING]: 'current_smoker'
            };

            const factorId = snomedToFactor[code];
            if (factorId) {
                const checkbox = document.getElementById(`factor-${factorId}`) as HTMLInputElement;
                if (checkbox) checkbox.checked = true;
            }
        }

        // Get lab values for Hb and eGFR categorization
        const [hbObs, egfrObs] = await Promise.all([
            fhirDataService.getObservation(LOINC_CODES.HEMOGLOBIN),
            fhirDataService.getObservation(LOINC_CODES.EGFR)
        ]);

        if (hbObs?.value) {
            const hb = hbObs.value;
            if (hb < 11) {
                const checkbox = document.getElementById('factor-hb_lt_11') as HTMLInputElement;
                if (checkbox) checkbox.checked = true;
            } else if (hb < 13) {
                const checkbox = document.getElementById('factor-hb_11_13') as HTMLInputElement;
                if (checkbox) checkbox.checked = true;
            }
        }

        if (egfrObs?.value) {
            const egfr = egfrObs.value;
            if (egfr < 30) {
                const checkbox = document.getElementById('factor-egfr_lt_30') as HTMLInputElement;
                if (checkbox) checkbox.checked = true;
            } else if (egfr < 60) {
                const checkbox = document.getElementById('factor-egfr_30_59') as HTMLInputElement;
                if (checkbox) checkbox.checked = true;
            }
        }

        // Recalculate with auto-populated values
        updateCalculation();

    } catch (error) {
        console.warn('Trade-off auto-populate failed:', error);
    }
}

export const tradeOffAnalysis: CalculatorModule = {
    id: 'trade-off-analysis',
    title: 'Risk Trade-off Analysis',
    description: 'Bleeding vs. Ischemic Risk Trade-off for DAPT Decision',
    generateHTML,
    initialize
};
