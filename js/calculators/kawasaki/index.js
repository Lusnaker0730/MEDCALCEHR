
export const kawasaki = {
    id: 'kawasaki',
    title: 'Kawasaki Disease Diagnostic Criteria',
    description: 'Diagnoses Kawasaki Disease based on clinical criteria.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row">
                    <div class="input-label">Fever for ≥5 days</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="fever" value="0"> No</label>
                        <label><input type="radio" name="fever" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Acute change in extremities<span>Erythema of palms and soles, or edema of hands and feet</span></div>
                    <div class="segmented-control">
                        <label><input type="radio" name="acute_extrem" value="0"> No</label>
                        <label><input type="radio" name="acute_extrem" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Subacute change in extremities<span>Periungual peeling of fingers and toes in weeks 2 and 3</span></div>
                    <div class="segmented-control">
                        <label><input type="radio" name="subacute_extrem" value="0"> No</label>
                        <label><input type="radio" name="subacute_extrem" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Polymorphous exanthem</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="exanthem" value="0"> No</label>
                        <label><input type="radio" name="exanthem" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Bilateral bulbar conjunctival injection without exudate</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="conjunctival" value="0"> No</label>
                        <label><input type="radio" name="conjunctival" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Changes in lips and oral cavity<span>Erythema, lips cracking, strawberry tongue, diffuse injection of oral/pharyngeal mucosae</span></div>
                    <div class="segmented-control">
                        <label><input type="radio" name="oral" value="0"> No</label>
                        <label><input type="radio" name="oral" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Cervical lymphadenopathy<span>>1.5 cm diameter, usually unilateral</span></div>
                    <div class="segmented-control">
                        <label><input type="radio" name="lymph" value="0"> No</label>
                        <label><input type="radio" name="lymph" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Coronary artery disease detected by 2D echo or coronary angiogram</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="cad" value="0"> No</label>
                        <label><input type="radio" name="cad" value="1"> Yes</label>
                    </div>
                </div>
            </div>
            <div id="kawasaki-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please select criteria.</div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#kawasaki-result');
        const resultValueEl = container.querySelector('#kawasaki-result .result-value');

        const calculate = () => {
            const fever = container.querySelector('input[name="fever"]:checked');
            const cad = container.querySelector('input[name="cad"]:checked');
            
            // The 5 principal clinical features (AHA guidelines count extremity changes as one)
            const extremChanges = container.querySelector('input[name="acute_extrem"]:checked')?.value === '1' || container.querySelector('input[name="subacute_extrem"]:checked')?.value === '1';
            const exanthem = container.querySelector('input[name="exanthem"]:checked')?.value === '1';
            const conjunctival = container.querySelector('input[name="conjunctival"]:checked')?.value === '1';
            const oral = container.querySelector('input[name="oral"]:checked')?.value === '1';
            const lymph = container.querySelector('input[name="lymph"]:checked')?.value === '1';

            const principalFeaturesCount = [extremChanges, exanthem, conjunctival, oral, lymph].filter(Boolean).length;

            if (!fever) {
                resultValueEl.textContent = 'Please select criteria.';
                resultEl.className = 'result-box ttkg-result';
                return;
            }

            const hasFever = fever.value === '1';
            const hasCAD = cad?.value === '1';

            if (!hasFever) {
                resultEl.className = 'result-box ttkg-result';
                resultValueEl.textContent = 'Fever for ≥5 days is required for diagnosis.';
                return;
            }

            if (principalFeaturesCount >= 4 || hasCAD) {
                resultEl.className = 'result-box ttkg-result calculated';
                resultValueEl.innerHTML = `
                    <div style="font-size: 1.5em; font-weight: bold;">Positive</div>
                    For Kawasaki Disease
                `;
            } else {
                resultEl.className = 'result-box ttkg-result';
                resultValueEl.innerHTML = `
                     <div style="font-size: 1.5em; font-weight: bold;">Criteria Not Met</div>
                     Consider incomplete Kawasaki Disease if fever persists. Found ${principalFeaturesCount} of 4 required principal features.
                `;
            }
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.segmented-control');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
        
        // Set all to 'No' initially and trigger calculation
        container.querySelectorAll('.segmented-control').forEach(group => {
            const noRadio = group.querySelector('input[type="radio"][value="0"]');
            if (noRadio) {
                noRadio.checked = true;
                noRadio.parentElement.classList.add('selected');
            }
        });

        calculate();
    }
};
