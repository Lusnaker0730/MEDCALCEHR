import { getMostRecentObservation, calculateAge, getPatientConditions } from '../../utils.js';

export const charlson = {
    id: 'charlson',
    title: 'Charlson Comorbidity Index (CCI)',
    description: 'Predicts 10-year survival in patients with multiple comorbidities.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row vertical">
                    <div class="input-label">Age</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="age" value="0"> &lt;50 years <span class="points">+0</span></label>
                        <label><input type="radio" name="age" value="1"> 50-59 years <span class="points">+1</span></label>
                        <label><input type="radio" name="age" value="2"> 60-69 years <span class="points">+2</span></label>
                        <label><input type="radio" name="age" value="3"> 70-79 years <span class="points">+3</span></label>
                        <label><input type="radio" name="age" value="4"> &ge;80 years <span class="points">+4</span></label>
                    </div>
                </div>

                ${this.generateConditionRow('mi', 'Myocardial infarction', 'History of definite or probable MI', 1)}
                ${this.generateConditionRow('chf', 'CHF', 'Exertional or paroxysmal nocturnal dyspnea', 1)}
                ${this.generateConditionRow('pvd', 'Peripheral vascular disease', 'Intermittent claudication, past bypass, gangrene, or aneurysm', 1)}
                ${this.generateConditionRow('cva', 'CVA or TIA', 'History of a cerebrovascular accident', 1)}
                ${this.generateConditionRow('dementia', 'Dementia', 'Chronic cognitive deficit', 1)}
                ${this.generateConditionRow('cpd', 'Chronic pulmonary disease', '', 1)}
                ${this.generateConditionRow('ctd', 'Connective tissue disease', '', 1)}
                ${this.generateConditionRow('pud', 'Peptic ulcer disease', 'Any history of treatment for ulcer disease', 1)}

                <div class="input-row vertical">
                    <div class="input-label">
                        <span>Liver disease</span>
                        <small>Mild = chronic hepatitis. Moderate/Severe = cirrhosis and portal hypertension.</small>
                    </div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="liver" value="0"> None <span class="points">+0</span></label>
                        <label><input type="radio" name="liver" value="1"> Mild <span class="points">+1</span></label>
                        <label><input type="radio" name="liver" value="3"> Moderate to severe <span class="points">+3</span></label>
                    </div>
                </div>

                <div class="input-row vertical">
                    <div class="input-label">
                        <span>Diabetes mellitus</span>
                        <small>End-organ damage includes retinopathy, nephropathy, or neuropathy.</small>
                    </div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="diabetes" value="0"> None or diet-controlled <span class="points">+0</span></label>
                        <label><input type="radio" name="diabetes" value="1"> Uncomplicated <span class="points">+1</span></label>
                        <label><input type="radio" name="diabetes" value="2"> End-organ damage <span class="points">+2</span></label>
                    </div>
                </div>
                
                ${this.generateConditionRow('hemiplegia', 'Hemiplegia', '', 2)}
                ${this.generateConditionRow('ckd', 'Moderate to severe CKD', 'Severe on dialysis, uremia, or creatinine >3 mg/dL', 2)}
                
                <div class="input-row vertical">
                    <div class="input-label">Solid tumor</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="tumor" value="0"> None <span class="points">+0</span></label>
                        <label><input type="radio" name="tumor" value="2"> Localized <span class="points">+2</span></label>
                        <label><input type="radio" name="tumor" value="6"> Metastatic <span class="points">+6</span></label>
                    </div>
                </div>

                ${this.generateConditionRow('leukemia', 'Leukemia', '', 2)}
                ${this.generateConditionRow('lymphoma', 'Lymphoma', '', 2)}
                ${this.generateConditionRow('aids', 'AIDS', 'Not just HIV positive, but "full-blown" AIDS', 6)}

            </div>
            <div class="ariscat-result-box">
                <div class="score-section">
                    <div class="score-value" id="cci-score">0</div>
                    <div class="score-label">Charlson Comorbidity Index</div>
                </div>
                <div class="interpretation-section">
                     <div class="score-value" id="cci-survival">98%</div>
                    <div class="score-label">Estimated 10-year survival</div>
                </div>
            </div>
        `;
    },
    generateConditionRow: function(id, title, subtitle, points) {
        return `
            <div class="input-row">
                <div class="input-label">
                    <span>${title}</span>
                    ${subtitle ? `<small>${subtitle}</small>` : ''}
                </div>
                <div class="segmented-control">
                    <label><input type="radio" name="${id}" value="0"> No <span class="points">+0</span></label>
                    <label><input type="radio" name="${id}" value="${points}"> Yes <span class="points">+${points}</span></label>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const calculate = () => {
            let score = 0;
            container.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                score += parseInt(radio.value, 10);
            });

            const survival = 100 * Math.pow(0.983, Math.exp(score * 0.9)); // Adjusted formula from literature

            container.querySelector('#cci-score').textContent = score;
            container.querySelector('#cci-survival').textContent = `${survival.toFixed(0)}%`;
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const group = radio.closest('.segmented-control, .radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                radio.parentElement.classList.add('selected');
                calculate();
            });
        });
        
        // Set default "No" or "None"
        container.querySelectorAll('.segmented-control, .radio-group').forEach(group => {
             const firstRadio = group.querySelector('input[type="radio"][value="0"]');
             if (firstRadio) {
                 firstRadio.checked = true;
                 firstRadio.parentElement.classList.add('selected');
             }
        });

        // Auto-populate age
        const age = calculateAge(patient.birthDate);
        let ageValue = 0;
        if (age >= 80) ageValue = 4;
        else if (age >= 70) ageValue = 3;
        else if (age >= 60) ageValue = 2;
        else if (age >= 50) ageValue = 1;
        const ageRadio = container.querySelector(`input[name="age"][value="${ageValue}"]`);
        if (ageRadio) {
            ageRadio.checked = true;
            ageRadio.parentElement.classList.add('selected');
        }
        
        // Auto-populate conditions from FHIR
        const conditionMap = {
            'mi': { codes: ['I21', 'I22'], value: 1 },
            'chf': { codes: ['I50'], value: 1 },
            'pvd': { codes: ['I73.9', 'I70'], value: 1 },
            'cva': { codes: ['I60', 'I61', 'I62', 'I63', 'I64', 'G45'], value: 1 },
            'dementia': { codes: ['F00', 'F01', 'F02', 'F03', 'G30'], value: 1 },
            'cpd': { codes: ['J40', 'J41', 'J42', 'J43', 'J44', 'J45', 'J46', 'J47'], value: 1 },
            'ctd': { codes: ['M32', 'M34', 'M05', 'M06'], value: 1 },
            'pud': { codes: ['K25', 'K26', 'K27', 'K28'], value: 1 },
            'hemiplegia': { codes: ['G81'], value: 2 },
            'leukemia': { codes: ['C91', 'C92', 'C93', 'C94', 'C95'], value: 2 },
            'lymphoma': { codes: ['C81', 'C82', 'C83', 'C84', 'C85'], value: 2 },
            'aids': { codes: ['B20', 'B21', 'B22', 'B24'], value: 6 }
        };

        for (const [key, { codes, value }] of Object.entries(conditionMap)) {
            getPatientConditions(client, codes).then(conditions => {
                if (conditions.length > 0) {
                    const radio = container.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (radio) {
                        radio.checked = true;
                        const group = radio.closest('.segmented-control');
                        group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                        radio.parentElement.classList.add('selected');
                        calculate();
                    }
                }
            });
        }
        
        // Special handling for multi-level conditions
        getPatientConditions(client, ['K70.3', 'K74', 'I85']).then(conditions => { // Moderate/Severe Liver
             if (conditions.length > 0) {
                 const radio = container.querySelector(`input[name="liver"][value="3"]`);
                 if(radio) radio.checked = true;
             } else {
                 getPatientConditions(client, ['K73', 'B18']).then(conditions => { // Mild Liver
                     if (conditions.length > 0) {
                         const radio = container.querySelector(`input[name="liver"][value="1"]`);
                         if(radio) radio.checked = true;
                     }
                 });
             }
        });
        
        getPatientConditions(client, ['E10.2', 'E10.3', 'E10.4', 'E10.5', 'E11.2', 'E11.3', 'E11.4', 'E11.5']).then(conditions => { // Diabetes w/ end-organ damage
             if (conditions.length > 0) {
                 const radio = container.querySelector(`input[name="diabetes"][value="2"]`);
                 if(radio) radio.checked = true;
             } else {
                 getPatientConditions(client, ['E10', 'E11']).then(conditions => { // Uncomplicated Diabetes
                     if (conditions.length > 0) {
                         const radio = container.querySelector(`input[name="diabetes"][value="1"]`);
                         if(radio) radio.checked = true;
                     }
                 });
             }
        });
        
        getPatientConditions(client, ['C00-C75', 'C76-C80']).then(conditions => { // Solid tumor
             if (conditions.length > 0) {
                const metastaticCodes = ['C77', 'C78', 'C79', 'C80'];
                const isMetastatic = conditions.some(c => metastaticCodes.includes(c.code.coding[0].code.substring(0,3)));
                const value = isMetastatic ? 6 : 2;
                const radio = container.querySelector(`input[name="tumor"][value="${value}"]`);
                if(radio) radio.checked = true;
             }
        });

        // Check for CKD via labs or conditions
        getPatientConditions(client, ['N18.3', 'N18.4', 'N18.5', 'Z99.2']).then(conditions => {
            if (conditions.length > 0) {
                 const radio = container.querySelector(`input[name="ckd"][value="2"]`);
                 if(radio) radio.checked = true;
            }
        });
        getMostRecentObservation(client, '2160-0').then(obs => { // Creatinine
            if (obs && obs.valueQuantity && obs.valueQuantity.value > 3) {
                 const radio = container.querySelector(`input[name="ckd"][value="2"]`);
                 if(radio) radio.checked = true;
            }
        });


        // Final calculation after all data is populated
        setTimeout(calculate, 1000); // Delay to allow async FHIR calls to complete
    }
};
