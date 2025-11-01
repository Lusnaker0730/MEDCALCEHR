// js/calculators/mme/index.js

export const mme = {
    id: 'mme',
    title: 'Morphine Milligram Equivalents (MME) Calculator',
    description: 'Calculates total daily morphine milligram equivalents.',
    generateHTML: function () {
        const conversionFactors = {
            Codeine: 0.15,
            'Fentanyl transdermal (mcg/hr)': 2.4,
            Hydrocodone: 1,
            Hydromorphone: 4,
            'Methadone (1-20mg/day)': 4,
            'Methadone (21-40mg/day)': 8,
            'Methadone (41-60mg/day)': 10,
            'Methadone (61-80mg/day)': 12,
            Morphine: 1,
            Oxycodone: 1.5,
            Oxymorphone: 3
        };
        const options = Object.keys(conversionFactors)
            .map(k => `<option value="${k}">${k}</option>`)
            .join('');

        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div id="mme-opioid-list">
                <div class="mme-opioid-item">
                    <select class="opioid-select">${options}</select>
                    <input type="number" class="opioid-dose" placeholder="Dose">
                    <button class="remove-opioid-btn">Remove</button>
                </div>
            </div>
            <button id="add-opioid-btn">Add Opioid</button>
            <hr>
            <div id="mme-result" class="result" style="display:none;"></div>

            <!-- Formula Section -->
            <div class="formula-section">
                <h4>📐 MME Calculation Formula</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    MME (Morphine Milligram Equivalent) converts all opioids to a common measure using standardized conversion factors based on analgesic potency.
                </p>

                <!-- Basic Formula -->
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">Basic Calculation:</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; text-align: center; font-size: 1.1em;">
                        Total MME/day = Σ (Daily Dose × Conversion Factor)
                    </p>
                    <p style="font-size: 0.85em; color: #555; margin-top: 10px;">
                        <strong>Where:</strong> Each opioid has a specific conversion factor that represents its potency relative to morphine
                    </p>
                </div>

                <!-- Conversion Factors Table -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">📊 Opioid Conversion Factors to MME</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; margin-top: 10px;">
                        <tr style="background: #e1f5fe;">
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: left;"><strong>Opioid</strong></th>
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: left;"><strong>Common Dosages</strong></th>
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>MME<br>Conversion Factor</strong></th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Morphine</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">5, 10, 15, 20, 30 mg</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>1</strong></td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Codeine</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">15mg, 30mg, 60mg</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>0.15</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Fentanyl (transdermal)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">25, 50, 75, 100 mcg/hr</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>2.4</strong></td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Hydrocodone</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">5, 10 mg (with acetaminophen)</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>1</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Hydromorphone</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">2, 4, 8 mg</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>4</strong></td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Oxycodone</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">5, 10, 15, 20, 30 mg</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>1.5</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Oxymorphone</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">5, 10 mg</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center;"><strong>3</strong></td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Methadone</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">Dose-dependent (1-80mg)</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px; text-align: center; font-size: 0.8em;"><strong>4-12*</strong></td>
                        </tr>
                    </table>
                    <p style="font-size: 0.75em; color: #555; margin-top: 8px;">
                        * Methadone conversion factor varies based on daily dose due to non-linear pharmacokinetics
                    </p>
                </div>

                <!-- Interpretation Guidelines -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📋 MME Range Interpretation & Risk Assessment</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; margin-top: 10px;">
                        <tr style="background: #fff8e1;">
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>MME Range</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Comparative Risk</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Recommendation</strong></th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">1 to <20 MME/day</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Reference</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Appropriate acute pain management</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">20 to <50 MME/day</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">2x higher risk of overdose</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">There is no completely safe dose when prescribing opioids at any dose and duration</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">50 to <100 MME/day</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">3.7x higher risk of overdose</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Strongly consider opioid analgesics and decreasing daily opioid dose</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">≥100 MME/day</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">8.8x higher risk of overdose</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Consult pain specialist to reassess pain management and decrease dose if clinically feasible</td>
                        </tr>
                    </table>
                </div>

                <!-- Clinical Considerations -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">💊 Important Clinical Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Methadone Special Note:</strong> Methadone conversion is complex; the ratio varies from 4:1 to 12:1 depending on baseline dose due to non-linear pharmacokinetics and incomplete cross-tolerance</li>
                        <li><strong>Fentanyl Transdermal:</strong> Only convert transdermal fentanyl using mcg/hr units; do NOT include short-acting fentanyl products in calculations</li>
                        <li><strong>Short-acting vs Long-acting:</strong> Calculate daily totals for all formulations (immediate, extended release)</li>
                        <li><strong>Combination Products:</strong> Some opioids come in combination with acetaminophen or NSAIDs; calculate based on opioid content only</li>
                        <li><strong>As-needed (PRN) doses:</strong> Include estimated daily total of PRN medications in calculation</li>
                    </ul>
                </div>

                <!-- CDC Guideline Recommendations -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">⚠️ CDC Opioid Prescribing Guideline Recommendations:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>≥90 MME/day:</strong> Higher potential for harm; consider consultation with pain specialist</li>
                        <li><strong>Opioid Overdose Risk:</strong> Risk of overdose and death increases steeply with dose. Tolerance does NOT develop equally to all effects</li>
                        <li><strong>Naloxone Co-prescription:</strong> Consider offering naloxone rescue medication to all patients on chronic opioids, especially at ≥50 MME/day</li>
                        <li><strong>Monitoring:</strong> Regular monitoring for opioid use disorder, substance abuse history, and mental health conditions</li>
                        <li><strong>Discontinuation:</strong> If dose reduction is needed, taper gradually to prevent withdrawal symptoms and patient harm</li>
                        <li><strong>Non-opioid Alternatives:</strong> Consider comprehensive pain management including physical therapy, psychological treatments, and non-opioid medications</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function () {
        const conversionFactors = {
            Codeine: 0.15,
            'Fentanyl transdermal (mcg/hr)': 2.4,
            Hydrocodone: 1,
            Hydromorphone: 4,
            'Methadone (1-20mg/day)': 4,
            'Methadone (21-40mg/day)': 8,
            'Methadone (41-60mg/day)': 10,
            'Methadone (61-80mg/day)': 12,
            Morphine: 1,
            Oxycodone: 1.5,
            Oxymorphone: 3
        };
        const options = Object.keys(conversionFactors)
            .map(k => `<option value="${k}">${k}</option>`)
            .join('');

        const calculate = () => {
            let totalMME = 0;
            const items = document.querySelectorAll('.mme-opioid-item');
            let calculationError = false;

            items.forEach(item => {
                const drug = item.querySelector('.opioid-select').value;
                const dose = parseFloat(item.querySelector('.opioid-dose').value);

                if (drug && dose > 0) {
                    const factor = conversionFactors[drug];
                    totalMME += dose * factor;
                } else if (items.length > 0) {
                    calculationError = true;
                }
            });

            const resultEl = document.getElementById('mme-result');
            if (calculationError) {
                resultEl.innerText = 'Please enter a valid dose for all opioids.';
                resultEl.style.display = 'block';
            } else if (items.length === 0) {
                resultEl.innerText = 'Please add at least one opioid.';
                resultEl.style.display = 'block';
            } else {
                let riskLevel = '';
                let riskColor = '';
                let warningMessage = '';

                if (totalMME < 20) {
                    riskLevel = 'Low Risk (Reference)';
                    riskColor = '#388e3c';
                    warningMessage = 'Appropriate acute pain management range.';
                } else if (totalMME < 50) {
                    riskLevel = '2x Higher Risk';
                    riskColor = '#7cb342';
                    warningMessage =
                        'There is no completely safe dose when prescribing opioids at any dose and duration.';
                } else if (totalMME < 100) {
                    riskLevel = '3.7x Higher Risk (⚠️ Caution)';
                    riskColor = '#ff9800';
                    warningMessage =
                        'Strongly consider opioid analgesics and decreasing daily opioid dose.';
                } else {
                    riskLevel = '8.8x Higher Risk (⚠️ Extreme Caution)';
                    riskColor = '#d32f2f';
                    warningMessage =
                        'Consult pain specialist to reassess pain management and decrease dose if clinically feasible.';
                }

                resultEl.innerHTML = `
                    <div class="result-item">
                        <span class="value">${totalMME.toFixed(1)}</span>
                        <span class="label">Total Daily MME</span>
                    </div>
                    <div style="background: ${riskColor}20; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <div style="font-size: 0.95em; margin-bottom: 8px;">
                            <strong style="color: ${riskColor};">📊 Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold;">${riskLevel}</span>
                        </div>
                        <div style="font-size: 0.9em; color: ${riskColor};">
                            ${warningMessage}
                        </div>
                        ${totalMME >= 50 ? '<div style="margin-top: 10px; font-size: 0.9em; color: ' + riskColor + ';"><strong>💊 Consider naloxone co-prescription</strong></div>' : ''}
                    </div>
                `;
                resultEl.style.display = 'block';
            }
        };

        const addOpioidRow = () => {
            const list = document.getElementById('mme-opioid-list');
            const newItem = document.createElement('div');
            newItem.className = 'mme-opioid-item';
            newItem.innerHTML = `
                <select class="opioid-select">${options}</select>
                <input type="number" class="opioid-dose" placeholder="Dose">
                <button class="remove-opioid-btn">Remove</button>
            `;
            list.appendChild(newItem);
            
            // Add event listeners to new inputs
            newItem.querySelector('.opioid-select').addEventListener('change', calculate);
            newItem.querySelector('.opioid-dose').addEventListener('input', calculate);
            newItem.querySelector('.remove-opioid-btn').addEventListener('click', () => {
                newItem.remove();
                calculate();
            });
        };

        // Add event listeners to initial row
        document.querySelectorAll('.mme-opioid-item').forEach(item => {
            item.querySelector('.opioid-select').addEventListener('change', calculate);
            item.querySelector('.opioid-dose').addEventListener('input', calculate);
        });

        document.getElementById('add-opioid-btn').addEventListener('click', addOpioidRow);
        document.querySelector('.remove-opioid-btn').addEventListener('click', e => {
            e.target.parentElement.remove();
            calculate();
        });

        // Initial calculation
        calculate();
    }
};
