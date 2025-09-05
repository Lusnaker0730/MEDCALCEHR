// js/calculators/sirs.js
import { getMostRecentObservation } from '../utils.js';

export const sirs = {
    id: 'sirs',
    title: 'SIRS, Sepsis, and Septic Shock Criteria',
    description: 'Defines the severity of sepsis and septic shock.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <h4>SIRS Criteria (Need ≥2):</h4>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="sirs-temp"><label for="sirs-temp">Temperature <36°C or >38°C</label></div>
                <div class="check-item"><input type="checkbox" id="sirs-hr"><label for="sirs-hr">Heart Rate >90 bpm</label></div>
                <div class="check-item"><input type="checkbox" id="sirs-rr"><label for="sirs-rr">Respiratory Rate >20 breaths/min or PaCO₂ <32 mmHg</label></div>
                <div class="check-item"><input type="checkbox" id="sirs-wbc"><label for="sirs-wbc">WBC <4,000 or >12,000 cells/mm³ or >10% bands</label></div>
            </div>
            <hr>
            <h4>Additional Criteria for Sepsis / Septic Shock:</h4>
             <div class="checklist">
                <div class="check-item"><input type="checkbox" id="sepsis-infection"><label for="sepsis-infection"><strong>Suspected or Confirmed Infection?</strong></label></div>
                <div class="check-item"><input type="checkbox" id="shock-hypotension"><label for="shock-hypotension"><strong>Persistent Hypotension?</strong> (SBP <90, MAP <70, or SBP decrease >40 despite fluid resuscitation)</label></div>
            </div>
            <button id="evaluate-sirs">Evaluate Criteria</button>
            <div id="sirs-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // Pre-fill vitals if possible
        client.request(`Observation?patient=${client.patient.id}&code=85353-1&_sort=-date&_count=1`).then(response => {
            if (response.entry && response.entry.length > 0) {
                const vitals = response.entry[0].resource;
                const hrComp = vitals.component.find(c => c.code.coding[0].code === '8867-4');
                const rrComp = vitals.component.find(c => c.code.coding[0].code === '9279-1');
                if (hrComp && hrComp.valueQuantity.value > 90) document.getElementById('sirs-hr').checked = true;
                if (rrComp && rrComp.valueQuantity.value > 20) document.getElementById('sirs-rr').checked = true;
            }
        });

        document.getElementById('evaluate-sirs').addEventListener('click', () => {
            let sirsCriteriaCount = 0;
            document.querySelectorAll('#sirs-temp, #sirs-hr, #sirs-rr, #sirs-wbc').forEach(box => {
                if (box.checked) sirsCriteriaCount++;
            });

            const hasInfection = document.getElementById('sepsis-infection').checked;
            const hasHypotension = document.getElementById('shock-hypotension').checked;
            const resultEl = document.getElementById('sirs-result');
            
            let diagnosis = '';
            if (sirsCriteriaCount >= 2) {
                if (hasInfection) {
                    if (hasHypotension) {
                        diagnosis = 'Septic Shock';
                    } else {
                        diagnosis = 'Sepsis';
                    }
                } else {
                    diagnosis = 'SIRS (Systemic Inflammatory Response Syndrome)';
                }
            } else {
                diagnosis = 'Criteria for SIRS not met.';
            }

            resultEl.innerHTML = `<p><strong>Interpretation:</strong> ${diagnosis}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
