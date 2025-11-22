import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const genevaScore = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',
    
    generateHTML: function () {
        const riskFactors = [
            { id: 'geneva-age', label: 'Age > 65 years', points: 1 },
            { id: 'geneva-prev-dvt', label: 'Previous DVT or PE', points: 1 },
            { id: 'geneva-surgery', label: 'Surgery or fracture within 1 month', points: 1 },
            { id: 'geneva-malignancy', label: 'Active malignancy', points: 1 }
        ];

        const clinicalSigns = [
            { id: 'geneva-limb-pain', label: 'Unilateral lower limb pain', points: 1 },
            { id: 'geneva-hemoptysis', label: 'Hemoptysis', points: 1 },
            { id: 'geneva-palpation', label: 'Pain on deep vein palpation AND unilateral edema', points: 1 }
        ];

        const assessmentSection = uiBuilder.createSection({
            title: 'Clinical Assessment',
            icon: '📋',
            content: riskFactors.map(item => 
                uiBuilder.createCheckbox({
                    id: item.id,
                    label: `${item.label} (+${item.points})`,
                    value: item.points.toString()
                })
            ).join('')
        });

        const signsSection = uiBuilder.createSection({
            title: 'Clinical Signs',
            icon: '⚕️',
            content: clinicalSigns.map(item => 
                uiBuilder.createCheckbox({
                    id: item.id,
                    label: `${item.label} (+${item.points})`,
                    value: item.points.toString()
                })
            ).join('')
        });

        const vitalsSection = uiBuilder.createSection({
            title: 'Vital Signs',
            icon: '🩺',
            content: uiBuilder.createInput({
                id: 'geneva-hr',
                label: 'Heart Rate',
                type: 'number',
                placeholder: 'Enter heart rate',
                unit: 'bpm',
                helpText: '75-94 bpm (+1), ≥ 95 bpm (+2)'
            })
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${assessmentSection}
            ${signsSection}
            ${vitalsSection}
            
            ${uiBuilder.createResultBox({ id: 'geneva-result', title: 'Geneva Score Result' })}
        `;
    },
    
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        const calculate = () => {
            let score = 0;
            
            // Sum checkbox values
            const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
            checkedBoxes.forEach(box => {
                score += parseInt(box.value, 10);
            });
            
            // Add heart rate score
            const hrInput = container.querySelector('#geneva-hr');
            const hr = parseInt(hrInput?.value, 10);
            if (!isNaN(hr)) {
                if (hr >= 75 && hr <= 94) {
                    score += 1;
                } else if (hr >= 95) {
                    score += 2;
                }
            }
            
            // Display result if heart rate is valid
            const resultBox = container.querySelector('#geneva-result');
            if (!hrInput || isNaN(hr)) {
                resultBox.classList.remove('show');
                return;
            }
            
            // Determine risk level
            let riskLevel, alertClass, prevalence, recommendation;
            
            if (score <= 1) {
                riskLevel = 'Low Risk';
                alertClass = 'ui-alert-success';
                prevalence = '8%';
                recommendation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be excluded.';
            } else if (score <= 4) {
                riskLevel = 'Intermediate Risk';
                alertClass = 'ui-alert-warning';
                prevalence = '28%';
                recommendation = 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.';
            } else {
                riskLevel = 'High Risk';
                alertClass = 'ui-alert-danger';
                prevalence = '74%';
                recommendation = 'PE is likely. Proceed directly to CT pulmonary angiography.';
            }
            
            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                ${uiBuilder.createResultItem({ 
                    label: 'PE Prevalence', 
                    value: prevalence, 
                    unit: '',
                    alertClass: alertClass
                })}
                
                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">💡</span>
                    <div class="ui-alert-content">
                        <strong>Recommendation:</strong> ${recommendation}
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };
        
        // Bind events
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', calculate);
            input.addEventListener('input', calculate);
        });
        
        // Load FHIR data
        if (client && patient) {
            // Auto-populate age checkbox
            if (patient.birthDate) {
                const age = calculateAge(patient.birthDate);
                const ageCheckbox = container.querySelector('#geneva-age');
                if (age > 65 && ageCheckbox) {
                    ageCheckbox.checked = true;
                    ageCheckbox.dispatchEvent(new Event('change'));
                }
            }
            
            // Load heart rate
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                const hrInput = container.querySelector('#geneva-hr');
                if (hrInput && obs?.valueQuantity) {
                    hrInput.value = Math.round(obs.valueQuantity.value);
                    hrInput.dispatchEvent(new Event('input'));
                }
            });
        }
        
        // Initial calculation
        calculate();
    }
};