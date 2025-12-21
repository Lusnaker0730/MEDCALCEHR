import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const sirs: CalculatorModule = {
    id: 'sirs',
    title: 'SIRS Criteria for Systemic Inflammatory Response',
    description: 'Evaluates SIRS criteria and progression to sepsis and septic shock using clinical parameters.',
    generateHTML: function () {
        const sirsCriteria = [
            { id: 'sirs-temp', label: 'Temperature < 36°C (96.8°F) or > 38°C (100.4°F)', icon: '🌡️' },
            { id: 'sirs-hr', label: 'Heart Rate > 90 bpm', icon: '💓' },
            { id: 'sirs-rr', label: 'Respiratory Rate > 20 breaths/min or PaCO₂ < 32 mmHg', icon: '🫁' },
            { id: 'sirs-wbc', label: 'WBC < 4,000 or > 12,000 or > 10% bands', icon: '🧪' }
        ];

        const sepsisCriteria = [
            { id: 'sepsis-infection', label: 'Suspected or Confirmed Infection', icon: '🦠' },
            { id: 'shock-hypotension', label: 'Persistent Hypotension despite fluid resuscitation', icon: '📉' }
        ];

        const sirsSection = uiBuilder.createSection({
            title: 'SIRS Criteria Assessment',
            subtitle: 'Need ≥ 2 criteria for SIRS diagnosis',
            content: sirsCriteria.map(item =>
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                })
            ).join('')
        });

        const sepsisSection = uiBuilder.createSection({
            title: 'Sepsis & Shock Assessment',
            content: sepsisCriteria.map(item =>
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="lab-values-summary">
                <h4>📊 Current Vital Signs & Labs</h4>
                <div class="lab-values-grid">
                    <div class="lab-value-item"><div class="lab-label">Temperature</div><div class="lab-value" id="current-temp">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">Heart Rate</div><div class="lab-value" id="current-hr">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">Respiratory Rate</div><div class="lab-value" id="current-rr">Loading...</div></div>
                    <div class="lab-value-item"><div class="lab-label">WBC Count</div><div class="lab-value" id="current-wbc">Loading...</div></div>
                </div>
            </div>

            ${sirsSection}
            ${sepsisSection}
            
            <div id="sirs-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'sirs-result', title: 'Diagnosis Assessment' })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            try {
                // Clear errors
                const errorContainer = container.querySelector('#sirs-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let sirsCount = 0;
                const sirsIds = ['sirs-temp', 'sirs-hr', 'sirs-rr', 'sirs-wbc'];

                sirsIds.forEach(id => {
                    const checked = container.querySelector(`input[name="${id}"]:checked`) as HTMLInputElement | null;
                    if (checked) sirsCount += parseInt(checked.value, 10);
                });

                const infectionRadio = container.querySelector('input[name="sepsis-infection"]:checked') as HTMLInputElement | null;
                const hypotensionRadio = container.querySelector('input[name="shock-hypotension"]:checked') as HTMLInputElement | null;

                const hasInfection = infectionRadio ? infectionRadio.value === '1' : false;
                const hasHypotension = hypotensionRadio ? hypotensionRadio.value === '1' : false;

                let diagnosis = '';
                let description = '';
                let alertClass = '';
                let recommendations = '';

                if (sirsCount >= 2) {
                    if (hasInfection) {
                        if (hasHypotension) {
                            diagnosis = 'Septic Shock';
                            description = 'Sepsis with persistent hypotension despite adequate fluid resuscitation.';
                            alertClass = 'ui-alert-danger';
                            recommendations = 'Urgent ICU admission; Vasopressor support; Aggressive fluid management; Multiorgan support.';
                        } else {
                            diagnosis = 'Sepsis';
                            description = 'SIRS with confirmed or suspected infection.';
                            alertClass = 'ui-alert-danger';
                            recommendations = 'Immediate antibiotic therapy; Source control measures; Fluid resuscitation; ICU consideration.';
                        }
                    } else {
                        diagnosis = 'SIRS';
                        description = 'Systemic Inflammatory Response Syndrome.';
                        alertClass = 'ui-alert-warning';
                        recommendations = 'Investigate underlying cause; Enhanced monitoring; Consider infection workup; Supportive care as needed.';
                    }
                } else {
                    diagnosis = 'Normal';
                    description = 'SIRS criteria not met (< 2 criteria).';
                    alertClass = 'ui-alert-success';
                    recommendations = 'Continue routine monitoring; Address underlying conditions; Reassess if clinical change.';
                }

                const resultBox = container.querySelector('#sirs-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Diagnosis',
                            value: diagnosis,
                            unit: '',
                            interpretation: description,
                            alertClass: alertClass
                        })}
                        
                        <div class="result-item mt-10">
                            <span class="label text-muted">SIRS Criteria Met:</span>
                            <span class="value font-semibold">${sirsCount} / 4</span>
                        </div>

                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">🏥</span>
                            <div class="ui-alert-content">
                                <strong>Clinical Management:</strong> ${recommendations}
                            </div>
                        </div>
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                // Error Handling with standardized ErrorHandler
                const errorContainer = container.querySelector('#sirs-error-container') as HTMLElement;
                if (errorContainer) {
                    displayError(errorContainer, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'sirs', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate vital signs and labs
        if (client) {
            // Temperature
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                const el = container.querySelector('#current-temp');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    let val = obs.valueQuantity.value;
                    let unit = obs.valueQuantity.unit || 'degC';

                    // Convert to Celcius if needed
                    if (unit === 'degF' || unit === 'F' || unit.toLowerCase().includes('degf')) {
                        const converted = UnitConverter.convert(val, 'degF', 'degC', 'temperature');
                        if (converted !== null) {
                            val = converted;
                            unit = 'degC';
                        }
                    }

                    if (el) el.textContent = `${val.toFixed(1)} °C`;

                    if (val < 36 || val > 38) {
                        setRadioValue('sirs-temp', '1');
                    }
                } else if (el) {
                    el.textContent = 'Not available';
                }
                if (obs) stalenessTracker.trackObservation('#current-temp', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
            }).catch(e => console.warn(e));

            // Heart Rate
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                const el = container.querySelector('#current-hr');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    if (el) el.textContent = `${val.toFixed(0)} bpm`;
                    if (val > 90) {
                        setRadioValue('sirs-hr', '1');
                    }
                } else if (el) {
                    el.textContent = 'Not available';
                }
                if (obs) stalenessTracker.trackObservation('#current-hr', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
            }).catch(e => console.warn(e));

            // Respiratory Rate
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                const el = container.querySelector('#current-rr');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    if (el) el.textContent = `${val.toFixed(0)} /min`;
                    if (val > 20) {
                        setRadioValue('sirs-rr', '1');
                    }
                } else if (el) {
                    el.textContent = 'Not available';
                }
                if (obs) stalenessTracker.trackObservation('#current-rr', obs, LOINC_CODES.RESPIRATORY_RATE, 'Respiratory Rate');
            }).catch(e => console.warn(e));

            // WBC
            getMostRecentObservation(client, LOINC_CODES.WBC).then(obs => {
                const el = container.querySelector('#current-wbc');
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    let unit = obs.valueQuantity.unit || 'cells/μL';

                    if (el) el.textContent = `${val} ${unit}`;

                    // Standardize to cells/uL for logic check (assuming raw value is 10^3 or cells depending on unit string)
                    // If unit usually '10*3/uL' or 'K/uL', value 12.0 = 12000
                    let wbc = val;
                    // Simply checking if value is small, likely needs scaling
                    if ((unit && (unit.includes('10*3') || unit.includes('K'))) || (val < 100)) {
                        // heuristics: WBC count usually > 1000. If < 100, likely K/uL.
                        wbc = val * 1000;
                    }

                    if (wbc < 4000 || wbc > 12000) {
                        setRadioValue('sirs-wbc', '1');
                    }
                } else if (el) {
                    el.textContent = 'Not available';
                }
                if (obs) stalenessTracker.trackObservation('#current-wbc', obs, LOINC_CODES.WBC, 'WBC Count');
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};
