import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { logger } from '../../logger.js';

export const cpisConfig: ScoringCalculatorConfig = {
    id: 'cpis',
    title: 'Clinical Pulmonary Infection Score (CPIS) for VAP',
    description:
        'Predicts ventilator-associated pneumonia (VAP) likelihood in patients on mechanical ventilation.',
    infoAlert:
        '<strong>Instructions:</strong> Use in mechanically ventilated patients to assess for ventilator-associated pneumonia (VAP).<br><strong>Interpretation:</strong> Score ≥6 suggests high likelihood of VAP. Consider in patients with new or worsening infiltrate on chest imaging.',
    sections: [
        {
            id: 'cpis-temperature',
            title: 'Temperature (°C)',
            subtitle: 'Core body temperature',
            options: [
                { value: '0', label: '36.5-38.4 (0)', checked: true },
                { value: '1', label: '38.5-38.9 (+1)' },
                { value: '2', label: '≥39.0 or ≤36.0 (+2)' }
            ]
        },
        {
            id: 'cpis-wbc',
            title: 'White blood cell count',
            subtitle: 'WBC count and band forms',
            options: [
                { value: '0', label: '4-11 (0)', checked: true },
                { value: '1', label: '<4 or >11 (+1)' },
                { value: '2', label: 'Either <4 or >11 plus band forms ≥500 (+2)' }
            ]
        },
        {
            id: 'cpis-secretions',
            title: 'Tracheal secretions',
            subtitle: 'Amount and purulence',
            options: [
                { value: '0', label: '<14+ (0)', checked: true },
                { value: '1', label: '≥14+ (+1)' },
                { value: '2', label: '≥14+ plus purulent secretions (+2)' }
            ]
        },
        {
            id: 'cpis-oxygenation',
            title: 'Oxygenation, PaO₂/FiO₂ mm Hg',
            subtitle: 'Arterial oxygen partial pressure to fractional inspired oxygen ratio',
            options: [
                { value: '0', label: '>240 or ARDS (0)', checked: true },
                { value: '2', label: '≤240 and no ARDS (+2)' }
            ]
        },
        {
            id: 'cpis-chest_xray',
            title: 'Pulmonary radiography',
            subtitle: 'Pattern on chest imaging',
            options: [
                { value: '0', label: 'No infiltrate (0)', checked: true },
                { value: '1', label: 'Diffuse or patchy infiltrate (+1)' },
                { value: '2', label: 'Localized infiltrate (+2)' }
            ]
        },
        {
            id: 'cpis-culture',
            title: 'Culture of tracheal aspirate specimen',
            subtitle: 'Semi-quantitative, 0, 1, 2, or 3+',
            options: [
                { value: '0', label: 'Pathogenic bacteria cultured ≤1 or no growth (0)', checked: true },
                { value: '1', label: 'Pathogenic bacteria cultured >1+ (+1)' },
                { value: '2', label: 'Pathogenic bacteria cultured >1+ plus same pathogenic bacteria on gram stain >1+ (+2)' }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 5, label: 'Low likelihood of VAP', severity: 'success' },
        { minScore: 6, maxScore: 12, label: 'High likelihood of VAP', severity: 'danger' }
    ],
    references: [
        '⚕️ Clinical Note: Scores ≥ 6 may indicate higher likelihood of VAP and need for BAL or mini-BAL.',
        '📚 Reference: Schurink CAM, et al. Clinical pulmonary infection score for ventilator-associated pneumonia: accuracy and inter-observer variability. Intensive Care Med. 2004.'
    ],
    customResultRenderer: (score: number) => {
        const isLow = score < 6;
        const interpretation = isLow ? 'Low likelihood of VAP' : 'High likelihood of VAP';
        const alertType = isLow ? 'success' : 'danger';
        const detail = isLow
            ? 'Score <6 suggests VAP is less likely'
            : 'Score ≥6 suggests VAP is likely';
        const management = isLow
            ? `<ul>
                <li><strong>Continue monitoring:</strong> Serial clinical assessments</li>
                <li><strong>Standard care:</strong> Ventilator bundle adherence</li>
                <li><strong>Re-evaluate:</strong> If clinical deterioration occurs</li>
               </ul>`
            : `<ul>
                <li><strong>Obtain cultures:</strong> Tracheal aspirate or BAL before antibiotics</li>
                <li><strong>Initiate antibiotics:</strong> Empiric coverage based on local antibiogram</li>
                <li><strong>Imaging:</strong> Consider CT chest if diagnosis unclear</li>
               </ul>`;

        return `
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
    },
    customInitialize: (
        client: unknown,
        patient: unknown,
        container: HTMLElement,
        calculate: () => void
    ) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const setRadio = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        if (client) {
            // Temperature
            fhirDataService
                .getObservation(LOINC_CODES.TEMPERATURE, {
                    trackStaleness: true,
                    stalenessLabel: 'Temperature',
                    targetUnit: 'degC',
                    unitType: 'temperature'
                })
                .then(result => {
                    if (result.value !== null) {
                        if (result.value >= 36.5 && result.value <= 38.4) {
                            setRadio('cpis-temperature', '0');
                        } else if (result.value >= 38.5 && result.value <= 38.9) {
                            setRadio('cpis-temperature', '1');
                        } else {
                            setRadio('cpis-temperature', '2');
                        }
                    }
                })
                .catch((e: unknown) => logger.warn('FHIR data fetch failed', { error: String(e) }));

            // WBC
            fhirDataService
                .getObservation(LOINC_CODES.WBC, { trackStaleness: true, stalenessLabel: 'WBC' })
                .then(result => {
                    if (result.value !== null) {
                        let wbc = result.value;
                        if (wbc > 1000) {
                            wbc = wbc / 1000;
                        }

                        if (wbc >= 4 && wbc <= 11) {
                            setRadio('cpis-wbc', '0');
                        } else {
                            setRadio('cpis-wbc', '1');
                        }
                    }
                })
                .catch((e: unknown) => logger.warn('FHIR data fetch failed', { error: String(e) }));
        }

        calculate();
    }
};

export const cpis = createScoringCalculator(cpisConfig);
