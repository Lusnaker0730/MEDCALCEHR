// js/calculators/demo-ui-builder/index.js
// Demonstration calculator using the new UI Builder system

import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { fhirFeedback } from '../../fhir-feedback.js';
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const demoUiBuilder = {
    id: 'demo-ui-builder',
    title: '🎨 UI Builder Demo Calculator',
    description: 'Demonstration of the unified UI component system with all available components',
    
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: '👤 Patient Demographics',
                icon: '📋',
                content: uiBuilder.createRadioGroup({
                    name: 'demo-gender',
                    label: 'Gender',
                    required: true,
                    options: [
                        { value: 'male', label: '👨 Male', checked: true },
                        { value: 'female', label: '👩 Female' }
                    ],
                    helpText: 'Select patient gender'
                }) + uiBuilder.createInput({
                    id: 'demo-age',
                    label: 'Age',
                    type: 'number',
                    min: 0,
                    max: 120,
                    unit: 'years',
                    placeholder: 'Enter age',
                    required: true,
                    helpText: 'Patient age in years'
                })
            })}
            
            ${uiBuilder.createSection({
                title: '📏 Measurements with Unit Conversion',
                icon: '⚖️',
                content: uiBuilder.createInput({
                    id: 'demo-weight',
                    label: 'Weight',
                    type: 'number',
                    placeholder: 'Enter weight',
                    unitToggle: {
                        type: 'weight',
                        units: ['kg', 'lbs'],
                        default: 'kg'
                    },
                    helpText: 'Click unit button to switch between kg and lbs'
                }) + uiBuilder.createInput({
                    id: 'demo-height',
                    label: 'Height',
                    type: 'number',
                    placeholder: 'Enter height',
                    unitToggle: {
                        type: 'height',
                        units: ['cm', 'in', 'ft'],
                        default: 'cm'
                    },
                    helpText: 'Click unit button to cycle through cm, inches, and feet'
                }) + uiBuilder.createInput({
                    id: 'demo-temp',
                    label: 'Temperature',
                    type: 'number',
                    placeholder: 'Enter temperature',
                    step: '0.1',
                    unitToggle: {
                        type: 'temperature',
                        units: ['C', 'F'],
                        default: 'C'
                    },
                    helpText: 'Toggle between Celsius and Fahrenheit'
                })
            })}
            
            ${uiBuilder.createSection({
                title: '🏥 Clinical Parameters',
                icon: '💉',
                content: uiBuilder.createSelect({
                    id: 'demo-race',
                    label: 'Race',
                    options: [
                        { value: '', label: '-- Select --', selected: true },
                        { value: 'white', label: 'White/Caucasian' },
                        { value: 'black', label: 'Black/African American' },
                        { value: 'asian', label: 'Asian' },
                        { value: 'hispanic', label: 'Hispanic/Latino' },
                        { value: 'other', label: 'Other' }
                    ],
                    helpText: 'Select patient race for eGFR calculation'
                }) + uiBuilder.createRange({
                    id: 'demo-severity',
                    label: 'Severity Score',
                    min: 0,
                    max: 10,
                    step: 1,
                    defaultValue: 5,
                    unit: '/10',
                    showValue: true
                })
            })}
            
            ${uiBuilder.createSection({
                title: '✅ Risk Factors (Checkboxes)',
                icon: '⚠️',
                content: uiBuilder.createCheckboxGroup({
                    name: 'demo-risk',
                    label: 'Select all that apply:',
                    options: [
                        { 
                            value: 'diabetes', 
                            label: 'Diabetes Mellitus',
                            description: 'History of type 1 or type 2 diabetes'
                        },
                        { 
                            value: 'hypertension', 
                            label: 'Hypertension',
                            description: 'Blood pressure consistently > 140/90 mmHg'
                        },
                        { 
                            value: 'smoking', 
                            label: 'Current Smoker',
                            description: 'Active tobacco use'
                        },
                        { 
                            value: 'ckd', 
                            label: 'Chronic Kidney Disease',
                            description: 'eGFR < 60 mL/min/1.73m²'
                        },
                        { 
                            value: 'chf', 
                            label: 'Congestive Heart Failure',
                            description: 'History of heart failure'
                        }
                    ],
                    helpText: 'Check all applicable risk factors'
                })
            })}
            
            ${uiBuilder.createSection({
                title: '🎯 Severity Assessment (Radio)',
                icon: '📊',
                content: uiBuilder.createRadioGroup({
                    name: 'demo-asa',
                    label: 'ASA Physical Status Classification',
                    options: [
                        { value: '1', label: 'ASA I - Healthy patient' },
                        { value: '2', label: 'ASA II - Mild systemic disease', checked: true },
                        { value: '3', label: 'ASA III - Severe systemic disease' },
                        { value: '4', label: 'ASA IV - Life-threatening disease' },
                        { value: '5', label: 'ASA V - Moribund patient' }
                    ],
                    helpText: 'American Society of Anesthesiologists classification'
                })
            })}
            
            <div class="result-container" id="demo-result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>💡 About This Demo</h4>
                <p>This calculator demonstrates all available UI components from the <strong>UI Builder System</strong>:</p>
                <ul>
                    <li><strong>Sections</strong>: Organized groups with icons and titles</li>
                    <li><strong>Input Fields</strong>: With unit conversion (kg↔lbs, cm↔in, °C↔°F)</li>
                    <li><strong>Radio Buttons</strong>: Single selection with visual feedback</li>
                    <li><strong>Checkboxes</strong>: Multiple selections with descriptions</li>
                    <li><strong>Select Dropdown</strong>: Traditional dropdown menu</li>
                    <li><strong>Range Slider</strong>: Interactive value selection</li>
                </ul>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>🎨 Consistent, modern styling across all components</li>
                    <li>🔄 Automatic unit conversion with visual buttons</li>
                    <li>📱 Fully responsive for mobile devices</li>
                    <li>♿ Accessible with keyboard navigation</li>
                    <li>⚡ Easy to use API for developers</li>
                </ul>
            </div>
        `;
    },
    
    initialize: function (client, patient, container) {
        const resultEl = container.querySelector('#demo-result');
        
        // ✨ Initialize all UI components (REQUIRED)
        uiBuilder.initializeComponents(container);
        
        // Get all form elements
        const weightInput = container.querySelector('#demo-weight');
        const heightInput = container.querySelector('#demo-height');
        const tempInput = container.querySelector('#demo-temp');
        const ageInput = container.querySelector('#demo-age');
        const genderRadios = container.querySelectorAll('input[name="demo-gender"]');
        const riskCheckboxes = container.querySelectorAll('input[name="demo-risk"]');
        const asaRadios = container.querySelectorAll('input[name="demo-asa"]');
        const raceSelect = container.querySelector('#demo-race');
        const severitySlider = container.querySelector('#demo-severity');
        
        // Calculation function
        const calculate = () => {
            // Get values using UnitConverter for proper unit handling
            const weight = UnitConverter.getStandardValue(weightInput, 'kg');
            const height = UnitConverter.getStandardValue(heightInput, 'cm');
            const temp = UnitConverter.getStandardValue(tempInput, 'C');
            const age = parseFloat(ageInput.value);
            
            // Get selected gender
            const gender = container.querySelector('input[name="demo-gender"]:checked')?.value;
            
            // Get selected race
            const race = raceSelect.value;
            
            // Get severity
            const severity = severitySlider.value;
            
            // Count selected risk factors
            const riskCount = Array.from(riskCheckboxes).filter(cb => cb.checked).length;
            const riskFactors = Array.from(riskCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.parentElement.querySelector('.checkbox-label').textContent.trim());
            
            // Get ASA classification
            const asa = container.querySelector('input[name="demo-asa"]:checked')?.value;
            
            // Calculate BMI if weight and height available
            let bmi = null;
            if (weight && height) {
                const heightM = height / 100;
                bmi = weight / (heightM * heightM);
            }
            
            // Generate result
            if (weight || height || age) {
                let resultHTML = `
                    <div class="result-header">
                        <h4>📊 Demo Results</h4>
                    </div>
                `;
                
                // Demographics
                resultHTML += `
                    <div class="result-section">
                        <h5>Patient Demographics</h5>
                        ${age ? `<div class="result-item"><span class="label">Age:</span><span class="value">${age} years</span></div>` : ''}
                        ${gender ? `<div class="result-item"><span class="label">Gender:</span><span class="value">${gender === 'male' ? '👨 Male' : '👩 Female'}</span></div>` : ''}
                        ${race ? `<div class="result-item"><span class="label">Race:</span><span class="value">${raceSelect.options[raceSelect.selectedIndex].text}</span></div>` : ''}
                    </div>
                `;
                
                // Measurements
                if (weight || height || temp) {
                    resultHTML += `
                        <div class="result-section">
                            <h5>Measurements</h5>
                            ${weight ? `<div class="result-item"><span class="label">Weight:</span><span class="value">${weight.toFixed(1)} kg (${(weight * 2.20462).toFixed(1)} lbs)</span></div>` : ''}
                            ${height ? `<div class="result-item"><span class="label">Height:</span><span class="value">${height.toFixed(1)} cm (${(height * 0.393701).toFixed(1)} in)</span></div>` : ''}
                            ${temp ? `<div class="result-item"><span class="label">Temperature:</span><span class="value">${temp.toFixed(1)}°C (${(temp * 9/5 + 32).toFixed(1)}°F)</span></div>` : ''}
                            ${bmi ? `<div class="result-item highlight"><span class="label">BMI:</span><span class="value">${bmi.toFixed(1)} kg/m²</span></div>` : ''}
                        </div>
                    `;
                }
                
                // Risk factors
                resultHTML += `
                    <div class="result-section">
                        <h5>Risk Assessment</h5>
                        <div class="result-item"><span class="label">Risk Factors:</span><span class="value">${riskCount}</span></div>
                        ${riskFactors.length > 0 ? `<div class="result-item"><span class="label">Selected:</span><span class="value-list">${riskFactors.join(', ')}</span></div>` : ''}
                        ${asa ? `<div class="result-item"><span class="label">ASA Class:</span><span class="value">ASA ${asa}</span></div>` : ''}
                        <div class="result-item"><span class="label">Severity Score:</span><span class="value">${severity}/10</span></div>
                    </div>
                `;
                
                // Overall assessment
                const riskLevel = riskCount >= 3 ? 'High' : riskCount >= 1 ? 'Moderate' : 'Low';
                const riskClass = riskCount >= 3 ? 'high-risk' : riskCount >= 1 ? 'moderate-risk' : 'low-risk';
                
                resultHTML += `
                    <div class="result-section">
                        <h5>Overall Assessment</h5>
                        <div class="alert ${riskClass}">
                            <strong>Risk Level:</strong> ${riskLevel}
                            <p>This patient has ${riskCount} documented risk factor${riskCount !== 1 ? 's' : ''}.</p>
                        </div>
                    </div>
                `;
                
                resultEl.innerHTML = resultHTML;
                resultEl.style.display = 'block';
            }
        };
        
        // Bind events to all inputs
        if (weightInput) weightInput.addEventListener('input', calculate);
        if (heightInput) heightInput.addEventListener('input', calculate);
        if (tempInput) tempInput.addEventListener('input', calculate);
        if (ageInput) ageInput.addEventListener('input', calculate);
        if (severitySlider) severitySlider.addEventListener('input', calculate);
        if (raceSelect) raceSelect.addEventListener('change', calculate);
        
        genderRadios.forEach(radio => radio.addEventListener('change', calculate));
        riskCheckboxes.forEach(checkbox => checkbox.addEventListener('change', calculate));
        asaRadios.forEach(radio => radio.addEventListener('change', calculate));
        
        // Load FHIR data if available with feedback
        if (client && patient) {
            // Use the trackDataLoading helper for automatic feedback
            fhirFeedback.trackDataLoading(container, [
                {
                    inputId: 'demo-weight',
                    label: 'Weight',
                    promise: getMostRecentObservation(client, LOINC_CODES.WEIGHT),
                    setValue: (input, obs) => {
                        if (obs?.valueQuantity) {
                            input.value = obs.valueQuantity.value.toFixed(1);
                        }
                    }
                },
                {
                    inputId: 'demo-height',
                    label: 'Height',
                    promise: getMostRecentObservation(client, LOINC_CODES.HEIGHT),
                    setValue: (input, obs) => {
                        if (obs?.valueQuantity) {
                            input.value = obs.valueQuantity.value.toFixed(1);
                        }
                    }
                },
                {
                    inputId: 'demo-temp',
                    label: 'Temperature',
                    promise: getMostRecentObservation(client, LOINC_CODES.TEMPERATURE),
                    setValue: (input, obs) => {
                        if (obs?.valueQuantity) {
                            input.value = obs.valueQuantity.value.toFixed(1);
                        }
                    }
                }
            ]).then(() => {
                // Auto-populate age from birthDate
                const ageInput = container.querySelector('#demo-age');
                if (patient.birthDate && ageInput) {
                    const birthDate = new Date(patient.birthDate);
                    const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
                    ageInput.value = age;
                    fhirFeedback.showSuccess(ageInput, 'Age', `${age} years`);
                }
                
                // Auto-select gender
                if (patient.gender) {
                    const genderValue = patient.gender.toLowerCase();
                    const genderRadio = container.querySelector(`input[name="demo-gender"][value="${genderValue}"]`);
                    if (genderRadio) {
                        genderRadio.checked = true;
                        genderRadio.parentElement.classList.add('selected');
                    }
                }
                
                calculate();
            });
        }
    }
};

