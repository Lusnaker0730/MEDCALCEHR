import { uiBuilder } from '../../ui-builder.js';
export const helps2bScore = {
    id: '2helps2b',
    title: '2HELPS2B Score',
    description: 'Estimates seizure risk in acutely ill patients undergoing continuous EEG (cEEG), based on the 2HELPS2B score and seizure probability table.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>📋 EEG Risk Factors</strong><br>Select all that apply from the continuous EEG (cEEG) findings:'
        })}
            
            ${uiBuilder.createSection({
            title: 'EEG Findings',
            icon: '🧠',
            content: `
                    ${uiBuilder.createCheckbox({ id: 'freq-gt-2hz', label: 'Frequency > 2Hz (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'sporadic-epileptiform', label: 'Sporadic epileptiform discharges (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'lpd-bipd-lrda', label: 'LPD / BIPD / LRDA (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'plus-features', label: 'Plus features (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'prior-seizure', label: 'Prior seizure (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'birds', label: 'Brief ictal rhythmic discharges (BIRDs) (+2)', value: '2' })}
                `
        })}


            ${uiBuilder.createResultBox({ id: 'helps2b-result', title: '2HELPS2B Score Results' })}

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    title: 'Scoring Criteria',
                    formulas: [
                        'Frequency > 2 Hz: +1 point',
                        'Sporadic epileptiform discharges: +1 point',
                        'LPD (Lateralized Periodic Discharges) / BIPD / LRDA: +1 point',
                        'Plus features (superimposed fast activity or rhythmic delta): +1 point',
                        'Prior seizure (before cEEG monitoring): +1 point',
                        'BIRDs (Brief Ictal Rhythmic Discharges): +2 points'
                    ]
                },
                {
                    title: 'Seizure Probability by Score',
                    content: `
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                    <thead>
                                        <tr style="background: rgba(102, 126, 234, 0.1);">
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Score</th>
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Seizure Risk</th>
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Risk Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">< 5%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Very Low</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">1</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">12%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Low</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">2</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">27%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Moderate</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">3</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">50%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Moderate-High</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">4</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">73%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">High</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">5</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">88%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Very High</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">≥6</td>
                                            <td style="padding: 8px; border: 1px; solid #ddd; text-align: center;">> 95%</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Extremely High</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        `
                }
            ]
        })}

            <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                <h4>📚 Reference</h4>
                <p>Struck, A. F., et al. (2017). Association of an Electroencephalography-Based Risk Score With Seizure Probability in Hospitalized Patients. <em>JAMA Neurology</em>, 74(12), 1419–1424.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const calculate = () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.value);
                }
            });
            // Risk mapping
            const riskData = {
                0: { risk: '< 5%', category: 'Very Low', alertType: 'success' },
                1: { risk: '12%', category: 'Low', alertType: 'success' },
                2: { risk: '27%', category: 'Moderate', alertType: 'warning' },
                3: { risk: '50%', category: 'Moderate-High', alertType: 'warning' },
                4: { risk: '73%', category: 'High', alertType: 'danger' },
                5: { risk: '88%', category: 'Very High', alertType: 'danger' }
            };
            const result = score >= 6
                ? { risk: '> 95%', category: 'Extremely High', alertType: 'danger' }
                : riskData[score];
            const resultBox = container.querySelector('#helps2b-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'Total Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: result.category,
                        alertClass: `ui-alert-${result.alertType}`
                    })}
                    ${uiBuilder.createResultItem({
                        label: 'Risk of Seizure',
                        value: result.risk,
                        alertClass: `ui-alert-${result.alertType}`
                    })}
                `;
                }
                resultBox.classList.add('show');
            }
        };
        container.querySelectorAll('input[type="checkbox"]').forEach(box => {
            box.addEventListener('change', calculate);
        });
        calculate();
    }
};
