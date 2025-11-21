// js/calculators/sirs.js
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const sirs = {
    id: 'sirs',
    title: 'SIRS Criteria for Systemic Inflammatory Response',
    description:
        'Evaluates SIRS criteria and progression to sepsis and septic shock using clinical parameters.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="sirs-container">
                <div class="current-vitals">
                    <h4>?? Current Vital Signs</h4>
                    <div class="vitals-grid">
                        <div class="vital-item">
                            <label>Temperature:</label>
                            <span id="current-temp">Loading...</span>
                        </div>
                        <div class="vital-item">
                            <label>Heart Rate:</label>
                            <span id="current-hr">Loading...</span>
                        </div>
                        <div class="vital-item">
                            <label>Respiratory Rate:</label>
                            <span id="current-rr">Loading...</span>
                        </div>
                        <div class="vital-item">
                            <label>WBC Count:</label>
                            <span id="current-wbc">Loading...</span>
                        </div>
                    </div>
                </div>

                <div class="sirs-criteria-section">
                    <h4>?î• SIRS Criteria Assessment</h4>
                    <div class="criteria-requirement">Need ?? criteria for SIRS diagnosis</div>
                    
                    <div class="sirs-criteria-grid">
                        <div class="criterion-card temperature">
                            <div class="criterion-header">
                                <div class="criterion-icon">?å°Ô∏?/div>
                                <div class="criterion-title">Temperature</div>
                                <div class="criterion-status" id="temp-status">0</div>
                            </div>
                            <div class="criterion-details">
                                <div class="criterion-range">&lt;36¬∞C (96.8¬∞F) or &gt;38¬∞C (100.4¬∞F)</div>
                                <div class="criterion-explanation">Hypothermia or hyperthermia indicating systemic response</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="temperature">
                                <input type="checkbox" id="sirs-temp">
                                <label for="sirs-temp" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card heart-rate">
                            <div class="criterion-header">
                                <div class="criterion-icon">??</div>
                                <div class="criterion-title">Heart Rate</div>
                                <div class="criterion-status" id="hr-status">0</div>
                            </div>
                            <div class="criterion-details">
                                <div class="criterion-range">&gt;90 beats per minute</div>
                                <div class="criterion-explanation">Tachycardia as compensatory response</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="heart-rate">
                                <input type="checkbox" id="sirs-hr">
                                <label for="sirs-hr" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card respiratory">
                            <div class="criterion-header">
                                <div class="criterion-icon">??</div>
                                <div class="criterion-title">Respiratory Rate</div>
                                <div class="criterion-status" id="rr-status">0</div>
                            </div>
                            <div class="criterion-details">
                                <div class="criterion-range">&gt;20 breaths/min or PaCO??&lt;32 mmHg</div>
                                <div class="criterion-explanation">Tachypnea or respiratory alkalosis</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="respiratory">
                                <input type="checkbox" id="sirs-rr">
                                <label for="sirs-rr" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card wbc">
                            <div class="criterion-header">
                                <div class="criterion-icon">?©∏</div>
                                <div class="criterion-title">White Blood Cells</div>
                                <div class="criterion-status" id="wbc-status">0</div>
                            </div>
                            <div class="criterion-details">
                                <div class="criterion-range">&lt;4.0 or &gt;12.0 ?10¬≥/ŒºL or &gt;10% bands</div>
                                <div class="criterion-explanation">Leukopenia, leukocytosis, or left shift</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="wbc">
                                <input type="checkbox" id="sirs-wbc">
                                <label for="sirs-wbc" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="sirs-score-display">
                        <div class="score-counter">
                            <div class="score-number" id="sirs-count">0</div>
                            <div class="score-denominator">/ 4</div>
                        </div>
                        <div class="score-label">SIRS Criteria Met</div>
                    </div>
                </div>

                <div class="progression-criteria">
                    <h4>?? Sepsis & Septic Shock Assessment</h4>
                    
                    <div class="progression-grid">
                        <div class="progression-card infection">
                            <div class="progression-header">
                                <div class="progression-icon">??</div>
                                <div class="progression-title">Infection Source</div>
                            </div>
                            <div class="progression-details">
                                <div class="progression-question">Suspected or confirmed infection?</div>
                                <div class="progression-explanation">Clinical suspicion or microbiological evidence of infection</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="infection">
                                <input type="checkbox" id="sepsis-infection">
                                <label for="sepsis-infection" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="progression-card hypotension">
                            <div class="progression-header">
                                <div class="progression-icon">??</div>
                                <div class="progression-title">Persistent Hypotension</div>
                            </div>
                            <div class="progression-details">
                                <div class="progression-question">Hypotension despite fluid resuscitation?</div>
                                <div class="progression-explanation">SBP &lt;90 mmHg, MAP &lt;70 mmHg, or SBP decrease &gt;40 mmHg</div>
                            </div>
                            <div class="sirs-toggle" data-criterion="hypotension">
                                <input type="checkbox" id="shock-hypotension">
                                <label for="shock-hypotension" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sirs-result-container">
                <div class="diagnosis-display">
                    <div class="diagnosis-icon" id="diagnosis-icon">??</div>
                    <div class="diagnosis-content">
                        <div class="diagnosis-title" id="diagnosis-title">Assessment Pending</div>
                        <div class="diagnosis-description" id="diagnosis-description">Complete the criteria assessment above</div>
                    </div>
                </div>

                <div class="severity-progression">
                    <h4>?? Severity Progression</h4>
                    <div class="progression-flow">
                        <div class="progression-step normal">
                            <div class="step-icon">??/div>
                            <div class="step-title">Normal</div>
                            <div class="step-criteria">&lt;2 SIRS criteria</div>
                        </div>
                        <div class="progression-arrow">??/div>
                        <div class="progression-step sirs">
                            <div class="step-icon">?î•</div>
                            <div class="step-title">SIRS</div>
                            <div class="step-criteria">?? SIRS criteria</div>
                        </div>
                        <div class="progression-arrow">??/div>
                        <div class="progression-step sepsis">
                            <div class="step-icon">??</div>
                            <div class="step-title">Sepsis</div>
                            <div class="step-criteria">SIRS + Infection</div>
                        </div>
                        <div class="progression-arrow">??/div>
                        <div class="progression-step shock">
                            <div class="step-icon">?†Ô?</div>
                            <div class="step-title">Septic Shock</div>
                            <div class="step-criteria">Sepsis + Hypotension</div>
                        </div>
                    </div>
                </div>

                <div class="clinical-management">
                    <h4>?è• Clinical Management Guidelines</h4>
                    <div class="management-grid">
                        <div class="management-item normal-management">
                            <h5>Normal (&lt;2 SIRS)</h5>
                            <ul>
                                <li>Continue routine monitoring</li>
                                <li>Address underlying conditions</li>
                                <li>Reassess if clinical change</li>
                            </ul>
                        </div>
                        <div class="management-item sirs-management">
                            <h5>SIRS (?? criteria)</h5>
                            <ul>
                                <li>Investigate underlying cause</li>
                                <li>Enhanced monitoring</li>
                                <li>Consider infection workup</li>
                                <li>Supportive care as needed</li>
                            </ul>
                        </div>
                        <div class="management-item sepsis-management">
                            <h5>Sepsis (SIRS + Infection)</h5>
                            <ul>
                                <li>Immediate antibiotic therapy</li>
                                <li>Source control measures</li>
                                <li>Fluid resuscitation</li>
                                <li>ICU consideration</li>
                            </ul>
                        </div>
                        <div class="management-item shock-management">
                            <h5>Septic Shock</h5>
                            <ul>
                                <li>Urgent ICU admission</li>
                                <li>Vasopressor support</li>
                                <li>Aggressive fluid management</li>
                                <li>Multiorgan support</li>
                            </ul>
                        </div>
                    </div>
            </div>
            </div>
        `;
    },
    initialize: function (client) {
        // Auto-populate vital signs and lab values
        this.populateVitalSigns(client);

        // Set up event listeners
        this.setupEventListeners();

        // Initial assessment
        this.assessCriteria();
    },

    populateVitalSigns: function (client) {
        // Get temperature
        getMostRecentObservation(client, LOINC_CODES.TEMPERATURE)
            .then(tempObs => {
                if (tempObs && tempObs.valueQuantity) {
                    const temp = tempObs.valueQuantity.value;
                    const unit = tempObs.valueQuantity.unit || '¬∞C';
                    document.getElementById('current-temp').textContent =
                        `${temp.toFixed(1)} ${unit}`;

                    // Auto-check if abnormal (assuming Celsius)
                    if (temp < 36 || temp > 38) {
                        document.getElementById('sirs-temp').checked = true;
                        this.updateToggleText('sirs-temp', true);
                    }
                } else {
                    document.getElementById('current-temp').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching temperature:', error);
                document.getElementById('current-temp').textContent = 'Not available';
            });

        // Get heart rate
        getMostRecentObservation(client, LOINC_CODES.HEART_RATE)
            .then(hrObs => {
                if (hrObs && hrObs.valueQuantity) {
                    const hr = hrObs.valueQuantity.value;
                    document.getElementById('current-hr').textContent = `${hr.toFixed(0)} bpm`;

                    // Auto-check if >90
                    if (hr > 90) {
                        document.getElementById('sirs-hr').checked = true;
                        this.updateToggleText('sirs-hr', true);
                    }
                } else {
                    document.getElementById('current-hr').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching heart rate:', error);
                document.getElementById('current-hr').textContent = 'Not available';
            });

        // Get respiratory rate
        getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE)
            .then(rrObs => {
                if (rrObs && rrObs.valueQuantity) {
                    const rr = rrObs.valueQuantity.value;
                    document.getElementById('current-rr').textContent = `${rr.toFixed(0)} /min`;

                    // Auto-check if >20
                    if (rr > 20) {
                        document.getElementById('sirs-rr').checked = true;
                        this.updateToggleText('sirs-rr', true);
                    }
                } else {
                    document.getElementById('current-rr').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching respiratory rate:', error);
                document.getElementById('current-rr').textContent = 'Not available';
            });

        // Get WBC count
        getMostRecentObservation(client, LOINC_CODES.WBC)
            .then(wbcObs => {
                if (wbcObs && wbcObs.valueQuantity && wbcObs.valueQuantity.value > 0) {
                    const wbc = wbcObs.valueQuantity.value;
                    const unit = wbcObs.valueQuantity.unit || 'cells/ŒºL';

                    // Handle different possible units
                    let displayValue, displayUnit;
                    if (
                        unit.includes('10*3') ||
                        unit.includes('?10¬≥') ||
                        unit.includes('K/uL') ||
                        wbc < 100
                    ) {
                        // Already in thousands
                        displayValue = wbc.toFixed(1);
                        displayUnit = '?10¬≥/ŒºL';
                    } else {
                        // Convert from cells/ŒºL to ?10¬≥/ŒºL
                        displayValue = (wbc / 1000).toFixed(1);
                        displayUnit = '?10¬≥/ŒºL';
                    }

                    document.getElementById('current-wbc').textContent =
                        `${displayValue} ${displayUnit}`;

                    // Auto-check if abnormal (convert to cells/ŒºL for comparison)
                    const wbcCells =
                        unit.includes('10*3') ||
                        unit.includes('?10¬≥') ||
                        unit.includes('K/uL') ||
                        wbc < 100
                            ? wbc * 1000
                            : wbc;
                    if (wbcCells < 4000 || wbcCells > 12000) {
                        document.getElementById('sirs-wbc').checked = true;
                        this.updateToggleText('sirs-wbc', true);
                    }
                } else {
                    document.getElementById('current-wbc').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching WBC:', error);
                document.getElementById('current-wbc').textContent = 'Not available';
            });

        // Reassess after data population
        setTimeout(() => this.assessCriteria(), 1000);
    },

    setupEventListeners: function () {
        const checkboxes = document.querySelectorAll('.sirs-container input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                this.updateToggleText(e.target.id, e.target.checked);
                this.assessCriteria();
            });
        });
    },

    updateToggleText: function (checkboxId, isChecked) {
        const label = document.querySelector(`label[for="${checkboxId}"]`);
        const textSpan = label.querySelector('.toggle-text');
        textSpan.textContent = isChecked ? 'Yes' : 'No';
    },

    assessCriteria: function () {
        // Count SIRS criteria
        let sirsCriteriaCount = 0;
        const sirsCheckboxes = ['sirs-temp', 'sirs-hr', 'sirs-rr', 'sirs-wbc'];

        sirsCheckboxes.forEach((id, index) => {
            const checkbox = document.getElementById(id);
            const statusElements = ['temp-status', 'hr-status', 'rr-status', 'wbc-status'];
            const statusEl = document.getElementById(statusElements[index]);

            if (checkbox.checked) {
                sirsCriteriaCount++;
                statusEl.textContent = '1';
                statusEl.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            } else {
                statusEl.textContent = '0';
                statusEl.style.background = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
            }
        });

        // Update SIRS count display
        document.getElementById('sirs-count').textContent = sirsCriteriaCount;

        // Check additional criteria
        const hasInfection = document.getElementById('sepsis-infection').checked;
        const hasHypotension = document.getElementById('shock-hypotension').checked;

        // Determine diagnosis
        let diagnosis = '';
        let diagnosisClass = '';
        let diagnosisIcon = '';
        let diagnosisDescription = '';

        if (sirsCriteriaCount >= 2) {
            if (hasInfection) {
                if (hasHypotension) {
                    diagnosis = 'Septic Shock';
                    diagnosisClass = 'shock';
                    diagnosisIcon = '?†Ô?';
                    diagnosisDescription =
                        'Life-threatening condition requiring immediate intensive care';
                } else {
                    diagnosis = 'Sepsis';
                    diagnosisClass = 'sepsis';
                    diagnosisIcon = '??';
                    diagnosisDescription = 'SIRS with confirmed or suspected infection';
                }
            } else {
                diagnosis = 'SIRS';
                diagnosisClass = 'sirs';
                diagnosisIcon = '?î•';
                diagnosisDescription =
                    'Systemic Inflammatory Response Syndrome - investigate underlying cause';
            }
        } else {
            diagnosis = 'Normal';
            diagnosisClass = 'normal';
            diagnosisIcon = '??;
            diagnosisDescription = 'SIRS criteria not met - continue routine monitoring';
        }

        // Update diagnosis display
        document.getElementById('diagnosis-icon').textContent = diagnosisIcon;
        document.getElementById('diagnosis-title').textContent = diagnosis;
        document.getElementById('diagnosis-description').textContent = diagnosisDescription;

        // Update progression highlighting
        document
            .querySelectorAll('.progression-step')
            .forEach(step => step.classList.remove('active'));
        document
            .querySelectorAll('.management-item')
            .forEach(item => item.classList.remove('active'));

        document.querySelector(`.progression-step.${diagnosisClass}`).classList.add('active');
        document
            .querySelector(`.management-item.${diagnosisClass}-management`)
            .classList.add('active');

        // Update diagnosis display styling
        const diagnosisDisplay = document.querySelector('.diagnosis-display');
        diagnosisDisplay.className = `diagnosis-display ${diagnosisClass}`;
    }
};
