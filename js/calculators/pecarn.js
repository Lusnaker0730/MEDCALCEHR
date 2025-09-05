// js/calculators/pecarn.js
import { calculateAge } from '../utils.js';

export const pecarn = {
    id: 'pecarn',
    title: 'PECARN Pediatric Head Injury/Trauma Algorithm',
    description: 'Predicts need for brain imaging after pediatric head injury.',
    generateHTML: function() {
        const criteriaUnder2 = [
            { id: 'gcs-not-15', label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)' },
            { id: 'palpable-fracture', label: 'Palpable skull fracture' },
            { id: 'loc-5-sec', label: 'LOC ≥ 5 seconds' },
            { id: 'not-acting-normally', label: 'Guardian feels child is not acting normally' },
            { id: 'severe-mechanism', label: 'Severe mechanism of injury (e.g., fall >3ft, MVA, struck by high-impact object)' },
            { id: 'hematoma', label: 'Non-frontal scalp hematoma' }
        ];
        const criteriaOver2 = [
             { id: 'gcs-not-15-over2', label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)' },
             { id: 'signs-basilar-fracture', label: 'Signs of basilar skull fracture (e.g., hemotympanum, raccoon eyes)' },
             { id: 'loc', label: 'Any loss of consciousness' },
             { id: 'vomiting', label: 'Vomiting' },
             { id: 'severe-headache', label: 'Severe headache' },
             { id: 'severe-mechanism-over2', label: 'Severe mechanism of injury' }
        ];

        let html = `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            
            <div id="pecarn-age-selector">
                <label><strong>Patient Age:</strong></label>
                <input type="radio" id="age-under-2" name="pecarn-age" value="under2" checked><label for="age-under-2">< 2 years</label>
                <input type="radio" id="age-over-2" name="pecarn-age" value="over2"><label for="age-over-2">&ge; 2 years</label>
            </div>
            <hr>
            
            <div id="pecarn-criteria-under2" class="pecarn-criteria-group">
                <h4>Criteria for Children < 2 Years Old:</h4>
                <div class="checklist">
                    ${criteriaUnder2.map(c => `<div class="check-item"><input type="checkbox" id="${c.id}"><label for="${c.id}">${c.label}</label></div>`).join('')}
                </div>
            </div>

            <div id="pecarn-criteria-over2" class="pecarn-criteria-group" style="display:none;">
                <h4>Criteria for Children &ge; 2 Years Old:</h4>
                <div class="checklist">
                     ${criteriaOver2.map(c => `<div class="check-item"><input type="checkbox" id="${c.id}"><label for="${c.id}">${c.label}</label></div>`).join('')}
                </div>
            </div>

            <button id="calculate-pecarn">Evaluate PECARN</button>
            <div id="pecarn-result" class="result" style="display:none;"></div>
        `;
        return html;
    },
    initialize: function(client, patient) {
        const age = calculateAge(patient.birthDate);
        const ageUnder2Radio = document.getElementById('age-under-2');
        const ageOver2Radio = document.getElementById('age-over-2');
        const criteriaUnder2Div = document.getElementById('pecarn-criteria-under2');
        const criteriaOver2Div = document.getElementById('pecarn-criteria-over2');

        const setAgeGroup = (age) => {
            if (age < 2) {
                ageUnder2Radio.checked = true;
                criteriaUnder2Div.style.display = 'block';
                criteriaOver2Div.style.display = 'none';
            } else {
                ageOver2Radio.checked = true;
                criteriaUnder2Div.style.display = 'none';
                criteriaOver2Div.style.display = 'block';
            }
        };
        setAgeGroup(age); // Set on load

        ageUnder2Radio.addEventListener('change', () => setAgeGroup(1));
        ageOver2Radio.addEventListener('change', () => setAgeGroup(2));

        document.getElementById('calculate-pecarn').addEventListener('click', () => {
            const resultEl = document.getElementById('pecarn-result');
            let recommendation = '';
            
            if (ageUnder2Radio.checked) {
                const gcs = document.getElementById('gcs-not-15').checked;
                const fracture = document.getElementById('palpable-fracture').checked;
                const loc = document.getElementById('loc-5-sec').checked;
                const acting = document.getElementById('not-acting-normally').checked;
                const mechanism = document.getElementById('severe-mechanism').checked;
                const hematoma = document.getElementById('hematoma').checked;

                if (gcs || fracture) {
                    recommendation = '<strong>CT Recommended.</strong> Risk of ciTBI is ~4.4%.';
                } else if (loc || acting || mechanism || hematoma) {
                    recommendation = '<strong>Observation vs. CT based on other factors.</strong> Risk of ciTBI is ~0.9%. Shared decision making with guardian is recommended.';
                } else {
                    recommendation = '<strong>CT Not Recommended.</strong> Risk of ciTBI is very low (<0.02%).';
                }

            } else { // Age >= 2
                const gcs = document.getElementById('gcs-not-15-over2').checked;
                const basilar = document.getElementById('signs-basilar-fracture').checked;
                const loc = document.getElementById('loc').checked;
                const vomiting = document.getElementById('vomiting').checked;
                const headache = document.getElementById('severe-headache').checked;
                const mechanism = document.getElementById('severe-mechanism-over2').checked;

                if (gcs || basilar) {
                    recommendation = '<strong>CT Recommended.</strong> Risk of ciTBI is ~4.3%.';
                } else if (loc || vomiting || headache || mechanism) {
                     recommendation = '<strong>Observation vs. CT based on other factors.</strong> Risk of ciTBI is ~0.8%. Shared decision making is recommended.';
                } else {
                    recommendation = '<strong>CT Not Recommended.</strong> Risk of ciTBI is very low (<0.05%).';
                }
            }

            resultEl.innerHTML = `<p>${recommendation}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
