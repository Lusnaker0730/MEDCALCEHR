import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirFeedback } from '../../fhir-feedback.js';

// js/calculators/geneva-score.js - REFACTORED with UI Builder
export const genevaScore = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',
    
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: '🩺 Clinical Assessment',
                icon: '📋',
                content: uiBuilder.createCheckboxGroup({
                    name: 'geneva-risk',
                    label: 'Risk Factors (Select all that apply)',
                    options: [
                        { 
                            id: 'geneva-age',
                            value: '1', 
                            label: 'Age > 65 years',
                            description: 'Patient is older than 65'
                        },
                        { 
                            id: 'geneva-prev-dvt',
                            value: '1', 
                            label: 'Previous DVT or PE',
                            description: 'History of deep vein thrombosis or pulmonary embolism'
                        },
                        { 
                            id: 'geneva-surgery',
                            value: '1', 
                            label: 'Surgery or fracture within 1 month',
                            description: 'Recent surgery or bone fracture'
                        },
                        { 
                            id: 'geneva-malignancy',
                            value: '1', 
                            label: 'Active malignancy',
                            description: 'Current cancer diagnosis or treatment'
                        }
                    ]
                })
            })}
            
            ${uiBuilder.createSection({
                title: '🔍 Clinical Signs',
                icon: '⚕️',
                content: uiBuilder.createCheckboxGroup({
                    name: 'geneva-signs',
                    label: 'Physical Examination Findings',
                    options: [
                        { 
                            id: 'geneva-limb-pain',
                            value: '1', 
                            label: 'Unilateral lower limb pain',
                            description: 'Pain in one leg only'
                        },
                        { 
                            id: 'geneva-hemoptysis',
                            value: '1', 
                            label: 'Hemoptysis',
                            description: 'Coughing up blood'
                        },
                        { 
                            id: 'geneva-palpation',
                            value: '1', 
                            label: 'Pain on deep vein palpation AND unilateral edema',
                            description: 'Tenderness when pressing deep veins plus swelling in one leg'
                        }
                    ]
                })
            })}
            
            ${uiBuilder.createSection({
                title: '💓 Vital Signs',
                icon: '🩺',
                content: uiBuilder.createInput({
                    id: 'geneva-hr',
                    label: 'Heart Rate',
                    type: 'number',
                    placeholder: 'Enter heart rate',
                    unit: 'bpm',
                    min: 30,
                    max: 250,
                    required: true,
                    helpText: '< 75 bpm: 0 points | 75-94 bpm: 1 point | ≥ 95 bpm: 2 points'
                })
            })}
            
            <div class="result-container" id="geneva-result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📊 Scoring System</h4>
                <div class="scoring-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Risk Factor</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Age > 65 years</td><td>1</td></tr>
                            <tr><td>Previous DVT or PE</td><td>1</td></tr>
                            <tr><td>Surgery or fracture within 1 month</td><td>1</td></tr>
                            <tr><td>Active malignancy</td><td>1</td></tr>
                            <tr><td>Unilateral lower limb pain</td><td>1</td></tr>
                            <tr><td>Hemoptysis</td><td>1</td></tr>
                            <tr><td>Pain on palpation + unilateral edema</td><td>1</td></tr>
                            <tr><td>Heart rate 75-94 bpm</td><td>1</td></tr>
                            <tr><td>Heart rate ≥ 95 bpm</td><td>2</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <h4>🎯 Risk Stratification</h4>
                <div class="risk-interpretation">
                    <div class="risk-level low">
                        <strong>Score 0-1:</strong> Low Risk (8% PE prevalence)
                    </div>
                    <div class="risk-level intermediate">
                        <strong>Score 2-4:</strong> Intermediate Risk (28% PE prevalence)
                    </div>
                    <div class="risk-level high">
                        <strong>Score ≥5:</strong> High Risk (74% PE prevalence)
                    </div>
                </div>
            </div>
        `;
    },
    
    initialize: function (client, patient, container) {
        // Handle old-style initialization
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }
        const root = container || document;
        
        // Initialize UI components
        uiBuilder.initializeComponents(root);
        
        // Get form elements
        const hrInput = root.querySelector('#geneva-hr');
        const checkboxes = root.querySelectorAll('input[type="checkbox"]');
        const resultEl = root.querySelector('#geneva-result');
        
        // Calculate function
        const calculate = () => {
            let score = 0;
            
            // Sum checkbox values
            const checkedBoxes = root.querySelectorAll('input[type="checkbox"]:checked');
            checkedBoxes.forEach(box => {
                score += parseInt(box.value, 10);
            });
            
            // Add heart rate score
            const hr = parseInt(hrInput?.value, 10);
            if (!isNaN(hr)) {
                if (hr >= 75 && hr <= 94) {
                    score += 1;
                } else if (hr >= 95) {
                    score += 2;
                }
            }
            
            // Display result if heart rate is valid
            if (!hrInput || isNaN(hr)) {
                if (resultEl) resultEl.style.display = 'none';
                return;
            }
            
            // Determine risk level
            let riskLevel, riskClass, prevalence, recommendation;
            
            if (score <= 1) {
                riskLevel = 'Low Risk';
                riskClass = 'low-risk';
                prevalence = '8%';
                recommendation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be excluded.';
            } else if (score <= 4) {
                riskLevel = 'Intermediate Risk';
                riskClass = 'moderate-risk';
                prevalence = '28%';
                recommendation = 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.';
            } else {
                riskLevel = 'High Risk';
                riskClass = 'high-risk';
                prevalence = '74%';
                recommendation = 'PE is likely. Proceed directly to CT pulmonary angiography.';
            }
            
            // Display result
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>📊 Revised Geneva Score</h4>
                </div>
                <div class="result-score">
                    <div class="score-value">${score}</div>
                    <div class="score-label">Total Points</div>
                </div>
                <div class="alert ${riskClass}">
                    <div class="alert-title">${riskLevel}</div>
                    <div class="alert-content">
                        <p><strong>PE Prevalence:</strong> ${prevalence}</p>
                        <p><strong>Recommendation:</strong> ${recommendation}</p>
                    </div>
                </div>
                <div class="result-details">
                    <h5>Score Breakdown:</h5>
                    <ul>
                        <li>Risk factors: ${checkedBoxes.length} point${checkedBoxes.length !== 1 ? 's' : ''}</li>
                        <li>Heart rate (${hr} bpm): ${hr >= 95 ? 2 : hr >= 75 ? 1 : 0} point${hr >= 95 || (hr >= 75 && hr < 95) ? 's' : ''}</li>
                    </ul>
                </div>
            `;
            resultEl.style.display = 'block';
        };
        
        // Bind events
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });
        
        if (hrInput) {
            hrInput.addEventListener('input', calculate);
        }
        
        // Load FHIR data with feedback
        if (client && patient) {
            // Auto-populate age checkbox
            if (patient.birthDate) {
                const age = calculateAge(patient.birthDate);
                const ageCheckbox = root.querySelector('#geneva-age');
                if (age > 65 && ageCheckbox) {
                    ageCheckbox.checked = true;
                    ageCheckbox.parentElement.classList.add('selected');
                    fhirFeedback.addFieldFeedback(
                        ageCheckbox,
                        `✓ Age (${age} years) pre-filled from patient record`,
                        'success'
                    );
                }
            }
            
            // Load heart rate with feedback
            if (hrInput) {
                fhirFeedback.trackDataLoading(root, [
                    {
                        inputId: 'geneva-hr',
                        label: 'Heart Rate',
                        promise: getMostRecentObservation(client, LOINC_CODES.HEART_RATE),
                        setValue: (input, obs) => {
                            if (obs?.valueQuantity) {
                                input.value = Math.round(obs.valueQuantity.value);
                            }
                        }
                    }
                ]).then(() => {
                    calculate();
                });
            }
        } else {
            // No FHIR data available
            if (hrInput) {
                fhirFeedback.showInfo(
                    hrInput,
                    'No EHR connection. Please enter heart rate manually.'
                );
            }
        }
        
        // Initial calculation
        calculate();
    }
};

