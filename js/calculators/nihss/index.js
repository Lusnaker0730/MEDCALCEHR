export const nihss = {
    id: 'nihss',
    title: 'NIH Stroke Scale/Score (NIHSS)',
    description: 'Quantifies stroke severity and monitors for neurological changes over time.',

    createItem: function (id, label, options) {
        const optionsHTML = options
            .map(
                (opt, index) => `
            <label class="radio-option">
                <input type="radio" name="${id}" value="${opt.value}" ${index === 0 ? 'checked' : ''}>
                <span>${opt.label}</span>
            </label>
        `
            )
            .join('');

        return `
            <div class="section">
                <div class="section-title">
                    <span>${label}</span>
                </div>
                <div class="radio-group">
                    ${optionsHTML}
                </div>
            </div>
        `;
    },

    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Clinical Use</div>
                    <p>Perform assessments within 24 hours of symptom onset and repeat serially to monitor progression or recovery.</p>
                </div>
            </div>
            
            ${this.createItem('nihss-1a', '1a. Level of Consciousness', [
        { value: '0', label: '0 - Alert' },
        { value: '1', label: '1 - Not alert, but arousable by minor stimulation' },
        { value: '2', label: '2 - Not alert, requires repeated stimulation to attend' },
        { value: '3', label: '3 - Unresponsive, or reflex motor responses only' }
    ])}
            
            ${this.createItem('nihss-1b', '1b. LOC Questions (Month, Age)', [
        { value: '0', label: '0 - Answers both correctly' },
        { value: '1', label: '1 - Answers one correctly' },
        { value: '2', label: '2 - Answers neither correctly' }
    ])}
            
            ${this.createItem('nihss-1c', '1c. LOC Commands (Open/close eyes, grip/release hand)', [
        { value: '0', label: '0 - Performs both correctly' },
        { value: '1', label: '1 - Performs one correctly' },
        { value: '2', label: '2 - Performs neither correctly' }
    ])}
            
            ${this.createItem('nihss-2', '2. Best Gaze', [
        { value: '0', label: '0 - Normal' },
        { value: '1', label: '1 - Partial gaze palsy' },
        { value: '2', label: '2 - Forced deviation' }
    ])}
            
            ${this.createItem('nihss-3', '3. Visual Fields', [
        { value: '0', label: '0 - No visual loss' },
        { value: '1', label: '1 - Partial hemianopia' },
        { value: '2', label: '2 - Complete hemianopia' },
        { value: '3', label: '3 - Bilateral hemianopia' }
    ])}
            
            ${this.createItem('nihss-4', '4. Facial Palsy', [
        { value: '0', label: '0 - Normal' },
        { value: '1', label: '1 - Minor paralysis' },
        { value: '2', label: '2 - Partial paralysis' },
        { value: '3', label: '3 - Complete paralysis of one or both sides' }
    ])}
            
            ${this.createItem('nihss-5a', '5a. Motor Arm - Left', [
        { value: '0', label: '0 - No drift' },
        { value: '1', label: '1 - Drift' },
        { value: '2', label: '2 - Some effort against gravity' },
        { value: '3', label: '3 - No effort against gravity, but moves' },
        { value: '4', label: '4 - No movement' }
    ])}
            
            ${this.createItem('nihss-5b', '5b. Motor Arm - Right', [
        { value: '0', label: '0 - No drift' },
        { value: '1', label: '1 - Drift' },
        { value: '2', label: '2 - Some effort against gravity' },
        { value: '3', label: '3 - No effort against gravity, but moves' },
        { value: '4', label: '4 - No movement' }
    ])}
            
            ${this.createItem('nihss-6a', '6a. Motor Leg - Left', [
        { value: '0', label: '0 - No drift' },
        { value: '1', label: '1 - Drift' },
        { value: '2', label: '2 - Some effort against gravity' },
        { value: '3', label: '3 - No effort against gravity, but moves' },
        { value: '4', label: '4 - No movement' }
    ])}
            
            ${this.createItem('nihss-6b', '6b. Motor Leg - Right', [
        { value: '0', label: '0 - No drift' },
        { value: '1', label: '1 - Drift' },
        { value: '2', label: '2 - Some effort against gravity' },
        { value: '3', label: '3 - No effort against gravity, but moves' },
        { value: '4', label: '4 - No movement' }
    ])}
            
            ${this.createItem('nihss-7', '7. Limb Ataxia', [
        { value: '0', label: '0 - Absent' },
        { value: '1', label: '1 - Present in one limb' },
        { value: '2', label: '2 - Present in two or more limbs' }
    ])}
            
            ${this.createItem('nihss-8', '8. Sensory', [
        { value: '0', label: '0 - Normal' },
        { value: '1', label: '1 - Mild-to-moderate loss' },
        { value: '2', label: '2 - Severe-to-total loss' }
    ])}
            
            ${this.createItem('nihss-9', '9. Best Language', [
        { value: '0', label: '0 - No aphasia' },
        { value: '1', label: '1 - Mild-to-moderate aphasia' },
        { value: '2', label: '2 - Severe aphasia' },
        { value: '3', label: '3 - Mute, global aphasia' }
    ])}
            
            ${this.createItem('nihss-10', '10. Dysarthria', [
        { value: '0', label: '0 - Normal articulation' },
        { value: '1', label: '1 - Mild-to-moderate dysarthria' },
        { value: '2', label: '2 - Severe dysarthria (unintelligible)' }
    ])}
            
            ${this.createItem('nihss-11', '11. Extinction and Inattention (Neglect)', [
        { value: '0', label: '0 - No neglect' },
        { value: '1', label: '1 - Partial neglect' },
        { value: '2', label: '2 - Complete neglect' }
    ])}
            
            <div class="result-container" id="nihss-result" style="display:none;"></div>
            
            <div class="info-section mt-30">
                <h4>📊 Interpretation</h4>
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Score</th>
                                <th>Severity</th>
                                <th>Clinical Significance</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0</td>
                                <td><span class="risk-badge low">No Stroke</span></td>
                                <td>No stroke symptoms</td>
                            </tr>
                            <tr>
                                <td>1-4</td>
                                <td><span class="risk-badge low">Minor</span></td>
                                <td>Minor stroke</td>
                            </tr>
                            <tr>
                                <td>5-15</td>
                                <td><span class="risk-badge moderate">Moderate</span></td>
                                <td>Moderate stroke</td>
                            </tr>
                            <tr>
                                <td>16-20</td>
                                <td><span class="risk-badge high">Mod-Severe</span></td>
                                <td>Moderate-to-severe stroke</td>
                            </tr>
                            <tr>
                                <td>21-42</td>
                                <td><span class="risk-badge high">Severe</span></td>
                                <td>Severe stroke</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Brott T, Adams HP Jr, Olinger CP, et al. Measurements of acute cerebral infarction: a clinical examination scale. <em>Stroke</em>. 1989;20(7):864-870.</p>
            </div>
        `;
    },
    initialize: function () {
        const container = document.querySelector('#calculator-container') || document.body;

        // Calculate function
        const calculate = () => {
            // Get all radio button groups
            const groups = [
                'nihss-1a',
                'nihss-1b',
                'nihss-1c',
                'nihss-2',
                'nihss-3',
                'nihss-4',
                'nihss-5a',
                'nihss-5b',
                'nihss-6a',
                'nihss-6b',
                'nihss-7',
                'nihss-8',
                'nihss-9',
                'nihss-10',
                'nihss-11'
            ];

            let score = 0;
            groups.forEach(groupName => {
                const checked = container.querySelector(`input[name="${groupName}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                }
            });

            let severity = '';
            let severityClass = '';
            let interpretation = '';

            if (score === 0) {
                severity = 'No Stroke';
                severityClass = 'low';
                interpretation = 'No stroke symptoms detected.';
            } else if (score >= 1 && score <= 4) {
                severity = 'Minor Stroke';
                severityClass = 'low';
                interpretation =
                    'Minor stroke. Consider outpatient management with close follow-up.';
            } else if (score >= 5 && score <= 15) {
                severity = 'Moderate Stroke';
                severityClass = 'moderate';
                interpretation = 'Moderate stroke. Requires inpatient monitoring and treatment.';
            } else if (score >= 16 && score <= 20) {
                severity = 'Moderate-to-Severe Stroke';
                severityClass = 'high';
                interpretation =
                    'Moderate-to-severe stroke. Intensive monitoring and intervention required.';
            } else {
                severity = 'Severe Stroke';
                severityClass = 'high';
                interpretation = 'Severe stroke. Critical care and aggressive intervention needed.';
            }

            const resultEl = container.querySelector('#nihss-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>NIHSS Assessment Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${score}</span>
                    <span class="result-score-unit">/ 42 points</span>
                </div>
                
                <div class="severity-indicator ${severityClass} mt-20">
                    <span class="severity-indicator-text">${severity}</span>
                </div>
                
                <div class="alert ${severityClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${severityClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                    <div class="alert-content">
                        <p>${interpretation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

        // Add visual feedback and auto-calculate
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
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
