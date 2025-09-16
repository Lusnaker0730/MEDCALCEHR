// js/calculators/perc.js
import { calculateAge } from '../../utils.js';

export const perc = {
    id: 'perc',
    title: 'PERC Rule for Pulmonary Embolism',
    description: 'Rules out PE if no criteria are present and pre-test probability is ≤15%.',
    generateHTML: function() {
        const criteria = [
            { id: 'age50', label: 'Age ≥ 50 years' },
            { id: 'hr100', label: 'Heart rate ≥ 100 bpm' },
            { id: 'o2sat', label: 'Room air SaO₂ < 95%' },
            { id: 'hemoptysis', label: 'Hemoptysis (coughing up blood)' },
            { id: 'exogenous-estrogen', label: 'Exogenous estrogen use' },
            { id: 'prior-dvt-pe', label: 'History of DVT or PE' },
            { id: 'unilateral-swelling', label: 'Unilateral leg swelling' },
            { id: 'trauma-surgery', label: 'Recent trauma or surgery requiring hospitalization' }
        ];

        let html = `
            <h3>${this.title}</h3>
            <p>Rules out PE if no criteria are present and pre-test probability is ≤15%.</p>
            <h4>Check all that apply:</h4>
            <div class="checklist">
        `;
        
        criteria.forEach(criterion => {
            html += `<div class="check-item"><input type="checkbox" id="${criterion.id}"><label for="${criterion.id}">${criterion.label}</label></div>`;
        });

        html += `
            </div>
            <button id="calculate-perc">Evaluate PERC Rule</button>
            <div id="perc-result" class="result" style="display:none;"></div>
        `;
        return html;
    },
    initialize: function(client, patient) {
        // Pre-fill age
        const age = calculateAge(patient.birthDate);
        if (age >= 50) {
            document.getElementById('age50').checked = true;
        }

        // Pre-fill heart rate and O2 saturation from most recent vitals
        // LOINC for vitals panel: 85353-1
        client.request(`Observation?patient=${patient.id}&code=85353-1&_sort=-date&_count=1`).then(response => {
            if (response.entry && response.entry.length > 0) {
                const vitals = response.entry[0].resource;
                const hrComponent = vitals.component.find(c => c.code.coding[0].code === '8867-4');
                const o2Component = vitals.component.find(c => c.code.coding[0].code === '59408-5'); // SpO2 on Room Air
                
                if (hrComponent && hrComponent.valueQuantity.value >= 100) {
                    document.getElementById('hr100').checked = true;
                }
                if (o2Component && o2Component.valueQuantity.value < 95) {
                    document.getElementById('o2sat').checked = true;
                }
            }
        });

        document.getElementById('calculate-perc').addEventListener('click', () => {
            const criteriaMet = [];
            document.querySelectorAll('.checklist input[type="checkbox"]').forEach(box => {
                if (box.checked) {
                    criteriaMet.push(box.id);
                }
            });

            const resultEl = document.getElementById('perc-result');
            if (criteriaMet.length === 0) {
                resultEl.innerHTML = `<p class="result-positive"><strong>PERC Negative:</strong> PE may be ruled out. No further testing is indicated if pre-test probability is low (≤15%).</p>`;
            } else {
                 resultEl.innerHTML = `<p class="result-negative"><strong>PERC Positive:</strong> The rule is positive. PE is not ruled out. Further testing (e.g., D-dimer, imaging) should be considered.</p>`;
            }
            resultEl.style.display = 'block';
        });
    }
};
