import {
    getMostRecentObservation,
    calculateAge
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

// Point allocation functions based on APACHE II score algorithm
const getPoints = {
    temp: v => {
        if (v >= 41 || v <= 29.9) return 4;
        if (v >= 39 || v <= 31.9) return 3;
        if (v <= 33.9) return 2;
        if (v >= 38.5 || v <= 35.9) return 1;
        return 0;
    },
    map: v => {
        if (v >= 160 || v <= 49) return 4;
        if (v >= 130) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    ph: v => {
        if (v >= 7.7 || v < 7.15) return 4;
        if (v >= 7.6 || v < 7.25) return 3;
        if (v < 7.33) return 2;
        if (v >= 7.5) return 1;
        return 0;
    },
    hr: v => {
        if (v >= 180 || v <= 39) return 4;
        if (v >= 140 || v <= 54) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    rr: v => {
        if (v >= 50 || v <= 5) return 4;
        if (v >= 35) return 3;
        if (v <= 9) return 2;
        if (v >= 25 || v <= 11) return 1;
        return 0;
    },
    sodium: v => {
        if (v >= 180 || v <= 110) return 4;
        if (v >= 160 || v <= 119) return 3;
        if (v >= 155 || v <= 129) return 2;
        if (v >= 150) return 1;
        return 0;
    },
    potassium: v => {
        if (v >= 7 || v < 2.5) return 4;
        if (v >= 6) return 3;
        if (v <= 2.9) return 2;
        if (v >= 5.5 || v <= 3.4) return 1;
        return 0;
    },
    creatinine: (v, arf) => {
        // arf is boolean for acute renal failure
        let score = 0;
        const v_mgdl = v / 88.4; // convert umol/L to mg/dL
        if (v_mgdl >= 3.5) score = 4;
        else if (v_mgdl >= 2.0) score = 3;
        else if (v_mgdl >= 1.5 || v_mgdl < 0.6) score = 2;
        return arf ? score * 2 : score;
    },
    hct: v => {
        if (v >= 60 || v < 20) return 4;
        if (v >= 50 || v < 30) return 2;
        return 0;
    },
    wbc: v => {
        if (v >= 40 || v < 1) return 4;
        if (v >= 20 || v < 3) return 2;
        if (v >= 15) return 1;
        return 0;
    },
    gcs: v => 15 - v,
    oxygenation: (fio2, pao2, paco2) => {
        if (fio2 >= 0.5) {
            const A_a_gradient = fio2 * 713 - paco2 / 0.8 - pao2;
            if (A_a_gradient >= 500) return 4;
            if (A_a_gradient >= 350) return 3;
            if (A_a_gradient >= 200) return 2;
            return 0;
        } else {
            if (pao2 < 55) return 4;
            if (pao2 <= 60) return 3;
            if (pao2 <= 70) return 1;
            return 0;
        }
    },
    age: v => {
        if (v >= 75) return 6;
        if (v >= 65) return 5;
        if (v >= 55) return 3;
        if (v >= 45) return 2;
        return 0;
    }
};

export const apacheIi = {
    id: 'apache-ii',
    title: 'APACHE II',
    description: 'Calculates APACHE II score for ICU mortality.',
    generateHTML: function () {
        const chronicHealthSection = uiBuilder.createSection({
            title: 'Chronic Health Status',
            subtitle: 'History of severe organ insufficiency or immunocompromised',
            content: uiBuilder.createRadioGroup({
                name: 'chronic',
                options: [
                    { value: '5', label: 'Yes - Non-operative or emergency postoperative (+5)', checked: true },
                    { value: '2', label: 'Yes - Elective postoperative (+2)' },
                    { value: '0', label: 'No (0)' }
                ]
            })
        });

        const demographicsSection = uiBuilder.createSection({
            title: 'Demographics & Vital Signs',
            content: [
                uiBuilder.createInput({ id: 'apache-ii-age', label: 'Age', unit: 'years' }),
                uiBuilder.createInput({ id: 'apache-ii-temp', label: 'Temperature', unit: '°C', step: 0.1, placeholder: '36.1 - 37.8' }),
                uiBuilder.createInput({ id: 'apache-ii-map', label: 'Mean Arterial Pressure', unit: 'mmHg', placeholder: '70 - 100' }),
                uiBuilder.createInput({ id: 'apache-ii-hr', label: 'Heart Rate', unit: 'bpm', placeholder: '60 - 100' }),
                uiBuilder.createInput({ id: 'apache-ii-rr', label: 'Respiratory Rate', unit: 'breaths/min', placeholder: '12 - 20' })
            ].join('')
        });

        const labsSection = uiBuilder.createSection({
            title: 'Laboratory Values',
            content: [
                uiBuilder.createInput({ id: 'apache-ii-ph', label: 'Arterial pH', step: 0.01, placeholder: '7.38 - 7.44' }),
                uiBuilder.createInput({ id: 'apache-ii-sodium', label: 'Sodium', unit: 'mmol/L', placeholder: '136 - 145' }),
                uiBuilder.createInput({ id: 'apache-ii-potassium', label: 'Potassium', unit: 'mmol/L', step: 0.1, placeholder: '3.5 - 5.2' }),
                uiBuilder.createInput({ id: 'apache-ii-creatinine', label: 'Creatinine', unit: 'μmol/L', step: 0.1, placeholder: '62 - 115' }),
                uiBuilder.createInput({ id: 'apache-ii-hct', label: 'Hematocrit', unit: '%', step: 0.1, placeholder: '36 - 51' }),
                uiBuilder.createInput({ id: 'apache-ii-wbc', label: 'WBC Count', unit: 'x 10⁹/L', step: 0.1, placeholder: '3.7 - 10.7' }),
                uiBuilder.createRadioGroup({
                    name: 'arf',
                    label: 'Acute Renal Failure',
                    helpText: 'Double creatinine points if ARF is present',
                    options: [
                        { value: '1', label: 'Yes (Double Points)' },
                        { value: '0', label: 'No', checked: true }
                    ]
                })
            ].join('')
        });

        const neuroSection = uiBuilder.createSection({
            title: 'Neurological Assessment',
            content: uiBuilder.createInput({ 
                id: 'apache-ii-gcs', 
                label: 'Glasgow Coma Scale', 
                unit: 'points', 
                placeholder: '3 - 15',
                min: 3,
                max: 15
            })
        });

        const oxygenSection = uiBuilder.createSection({
            title: 'Oxygenation',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'oxy_method',
                    label: 'Measurement Method',
                    options: [
                        { value: 'fio2_pao2', label: 'FiO₂ ≥ 0.5 (uses A-a gradient)', checked: true },
                        { value: 'pao2_only', label: 'FiO₂ < 0.5 (uses PaO₂ only)' }
                    ]
                }),
                '<div id="fio2_pao2_inputs">',
                uiBuilder.createInput({ id: 'apache-ii-fio2', label: 'FiO₂', step: 0.01, placeholder: 'e.g. 0.5', min: 0, max: 1 }),
                uiBuilder.createInput({ id: 'apache-ii-pao2', label: 'PaO₂', unit: 'mmHg' }),
                uiBuilder.createInput({ id: 'apache-ii-paco2', label: 'PaCO₂', unit: 'mmHg' }),
                '</div>',
                '<div id="pao2_only_inputs" style="display:none;">',
                uiBuilder.createInput({ id: 'apache-ii-pao2-only', label: 'PaO₂', unit: 'mmHg' }),
                '</div>'
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p>Enter physiologic values from the first 24 hours of ICU admission. Use the worst value for each parameter.</p>
                </div>
            </div>
            
            ${chronicHealthSection}
            ${demographicsSection}
            ${labsSection}
            ${neuroSection}
            ${oxygenSection}
            
            ${uiBuilder.createResultBox({ id: 'apache-ii-result', title: 'APACHE II Score' })}
            
            <div class="info-section mt-30">
                <h4>📚 Reference</h4>
                <p>Knaus, W. A., Draper, E. A., Wagner, D. P., & Zimmerman, J. E. (1985). APACHE II: a severity of disease classification system. <em>Critical care medicine</em>, 13(10), 818-829.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#apache-ii-age');
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        // Helper to safely set value if element exists
        const setValue = (id, value) => {
            const el = container.querySelector(id);
            if (el) el.value = value;
        };

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-temp', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-map', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-hr', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-rr', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.PO2).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-ph', obs.valueQuantity.value.toFixed(2));
            });
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-sodium', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.POTASSIUM).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-potassium', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-creatinine', obs.valueQuantity.value.toFixed(2));
            });
            getMostRecentObservation(client, LOINC_CODES.HEMATOCRIT).then(obs => {
                if (obs?.valueQuantity) setValue('#apache-ii-hct', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, '6764-2').then(obs => { // WBC
                if (obs?.valueQuantity) setValue('#apache-ii-wbc', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, '8478-0').then(obs => { // GCS
                if (obs?.valueQuantity) setValue('#apache-ii-gcs', obs.valueQuantity.value.toFixed(0));
            });
        }

        // Calculate function
        const calculate = () => {
            const arf = container.querySelector('input[name="arf"]:checked')?.value === '1';
            const chronic = container.querySelector('input[name="chronic"]:checked')?.value === '5';
            const oxyMethod = container.querySelector('input[name="oxy_method"]:checked')?.value;

            const getValue = (id) => parseFloat(container.querySelector(id)?.value) || 0;

            const values = {
                temp: getValue('#apache-ii-temp'),
                map: getValue('#apache-ii-map'),
                hr: getValue('#apache-ii-hr'),
                rr: getValue('#apache-ii-rr'),
                ph: getValue('#apache-ii-ph'),
                sodium: getValue('#apache-ii-sodium'),
                potassium: getValue('#apache-ii-potassium'),
                creatinine: getValue('#apache-ii-creatinine'),
                hct: getValue('#apache-ii-hct'),
                wbc: getValue('#apache-ii-wbc'),
                gcs: getValue('#apache-ii-gcs'),
                age: getValue('#apache-ii-age'),
                fio2: getValue('#apache-ii-fio2'),
                pao2: getValue('#apache-ii-pao2'),
                paco2: getValue('#apache-ii-paco2'),
                pao2_only: getValue('#apache-ii-pao2-only')
            };

            const resultBox = container.querySelector('#apache-ii-result');
            const resultHeader = resultBox.querySelector('.ui-result-header');
            const resultContent = resultBox.querySelector('.ui-result-content');

            try {
                // Check required fields (simple check: must not be 0 unless 0 is valid, but most vitals aren't 0)
                // For simplicity, we'll calculate if most fields are present
                
                let aps = 0;
                aps += getPoints.temp(values.temp);
                aps += getPoints.map(values.map);
                aps += getPoints.ph(values.ph);
                aps += getPoints.hr(values.hr);
                aps += getPoints.rr(values.rr);
                aps += getPoints.sodium(values.sodium);
                aps += getPoints.potassium(values.potassium);
                aps += getPoints.creatinine(values.creatinine, arf);
                aps += getPoints.hct(values.hct);
                aps += getPoints.wbc(values.wbc);
                aps += getPoints.gcs(values.gcs);

                if (oxyMethod === 'fio2_pao2' && values.fio2 >= 0.5) {
                    aps += getPoints.oxygenation(values.fio2, values.pao2, values.paco2);
                } else {
                    aps += getPoints.oxygenation(0.21, values.pao2_only || values.pao2, null);
                }

                const agePoints = getPoints.age(values.age);
                const chronicPoints = chronic ? 5 : 0;

                const score = aps + agePoints + chronicPoints;
                const mortality =
                    (Math.exp(-3.517 + 0.146 * score) / (1 + Math.exp(-3.517 + 0.146 * score))) *
                    100;

                let mortalityClass = 'ui-alert-success';
                let riskLevel = 'Low Risk';

                if (mortality < 10) {
                    mortalityClass = 'ui-alert-success';
                    riskLevel = 'Low Risk';
                } else if (mortality < 25) {
                    mortalityClass = 'ui-alert-warning';
                    riskLevel = 'Moderate Risk';
                } else if (mortality < 50) {
                    mortalityClass = 'ui-alert-danger';
                    riskLevel = 'High Risk';
                } else {
                    mortalityClass = 'ui-alert-danger';
                    riskLevel = 'Very High Risk';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({ label: 'Total Score', value: score, unit: 'points' })}
                    ${uiBuilder.createResultItem({ 
                        label: 'Predicted ICU Mortality', 
                        value: mortality.toFixed(1), 
                        unit: '%', 
                        interpretation: riskLevel, 
                        alertClass: mortalityClass 
                    })}
                    
                    <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
                        <strong>Breakdown:</strong> APS ${aps} + Age ${agePoints} + Chronic Health ${chronicPoints}
                    </div>
                `;
                
                resultBox.classList.add('show');
            } catch (e) {
                console.error(e);
            }
        };

        // Attach event listeners
        container.addEventListener('change', (e) => {
            if (e.target.type === 'radio' || e.target.type === 'checkbox') calculate();
        });
        
        container.addEventListener('input', (e) => {
            if (e.target.type === 'number') calculate();
        });

        // Handle oxygen method switching
        const oxyMethodInputs = container.querySelectorAll('input[name="oxy_method"]');
        const fio2Inputs = container.querySelector('#fio2_pao2_inputs');
        const pao2OnlyInputs = container.querySelector('#pao2_only_inputs');

        oxyMethodInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === 'fio2_pao2') {
                    fio2Inputs.style.display = 'block';
                    pao2OnlyInputs.style.display = 'none';
                } else {
                    fio2Inputs.style.display = 'none';
                    pao2OnlyInputs.style.display = 'block';
                }
                calculate();
            });
        });

        // Initial calculation
        calculate();
    }
};