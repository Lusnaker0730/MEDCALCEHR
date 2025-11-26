import {
    getMostRecentObservation,
    calculateAge
} from '../../utils';
import { LOINC_CODES } from '../../fhir-codes';
import { UnitConverter } from '../../unit-converter';
import { uiBuilder } from '../../ui-builder';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Observation, Patient } from '../../types/fhir';

// Point allocation functions based on APACHE II score algorithm
const getPoints = {
    temp: (v: number): number => {
        if (v >= 41 || v <= 29.9) return 4;
        if (v >= 39 || v <= 31.9) return 3;
        if (v <= 33.9) return 2;
        if (v >= 38.5 || v <= 35.9) return 1;
        return 0;
    },
    map: (v: number): number => {
        if (v >= 160 || v <= 49) return 4;
        if (v >= 130) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    ph: (v: number): number => {
        if (v >= 7.7 || v < 7.15) return 4;
        if (v >= 7.6 || v < 7.25) return 3;
        if (v < 7.33) return 2;
        if (v >= 7.5) return 1;
        return 0;
    },
    hr: (v: number): number => {
        if (v >= 180 || v <= 39) return 4;
        if (v >= 140 || v <= 54) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    rr: (v: number): number => {
        if (v >= 50 || v <= 5) return 4;
        if (v >= 35) return 3;
        if (v <= 9) return 2;
        if (v >= 25 || v <= 11) return 1;
        return 0;
    },
    sodium: (v: number): number => {
        if (v >= 180 || v <= 110) return 4;
        if (v >= 160 || v <= 119) return 3;
        if (v >= 155 || v <= 129) return 2;
        if (v >= 150) return 1;
        return 0;
    },
    potassium: (v: number): number => {
        if (v >= 7 || v < 2.5) return 4;
        if (v >= 6) return 3;
        if (v <= 2.9) return 2;
        if (v >= 5.5 || v <= 3.4) return 1;
        return 0;
    },
    creatinine: (v: number, arf: boolean): number => {
        // arf is boolean for acute renal failure
        let score = 0;
        const v_mgdl = v / 88.4; // convert umol/L to mg/dL
        if (v_mgdl >= 3.5) score = 4;
        else if (v_mgdl >= 2.0) score = 3;
        else if (v_mgdl >= 1.5 || v_mgdl < 0.6) score = 2;
        return arf ? score * 2 : score;
    },
    hct: (v: number): number => {
        if (v >= 60 || v < 20) return 4;
        if (v >= 50 || v < 30) return 2;
        return 0;
    },
    wbc: (v: number): number => {
        if (v >= 40 || v < 1) return 4;
        if (v >= 20 || v < 3) return 2;
        if (v >= 15) return 1;
        return 0;
    },
    gcs: (v: number): number => 15 - v,
    oxygenation: (fio2: number, pao2: number, paco2: number | null): number => {
        if (fio2 >= 0.5) {
            // Need paco2 for A-a gradient
            if (paco2 === null) return 0; // Should not happen if logic is correct
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
    age: (v: number): number => {
        if (v >= 75) return 6;
        if (v >= 65) return 5;
        if (v >= 55) return 3;
        if (v >= 45) return 2;
        return 0;
    }
};

export const apacheIi: Calculator = {
    id: 'apache-ii',
    title: 'APACHE II',
    description: 'Calculates APACHE II score for ICU mortality.',
    category: 'critical-care',
    generateHTML: function (): string {
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
                uiBuilder.createInput({
                    id: 'apache-ii-temp',
                    label: 'Temperature',
                    unitToggle: { type: 'temperature', units: ['°C', '°F'] },
                    step: 0.1,
                    placeholder: '36.0 - 38.4'
                }),
                uiBuilder.createInput({ id: 'apache-ii-map', label: 'Mean Arterial Pressure', unit: 'mmHg', placeholder: '70 - 109' }),
                uiBuilder.createInput({ id: 'apache-ii-hr', label: 'Heart Rate', unit: 'bpm', placeholder: '70 - 109' }),
                uiBuilder.createInput({ id: 'apache-ii-rr', label: 'Respiratory Rate', unit: 'breaths/min', placeholder: '12 - 24' })
            ].join('')
        });

        const labsSection = uiBuilder.createSection({
            title: 'Laboratory Values',
            content: [
                uiBuilder.createInput({ id: 'apache-ii-ph', label: 'Arterial pH', step: 0.01, placeholder: '7.33 - 7.49' }),
                uiBuilder.createInput({
                    id: 'apache-ii-sodium',
                    label: 'Sodium',
                    unitToggle: { type: 'electrolytes', units: ['mEq/L', 'mmol/L'] },
                    placeholder: '130 - 149'
                }),
                uiBuilder.createInput({
                    id: 'apache-ii-potassium',
                    label: 'Potassium',
                    unitToggle: { type: 'electrolytes', units: ['mEq/L', 'mmol/L'] },
                    step: 0.1,
                    placeholder: '3.5 - 5.4'
                }),
                uiBuilder.createInput({
                    id: 'apache-ii-creatinine',
                    label: 'Creatinine',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] },
                    step: 0.1,
                    placeholder: '0.6 - 1.4'
                }),
                uiBuilder.createInput({ id: 'apache-ii-hct', label: 'Hematocrit', unit: '%', step: 0.1, placeholder: '30 - 45.9' }),
                uiBuilder.createInput({ id: 'apache-ii-wbc', label: 'WBC Count', unit: 'x 10⁹/L', step: 0.1, placeholder: '3 - 14.9' }),
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
                uiBuilder.createInput({ id: 'apache-ii-pao2', label: 'PaO₂', unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'] } }),
                uiBuilder.createInput({ id: 'apache-ii-paco2', label: 'PaCO₂', unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'] } }),
                '</div>',
                '<div id="pao2_only_inputs" style="display:none;">',
                uiBuilder.createInput({ id: 'apache-ii-pao2-only', label: 'PaO₂', unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'] } }),
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
    initialize: function (client: FHIRClient, patient: Patient, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#apache-ii-age') as HTMLInputElement;
        if (patient && patient.birthDate && ageInput) {
            ageInput.value = calculateAge(patient.birthDate).toString();
        }

        // Helper to safely set value if element exists
        const setValue = (id: string, value: string) => {
            const el = container.querySelector(id) as HTMLInputElement;
            if (el) el.value = value;
        };

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-temp', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-map', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-hr', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-rr', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.PO2).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-ph', obs.valueQuantity.value.toFixed(2));
            });
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-sodium', obs.valueQuantity.value.toFixed(0));
            });
            getMostRecentObservation(client, LOINC_CODES.POTASSIUM).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-potassium', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-creatinine', obs.valueQuantity.value.toFixed(2));
            });
            getMostRecentObservation(client, LOINC_CODES.HEMATOCRIT).then((obs: Observation | null) => {
                if (obs?.valueQuantity) setValue('#apache-ii-hct', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, '6764-2').then((obs: Observation | null) => { // WBC
                if (obs?.valueQuantity) setValue('#apache-ii-wbc', obs.valueQuantity.value.toFixed(1));
            });
            getMostRecentObservation(client, '8478-0').then((obs: Observation | null) => { // GCS
                if (obs?.valueQuantity) setValue('#apache-ii-gcs', obs.valueQuantity.value.toFixed(0));
            });
        }

        // Calculate function
        const calculate = () => {
            const arfInput = container.querySelector('input[name="arf"]:checked') as HTMLInputElement;
            const arf = arfInput?.value === '1';

            const chronicInput = container.querySelector('input[name="chronic"]:checked') as HTMLInputElement;
            const chronic = chronicInput?.value === '5';

            const oxyMethodInput = container.querySelector('input[name="oxy_method"]:checked') as HTMLInputElement;
            const oxyMethod = oxyMethodInput?.value;

            const getValue = (id: string): number => {
                const el = container.querySelector(id) as HTMLInputElement;
                return parseFloat(el?.value) || 0;
            };
            const getStandardValue = (id: string, unit: string): number => {
                const el = container.querySelector(id) as HTMLInputElement;
                return UnitConverter.getStandardValue(el, unit) || 0;
            };

            const values = {
                temp: getStandardValue('#apache-ii-temp', '°C'),
                map: getValue('#apache-ii-map'),
                hr: getValue('#apache-ii-hr'),
                rr: getValue('#apache-ii-rr'),
                ph: getValue('#apache-ii-ph'),
                sodium: getStandardValue('#apache-ii-sodium', 'mmol/L'),
                potassium: getStandardValue('#apache-ii-potassium', 'mmol/L'),
                creatinine: getStandardValue('#apache-ii-creatinine', 'µmol/L'),
                hct: getValue('#apache-ii-hct'),
                wbc: getValue('#apache-ii-wbc'),
                gcs: getValue('#apache-ii-gcs'),
                age: getValue('#apache-ii-age'),
                fio2: getValue('#apache-ii-fio2'),
                pao2: getStandardValue('#apache-ii-pao2', 'mmHg'),
                paco2: getStandardValue('#apache-ii-paco2', 'mmHg'),
                pao2_only: getStandardValue('#apache-ii-pao2-only', 'mmHg')
            };

            const resultBox = container.querySelector('#apache-ii-result') as HTMLElement;
            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

            try {
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
                    ${uiBuilder.createResultItem({ label: 'Total Score', value: score.toString(), unit: 'points' })}
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
            const target = e.target as HTMLInputElement;
            if (target.type === 'radio' || target.type === 'checkbox') calculate();
        });

        container.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'number') calculate();
        });

        // Handle oxygen method switching
        const oxyMethodInputs = container.querySelectorAll('input[name="oxy_method"]');
        const fio2Inputs = container.querySelector('#fio2_pao2_inputs') as HTMLElement;
        const pao2OnlyInputs = container.querySelector('#pao2_only_inputs') as HTMLElement;

        oxyMethodInputs.forEach(input => {
            input.addEventListener('change', () => {
                const target = input as HTMLInputElement;
                if (target.value === 'fio2_pao2') {
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

export default apacheIi;
