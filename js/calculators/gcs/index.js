// js/calculators/gcs.js

export const gcs = {
    id: 'gcs',
    title: 'Glasgow Coma Scale (GCS)',
    description: 'Coma severity based on Eye (4), Verbal (5), and Motor (6) criteria.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <!-- Eye Opening Response -->
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">👁️</span>
                    <span>Eye Opening Response</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="eye" value="4" checked>
                        <span>Spontaneous - open with blinking at baseline (4)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="eye" value="3">
                        <span>To verbal stimuli, command, speech (3)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="eye" value="2">
                        <span>To pain only (not applied to face) (2)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="eye" value="1">
                        <span>No response (1)</span>
                    </label>
                </div>
            </div>

            <!-- Verbal Response -->
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">💬</span>
                    <span>Verbal Response</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="verbal" value="5" checked>
                        <span>Oriented (5)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="verbal" value="4">
                        <span>Confused speech, but able to answer questions (4)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="verbal" value="3">
                        <span>Inappropriate words (3)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="verbal" value="2">
                        <span>Incomprehensible speech (2)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="verbal" value="1">
                        <span>No response (1)</span>
                    </label>
                </div>
            </div>

            <!-- Motor Response -->
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">💪</span>
                    <span>Motor Response</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="motor" value="6" checked>
                        <span>Obeys commands for movement (6)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="motor" value="5">
                        <span>Purposeful movement to painful stimulus (5)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="motor" value="4">
                        <span>Withdraws from pain (4)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="motor" value="3">
                        <span>Abnormal (spastic) flexion, decorticate posture (3)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="motor" value="2">
                        <span>Extensor (rigid) response, decerebrate posture (2)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="motor" value="1">
                        <span>No response (1)</span>
                    </label>
                </div>
            </div>

            <div class="result-container" id="gcs-result" style="display:none;"></div>
            
            <!-- Interpretation Guide -->
            <div class="info-section mt-30">
                <h4>📊 Interpretation</h4>
                <div class="data-table">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Score</th>
                                <th>Severity</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>13-15</td>
                                <td><span class="risk-badge low">Mild</span></td>
                                <td>Mild brain injury</td>
                            </tr>
                            <tr>
                                <td>9-12</td>
                                <td><span class="risk-badge moderate">Moderate</span></td>
                                <td>Moderate brain injury</td>
                            </tr>
                            <tr>
                                <td>3-8</td>
                                <td><span class="risk-badge high">Severe</span></td>
                                <td>Severe brain injury (coma)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    initialize: function () {
        const container = document.querySelector('#calculator-container') || document.body;
        
        // Calculate function
        const calculate = () => {
            const eyeScore = parseInt(container.querySelector('input[name="eye"]:checked').value);
            const verbalScore = parseInt(container.querySelector('input[name="verbal"]:checked').value);
            const motorScore = parseInt(container.querySelector('input[name="motor"]:checked').value);
            const totalScore = eyeScore + verbalScore + motorScore;

            let severity = '';
            let severityClass = '';
            
            if (totalScore >= 13) {
                severity = 'Mild';
                severityClass = 'low';
            } else if (totalScore >= 9) {
                severity = 'Moderate';
                severityClass = 'moderate';
            } else {
                severity = 'Severe';
                severityClass = 'high';
            }

            const resultEl = container.querySelector('#gcs-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>Glasgow Coma Scale Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${totalScore}</span>
                    <span class="result-score-unit">points</span>
                </div>
                
                <div class="result-item">
                    <span class="result-item-label">Component Scores</span>
                    <span class="result-item-value">E${eyeScore}V${verbalScore}M${motorScore}</span>
                </div>
                
                <div class="severity-indicator ${severityClass} mt-20">
                    <span class="severity-indicator-text">${severity} Brain Injury</span>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };
        
        // Add visual feedback and auto-calculate
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function() {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;
                
                // Remove selected class from all options in this group
                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });
                
                // Add selected class to clicked option
                this.classList.add('selected');
                radio.checked = true;
                
                // Auto-calculate
                calculate();
            });
        });
        
        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });
        
        // Initial calculation
        calculate();
    }
};
