export const regiscar = {
    id: 'regiscar',
    title: 'RegiSCAR Score for DRESS',
    description: 'Diagnoses Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS).',

    generateHTML: () => `
        <div class="regiscar-container">
            <div class="calculator-header">
                <div class="header-icon">🩺</div>
                <div class="header-content">
                    <h2 class="calculator-title">RegiSCAR Score for DRESS</h2>
                    <p class="calculator-description">Diagnoses Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS)</p>
                </div>
            </div>

            <div class="instructions-notice">
                <div class="notice-icon">ℹ️</div>
                <div class="notice-content">
                    <h5>About DRESS Syndrome</h5>
                    <p>DRESS (Drug Reaction with Eosinophilia and Systemic Symptoms) is a severe, potentially life-threatening drug hypersensitivity reaction characterized by fever, rash, eosinophilia, and internal organ involvement. The RegiSCAR scoring system helps standardize diagnosis.</p>
                </div>
            </div>

            <div class="criteria-sections">
                <!-- Clinical Features -->
                <div class="criteria-section">
                    <h4 class="section-title">
                        <span class="section-icon">🌡️</span>
                        Clinical Features
                    </h4>
                    
                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Fever (≥38.5 °C)</div>
                            <div class="criterion-points" data-points="fever">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="fever" value="-1" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="fever" value="0">
                                <span class="toggle-text">✅ Yes</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Enlarged lymph nodes</div>
                            <div class="criterion-subtitle">(≥2 sites, >1 cm)</div>
                            <div class="criterion-points" data-points="lymph-nodes">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="lymph-nodes" value="0" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="lymph-nodes" value="1">
                                <span class="toggle-text">✅ Yes (+1)</span>
                            </label>
                </div>
            </div>
                </div>

                <!-- Laboratory Findings -->
                <div class="criteria-section">
                    <h4 class="section-title">
                        <span class="section-icon">🔬</span>
                        Laboratory Findings
                    </h4>
                    
                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Atypical lymphocytes</div>
                            <div class="criterion-points" data-points="lymphocytes">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="lymphocytes" value="0" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="lymphocytes" value="1">
                                <span class="toggle-text">✅ Yes (+1)</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Eosinophilia</div>
                            <div class="criterion-points" data-points="eosinophilia">0 pts</div>
                        </div>
                        <div class="regiscar-radio-group">
                            <label class="radio-option">
                                <input type="radio" name="eosinophilia" value="0" checked>
                                <span class="radio-content">
                                    <span class="radio-label">0-699 cells or <10%</span>
                                    <span class="radio-score">0 pts</span>
                                </span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="eosinophilia" value="1">
                                <span class="radio-content">
                                    <span class="radio-label">700-1,499 cells or 10-19.9%</span>
                                    <span class="radio-score">+1 pt</span>
                                </span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="eosinophilia" value="2">
                                <span class="radio-content">
                                    <span class="radio-label">≥1,500 cells or ≥20%</span>
                                    <span class="radio-score">+2 pts</span>
                                </span>
                            </label>
                </div>
            </div>
                </div>

                <!-- Skin Manifestations -->
                <div class="criteria-section">
                    <h4 class="section-title">
                        <span class="section-icon">🩹</span>
                        Skin Manifestations
                    </h4>
                    
                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Skin rash extent >50%</div>
                            <div class="criterion-points" data-points="rash">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="rash" value="0" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="rash" value="1">
                                <span class="toggle-text">✅ Yes (+1)</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Skin features</div>
                            <div class="criterion-subtitle">At least 2 of: edema, infiltration, purpura, scaling</div>
                            <div class="criterion-points" data-points="skin-features">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group triple">
                            <label class="toggle-option">
                                <input type="radio" name="skin-features" value="0" checked>
                                <span class="toggle-text">❓ Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="skin-features" value="-1">
                                <span class="toggle-text">❌ No (-1)</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="skin-features" value="1">
                                <span class="toggle-text">✅ Yes (+1)</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Biopsy suggesting DRESS</div>
                            <div class="criterion-points" data-points="biopsy">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="biopsy" value="-1">
                                <span class="toggle-text">❌ No (-1)</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="biopsy" value="0" checked>
                                <span class="toggle-text">✅ Yes/Unknown</span>
                            </label>
                </div>
            </div>
                </div>

                <!-- Organ Involvement & Course -->
                <div class="criteria-section">
                    <h4 class="section-title">
                        <span class="section-icon">🫀</span>
                        Organ Involvement & Clinical Course
                    </h4>
                    
                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Internal organ involved</div>
                            <div class="criterion-subtitle">Liver, kidney, lung, heart, pancreas, etc.</div>
                            <div class="criterion-points" data-points="organ">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group triple">
                            <label class="toggle-option">
                                <input type="radio" name="organ" value="0" checked>
                                <span class="toggle-text">None</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="organ" value="1">
                                <span class="toggle-text">1 organ (+1)</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="organ" value="2">
                                <span class="toggle-text">≥2 organs (+2)</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Resolution in ≥15 days</div>
                            <div class="criterion-subtitle">Prolonged course after drug withdrawal</div>
                            <div class="criterion-points" data-points="resolution">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="resolution" value="-1" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="resolution" value="0">
                                <span class="toggle-text">✅ Yes</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card">
                        <div class="criterion-header">
                            <div class="criterion-title">Alternative diagnoses excluded</div>
                            <div class="criterion-subtitle">By ≥3 biological investigations</div>
                            <div class="criterion-points" data-points="alternative">0 pts</div>
                        </div>
                        <div class="regiscar-toggle-group">
                            <label class="toggle-option">
                                <input type="radio" name="alternative" value="0" checked>
                                <span class="toggle-text">❌ No/Unknown</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="alternative" value="1">
                                <span class="toggle-text">✅ Yes (+1)</span>
                            </label>
                </div>
            </div>
                </div>
            </div>

            <!-- Results Section -->
            <div class="results-section">
                <div class="results-header">
                    <h4>📊 RegiSCAR Score Assessment</h4>
                </div>
                <div class="results-content">
                    <div class="result-main">
                        <div class="result-value-container">
                            <div class="result-score-display" id="result-score">-2</div>
                            <div class="result-label">RegiSCAR Score</div>
                        </div>
                        <div class="result-interpretation-container">
                            <div class="result-likelihood" id="result-interpretation">No case</div>
                            <div class="result-description" id="result-description">Score below threshold for DRESS diagnosis</div>
                        </div>
                    </div>
                    
                    <div class="score-interpretation-guide">
                        <h5>📋 Score Interpretation</h5>
                        <div class="interpretation-grid">
                            <div class="interpretation-item no-case">
                                <div class="interpretation-score">&lt;2</div>
                                <div class="interpretation-label">No case</div>
                            </div>
                            <div class="interpretation-item possible">
                                <div class="interpretation-score">2-3</div>
                                <div class="interpretation-label">Possible case</div>
                            </div>
                            <div class="interpretation-item probable">
                                <div class="interpretation-score">4-5</div>
                                <div class="interpretation-label">Probable case</div>
                            </div>
                            <div class="interpretation-item definite">
                                <div class="interpretation-score">&gt;5</div>
                                <div class="interpretation-label">Definite case</div>
                            </div>
                        </div>
                    </div>

                    <div class="clinical-management">
                        <h5>⚕️ Clinical Management</h5>
                        <div class="management-content" id="management-content">
                            <ul>
                                <li><strong>Immediate:</strong> Discontinue suspected drug(s)</li>
                                <li><strong>Supportive care:</strong> Fluid management, electrolyte balance</li>
                                <li><strong>Monitoring:</strong> Liver function, renal function, complete blood count</li>
                                <li><strong>Treatment:</strong> Systemic corticosteroids for severe cases</li>
                                <li><strong>Follow-up:</strong> Monitor for viral reactivation (HHV-6, EBV, CMV)</li>
                            </ul>
                </div>
            </div>
                </div>
            </div>

            <!-- References and Images Section -->
            <div class="references-section">
                <h4>📚 References & Clinical Information</h4>
                
                <div class="reference-content">
                    <div class="reference-citation">
                        <h5>Primary Reference</h5>
                        <p class="citation-text">
                            <strong>Roujeau JC, Stern RS.</strong> Severe Adverse Cutaneous Reactions to Drugs. 
                            <em>N Engl J Med.</em> 1994;331(19):1272-1285.
                        </p>
                        <div class="citation-details">
                            <span class="citation-badge">PMID: N/A</span>
                            <span class="citation-badge">DOI: 10.1056/NEJM199411103311906</span>
                        </div>
                        <a href="https://doi.org/10.1056/NEJM199411103311906" target="_blank" class="citation-link">
                            🔗 View Full Article
                        </a>
                    </div>

                    <div class="reference-images">
                        <h5>📊 Clinical Reference Images</h5>
                        
                        <div class="image-grid">
                            <div class="reference-image-card">
                                <img src="js/calculators/regiscar/The-RegiSCAR-scoring-system-for-diagnosing-DRESS.jpg" 
                                     alt="RegiSCAR Scoring System" 
                                     class="reference-img">
                                <p class="image-caption">The RegiSCAR scoring system for diagnosing DRESS</p>
                            </div>

                            <div class="reference-image-card">
                                <img src="js/calculators/regiscar/Clinical-courses-of-patients-with-DRESS-syndrome_W640.jpg" 
                                     alt="Clinical Courses of DRESS" 
                                     class="reference-img">
                                <p class="image-caption">Clinical courses of patients with DRESS syndrome</p>
                            </div>

                            <div class="reference-image-card">
                                <img src="js/calculators/regiscar/Possible-pathomechanisms-of-DRESS-syndrome-Drugs-or-their-metabolites-a-may-accumulate_W640.jpg" 
                                     alt="Pathomechanisms of DRESS" 
                                     class="reference-img">
                                <p class="image-caption">Possible pathomechanisms of DRESS syndrome</p>
                </div>
            </div>
        </div>

                    <div class="clinical-notes">
                        <h5>⚠️ Important Clinical Notes</h5>
                        <ul>
                            <li><strong>Timing:</strong> DRESS typically occurs 2-8 weeks after drug initiation</li>
                            <li><strong>Common Culprit Drugs:</strong> Anticonvulsants, allopurinol, sulfonamides, minocycline, dapsone</li>
                            <li><strong>Mortality:</strong> Approximately 10% mortality rate, mainly from hepatic failure</li>
                            <li><strong>Viral Reactivation:</strong> HHV-6, EBV, and CMV reactivation common</li>
                            <li><strong>Prolonged Course:</strong> Symptoms may persist for weeks to months after drug discontinuation</li>
                            <li><strong>Autoimmune Sequelae:</strong> Risk of developing autoimmune conditions (thyroiditis, diabetes)</li>
                        </ul>
                    </div>
            </div>
            </div>
        </div>
    `,

    initialize: client => {
        const updateToggleState = input => {
            const group = input.closest('.regiscar-toggle-group, .regiscar-radio-group');
            if (group) {
                group.querySelectorAll('.toggle-option, .radio-option').forEach(option => {
                    option.classList.remove('active');
                });
                input.closest('.toggle-option, .radio-option').classList.add('active');
            }
        };

        const updatePointsDisplay = (name, value) => {
            const pointsEl = document.querySelector(`[data-points="${name}"]`);
            if (pointsEl) {
                const points = parseInt(value);
                if (points > 0) {
                    pointsEl.textContent = `+${points} pt${points > 1 ? 's' : ''}`;
                    pointsEl.style.color = '#059669';
                } else if (points < 0) {
                    pointsEl.textContent = `${points} pt${points < -1 ? 's' : ''}`;
                    pointsEl.style.color = '#dc2626';
                } else {
                    pointsEl.textContent = '0 pts';
                    pointsEl.style.color = '#6b7280';
                }
            }
        };

        const calculate = () => {
            const criteriaNames = [
                'fever',
                'lymph-nodes',
                'lymphocytes',
                'eosinophilia',
                'rash',
                'skin-features',
                'biopsy',
                'organ',
                'resolution',
                'alternative'
            ];

            const score = criteriaNames.reduce((acc, name) => {
                const selected = document.querySelector(`input[name="${name}"]:checked`);
                const value = selected ? parseInt(selected.value) : 0;
                updatePointsDisplay(name, value);
                return acc + value;
            }, 0);

            const resultScore = document.getElementById('result-score');
            const resultInterpretation = document.getElementById('result-interpretation');
            const resultDescription = document.getElementById('result-description');
            const resultMain = document.querySelector('.result-main');

            resultScore.textContent = score;

            let interpretation = '';
            let description = '';
            let resultClass = '';

            if (score < 2) {
                interpretation = 'No case';
                description = 'Score below threshold for DRESS diagnosis';
                resultClass = 'no-case';
            } else if (score <= 3) {
                interpretation = 'Possible case';
                description = 'Consider DRESS in differential diagnosis, monitor closely';
                resultClass = 'possible';
            } else if (score <= 5) {
                interpretation = 'Probable case';
                description = 'High likelihood of DRESS, initiate appropriate management';
                resultClass = 'probable';
            } else {
                interpretation = 'Definite case';
                description = 'DRESS diagnosis confirmed, immediate intervention required';
                resultClass = 'definite';
            }

            resultInterpretation.textContent = interpretation;
            resultDescription.textContent = description;
            resultMain.className = `result-main ${resultClass}`;

            // Highlight corresponding interpretation item
            document.querySelectorAll('.interpretation-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`.interpretation-item.${resultClass}`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        };

        // Event listeners for all radio buttons
        document.querySelectorAll('.regiscar-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', e => {
                updateToggleState(e.target);
                calculate();
            });

            // Initialize toggle states
            if (radio.checked) {
                updateToggleState(radio);
            }
        });

        // FHIR data fetching
        const getObservation = code => {
            if (!client || !client.patient) {
                return Promise.resolve(null);
            }
            return client.patient
                .request(`Observation?code=${code}&_sort=-date&_count=1`)
                .then(r => (r.entry && r.entry[0] ? r.entry[0].resource : null))
                .catch(error => {
                    console.error(`Error fetching observation ${code}:`, error);
                    return null;
                });
        };

        // Auto-populate temperature
        getObservation('8310-5').then(temp => {
            if (temp && temp.valueQuantity && temp.valueQuantity.value >= 38.5) {
                const feverRadio = document.querySelector('input[name="fever"][value="0"]');
                if (feverRadio) {
                    feverRadio.checked = true;
                    updateToggleState(feverRadio);
                    calculate();
                }
            }
        });

        // Auto-populate eosinophils
        getObservation('26478-8').then(eos => {
            if (eos && eos.valueQuantity) {
                const value = eos.valueQuantity.value;
                let radioValue = '0';
                if (value >= 1500) {
                    radioValue = '2';
                } else if (value >= 700) {
                    radioValue = '1';
                }
                const eosRadio = document.querySelector(
                    `input[name="eosinophilia"][value="${radioValue}"]`
                );
                if (eosRadio) {
                    eosRadio.checked = true;
                    updateToggleState(eosRadio);
                    calculate();
                }
            }
        });

        // Initial calculation
        calculate();
    }
};
