// js/calculators/mme.js

export const mme = {
    id: 'mme',
    title: 'Morphine Milligram Equivalents (MME) Calculator',
    description: 'Calculates total daily morphine milligram equivalents.',
    generateHTML: function() {
        const conversionFactors = {
            'Codeine': 0.15,
            'Fentanyl transdermal (mcg/hr)': 2.4,
            'Hydrocodone': 1,
            'Hydromorphone': 4,
            'Methadone (1-20mg/day)': 4,
            'Methadone (21-40mg/day)': 8,
            'Methadone (41-60mg/day)': 10,
            'Methadone (61-80mg/day)': 12,
            'Morphine': 1,
            'Oxycodone': 1.5,
            'Oxymorphone': 3
        };
        const options = Object.keys(conversionFactors).map(k => `<option value="${k}">${k}</option>`).join('');

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
            <button id="calculate-mme">Calculate Total MME</button>
            <div id="mme-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        const conversionFactors = {
            'Codeine': 0.15,
            'Fentanyl transdermal (mcg/hr)': 2.4,
            'Hydrocodone': 1,
            'Hydromorphone': 4,
            'Methadone (1-20mg/day)': 4,
            'Methadone (21-40mg/day)': 8,
            'Methadone (41-60mg/day)': 10,
            'Methadone (61-80mg/day)': 12,
            'Morphine': 1,
            'Oxycodone': 1.5,
            'Oxymorphone': 3
        };
        const options = Object.keys(conversionFactors).map(k => `<option value="${k}">${k}</option>`).join('');

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
            newItem.querySelector('.remove-opioid-btn').addEventListener('click', () => newItem.remove());
        };

        document.getElementById('add-opioid-btn').addEventListener('click', addOpioidRow);
        document.querySelector('.remove-opioid-btn').addEventListener('click', (e) => e.target.parentElement.remove());

        document.getElementById('calculate-mme').addEventListener('click', () => {
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
            }
            else {
                resultEl.innerHTML = `<p>Total Daily MME: ${totalMME.toFixed(1)}</p>`;
                if (totalMME >= 50) {
                    resultEl.innerHTML += `<p class="warning"><strong>Caution:</strong> Total MME is ${totalMME >= 90 ? 'very high' : 'high'}. Increase caution and consider offering naloxone.</p>`;
                }
                resultEl.style.display = 'block';
            }
        });
    }
};
