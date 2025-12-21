/**
 * Child-Pugh Score for Cirrhosis Mortality Calculator
 * 
 * 這是一個複雜的計算器，包含：
 * - 實驗室數值自動填充（Bilirubin, Albumin, INR）
 * - 臨床參數（Ascites, Encephalopathy）
 * - 數值區間自動選擇對應的 radio
 * 
 * 由於複雜度高，保持自定義實現
 */

import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: unknown, patient: unknown, container: HTMLElement) => void;
}

interface RangeCondition {
    condition: (v: number) => boolean;
    value: string;
}

export const childPugh: CalculatorModule = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    description: 'Estimates cirrhosis severity and prognosis.',
    
    generateHTML: function (): string {
        const labSection = uiBuilder.createSection({
            title: 'Laboratory Parameters',
            icon: '🔬',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'bilirubin',
                    label: 'Bilirubin (Total)',
                    options: [
                        { value: '1', label: '< 2 mg/dL (< 34.2 μmol/L) (+1)' },
                        { value: '2', label: '2-3 mg/dL (34.2-51.3 μmol/L) (+2)' },
                        { value: '3', label: '> 3 mg/dL (> 51.3 μmol/L) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'albumin',
                    label: 'Albumin',
                    options: [
                        { value: '1', label: '> 3.5 g/dL (> 35 g/L) (+1)' },
                        { value: '2', label: '2.8-3.5 g/dL (28-35 g/L) (+2)' },
                        { value: '3', label: '< 2.8 g/dL (< 28 g/L) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'inr',
                    label: 'INR',
                    options: [
                        { value: '1', label: '< 1.7 (+1)' },
                        { value: '2', label: '1.7-2.3 (+2)' },
                        { value: '3', label: '> 2.3 (+3)' }
                    ]
                })
            ].join('')
        });

        const clinicalSection = uiBuilder.createSection({
            title: 'Clinical Parameters',
            icon: '🩺',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'ascites',
                    label: 'Ascites',
                    helpText: 'Fluid accumulation in peritoneal cavity',
                    options: [
                        { value: '1', label: 'Absent (+1)' },
                        { value: '2', label: 'Slight (controlled with diuretics) (+2)' },
                        { value: '3', label: 'Moderate (despite diuretic therapy) (+3)' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'encephalopathy',
                    label: 'Hepatic Encephalopathy',
                    helpText: 'Neuropsychiatric abnormalities',
                    options: [
                        { value: '1', label: 'No Encephalopathy (+1)' },
                        { value: '2', label: 'Grade 1-2 (mild confusion, asterixis) (+2)' },
                        { value: '3', label: 'Grade 3-4 (severe confusion, coma) (+3)' }
                    ]
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>About Child-Pugh Score:</strong> Assesses the prognosis of chronic liver disease, mainly cirrhosis. Uses five clinical measures to classify patients into three categories (A, B, C) with different survival rates and surgical risks.</p>
                </div>
            </div>

            <div class="lab-values-summary">
                <h4>📋 Current Lab Values</h4>
                <div class="lab-values-grid">
                    <div class="lab-value-item">
                        <div class="lab-label">Bilirubin (Total)</div>
                        <div class="lab-value" id="current-bilirubin">Loading...</div>
                    </div>
                    <div class="lab-value-item">
                        <div class="lab-label">Albumin</div>
                        <div class="lab-value" id="current-albumin">Loading...</div>
                    </div>
                    <div class="lab-value-item">
                        <div class="lab-label">INR</div>
                        <div class="lab-value" id="current-inr">Loading...</div>
                    </div>
                </div>
            </div>

            ${labSection}
            ${clinicalSection}
            
            <div id="child-pugh-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'child-pugh-result', title: 'Child-Pugh Score Assessment' })}
            
            <div class="info-section mt-20">
                <h4>📚 References</h4>
                <p>Pugh RN, Murray-Lyon IM, Dawson JL, et al. Transection of the oesophagus for bleeding oesophageal varices. <em>Br J Surg</em>. 1973;60(8):646-649.</p>
            </div>
        `;
    },
    
    initialize: function (client: unknown, patient: unknown, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const groups = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy'];

        const calculate = (): void => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#child-pugh-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                const allAnswered = groups.every(group =>
                    container.querySelector(`input[name="${group}"]:checked`)
                );

                groups.forEach(group => {
                    const selected = container.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement | null;
                    if (selected) {
                        const value = parseInt(selected.value);
                        score += value;
                    }
                });

                const resultBox = container.querySelector('#child-pugh-result') as HTMLElement;
                const resultContent = resultBox?.querySelector('.ui-result-content') as HTMLElement;

                if (!allAnswered) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                let classification = '';
                let prognosis = '';
                let alertClass = 'ui-alert-info';

                if (score <= 6) {
                    classification = 'Child Class A';
                    prognosis = 'Well-compensated disease - Good prognosis<br>Life Expectancy: 15-20 years<br>Surgical Mortality: 10%';
                    alertClass = 'ui-alert-success';
                } else if (score <= 9) {
                    classification = 'Child Class B';
                    prognosis = 'Significant functional compromise - Moderate prognosis<br>Life Expectancy: 4-14 years<br>Surgical Mortality: 30%';
                    alertClass = 'ui-alert-warning';
                } else {
                    classification = 'Child Class C';
                    prognosis = 'Decompensated disease - Poor prognosis<br>Life Expectancy: 1-3 years<br>Surgical Mortality: 82%';
                    alertClass = 'ui-alert-danger';
                }

                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Points',
                            value: score.toString(),
                            unit: 'points'
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Classification',
                            value: classification,
                            interpretation: prognosis,
                            alertClass: alertClass
                        })}
                    `;
                }

                if (resultBox) resultBox.classList.add('show');
            } catch (error) {
                console.error('Error calculating Child-Pugh:', error);
                const errorContainer = container.querySelector('#child-pugh-error-container');
                if (errorContainer) {
                    errorContainer.innerHTML = '<div class="ui-alert ui-alert-danger">Calculation error. Please check your inputs.</div>';
                }
            }
        };

        const setRadioFromValue = (
            groupName: string, 
            value: number, 
            ranges: RangeCondition[], 
            displayValue: string, 
            unit: string
        ): void => {
            if (value === null || value === undefined) {
                const displayEl = container.querySelector(`#current-${groupName}`);
                if (displayEl) {
                    displayEl.textContent = 'Not available';
                }
                return;
            }

            // Update display
            const displayEl = container.querySelector(`#current-${groupName}`);
            if (displayEl) {
                displayEl.textContent = `${displayValue} ${unit}`;
            }

            // Select appropriate radio
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(
                    `input[name="${groupName}"][value="${radioToSelect.value}"]`
                ) as HTMLInputElement;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            }
        };

        // Fetch and set lab values
        if (client) {
            // Bilirubin
            getMostRecentObservation(client, LOINC_CODES.BILIRUBIN_TOTAL)
                .then(obs => {
                    if (obs?.valueQuantity) {
                        const value = obs.valueQuantity.value;
                        setRadioFromValue(
                            'bilirubin',
                            value,
                            [
                                { condition: (v: number) => v < 2, value: '1' },
                                { condition: (v: number) => v >= 2 && v <= 3, value: '2' },
                                { condition: (v: number) => v > 3, value: '3' }
                            ],
                            value.toFixed(1),
                            'mg/dL'
                        );
                        stalenessTracker.trackObservation('#current-bilirubin', obs, LOINC_CODES.BILIRUBIN_TOTAL, 'Bilirubin');
                    } else {
                        const el = container.querySelector('#current-bilirubin');
                        if (el) el.textContent = 'Not available';
                    }
                })
                .catch(error => {
                    console.error('Error fetching bilirubin:', error);
                    const el = container.querySelector('#current-bilirubin');
                    if (el) el.textContent = 'Not available';
                });

            // Albumin
            getMostRecentObservation(client, LOINC_CODES.ALBUMIN)
                .then(obs => {
                    if (obs?.valueQuantity) {
                        // Check unit. If g/L, convert to g/dL.
                        let valueGdL = obs.valueQuantity.value;
                        const unit = obs.valueQuantity.unit || 'g/dL';

                        if (unit.toLowerCase().includes('l') && !unit.toLowerCase().includes('dl')) {
                            // Assuming g/L
                            valueGdL = valueGdL / 10;
                        }

                        setRadioFromValue(
                            'albumin',
                            valueGdL,
                            [
                                { condition: (v: number) => v > 3.5, value: '1' },
                                { condition: (v: number) => v >= 2.8 && v <= 3.5, value: '2' },
                                { condition: (v: number) => v < 2.8, value: '3' }
                            ],
                            valueGdL.toFixed(1),
                            'g/dL'
                        );
                        stalenessTracker.trackObservation('#current-albumin', obs, LOINC_CODES.ALBUMIN, 'Albumin');
                    } else {
                        const el = container.querySelector('#current-albumin');
                        if (el) el.textContent = 'Not available';
                    }
                })
                .catch(error => {
                    console.error('Error fetching albumin:', error);
                    const el = container.querySelector('#current-albumin');
                    if (el) el.textContent = 'Not available';
                });

            // INR
            getMostRecentObservation(client, LOINC_CODES.INR_COAG)
                .then(obs => {
                    if (obs?.valueQuantity) {
                        const value = obs.valueQuantity.value;
                        setRadioFromValue(
                            'inr',
                            value,
                            [
                                { condition: (v: number) => v < 1.7, value: '1' },
                                { condition: (v: number) => v >= 1.7 && v <= 2.3, value: '2' },
                                { condition: (v: number) => v > 2.3, value: '3' }
                            ],
                            value.toFixed(2),
                            ''
                        );
                        stalenessTracker.trackObservation('#current-inr', obs, LOINC_CODES.INR_COAG, 'INR');
                    } else {
                        const el = container.querySelector('#current-inr');
                        if (el) el.textContent = 'Not available';
                    }
                })
                .catch(error => {
                    console.error('Error fetching INR:', error);
                    const el = container.querySelector('#current-inr');
                    if (el) el.textContent = 'Not available';
                });
        } else {
            // No client - mark labs as not available
            ['bilirubin', 'albumin', 'inr'].forEach(lab => {
                const el = container.querySelector(`#current-${lab}`);
                if (el) el.textContent = 'Not available';
            });
        }

        // Event listeners for all radio buttons
        container.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'radio') {
                calculate();
            }
        });

        // Initial calculation
        calculate();
    }
};
