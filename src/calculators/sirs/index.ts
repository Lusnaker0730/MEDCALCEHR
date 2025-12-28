/**
 * SIRS Criteria for Systemic Inflammatory Response
 *
 * 使用 Radio Score Calculator 工廠函數
 * 評估 SIRS 標準及進展至敗血症和敗血性休克
 */

import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const sirs = createRadioScoreCalculator({
    id: 'sirs',
    title: 'SIRS Criteria for Systemic Inflammatory Response',
    description:
        'Evaluates SIRS criteria and progression to sepsis and septic shock using clinical parameters.',

    infoAlert: `
        <div class="lab-values-summary">
            <h4>📊 Current Vital Signs & Labs</h4>
            <div class="lab-values-grid">
                <div class="lab-value-item"><div class="lab-label">Temperature</div><div class="lab-value" id="current-temp">Loading...</div></div>
                <div class="lab-value-item"><div class="lab-label">Heart Rate</div><div class="lab-value" id="current-hr">Loading...</div></div>
                <div class="lab-value-item"><div class="lab-label">Respiratory Rate</div><div class="lab-value" id="current-rr">Loading...</div></div>
                <div class="lab-value-item"><div class="lab-label">WBC Count</div><div class="lab-value" id="current-wbc">Loading...</div></div>
            </div>
        </div>
    `,

    sections: [
        // SIRS Criteria Section
        {
            id: 'sirs-temp',
            title: '🌡️ Temperature < 36°C (96.8°F) or > 38°C (100.4°F)',
            loincCode: LOINC_CODES.TEMPERATURE,
            valueMapping: [
                { condition: v => v < 36 || v > 38, radioValue: '1' },
                { condition: v => v >= 36 && v <= 38, radioValue: '0' }
            ],
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'sirs-hr',
            title: '💓 Heart Rate > 90 bpm',
            loincCode: LOINC_CODES.HEART_RATE,
            valueMapping: [
                { condition: v => v > 90, radioValue: '1' },
                { condition: v => v <= 90, radioValue: '0' }
            ],
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'sirs-rr',
            title: '🫁 Respiratory Rate > 20 breaths/min or PaCO₂ < 32 mmHg',
            loincCode: LOINC_CODES.RESPIRATORY_RATE,
            valueMapping: [
                { condition: v => v > 20, radioValue: '1' },
                { condition: v => v <= 20, radioValue: '0' }
            ],
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'sirs-wbc',
            title: '🧪 WBC < 4,000 or > 12,000 or > 10% bands',
            loincCode: LOINC_CODES.WBC,
            valueMapping: [
                { condition: v => v < 4 || v > 12, radioValue: '1' }, // assuming K/uL
                { condition: v => v >= 4 && v <= 12, radioValue: '0' }
            ],
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        // Sepsis & Shock Assessment
        {
            id: 'sepsis-infection',
            title: '🦠 Suspected or Confirmed Infection',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        },
        {
            id: 'shock-hypotension',
            title: '📉 Persistent Hypotension despite fluid resuscitation',
            options: [
                { value: '0', label: 'No', checked: true },
                { value: '1', label: 'Yes' }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 1, label: 'Normal', severity: 'success' },
        { minScore: 2, maxScore: 4, label: 'SIRS Possible', severity: 'warning' },
        { minScore: 5, maxScore: 6, label: 'Sepsis/Shock', severity: 'danger' }
    ],

    formulaSection: {
        show: true,
        title: 'SIRS Criteria',
        calculationNote: 'Need ≥ 2 SIRS criteria for diagnosis:',
        scoringCriteria: [
            { criteria: 'Temperature < 36°C or > 38°C', points: '+1' },
            { criteria: 'Heart Rate > 90 bpm', points: '+1' },
            { criteria: 'Respiratory Rate > 20/min or PaCO₂ < 32 mmHg', points: '+1' },
            { criteria: 'WBC < 4,000 or > 12,000 or > 10% bands', points: '+1' }
        ],
        interpretationTitle: 'Diagnosis Pathway',
        tableHeaders: ['Condition', 'Diagnosis'],
        interpretations: [
            { score: '< 2 SIRS criteria', interpretation: 'Normal - SIRS criteria not met' },
            { score: '≥ 2 SIRS criteria', interpretation: 'SIRS (Systemic Inflammatory Response)' },
            { score: 'SIRS + Infection', interpretation: 'Sepsis' },
            { score: 'Sepsis + Hypotension', interpretation: 'Septic Shock' }
        ]
    },

    customResultRenderer: (score: number, sectionScores: Record<string, number>) => {
        // Calculate SIRS count (first 4 sections only)
        const sirsCount =
            (sectionScores['sirs-temp'] || 0) +
            (sectionScores['sirs-hr'] || 0) +
            (sectionScores['sirs-rr'] || 0) +
            (sectionScores['sirs-wbc'] || 0);

        const hasInfection = (sectionScores['sepsis-infection'] || 0) === 1;
        const hasHypotension = (sectionScores['shock-hypotension'] || 0) === 1;

        let diagnosis = '';
        let description = '';
        let alertClass = '';
        let recommendations = '';

        if (sirsCount >= 2) {
            if (hasInfection) {
                if (hasHypotension) {
                    diagnosis = 'Septic Shock';
                    description =
                        'Sepsis with persistent hypotension despite adequate fluid resuscitation.';
                    alertClass = 'danger';
                    recommendations =
                        'Urgent ICU admission; Vasopressor support; Aggressive fluid management; Multiorgan support.';
                } else {
                    diagnosis = 'Sepsis';
                    description = 'SIRS with confirmed or suspected infection.';
                    alertClass = 'danger';
                    recommendations =
                        'Immediate antibiotic therapy; Source control measures; Fluid resuscitation; ICU consideration.';
                }
            } else {
                diagnosis = 'SIRS';
                description = 'Systemic Inflammatory Response Syndrome.';
                alertClass = 'warning';
                recommendations =
                    'Investigate underlying cause; Enhanced monitoring; Consider infection workup; Supportive care as needed.';
            }
        } else {
            diagnosis = 'Normal';
            description = 'SIRS criteria not met (< 2 criteria).';
            alertClass = 'success';
            recommendations =
                'Continue routine monitoring; Address underlying conditions; Reassess if clinical change.';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Diagnosis',
                value: diagnosis,
                interpretation: description,
                alertClass: `ui-alert-${alertClass}`
            })}
            
            <div class="result-item mt-10">
                <span class="label text-muted">SIRS Criteria Met:</span>
                <span class="value font-semibold">${sirsCount} / 4</span>
            </div>

            ${uiBuilder.createAlert({
                type: alertClass as 'success' | 'warning' | 'danger' | 'info',
                message: `<strong>🏥 Clinical Management:</strong> ${recommendations}`
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate) => {
        if (!client) return;

        fhirDataService.initialize(client, patient, container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        try {
            // Temperature
            const tempResult = await fhirDataService.getObservation(LOINC_CODES.TEMPERATURE, {
                trackStaleness: true,
                stalenessLabel: 'Temperature',
                targetUnit: 'C',
                unitType: 'temperature'
            });
            const tempEl = container.querySelector('#current-temp');
            if (tempResult.value !== null) {
                if (tempEl) tempEl.textContent = `${tempResult.value.toFixed(1)} °C`;
                if (tempResult.value < 36 || tempResult.value > 38) {
                    setRadioValue('sirs-temp', '1');
                }
            } else if (tempEl) {
                tempEl.textContent = 'Not available';
            }

            // Heart Rate
            const hrResult = await fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Heart Rate'
            });
            const hrEl = container.querySelector('#current-hr');
            if (hrResult.value !== null) {
                if (hrEl) hrEl.textContent = `${hrResult.value.toFixed(0)} bpm`;
                if (hrResult.value > 90) {
                    setRadioValue('sirs-hr', '1');
                }
            } else if (hrEl) {
                hrEl.textContent = 'Not available';
            }

            // Respiratory Rate
            const rrResult = await fhirDataService.getObservation(LOINC_CODES.RESPIRATORY_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Respiratory Rate'
            });
            const rrEl = container.querySelector('#current-rr');
            if (rrResult.value !== null) {
                if (rrEl) rrEl.textContent = `${rrResult.value.toFixed(0)} /min`;
                if (rrResult.value > 20) {
                    setRadioValue('sirs-rr', '1');
                }
            } else if (rrEl) {
                rrEl.textContent = 'Not available';
            }

            // WBC
            const wbcResult = await fhirDataService.getObservation(LOINC_CODES.WBC, {
                trackStaleness: true,
                stalenessLabel: 'WBC Count'
            });
            const wbcEl = container.querySelector('#current-wbc');
            if (wbcResult.value !== null) {
                const unit = wbcResult.unit || 'K/μL';
                if (wbcEl) wbcEl.textContent = `${wbcResult.value} ${unit}`;

                // Standardize to K/uL for logic check
                let wbc = wbcResult.value;
                if (wbcResult.value > 100) {
                    wbc = wbcResult.value / 1000; // Convert cells/uL to K/uL
                }

                if (wbc < 4 || wbc > 12) {
                    setRadioValue('sirs-wbc', '1');
                }
            } else if (wbcEl) {
                wbcEl.textContent = 'Not available';
            }

            calculate();
        } catch (e) {
            console.warn('FHIR data fetch failed:', e);
        }
    }
});
