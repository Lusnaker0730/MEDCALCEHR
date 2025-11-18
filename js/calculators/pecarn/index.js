// js/calculators/pecarn.js
import { calculateAge } from '../../utils.js';

export const pecarn = {
    id: 'pecarn',
    title: 'PECARN Pediatric Head Injury/Trauma Algorithm',
    description: 'Predicts need for brain imaging after pediatric head injury.',
    generateHTML: function () {
        const criteriaUnder2 = [
            {
                id: 'gcs-not-15',
                label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)'
            },
            { id: 'palpable-fracture', label: 'Palpable skull fracture' },
            { id: 'loc-5-sec', label: 'LOC ≥ 5 seconds' },
            { id: 'not-acting-normally', label: 'Guardian feels child is not acting normally' },
            {
                id: 'severe-mechanism',
                label: 'Severe mechanism of injury (e.g., fall >3ft, MVA, struck by high-impact object)'
            },
            { id: 'hematoma', label: 'Non-frontal scalp hematoma' }
        ];
        const criteriaOver2 = [
            {
                id: 'gcs-not-15-over2',
                label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)'
            },
            {
                id: 'signs-basilar-fracture',
                label: 'Signs of basilar skull fracture (e.g., hemotympanum, raccoon eyes)'
            },
            { id: 'loc', label: 'Any loss of consciousness' },
            { id: 'vomiting', label: 'Vomiting' },
            { id: 'severe-headache', label: 'Severe headache' },
            { id: 'severe-mechanism-over2', label: 'Severe mechanism of injury' }
        ];

        const html = `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            
            <div id="pecarn-age-selector">
                <label><strong>Patient Age:</strong></label>
                <input type="radio" id="age-under-2" name="pecarn-age" value="under2" checked><label for="age-under-2">< 2 years</label>
                <input type="radio" id="age-over-2" name="pecarn-age" value="over2"><label for="age-over-2">≥ 2 years</label>
            </div>
            <hr>
            
            <div id="pecarn-criteria-under2" class="pecarn-criteria-group">
                <h4>Criteria for Children < 2 Years Old:</h4>
                <div class="checklist">
                    ${criteriaUnder2.map(c => `<div class="check-item"><input type="checkbox" id="${c.id}"><label for="${c.id}">${c.label}</label></div>`).join('')}
                </div>
            </div>

            <div id="pecarn-criteria-over2" class="pecarn-criteria-group" style="display:none;">
                <h4>Criteria for Children ≥ 2 Years Old:</h4>
                <div class="checklist">
                     ${criteriaOver2.map(c => `<div class="check-item"><input type="checkbox" id="${c.id}"><label for="${c.id}">${c.label}</label></div>`).join('')}
                </div>
            </div>

            <button id="calculate-pecarn">Evaluate PECARN</button>
            <div id="pecarn-result" class="result" style="display:none;"></div>

            <!-- Decision Tree and Clinical Information Section -->
            <div class="formula-section">
                <h4>📋 PECARN Head Trauma Decision Tree & Risk Stratification</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    The PECARN algorithm uses dichotomous Yes/No questions to predict clinically important traumatic brain injury (ciTBI) risk and guide imaging decisions.
                </p>

                <!-- Children < 2 Years Algorithm -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">🔍 Algorithm A: Children < 2 Years Old</h5>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Question 1: GCS < 15 or other signs of altered mental status?</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #c8e6c9;">
                                    <strong>YES:</strong><br>
                                    → <strong style="color: #d32f2f;">CT Recommended</strong><br>
                                    <span style="font-size: 0.85em;">Risk of ciTBI: <strong>13-16%</strong></span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%;">
                                    <strong>NO:</strong><br>
                                    → Continue to Question 2
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: white; padding: 15px; border-radius: 5px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Question 2: Occipital or parietal or temporal scalp hematoma, laceration ≥5cm, or abrasion/bruising?</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #fff9c4;">
                                    <strong>YES:</strong><br>
                                    → <strong style="color: #f57f17;">Observation vs. CT</strong><br>
                                    <span style="font-size: 0.85em;">Risk: <strong>4.4%</strong></span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #c8e6c9;">
                                    <strong>NO:</strong><br>
                                    → <strong style="color: #388e3c;">CT Not Recommended</strong><br>
                                    <span style="font-size: 0.85em;">Risk: <strong>&lt;0.02%</strong></span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Children ≥ 2 Years Algorithm -->
                <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #9C27B0;">
                    <h5 style="margin-top: 0; color: #6A1B9A;">🔍 Algorithm B: Children ≥ 2 Years Old</h5>
                    
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Question 1: GCS < 15 or other signs of altered mental status?</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #c8e6c9;">
                                    <strong>YES:</strong><br>
                                    → <strong style="color: #d32f2f;">CT Recommended</strong><br>
                                    <span style="font-size: 0.85em;">Risk of ciTBI: <strong>14%</strong></span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%;">
                                    <strong>NO:</strong><br>
                                    → Continue to Question 2
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: white; padding: 15px; border-radius: 5px;">
                        <p style="font-weight: bold; margin-bottom: 8px;">Question 2: History of LOC, history of vomiting, or severe mechanism of injury?</p>
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #fff9c4;">
                                    <strong>YES:</strong><br>
                                    → <strong style="color: #f57f17;">Observation vs. CT</strong><br>
                                    <span style="font-size: 0.85em;">Risk: <strong>4.3%</strong></span>
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px; width: 50%; background: #c8e6c9;">
                                    <strong>NO:</strong><br>
                                    → <strong style="color: #388e3c;">CT Not Recommended</strong><br>
                                    <span style="font-size: 0.85em;">Risk: <strong>&lt;0.05%</strong></span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Risk Summary Table -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📊 Risk Summary & Clinical Recommendations</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85em;">
                        <tr style="background: #fff8e1;">
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Recommendation</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Risk of ciTBI</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Clinical Action</strong></th>
                        </tr>
                        <tr style="background: #c8e6c9;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong style="color: #d32f2f;">CT Recommended</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">13-16% (Age <2)<br>14% (Age ≥2)</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Obtain immediate CT imaging</td>
                        </tr>
                        <tr style="background: #fff9c4;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong style="color: #f57f17;">Observation vs. CT</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">4.3-4.4%</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Shared decision-making based on clinical factors (physician experience, parent preference, age <3 months)</td>
                        </tr>
                        <tr style="background: #c8e6c9;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong style="color: #388e3c;">CT Not Recommended</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">&lt;0.02-0.05%</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Observation without imaging; arrange follow-up</td>
                        </tr>
                    </table>
                </div>

                <!-- Clinical Decision Factors -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">🎯 Shared Decision-Making Factors (Observation vs. CT Zone):</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>Physician Experience:</strong> With head injury evaluation and close follow-up capability</li>
                        <li><strong>Multiple Concerning Findings:</strong> More findings favor imaging</li>
                        <li><strong>Worsening Symptoms:</strong> After emergency department observation</li>
                        <li><strong>Signs After Observation:</strong> New symptom development during observation</li>
                        <li><strong>Parental Preference:</strong> Parent anxiety and preference for imaging vs. observation</li>
                        <li><strong>Age Factor:</strong> Age <3 months - lower threshold for CT</li>
                        <li><strong>Follow-up Reliability:</strong> Ability of family to return if worsening</li>
                    </ul>
                </div>

                <!-- Important Clinical Notes -->
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #0c5460;">📌 Important Clinical Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #0c5460;">
                        <li><strong>Clinically Important Traumatic Brain Injury (ciTBI):</strong> Defined as CT evidence of traumatic brain injury with neurologic symptoms that require acute intervention OR hospitalization ≥2 nights</li>
                        <li><strong>GCS Scoring:</strong> Even brief periods of abnormal behavior (irritability, lethargy, confusion) count as altered mental status</li>
                        <li><strong>Loss of Consciousness:</strong> Any period of unconsciousness after trauma (even brief)</li>
                        <li><strong>Scalp Hematoma (Age <2):</strong> Specifically non-frontal (occipital, parietal, temporal) carries higher risk</li>
                        <li><strong>Mechanism Assessment:</strong> Falls >3 feet, motor vehicle accidents, struck by high-impact object</li>
                        <li><strong>Validation:</strong> PECARN rules are sensitive (92-96%) and help reduce unnecessary CT imaging</li>
                        <li><strong>Follow-up Required:</strong> Even children not receiving CT should have clear return precautions and follow-up instructions</li>
                        <li><strong>Age Limitations:</strong> Rules apply to children aged 2 days to 18 years</li>
                    </ul>
                </div>
            </div>
        `;
        return html;
    },
    initialize: function (client, patient, container) {
        const ageUnder2Radio = container.querySelector('#age-under-2');
        const ageOver2Radio = container.querySelector('#age-over-2');
        const criteriaUnder2Div = container.querySelector('#pecarn-criteria-under2');
        const criteriaOver2Div = container.querySelector('#pecarn-criteria-over2');

        const setAgeGroup = age => {
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

        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            setAgeGroup(age);
        }

        ageUnder2Radio.addEventListener('change', () => setAgeGroup(1));
        ageOver2Radio.addEventListener('change', () => setAgeGroup(2));

        container.querySelector('#calculate-pecarn').addEventListener('click', () => {
            const resultEl = container.querySelector('#pecarn-result');
            let recommendation = '';
            let riskColor = '';
            let riskPercentage = '';

            if (ageUnder2Radio.checked) {
                const gcs = container.querySelector('#gcs-not-15').checked;
                const fracture = container.querySelector('#palpable-fracture').checked;
                const loc = container.querySelector('#loc-5-sec').checked;
                const acting = container.querySelector('#not-acting-normally').checked;
                const mechanism = container.querySelector('#severe-mechanism').checked;
                const hematoma = container.querySelector('#hematoma').checked;

                if (gcs || fracture) {
                    recommendation = '<strong>CT Recommended</strong>';
                    riskPercentage = '13-16% risk of ciTBI';
                    riskColor = '#d32f2f';
                } else if (loc || acting || mechanism || hematoma) {
                    recommendation =
                        '<strong>Observation vs. CT Based on Clinical Factors</strong>';
                    riskPercentage = '4.4% risk of ciTBI';
                    riskColor = '#f57f17';
                } else {
                    recommendation = '<strong>CT Not Recommended</strong>';
                    riskPercentage = '<0.02% risk of ciTBI';
                    riskColor = '#388e3c';
                }
            } else {
                // Age >= 2
                const gcs = container.querySelector('#gcs-not-15-over2').checked;
                const basilar = container.querySelector('#signs-basilar-fracture').checked;
                const loc = container.querySelector('#loc').checked;
                const vomiting = container.querySelector('#vomiting').checked;
                const headache = container.querySelector('#severe-headache').checked;
                const mechanism = container.querySelector('#severe-mechanism-over2').checked;

                if (gcs || basilar) {
                    recommendation = '<strong>CT Recommended</strong>';
                    riskPercentage = '14% risk of ciTBI';
                    riskColor = '#d32f2f';
                } else if (loc || vomiting || headache || mechanism) {
                    recommendation =
                        '<strong>Observation vs. CT Based on Clinical Factors</strong>';
                    riskPercentage = '4.3% risk of ciTBI';
                    riskColor = '#f57f17';
                } else {
                    recommendation = '<strong>CT Not Recommended</strong>';
                    riskPercentage = '<0.05% risk of ciTBI';
                    riskColor = '#388e3c';
                }
            }

            resultEl.innerHTML = `
                <div style="background: ${riskColor}20; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 5px;">
                    <div style="font-size: 1em; margin-bottom: 10px;">
                        <span style="color: ${riskColor}; font-weight: bold; font-size: 1.1em;">${recommendation}</span>
                    </div>
                    <div style="font-size: 0.95em; color: ${riskColor};">
                        <strong>Risk Assessment:</strong> ${riskPercentage}
                    </div>
                    ${
                        riskColor === '#f57f17'
                            ? `
                    <div style="font-size: 0.9em; color: ${riskColor}; margin-top: 10px;">
                        <strong>Shared Decision-Making Recommended</strong><br>
                        Factors to consider: Physician experience, multiple findings, parental preference, follow-up reliability
                    </div>
                    `
                            : ''
                    }
                </div>
            `;
            resultEl.style.display = 'block';
        });
    }
};
