import { getPatient, getPatientConditions, getObservation } from '../../utils.js';

export const garfieldAf = {
    id: 'garfield-af',
    title: 'GARFIELD-AF Risk Score',
    description:
        'Predicts mortality, stroke, and bleeding in patients with and w/out anticoagulation.',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS:</strong> Use in patients with newly diagnosed atrial fibrillation (AF) to assist in determining the risks of anticoagulation therapy.
            </div>

            <div class="input-row">
                <div class="input-label">Sex</div>
                <div class="segmented-control" data-name="sex">
                    <label><input type="radio" name="sex" value="0" checked><span>Male</span></label>
                    <label><input type="radio" name="sex" value="1"><span>Female</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Age</div>
                <div class="input-with-unit">
                    <input type="number" id="age" class="input-field" placeholder="70">
                    <span>years</span>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Weight</div>
                <div class="input-with-unit">
                    <input type="number" id="weight" class="input-field" placeholder="65">
                    <span>kg</span>
                </div>
            </div>
             <div class="input-row">
                <div class="input-label">Heart Failure</div>
                <div class="segmented-control" data-name="heart_failure">
                    <label><input type="radio" name="heart_failure" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="heart_failure" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Vascular disease</div>
                <div class="segmented-control" data-name="vascular_disease">
                    <label><input type="radio" name="vascular_disease" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="vascular_disease" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Prior stroke</div>
                <div class="segmented-control" data-name="prior_stroke">
                    <label><input type="radio" name="prior_stroke" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="prior_stroke" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">History of bleeding</div>
                <div class="segmented-control" data-name="bleeding_history">
                    <label><input type="radio" name="bleeding_history" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="bleeding_history" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Carotid occlusive disease</div>
                <div class="segmented-control" data-name="carotid_disease">
                    <label><input type="radio" name="carotid_disease" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="carotid_disease" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Diabetes</div>
                <div class="segmented-control" data-name="diabetes">
                    <label><input type="radio" name="diabetes" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="diabetes" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Moderate-to-severe CKD</div>
                <div class="segmented-control" data-name="ckd">
                    <label><input type="radio" name="ckd" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="ckd" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Dementia</div>
                <div class="segmented-control" data-name="dementia">
                    <label><input type="radio" name="dementia" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="dementia" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Current smoker</div>
                <div class="segmented-control" data-name="smoker">
                    <label><input type="radio" name="smoker" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="smoker" value="1"><span>Yes</span></label>
                </div>
            </div>
             <div class="input-row">
                <div class="input-label">Antiplatelet treatment</div>
                <div class="segmented-control" data-name="antiplatelet">
                    <label><input type="radio" name="antiplatelet" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="antiplatelet" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">Ethnicity</div>
                <div class="radio-group vertical-group" data-name="ethnicity">
                    <label><input type="radio" name="ethnicity" value="caucasian" checked><span>Caucasian</span></label>
                    <label><input type="radio" name="ethnicity" value="hispanic"><span>Hispanic Latino</span></label>
                    <label><input type="radio" name="ethnicity" value="asian"><span>Asian</span></label>
                    <label><input type="radio" name="ethnicity" value="black"><span>Black/mixed/other</span></label>
                </div>
            </div>
             <div class="input-row">
                <div class="input-label">Pulse</div>
                <div class="input-with-unit">
                    <input type="number" id="pulse" class="input-field" placeholder="100">
                    <span>beats/min</span>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Diastolic blood pressure</div>
                <div class="input-with-unit">
                    <input type="number" id="dbp" class="input-field" placeholder="80">
                    <span>mm Hg</span>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">OAC treatment</div>
                <div class="radio-group vertical-group" data-name="oac">
                    <label><input type="radio" name="oac" value="none" checked><span>No oral anticoagulant</span></label>
                    <label><input type="radio" name="oac" value="noac"><span>NOAC</span></label>
                    <label><input type="radio" name="oac" value="vka"><span>VKA</span></label>
                </div>
            </div>
        </div>
        <div class="result-grid">
            <div class="result-box">
                <div class="result-title">6 months</div>
                <div id="result_6m"></div>
            </div>
            <div class="result-box">
                <div class="result-title">1 year</div>
                <div id="result_1y"></div>
            </div>
            <div class="result-box">
                <div class="result-title">2 years</div>
                <div id="result_2y"></div>
            </div>
        </div>
    `,

    initialize: client => {
        // Coefficients and baseline survival from GARFIELD-AF risk tool paper
        const modelData = {
            mortality: {
                coeffs: {
                    age: 0.076,
                    female: -0.165,
                    weight: -0.007,
                    hf: 0.638,
                    vascular: 0.168,
                    stroke: 0.38,
                    bleed: 0.354,
                    carotid: 0.334,
                    diabetes: 0.161,
                    ckd: 0.49,
                    dementia: 0.404,
                    smoker: 0.421,
                    pulse: 0.008,
                    dbp: -0.006,
                    oac_noac: -0.402,
                    oac_vka: -0.27,
                    antiplatelet: 0.198,
                    ethnicity_black: 0.134,
                    ethnicity_asian: -0.42,
                    ethnicity_hispanic: -0.091
                },
                baseline: { t6m: 0.985, t1y: 0.969, t2y: 0.935 }
            },
            stroke: {
                coeffs: {
                    age: 0.038,
                    female: 0.021,
                    weight: -0.008,
                    hf: 0.098,
                    vascular: 0.315,
                    stroke: 0.811,
                    bleed: 0.021,
                    carotid: 0.228,
                    diabetes: 0.052,
                    ckd: 0.076,
                    dementia: 0.288,
                    smoker: 0.131,
                    pulse: 0.002,
                    dbp: -0.008,
                    oac_noac: -0.366,
                    oac_vka: -0.49,
                    antiplatelet: 0.128,
                    ethnicity_black: 0.176,
                    ethnicity_asian: -0.04,
                    ethnicity_hispanic: 0.057
                },
                baseline: { t6m: 0.994, t1y: 0.989, t2y: 0.978 }
            },
            bleeding: {
                coeffs: {
                    age: 0.016,
                    female: 0.124,
                    weight: -0.004,
                    hf: 0.147,
                    vascular: 0.17,
                    stroke: 0.11,
                    bleed: 0.697,
                    carotid: 0.111,
                    diabetes: 0.071,
                    ckd: 0.364,
                    dementia: 0.008,
                    smoker: 0.079,
                    pulse: 0.002,
                    dbp: -0.001,
                    oac_noac: 0.648,
                    oac_vka: 0.706,
                    antiplatelet: 0.385,
                    ethnicity_black: 0.007,
                    ethnicity_asian: 0.284,
                    ethnicity_hispanic: -0.229
                },
                baseline: { t6m: 0.993, t1y: 0.985, t2y: 0.971 }
            }
        };

        const calculate = () => {
            const getRadioValue = name =>
                document.querySelector(`input[name="${name}"]:checked`)?.value || '0';
            const getNumeric = id => parseFloat(document.getElementById(id).value) || 0;

            const values = {
                age: getNumeric('age'),
                female: parseInt(getRadioValue('sex')),
                weight: getNumeric('weight'),
                hf: parseInt(getRadioValue('heart_failure')),
                vascular: parseInt(getRadioValue('vascular_disease')),
                stroke: parseInt(getRadioValue('prior_stroke')),
                bleed: parseInt(getRadioValue('bleeding_history')),
                carotid: parseInt(getRadioValue('carotid_disease')),
                diabetes: parseInt(getRadioValue('diabetes')),
                ckd: parseInt(getRadioValue('ckd')),
                dementia: parseInt(getRadioValue('dementia')),
                smoker: parseInt(getRadioValue('smoker')),
                pulse: getNumeric('pulse'),
                dbp: getNumeric('dbp'),
                antiplatelet: parseInt(getRadioValue('antiplatelet')),
                oac_noac: getRadioValue('oac') === 'noac' ? 1 : 0,
                oac_vka: getRadioValue('oac') === 'vka' ? 1 : 0,
                ethnicity_black: getRadioValue('ethnicity') === 'black' ? 1 : 0,
                ethnicity_asian: getRadioValue('ethnicity') === 'asian' ? 1 : 0,
                ethnicity_hispanic: getRadioValue('ethnicity') === 'hispanic' ? 1 : 0
            };

            const calculateRisk = outcome => {
                const lp = Object.keys(modelData[outcome].coeffs).reduce((sum, key) => {
                    return sum + modelData[outcome].coeffs[key] * (values[key] || 0);
                }, 0);

                const S0 = modelData[outcome].baseline;
                return {
                    t6m: (1 - Math.pow(S0.t6m, Math.exp(lp))) * 100,
                    t1y: (1 - Math.pow(S0.t1y, Math.exp(lp))) * 100,
                    t2y: (1 - Math.pow(S0.t2y, Math.exp(lp))) * 100
                };
            };

            const mortalityRisk = calculateRisk('mortality');
            const strokeRisk = calculateRisk('stroke');
            const bleedingRisk = calculateRisk('bleeding');

            const formatResult = (mortality, stroke, bleeding) => `
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #dc3545;">
                        <span style="font-weight: 500; color: #495057;">All-cause mortality:</span>
                        <strong style="font-size: 1.2em; color: #dc3545;">${mortality.toFixed(1)}%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #fd7e14;">
                        <span style="font-weight: 500; color: #495057;">Ischemic stroke/SE:</span>
                        <strong style="font-size: 1.2em; color: #fd7e14;">${stroke.toFixed(1)}%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #ffc107;">
                        <span style="font-weight: 500; color: #495057;">Major bleeding:</span>
                        <strong style="font-size: 1.2em; color: #ffc107;">${bleeding.toFixed(1)}%</strong>
                    </div>
                </div>`;

            document.getElementById('result_6m').innerHTML = formatResult(
                mortalityRisk.t6m,
                strokeRisk.t6m,
                bleedingRisk.t6m
            );
            document.getElementById('result_1y').innerHTML = formatResult(
                mortalityRisk.t1y,
                strokeRisk.t1y,
                bleedingRisk.t1y
            );
            document.getElementById('result_2y').innerHTML = formatResult(
                mortalityRisk.t2y,
                strokeRisk.t2y,
                bleedingRisk.t2y
            );
        };

        // Add visual feedback for radio button selections
        const updateRadioStyles = () => {
            // Handle segmented controls (horizontal radio groups)
            document.querySelectorAll('.segmented-control').forEach(control => {
                const labels = control.querySelectorAll('label');
                labels.forEach(label => {
                    const input = label.querySelector('input[type="radio"]');
                    if (input && input.checked) {
                        label.classList.add('selected');
                    } else {
                        label.classList.remove('selected');
                    }
                });
            });

            // Handle vertical radio groups
            document.querySelectorAll('.radio-group.vertical-group').forEach(group => {
                const labels = group.querySelectorAll('label');
                labels.forEach(label => {
                    const input = label.querySelector('input[type="radio"]');
                    if (input && input.checked) {
                        label.classList.add('selected');
                    } else {
                        label.classList.remove('selected');
                    }
                });
            });
        };

        // Update styles on input change
        document.querySelectorAll('.form-container input').forEach(input => {
            input.addEventListener('input', () => {
                calculate();
                updateRadioStyles();
            });
            input.addEventListener('change', () => {
                calculate();
                updateRadioStyles();
            });
        });

        // Initial style update
        updateRadioStyles();

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                updateRadioStyles();
            }
        };
        const setInput = (id, value, precision) => {
            document.getElementById(id).value = value.toFixed(precision);
        };

        getPatient(client).then(patient => {
            if (patient.gender === 'female') {
                setRadio('sex', '1');
            }
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            setInput('age', age, 0);
        });

        const conditionMap = {
            84114007: 'heart_failure',
            49601007: 'vascular_disease',
            230690007: 'prior_stroke',
            131148009: 'bleeding_history',
            51275005: 'carotid_disease',
            44054006: 'diabetes',
            52448006: 'dementia'
        };
        getPatientConditions(client, Object.keys(conditionMap)).then(conditions => {
            conditions.forEach(c => {
                const key = conditionMap[c.code.coding[0].code];
                if (key) {
                    setRadio(key, '1');
                }
            });
        });

        getObservation(client, '33914-3').then(egfr => {
            // eGFR
            if (egfr && egfr.valueQuantity && egfr.valueQuantity.value < 60) {
                setRadio('ckd', '1');
            }
        });
        getObservation(client, '72166-2').then(smoking => {
            // Smoking
            if (
                smoking &&
                smoking.valueCodeableConcept &&
                smoking.valueCodeableConcept.coding.some(c => c.code === '449868002')
            ) {
                setRadio('smoker', '1');
            }
        });
        getObservation(client, '29463-7').then(obs =>
            setInput('weight', obs.valueQuantity.value, 1)
        );
        getObservation(client, '8867-4').then(obs => setInput('pulse', obs.valueQuantity.value, 0));
        getObservation(client, '8462-4').then(obs => setInput('dbp', obs.valueQuantity.value, 0));

        client.patient
            .request('MedicationStatement?status=active&category=outpatient')
            .then(meds => {
                if (meds.entry) {
                    const antiplatelets = ['1191', '32968']; // Aspirin, Clopidogrel
                    const noacs = ['1364430', '1339905', '1490481']; // Apixaban, Dabigatran, Rivaroxaban
                    const vkas = ['11289']; // Warfarin

                    meds.entry.forEach(e => {
                        const code = e.resource.medicationCodeableConcept?.coding.find(
                            c => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
                        )?.code;
                        if (!code) {
                            return;
                        }
                        if (antiplatelets.includes(code)) {
                            setRadio('antiplatelet', '1');
                        }
                        if (noacs.includes(code)) {
                            setRadio('oac', 'noac');
                        }
                        if (vkas.includes(code)) {
                            setRadio('oac', 'vka');
                        }
                    });
                }
            })
            .finally(() => {
                setTimeout(calculate, 500);
            });
    }
};
