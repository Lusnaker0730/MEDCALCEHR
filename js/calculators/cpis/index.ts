import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const cpis: CalculatorModule = {
    id: 'cpis',
    title: 'Clinical Pulmonary Infection Score (CPIS) for VAP',
    description:
        'Predicts ventilator-associated pneumonia (VAP) likelihood in patients on mechanical ventilation.',

    generateHTML: () => `
        <div class="calculator-header">
            <h3>Clinical Pulmonary Infection Score (CPIS)</h3>
            <p class="description">Predicts ventilator-associated pneumonia (VAP) likelihood in patients on mechanical ventilation.</p>
        </div>

        ${uiBuilder.createAlert({
        type: 'info',
        message: '<strong>Instructions:</strong> Use in mechanically ventilated patients to assess for ventilator-associated pneumonia (VAP).<br><strong>Interpretation:</strong> Score ≥6 suggests high likelihood of VAP. Consider in patients with new or worsening infiltrate on chest imaging.'
    })}
        
        ${uiBuilder.createSection({
        title: 'Clinical Parameters',
        content: `
                ${uiBuilder.createRadioGroup({
            name: 'cpis-temperature',
            label: 'Temperature',
            helpText: 'Core body temperature',
            options: [
                { value: '0', label: '36.5-38.4°C (0)', checked: true },
                { value: '1', label: '38.5-38.9°C (+1)' },
                { value: '2', label: '≥39 or ≤36°C (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'cpis-wbc',
            label: 'White Blood Cell Count',
            helpText: 'WBC count and band forms',
            options: [
                { value: '0', label: '4-11 × 10³/μL (0)', checked: true },
                { value: '1', label: '<4 or >11 × 10³/μL (+1)' },
                { value: '2', label: '<4 or >11 + bands ≥50% (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'cpis-secretions',
            label: 'Tracheal Secretions',
            helpText: 'Amount and purulence',
            options: [
                { value: '0', label: 'Few (0)', checked: true },
                { value: '1', label: 'Moderate (+1)' },
                { value: '2', label: 'Large/Purulent (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'cpis-oxygenation',
            label: 'Oxygenation: PaO₂/FiO₂ (mmHg)',
            helpText: 'Arterial oxygen partial pressure to fractional inspired oxygen ratio',
            options: [
                { value: '0', label: '>240 or ARDS (0)', checked: true },
                { value: '2', label: '≤240 and no ARDS (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'cpis-chest_xray',
            label: 'Chest Radiograph Infiltrate',
            helpText: 'Pattern on chest imaging',
            options: [
                { value: '0', label: 'No infiltrate (0)', checked: true },
                { value: '1', label: 'Diffuse (+1)' },
                { value: '2', label: 'Localized (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'cpis-culture',
            label: 'Culture of Tracheal Aspirate',
            helpText: 'Semi-quantitative culture result',
            options: [
                { value: '0', label: 'No/Few pathogens (0)', checked: true },
                { value: '1', label: 'Moderate/Many (+1)' },
                { value: '2', label: 'Same on Gram stain (+2)' }
            ]
        })}
            `
    })}
        
        <div id="cpis-error-container"></div>
        ${uiBuilder.createResultBox({ id: 'cpis-result-box', title: 'CPIS Result' })}
        
        ${uiBuilder.createAlert({
        type: 'info',
        message: `
                <h4>⚕️ Clinical Note</h4>
                <p>Scores ≥ 6 may indicate higher likelihood of VAP and need for BAL or mini-BAL.</p>
                <h4 style="margin-top: 10px;">📚 Reference</h4>
                <p>Schurink CAM, et al. Clinical pulmonary infection score for ventilator-associated pneumonia: accuracy and inter-observer variability. <em>Intensive Care Med.</em> 2004.</p>
            `
    })}
    `,

    initialize: (client, patient, container) => {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const calculate = () => {
            try {
                // Clear errors
                const errorContainer = container.querySelector('#cpis-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const groups = [
                    'cpis-temperature', 'cpis-wbc', 'cpis-secretions',
                    'cpis-oxygenation', 'cpis-chest_xray', 'cpis-culture'
                ];

                let score = 0;
                groups.forEach(group => {
                    const checked = container.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement;
                    if (checked) score += parseInt(checked.value);
                });

                const resultBox = container.querySelector('#cpis-result-box');
                if (!resultBox) return;
                const resultContent = resultBox.querySelector('.ui-result-content');

                let interpretation = '';
                let detail = '';
                let alertType: 'success' | 'danger' = 'success';
                let management = '';

                if (score < 6) {
                    interpretation = 'Low likelihood of VAP';
                    detail = 'Score <6 suggests VAP is less likely';
                    alertType = 'success';
                    management = `
                        <ul>
                            <li><strong>Continue monitoring:</strong> Serial clinical assessments</li>
                            <li><strong>Standard care:</strong> Ventilator bundle adherence</li>
                            <li><strong>Re-evaluate:</strong> If clinical deterioration occurs</li>
                        </ul>
                    `;
                } else {
                    interpretation = 'High likelihood of VAP';
                    detail = 'Score ≥6 suggests VAP is likely';
                    alertType = 'danger';
                    management = `
                        <ul>
                            <li><strong>Obtain cultures:</strong> Tracheal aspirate or BAL before antibiotics</li>
                            <li><strong>Initiate antibiotics:</strong> Empiric coverage based on local antibiogram</li>
                            <li><strong>Imaging:</strong> Consider CT chest if diagnosis unclear</li>
                        </ul>
                    `;
                }

                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'CPIS Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: interpretation,
                        alertClass: `ui-alert-${alertType}`
                    })}
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>Interpretation:</strong> ${detail}`
                    })}
                        ${uiBuilder.createSection({
                        title: 'Management Considerations',
                        content: management
                    })}
                    `;
                }
                resultBox.classList.add('show');
            } catch (error) {
                // Error Handling
                const errorContainer = container.querySelector('#cpis-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'cpis', action: 'calculate' });
            }
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        if (client) {
            // Temperature
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs && obs.valueQuantity) {
                    let tempC = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || obs.valueQuantity.code;

                    if (unit === 'degF' || unit === 'F' || (unit && unit.toLowerCase().includes('fahr'))) {
                        // @ts-ignore
                        tempC = UnitConverter.convert(tempC, 'degF', 'degC', 'temperature');
                    }

                    if (tempC !== null) {
                        if (tempC >= 36.5 && tempC <= 38.4) setRadio('cpis-temperature', '0');
                        else if (tempC >= 38.5 && tempC <= 38.9) setRadio('cpis-temperature', '1');
                        else setRadio('cpis-temperature', '2');
                    }

                    stalenessTracker.trackObservation('input[name="cpis-temperature"]', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
                }
            }).catch(e => console.warn(e));

            // WBC
            getMostRecentObservation(client, LOINC_CODES.WBC).then(obs => {
                if (obs && obs.valueQuantity) {
                    let wbc = obs.valueQuantity.value;
                    // const unit = obs.valueQuantity.unit;

                    // Basic normalization
                    if (wbc < 100) wbc = wbc; // Assume 10*3 if user raw value isn't super high, but wait, usually 4000-11000 or 4.0-11.0. 
                    // If > 1000, assumes /uL. If < 100, assumes /mm3 or similar in thousands.
                    if (wbc > 1000) wbc = wbc / 1000;

                    if (wbc >= 4 && wbc <= 11) setRadio('cpis-wbc', '0');
                    else setRadio('cpis-wbc', '1'); // Can't determine bands from just WBC count

                    stalenessTracker.trackObservation('input[name="cpis-wbc"]', obs, LOINC_CODES.WBC, 'WBC');
                }
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};
