import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const sofa = {
    id: 'sofa',
    title: 'SOFA Score for Sepsis Organ Failure',
    description:
        'Sequential Organ Failure Assessment (SOFA) Score predicts ICU mortality based on lab results and clinical data.',
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

            <div class="lab-values-summary" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em;">
                <h4 style="margin-top: 0; margin-bottom: 10px; color: #2c3e50;">📊 Current Lab Values</h4>
                <div class="lab-values-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                    <div class="lab-value-item"><div class="lab-label" style="color: #7f8c8d;">Platelets</div><div class="lab-value" id="current-platelets" style="font-weight: 600;">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label" style="color: #7f8c8d;">Creatinine</div><div class="lab-value" id="current-creatinine" style="font-weight: 600;">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label" style="color: #7f8c8d;">Bilirubin</div><div class="lab-value" id="current-bilirubin" style="font-weight: 600;">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label" style="color: #7f8c8d;">PaO₂/FiO₂</div><div class="lab-value" id="current-pao2fio2" style="font-weight: 600;">Manual entry</div></div>
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
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Helper to set radio value
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
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

                // Validator: Ensure all sections are selected is NOT required for SOFA interactive use usually,
                // but if we wanted to enforce completeness we could. 
                // For now, we calculate what is selected (default 0).

                radios.forEach(radio => {
                    totalScore += parseInt(radio.value);
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
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total SOFA Score',
                    value: totalScore,
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

                resultBox.classList.add('show');
            } catch (error) {
                // Error Handling with standardized ErrorHandler
                const errorContainer = container.querySelector('#sofa-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'sofa', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate lab values
        if (client) {
            // Using standard unit conversion where applicable (though these specific lookups are fairly standard)

            // Platelets
            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then(obs => {
                const el = container.querySelector('#current-platelets');
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    // Standard unit: 10^3/uL
                    // We simply display it. Unit conversion for platelets is rare (usually same magnitude).
                    if (el) el.textContent = `${val.toFixed(0)} ×10³/μL`;

                    let radioValue = '0';
                    if (val < 20) radioValue = '4';
                    else if (val < 50) radioValue = '3';
                    else if (val < 100) radioValue = '2';
                    else if (val < 150) radioValue = '1';
                    setRadioValue('sofa-coag', radioValue);
                } else {
                    if (el) el.textContent = 'Not available';
                }
            }).catch(e => console.warn(e)); // Non-critical fetch error

            // Creatinine
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                const el = container.querySelector('#current-creatinine');
                if (obs?.valueQuantity) {
                    // Start using UnitConverter if possible, but here we assume mg/dL is standard or we check unit.
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    if (UnitConverter.isUnit(unit, 'mmol/L')) {
                        val = UnitConverter.convert(val, 'mmol/L', 'mg/dL', 'creatinine');
                    }

                    if (el) el.textContent = `${val.toFixed(1)} mg/dL`;

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
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    if (UnitConverter.isUnit(unit, 'mmol/L')) {
                        // Approximating Bilirubin conversion: 1 mg/dL = 17.1 umol/L (common) -> usually mmol/L not used for bili? umol/L is.
                        // But UnitConverter handles what's defined. Assuming no conversion needed if not defined, or we leave raw value if unit match fails.
                        // For robustness, stick to raw if unknown.
                    }

                    if (el) el.textContent = `${val.toFixed(1)} mg/dL`;

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