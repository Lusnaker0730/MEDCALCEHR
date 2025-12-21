import { uiBuilder } from '../../ui-builder.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const mme: CalculatorModule = {
    id: 'mme',
    title: 'Morphine Milligram Equivalents (MME) Calculator',
    description: 'Calculates total daily morphine milligram equivalents.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Opioid Medications',
            icon: '💊',
            content: `
                    <div id="mme-opioid-list">
                        <!-- Dynamic rows will be added here -->
                    </div>
                    <div class="mt-15">
                        <button id="add-opioid-btn" class="ui-button ui-button-secondary full-width">+ Add Opioid</button>
                    </div>
                `
        })}

            ${uiBuilder.createResultBox({ id: 'mme-result', title: 'Total Daily MME' })}

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'MME Calculation',
                    formula: 'Total MME/day = Σ (Daily Dose × Conversion Factor)',
                    notes: 'Each opioid has a specific conversion factor representing its potency relative to morphine.'
                }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Conversion Factors</h4>
                    <div class="ui-data-table">
                        <table>
                            <thead>
                                <tr><th>Opioid</th><th>Factor</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>Morphine, Hydrocodone</td><td>1</td></tr>
                                <tr><td>Codeine</td><td>0.15</td></tr>
                                <tr><td>Oxycodone</td><td>1.5</td></tr>
                                <tr><td>Hydromorphone, Methadone (1-20mg)</td><td>4</td></tr>
                                <tr><td>Oxymorphone</td><td>3</td></tr>
                                <tr><td>Fentanyl transdermal (mcg/hr)</td><td>2.4</td></tr>
                                <tr><td>Methadone (>20mg)</td><td>8-12 (dose dependent)</td></tr>
                            </tbody>
                        </table>
                    </div>
                `
        })}

            ${uiBuilder.createAlert({
            type: 'warning',
            message: `
                    <h4>⚠️ CDC Recommendations</h4>
                    <ul class="info-list">
                        <li><strong>≥50 MME/day:</strong> Increased risk. Reassess benefits/risks.</li>
                        <li><strong>≥90 MME/day:</strong> Avoid if possible. Consider specialist referral.</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const conversionFactors: { [key: string]: number } = {
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

        const opioidOptions = Object.keys(conversionFactors).map(k => ({ value: k, label: k }));

        const listContainer = container.querySelector('#mme-opioid-list') as HTMLElement;
        const addBtn = container.querySelector('#add-opioid-btn') as HTMLElement;
        const resultBox = container.querySelector('#mme-result');

        const calculate = () => {
            let totalMME = 0;
            const rows = listContainer.querySelectorAll('.mme-row');

            if (rows.length === 0) {
                if (resultBox) resultBox.classList.remove('show');
                return;
            }

            rows.forEach(row => {
                const select = row.querySelector('select') as HTMLSelectElement;
                const input = row.querySelector('input') as HTMLInputElement;
                const drug = select.value;
                const dose = parseFloat(input.value);

                if (drug && dose > 0) {
                    const factor = conversionFactors[drug];
                    totalMME += dose * factor;
                }
            });

            let riskLevel = '';
            let alertType: 'info' | 'success' | 'warning' | 'danger' = 'info';
            let recommendation = '';

            if (totalMME < 50) {
                riskLevel = 'Lower Risk (<50 MME)';
                alertType = 'success';
                recommendation = 'Standard precautions.';
            } else if (totalMME < 90) {
                riskLevel = 'Moderate Risk (50-90 MME)';
                alertType = 'warning';
                recommendation = 'Reassess evidence of benefits and risks. Consider offering naloxone.';
            } else {
                riskLevel = 'High Risk (≥90 MME)';
                alertType = 'danger';
                recommendation = 'Avoid increasing dosage. Justify decision to titrate >90 MME/day. Consider specialist referral.';
            }

            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'Total Daily MME',
                        value: totalMME.toFixed(1),
                        unit: 'MME/day',
                        interpretation: riskLevel,
                        alertClass: `ui-alert-${alertType}`
                    })}
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>Recommendation:</strong> ${recommendation}`
                    })}
                    `;
                }
                resultBox.classList.add('show');
            }
        };

        const createRow = () => {
            const rowId = `mme-row-${Date.now()}`;
            const div = document.createElement('div');
            div.className = 'mme-row';
            div.className = 'mme-row flex-row gap-md align-center mb-10 p-10';

            const selectHTML = uiBuilder.createSelect({
                id: `${rowId}-drug`,
                label: 'Opioid',
                options: opioidOptions
            });

            const inputHTML = uiBuilder.createInput({
                id: `${rowId}-dose`,
                label: 'Daily Dose',
                type: 'number',
                placeholder: 'mg/day (or mcg/hr)'
            });

            div.innerHTML = `
                <div class="flex-1">${selectHTML}</div>
                <div class="flex-1">${inputHTML}</div>
                <button class="remove-btn ui-button ui-button-danger mt-20">✕</button>
            `;

            listContainer.appendChild(div);

            const select = div.querySelector('select') as HTMLSelectElement;
            const input = div.querySelector('input') as HTMLInputElement;
            const removeBtn = div.querySelector('.remove-btn') as HTMLElement;

            select.addEventListener('change', calculate);
            input.addEventListener('input', calculate);
            removeBtn.addEventListener('click', () => {
                div.remove();
                calculate();
            });
        };

        addBtn.addEventListener('click', createRow);

        // Create initial row
        createRow();
    }
};
