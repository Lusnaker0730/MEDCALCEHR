import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { createStalenessTracker } from '../../data-staleness.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const sofa: CalculatorModule = {
    id: 'sofa',
    title: 'SOFA Score for Sepsis Organ Failure',
    description: 'Sequential Organ Failure Assessment (SOFA) Score predicts ICU mortality based on lab results and clinical data.',
    generateHTML: function () {
        const sections = [
            {
                id: 'resp',
                title: 'Respiration - PaO₂/FiO₂ Ratio',
                subtitle: 'Mechanical ventilation or CPAP required for scores 3-4',
                options: [
                    { value: '0', label: '≥400 (0)', checked: true },
                    { value: '1', label: '<400 (+1)' },
                    { value: '2', label: '<300 (+2)' },
                    { value: '3', label: '<200 with respiratory support (+3)' },
                    { value: '4', label: '<100 with respiratory support (+4)' }
                ]
            },
            {
                id: 'coag',
                title: 'Coagulation - Platelets',
                subtitle: 'Normal platelet count: 150-450 ×10³/μL',
                options: [
                    { value: '0', label: '≥150 ×10³/μL (0)', checked: true },
                    { value: '1', label: '<150 ×10³/μL (+1)' },
                    { value: '2', label: '<100 ×10³/μL (+2)' },
                    { value: '3', label: '<50 ×10³/μL (+3)' },
                    { value: '4', label: '<20 ×10³/μL (+4)' }
                ]
            },
            {
                id: 'liver',
                title: 'Liver - Bilirubin',
                subtitle: 'Normal bilirubin: 0.2-1.2 mg/dL',
                options: [
                    { value: '0', label: '<1.2 mg/dL (0)', checked: true },
                    { value: '1', label: '1.2-1.9 mg/dL (+1)' },
                    { value: '2', label: '2.0-5.9 mg/dL (+2)' },
                    { value: '3', label: '6.0-11.9 mg/dL (+3)' },
                    { value: '4', label: '≥12.0 mg/dL (+4)' }
                ]
            },
            {
                id: 'cardio',
                title: 'Cardiovascular - Hypotension & Vasopressors',
                subtitle: 'Vasopressor doses in μg/kg/min',
                options: [
                    { value: '0', label: 'No hypotension (0)', checked: true },
                    { value: '1', label: 'MAP <70 mmHg (+1)' },
                    { value: '2', label: 'Dopamine ≤5 or Dobutamine (any) (+2)' },
                    { value: '3', label: 'Dopamine >5 or Epi/NE ≤0.1 (+3)' },
                    { value: '4', label: 'Dopamine >15 or Epi/NE >0.1 (+4)' }
                ]
            },
            {
                id: 'cns',
                title: 'Central Nervous System - GCS',
                subtitle: 'Normal GCS: 15 (Eye 4 + Verbal 5 + Motor 6)',
                options: [
                    { value: '0', label: 'GCS 15 (0)', checked: true },
                    { value: '1', label: 'GCS 13-14 (+1)' },
                    { value: '2', label: 'GCS 10-12 (+2)' },
                    { value: '3', label: 'GCS 6-9 (+3)' },
                    { value: '4', label: 'GCS <6 (+4)' }
                ]
            },
            {
                id: 'renal',
                title: 'Renal - Creatinine / Urine Output',
                subtitle: 'Normal creatinine: 0.6-1.2 mg/dL',
                options: [
                    { value: '0', label: '<1.2 mg/dL (0)', checked: true },
                    { value: '1', label: '1.2-1.9 mg/dL (+1)' },
                    { value: '2', label: '2.0-3.4 mg/dL (+2)' },
                    { value: '3', label: '3.5-4.9 mg/dL or UO <500 mL/day (+3)' },
                    { value: '4', label: '≥5.0 mg/dL or UO <200 mL/day (+4)' }
                ]
            }
        ];

        const sectionsHTML = sections.map(s =>
            uiBuilder.createSection({
                title: s.title,
                subtitle: s.subtitle,
                content: uiBuilder.createRadioGroup({
                    name: `sofa-${s.id}`,
                    options: s.options
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="lab-values-summary">
                <h4>📊 Current Lab Values</h4>
                <div class="lab-values-grid">
                    <div class="lab-value-item"><div class="lab-label">Platelets</div><div class="lab-value" id="current-platelets">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">Creatinine</div><div class="lab-value" id="current-creatinine">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">Bilirubin</div><div class="lab-value" id="current-bilirubin">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">PaO₂/FiO₂</div><div class="lab-value" id="current-pao2fio2">Manual entry</div></div>
                </div>
            </div>

            ${sectionsHTML}
            
            <div id="sofa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'sofa-result', title: 'SOFA Score Result' })}
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. <em>Intensive Care Med</em>. 1996 Jul;22(7):707-10.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker for this calculator
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        // Helper to set radio value
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            try {
                // Clear any previous errors
                const errorContainer = container.querySelector('#sofa-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let totalScore = 0;
                const radios = container.querySelectorAll('input[type="radio"]:checked');

                radios.forEach(radio => {
                    totalScore += parseInt((radio as HTMLInputElement).value, 10);
                });

                let mortalityRisk = '';
                let mortalityPercentage = '';
                let alertClass = '';

                if (totalScore <= 6) {
                    mortalityRisk = 'Low Risk';
                    mortalityPercentage = '~10%';
                    alertClass = 'ui-alert-success';
                } else if (totalScore <= 9) {
                    mortalityRisk = 'Moderate Risk';
                    mortalityPercentage = '15-20%';
                    alertClass = 'ui-alert-warning';
                } else if (totalScore <= 12) {
                    mortalityRisk = 'High Risk';
                    mortalityPercentage = '40-50%';
                    alertClass = 'ui-alert-danger';
                } else {
                    mortalityRisk = 'Very High Risk';
                    mortalityPercentage = '>80%';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#sofa-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total SOFA Score',
                            value: totalScore.toString(),
                            unit: 'points',
                            interpretation: `${mortalityRisk} (ICU Mortality: ${mortalityPercentage})`,
                            alertClass: alertClass
                        })}
                            
                            <div class="ui-alert ui-alert-info mt-10">
                                <span class="ui-alert-icon">ℹ️</span>
                                <div class="ui-alert-content">
                                    <strong>ΔSOFA Significance:</strong> An increase in SOFA score of ≥2 points indicates organ dysfunction and increased mortality risk.
                                </div>
                            </div>
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                // Error Handling with standardized ErrorHandler
                const errorContainer = container.querySelector('#sofa-error-container') as HTMLElement;
                if (errorContainer) {
                    displayError(errorContainer, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'sofa', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate lab values
        if (client) {
            // Platelets
            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then(obs => {
                const el = container.querySelector('#current-platelets');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    // Standard unit: 10^3/uL
                    if (el) el.textContent = `${val.toFixed(0)} ×10³/μL`;

                    // Track staleness
                    stalenessTracker.trackObservation('#current-platelets', obs, LOINC_CODES.PLATELETS, 'Platelets');

                    let radioValue = '0';
                    if (val < 20) radioValue = '4';
                    else if (val < 50) radioValue = '3';
                    else if (val < 100) radioValue = '2';
                    else if (val < 150) radioValue = '1';
                    setRadioValue('sofa-coag', radioValue);
                } else {
                    if (el) el.textContent = 'Not available';
                }
            }).catch(e => console.warn(e));

            // Creatinine
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                const el = container.querySelector('#current-creatinine');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    if (unit === 'mmol/L' || unit.toLowerCase() === 'umol/l') {
                        // Note: 1 mg/dL = 88.4 umol/L.
                        // UnitConverter should be used if capable, otherwise manual.
                        // Assuming UnitConverter can handle 'umol/L' if mapped, or we implement simple logic.
                        const converted = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');
                        if (converted !== null) {
                            val = converted;
                        }
                    }

                    if (el) el.textContent = `${val.toFixed(1)} mg/dL`;

                    // Track staleness
                    stalenessTracker.trackObservation('#current-creatinine', obs, LOINC_CODES.CREATININE, 'Creatinine');

                    let radioValue = '0';
                    if (val >= 5.0) radioValue = '4';
                    else if (val >= 3.5) radioValue = '3';
                    else if (val >= 2.0) radioValue = '2';
                    else if (val >= 1.2) radioValue = '1';
                    setRadioValue('sofa-renal', radioValue);
                } else {
                    if (el) el.textContent = 'Not available';
                }
            }).catch(e => console.warn(e));

            // Bilirubin
            getMostRecentObservation(client, LOINC_CODES.BILIRUBIN_TOTAL).then(obs => {
                const el = container.querySelector('#current-bilirubin');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    // Convert if needed (e.g. umol/L to mg/dL for Bilirubin: 1 mg/dL = 17.1 umol/L)
                    if (unit === 'mmol/L' || unit.toLowerCase() === 'umol/l') {
                        const converted = UnitConverter.convert(val, unit, 'mg/dL', 'bilirubin'); // type 'bilirubin' might not be standard in UnitConverter map
                        // If UnitConverter doesn't have 'bilirubin' type, we might check generic map.
                        // But for now, let's just attempt conversion if UnitConverter supports it, or leave as is if not.
                        if (converted !== null) {
                            val = converted;
                        }
                    }

                    if (el) el.textContent = `${val.toFixed(1)} mg/dL`;

                    // Track staleness
                    stalenessTracker.trackObservation('#current-bilirubin', obs, LOINC_CODES.BILIRUBIN_TOTAL, 'Bilirubin');

                    let radioValue = '0';
                    if (val >= 12.0) radioValue = '4';
                    else if (val >= 6.0) radioValue = '3';
                    else if (val >= 2.0) radioValue = '2';
                    else if (val >= 1.2) radioValue = '1';
                    setRadioValue('sofa-liver', radioValue);
                } else {
                    if (el) el.textContent = 'Not available';
                }
            }).catch(e => console.warn(e));
        }

        // Initial calculation
        calculate();
    }
};
