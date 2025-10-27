import {
    getPatient,
    getMostRecentObservation,
    getPatientConditions,
    getMedicationRequests
} from '../../utils.js';

export const hasBled = {
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description:
        'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    generateHTML: () => `
        <div class="calculator-container">
            <div class="input-group">
                <label>Hypertension (Uncontrolled, >160 mmHg systolic)</label>
                <div class="segmented-control" data-id="hypertension">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Renal disease (Dialysis, transplant, Cr >2.26 mg/dL or >200 µmol/L)</label>
                <div class="segmented-control" data-id="renal">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Liver disease (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)</label>
                <div class="segmented-control" data-id="liver">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Stroke history</label>
                <div class="segmented-control" data-id="stroke">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Prior major bleeding or predisposition to bleeding</label>
                <div class="segmented-control" data-id="bleeding">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Labile INR (Unstable/high INRs, time in therapeutic range <60%)</label>
                <div class="segmented-control" data-id="inr">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Age >65</label>
                <div class="segmented-control" data-id="age">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Medication usage predisposing to bleeding (Aspirin, clopidogrel, NSAIDs)</label>
                <div class="segmented-control" data-id="meds">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="input-group">
                <label>Alcohol use (≥8 drinks/week)</label>
                <div class="segmented-control" data-id="alcohol">
                    <button value="0" class="active">No (+0)</button>
                    <button value="1">Yes (+1)</button>
                </div>
            </div>
            <div class="result-box has-bled-result">
                <h3 id="has-bled-score">0 points</h3>
                <p id="has-bled-interpretation">Risk was 0.9% in one validation study (Lip 2011) and 1.13 bleeds per 100 patient-years in another validation study (Pisters 2010). Anticoagulation should be considered: Patient has a relatively low risk for major bleeding (~1/100 patient-years).</p>
            </div>
        </div>
    `,
    initialize: async (client, patient, container) => {
        const riskFactors = [
            'hypertension',
            'renal',
            'liver',
            'stroke',
            'bleeding',
            'inr',
            'age',
            'meds',
            'alcohol'
        ];

        const scoreInterpretation = {
            0: '0.9% risk (Lip 2011) or 1.13 bleeds/100 patient-years (Pisters 2010). Low risk.',
            1: '1.02 bleeds/100 patient-years. Low-moderate risk.',
            2: '1.88 bleeds/100 patient-years. Moderate risk.',
            3: '3.74 bleeds/100 patient-years. Moderate-high risk.',
            4: '8.70 bleeds/100 patient-years. High risk.',
            5: '12.50 bleeds/100 patient-years. Very high risk.'
        };

        const calculateHasBledScore = () => {
            let score = 0;
            riskFactors.forEach(id => {
                const button = container.querySelector(
                    `.segmented-control[data-id="${id}"] .active`
                );
                if (button) {
                    score += parseInt(button.value);
                }
            });

            const interpretationText = scoreInterpretation[score] || scoreInterpretation[5];

            container.querySelector('#has-bled-score').innerText = `${score} points`;
            container.querySelector('#has-bled-interpretation').innerText =
                `Annual bleeding risk: ${interpretationText}`;
        };

        riskFactors.forEach(id => {
            container
                .querySelectorAll(`.segmented-control[data-id="${id}"] button`)
                .forEach(button => {
                    button.addEventListener('click', e => {
                        container
                            .querySelectorAll(`.segmented-control[data-id="${id}"] button`)
                            .forEach(btn => btn.classList.remove('active'));
                        e.target.classList.add('active');
                        calculateHasBledScore();
                    });
                });
        });

        calculateHasBledScore();

        // FHIR Integration
        if (client) {
            const setRadioValue = (id, value) => {
                const control = container.querySelector(`.segmented-control[data-id="${id}"]`);
                if (control) {
                    control
                        .querySelectorAll('button')
                        .forEach(btn => btn.classList.remove('active'));
                    const buttonToActivate = control.querySelector(`button[value="${value}"]`);
                    if (buttonToActivate) {
                        buttonToActivate.classList.add('active');
                    }
                }
            };

            // Age > 65
            const patientData = await getPatient(client);
            if (patientData && patientData.birthDate) {
                const age =
                    new Date().getFullYear() - new Date(patientData.birthDate).getFullYear();
                if (age > 65) {
                    setRadioValue('age', '1');
                }
            }

            // Conditions
            const conditions = await getPatientConditions(client, [
                '38341003', // Hypertension
                '709044004',
                '34947000',
                '80294001', // Renal disease
                '19943007', // Liver disease (Cirrhosis)
                '230690007', // Stroke
                '131148009' // Bleeding
            ]);

            const conditionMap = {
                hypertension: ['38341003'],
                renal: ['709044004', '34947000', '80294001'],
                liver: ['19943007'],
                stroke: ['230690007'],
                bleeding: ['131148009']
            };

            for (const [key, codes] of Object.entries(conditionMap)) {
                if (conditions.some(c => codes.includes(c.code.coding[0].code))) {
                    setRadioValue(key, '1');
                }
            }

            // Observations
            const sbp = await getMostRecentObservation(client, '8480-6'); // SBP
            if (sbp && sbp.valueQuantity.value > 160) {
                setRadioValue('hypertension', '1');
            }

            const creatinine = await getMostRecentObservation(client, '2160-0'); // Creatinine
            if (creatinine && creatinine.valueQuantity.value > 2.26) {
                // Assuming mg/dL
                setRadioValue('renal', '1');
            }

            // Medications
            const meds = await getMedicationRequests(client, [
                '1191',
                '32953',
                '5640',
                '7294',
                '3329'
            ]); // Aspirin, Clopidogrel, Ibuprofen, Naproxen, Diclofenac
            if (meds && meds.length > 0) {
                setRadioValue('meds', '1');
            }

            calculateHasBledScore();
        }
    }
};
