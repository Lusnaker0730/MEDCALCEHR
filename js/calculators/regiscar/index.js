
export const regiscar = {
    id: 'regiscar',
    title: 'RegiSCAR Score for DRESS',
    description: 'Diagnoses Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS).',

    generateHTML: () => `
        <div class="form-container">
            <div class="input-row">
                <div class="input-label">Fever (≥38.5 °C)</div>
                <div class="segmented-control" data-name="fever">
                    <label><input type="radio" name="fever" value="-1" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="fever" value="0"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Enlarged lymph nodes (≥2 sites, >1 cm)</div>
                <div class="segmented-control" data-name="lymph-nodes">
                    <label><input type="radio" name="lymph-nodes" value="0" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="lymph-nodes" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Atypical lymphocytes</div>
                <div class="segmented-control" data-name="lymphocytes">
                    <label><input type="radio" name="lymphocytes" value="0" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="lymphocytes" value="1"><span>Yes</span></label>
                </div>
            </div>
             <div class="input-row vertical">
                <div class="input-label">Eosinophilia</div>
                <div class="radio-group vertical-group" data-name="eosinophilia">
                    <label><input type="radio" name="eosinophilia" value="0" checked><span>0-699 cells or &lt;10%</span></label>
                    <label><input type="radio" name="eosinophilia" value="1"><span>700-1,499 cells or 10-19.9%</span></label>
                    <label><input type="radio" name="eosinophilia" value="2"><span>≥1,500 cells or ≥20%</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Skin rash extent >50%</div>
                <div class="segmented-control" data-name="rash">
                    <label><input type="radio" name="rash" value="0" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="rash" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">At least two of: edema, infiltration, purpura, scaling</div>
                <div class="segmented-control" data-name="skin-features">
                    <label><input type="radio" name="skin-features" value="0" checked><span>Unknown</span></label>
                    <label><input type="radio" name="skin-features" value="-1"><span>No</span></label>
                    <label><input type="radio" name="skin-features" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Biopsy suggesting DRESS</div>
                <div class="segmented-control" data-name="biopsy">
                    <label><input type="radio" name="biopsy" value="-1"><span>No</span></label>
                    <label><input type="radio" name="biopsy" value="0" checked><span>Yes/Unknown</span></label>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">Internal organ involved</div>
                <div class="segmented-control" data-name="organ">
                    <label><input type="radio" name="organ" value="0" checked><span>0</span></label>
                    <label><input type="radio" name="organ" value="1"><span>1</span></label>
                    <label><input type="radio" name="organ" value="2"><span>≥2</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Resolution in ≥15 days</div>
                <div class="segmented-control" data-name="resolution">
                    <label><input type="radio" name="resolution" value="-1" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="resolution" value="0"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Alternative diagnoses excluded (by ≥3 biological investigations)</div>
                <div class="segmented-control" data-name="alternative">
                    <label><input type="radio" name="alternative" value="0" checked><span>No/Unknown</span></label>
                    <label><input type="radio" name="alternative" value="1"><span>Yes</span></label>
                </div>
            </div>
        </div>
        <div class="result-box">
            <div class="result-content">
                <div class="result-title">RegiSCAR Score</div>
                <div class="result-score" id="result-score">-</div>
            </div>
            <div class="result-content">
                <div class="result-title">Likelihood</div>
                <div class="result-interpretation" id="result-interpretation">-</div>
            </div>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const score = [
                'fever', 'lymph-nodes', 'lymphocytes', 'eosinophilia', 
                'rash', 'skin-features', 'biopsy', 'organ', 
                'resolution', 'alternative'
            ].reduce((acc, name) => {
                const selected = document.querySelector(`input[name="${name}"]:checked`);
                return acc + (selected ? parseInt(selected.value) : 0);
            }, 0);

            const resultScore = document.getElementById('result-score');
            const resultInterpretation = document.getElementById('result-interpretation');
            const resultBox = document.querySelector('.result-box');
            
            resultScore.textContent = `${score} points`;
            
            let interpretation = '';
            let resultClass = '';

            if (score < 2) {
                interpretation = 'No case';
                resultClass = 'low-risk';
            } else if (score <= 3) {
                interpretation = 'Possible case';
                resultClass = 'intermediate-risk';
            } else if (score <= 5) {
                interpretation = 'Probable case';
                resultClass = 'high-risk';
            } else {
                interpretation = 'Definite case';
                resultClass = 'very-high-risk';
            }

            resultInterpretation.textContent = interpretation;
            resultBox.className = `result-box ${resultClass}`;
        };

        document.querySelectorAll('.form-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        
        // FHIR data fetching
        const getObservation = (code) => client.patient.request(
            `Observation?code=${code}&_sort=-date&_count=1`
        ).then(r => r.entry && r.entry[0] ? r.entry[0].resource : null);

        getObservation('8310-5').then(temp => { // Temperature
            if (temp && temp.valueQuantity && temp.valueQuantity.value >= 38.5) {
                document.querySelector('input[name="fever"][value="0"]').checked = true;
                document.querySelector('input[name="fever"][value="0"]').parentElement.click();
            }
        });

        getObservation('26478-8').then(eos => { // Eosinophils
            if (eos && eos.valueQuantity) {
                const value = eos.valueQuantity.value;
                let radioValue = '0';
                if (value >= 1500) {
                    radioValue = '2';
                } else if (value >= 700) {
                    radioValue = '1';
                }
                document.querySelector(`input[name="eosinophilia"][value="${radioValue}"]`).checked = true;
                document.querySelector(`input[name="eosinophilia"][value="${radioValue}"]`).parentElement.click();
            }
        });
        
        calculate(); // Initial calculation
    }
};
