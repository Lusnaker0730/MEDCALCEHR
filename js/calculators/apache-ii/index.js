import {
    getMostRecentObservation,
    calculateAge,
    initializeSegmentedControls
} from '../../utils.js';

// Point allocation functions based on APACHE II score algorithm
const getPoints = {
    temp: v => {
        if (v >= 41 || v <= 29.9) {
            return 4;
        }
        if (v >= 39 || v <= 31.9) {
            return 3;
        }
        if (v <= 33.9) {
            return 2;
        }
        if (v >= 38.5 || v <= 35.9) {
            return 1;
        }
        return 0;
    },
    map: v => {
        if (v >= 160 || v <= 49) {
            return 4;
        }
        if (v >= 130) {
            return 3;
        }
        if (v >= 110 || v <= 69) {
            return 2;
        }
        return 0;
    },
    ph: v => {
        if (v >= 7.7 || v < 7.15) {
            return 4;
        }
        if (v >= 7.6 || v < 7.25) {
            return 3;
        }
        if (v < 7.33) {
            return 2;
        }
        if (v >= 7.5) {
            return 1;
        }
        return 0;
    },
    hr: v => {
        if (v >= 180 || v <= 39) {
            return 4;
        }
        if (v >= 140 || v <= 54) {
            return 3;
        }
        if (v >= 110 || v <= 69) {
            return 2;
        }
        return 0;
    },
    rr: v => {
        if (v >= 50 || v <= 5) {
            return 4;
        }
        if (v >= 35) {
            return 3;
        }
        if (v <= 9) {
            return 2;
        }
        if (v >= 25 || v <= 11) {
            return 1;
        }
        return 0;
    },
    sodium: v => {
        if (v >= 180 || v <= 110) {
            return 4;
        }
        if (v >= 160 || v <= 119) {
            return 3;
        }
        if (v >= 155 || v <= 129) {
            return 2;
        }
        if (v >= 150) {
            return 1;
        }
        return 0;
    },
    potassium: v => {
        if (v >= 7 || v < 2.5) {
            return 4;
        }
        if (v >= 6) {
            return 3;
        }
        if (v <= 2.9) {
            return 2;
        }
        if (v >= 5.5 || v <= 3.4) {
            return 1;
        }
        return 0;
    },
    creatinine: (v, arf) => {
        // arf is boolean for acute renal failure
        let score = 0;
        const v_mgdl = v / 88.4; // convert umol/L to mg/dL
        if (v_mgdl >= 3.5) {
            score = 4;
        } else if (v_mgdl >= 2.0) {
            score = 3;
        } else if (v_mgdl >= 1.5 || v_mgdl < 0.6) {
            score = 2;
        }
        return arf ? score * 2 : score;
    },
    hct: v => {
        if (v >= 60 || v < 20) {
            return 4;
        }
        if (v >= 50 || v < 30) {
            return 2;
        }
        return 0;
    },
    wbc: v => {
        if (v >= 40 || v < 1) {
            return 4;
        }
        if (v >= 20 || v < 3) {
            return 2;
        }
        if (v >= 15) {
            return 1;
        }
        return 0;
    },
    gcs: v => 15 - v,
    oxygenation: (fio2, pao2, paco2) => {
        if (fio2 >= 0.5) {
            const A_a_gradient = fio2 * 713 - paco2 / 0.8 - pao2;
            if (A_a_gradient >= 500) {
                return 4;
            }
            if (A_a_gradient >= 350) {
                return 3;
            }
            if (A_a_gradient >= 200) {
                return 2;
            }
            return 0;
        } else {
            if (pao2 < 55) {
                return 4;
            }
            if (pao2 <= 60) {
                return 3;
            }
            if (pao2 <= 70) {
                return 1;
            }
            return 0;
        }
    },
    age: v => {
        if (v >= 75) {
            return 6;
        }
        if (v >= 65) {
            return 5;
        }
        if (v >= 55) {
            return 3;
        }
        if (v >= 45) {
            return 2;
        }
        return 0;
    }
};

export const apacheIi = {
    id: 'apache-ii',
    title: 'APACHE II',
    description: 'Calculates APACHE II score for ICU mortality.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Instructions</div>
                    <p>Enter physiologic values from the first 24 hours of ICU admission. Use the worst value for each parameter.</p>
                </div>
            </div>
            
            <div class="form-container modern">
                <div class="section">
                    <div class="section-title">
                        <span>Chronic Health Status</span>
                    </div>
                    <div class="section-subtitle">History of severe organ insufficiency or immunocompromised</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="chronic" value="5" checked>
                            <span>Yes - Non-operative or emergency postoperative patient <strong>+5</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="chronic" value="2">
                            <span>Yes - Elective postoperative patient <strong>+2</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="chronic" value="0">
                            <span>No <strong>0</strong></span>
                        </label>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Demographics & Vital Signs</span>
                    </div>
                    <div class="input-row"><label>Age</label><div class="input-with-unit"><input type="number" id="apache-ii-age"><span>years</span></div></div>
                    <div class="input-row"><label>Temperature</label><div class="input-with-unit"><input type="number" id="apache-ii-temp" step="0.1" placeholder="Norm: 36.1 - 37.8"><span>°C</span></div></div>
                    <div class="input-row"><label>Mean arterial pressure</label><div class="input-with-unit"><input type="number" id="apache-ii-map" placeholder="Norm: 70 - 100"><span>mm Hg</span></div></div>
                    <div class="input-row"><label>Heart rate/pulse</label><div class="input-with-unit"><input type="number" id="apache-ii-hr" placeholder="Norm: 60 - 100"><span>beats/min</span></div></div>
                    <div class="input-row"><label>Respiratory rate</label><div class="input-with-unit"><input type="number" id="apache-ii-rr" placeholder="Norm: 12 - 20"><span>breaths/min</span></div></div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Laboratory Values</span>
                    </div>
                    <div class="input-row"><label>pH (arterial)</label><input type="number" id="apache-ii-ph" step="0.01" placeholder="Norm: 7.38 - 7.44"></div>
                    <div class="input-row"><label>Sodium</label><div class="input-with-unit"><input type="number" id="apache-ii-sodium" placeholder="Norm: 136 - 145"><span>mmol/L</span></div></div>
                    <div class="input-row"><label>Potassium</label><div class="input-with-unit"><input type="number" id="apache-ii-potassium" step="0.1" placeholder="Norm: 3.5 - 5.2"><span>mmol/L</span></div></div>
                    <div class="input-row"><label>Creatinine</label><div class="input-with-unit"><input type="number" id="apache-ii-creatinine" step="0.1" placeholder="Norm: 62 - 115"><span>μmol/L</span></div></div>
                    <div class="input-row"><label>Hematocrit</label><div class="input-with-unit"><input type="number" id="apache-ii-hct" step="0.1" placeholder="Norm: 36 - 51"><span>%</span></div></div>
                    <div class="input-row"><label>White blood cell count</label><div class="input-with-unit"><input type="number" id="apache-ii-wbc" step="0.1" placeholder="Norm: 3.7 - 10.7"><span>x 10⁹ cells/L</span></div></div>
                    
                    <div class="section-subtitle">Acute renal failure</div>
                    <div class="help-text mb-10">Note: "acute renal failure" was not defined in the original study. Use clinical judgment to determine whether patient has acute kidney injury.</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="arf" value="1">
                            <span>Yes - Double creatinine points <strong>×2</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="arf" value="0" checked>
                            <span>No <strong>×1</strong></span>
                        </label>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Neurological Assessment</span>
                    </div>
                    <div class="input-row"><label>Glasgow Coma Scale</label><div class="input-with-unit"><input type="number" id="apache-ii-gcs" placeholder="3 - 15" min="3" max="15"><span>points</span></div></div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Oxygenation</span>
                    </div>
                    <div class="section-subtitle">Choose measurement method</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="oxy_method" value="fio2_pao2" checked>
                            <span>FiO₂ and PaO₂ (if FiO₂ ≥ 0.5)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="oxy_method" value="pao2_only">
                            <span>PaO₂ only (if FiO₂ &lt; 0.5)</span>
                        </label>
                    </div>
                    
                    <div class="input-row mt-15" id="fio2_pao2_inputs">
                        <label for="apache-ii-fio2">FiO₂</label><input type="number" id="apache-ii-fio2" step="0.01" placeholder="e.g. 0.5" min="0" max="1">
                        <label for="apache-ii-pao2">PaO₂</label><input type="number" id="apache-ii-pao2" placeholder="mmHg">
                        <label for="apache-ii-paco2">PaCO₂</label><input type="number" id="apache-ii-paco2" placeholder="mmHg">
                    </div>
                    <div class="input-row mt-15" id="pao2_only_inputs" style="display:none;">
                        <label for="apache-ii-pao2-only">PaO₂</label><input type="number" id="apache-ii-pao2-only" placeholder="mmHg">
                    </div>
                </div>
                
            </div>
            
            <div id="apache-ii-result" class="result-container" style="display:none;"></div>
            
            <div class="info-section mt-30">
                <h4>📚 Reference</h4>
                <p>Knaus, W. A., Draper, E. A., Wagner, D. P., & Zimmerman, J. E. (1985). APACHE II: a severity of disease classification system. <em>Critical care medicine</em>, 13(10), 818-829.</p>
                <img src="js/calculators/apache-ii/APACHE2.png" alt="APACHE II Reference Image" class="reference-image" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const ageInput = container.querySelector('#apache-ii-age');
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        // Auto-populate from FHIR
        getMostRecentObservation(client, '8310-5').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-temp').value =
                    obs.valueQuantity.value.toFixed(1);
            }
        });
        getMostRecentObservation(client, '8480-6').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-map').value =
                    obs.valueQuantity.value.toFixed(0);
            }
        });
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-hr').value = obs.valueQuantity.value.toFixed(0);
            }
        });
        getMostRecentObservation(client, '9279-1').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-rr').value = obs.valueQuantity.value.toFixed(0);
            }
        });
        getMostRecentObservation(client, '2703-7').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-ph').value = obs.valueQuantity.value.toFixed(2);
            }
        });
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-sodium').value =
                    obs.valueQuantity.value.toFixed(0);
            }
        });
        getMostRecentObservation(client, '2823-3').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-potassium').value =
                    obs.valueQuantity.value.toFixed(1);
            }
        });
        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-creatinine').value =
                    obs.valueQuantity.value.toFixed(2);
            }
        });
        getMostRecentObservation(client, '4544-3').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-hct').value =
                    obs.valueQuantity.value.toFixed(1);
            }
        });
        getMostRecentObservation(client, '6764-2').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-wbc').value =
                    obs.valueQuantity.value.toFixed(1);
            }
        });
        getMostRecentObservation(client, '8478-0').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#apache-ii-gcs').value =
                    obs.valueQuantity.value.toFixed(0);
            }
        });

        // Calculate function
        const calculate = () => {
            const arf = container.querySelector('input[name="arf"]:checked')?.value === '1';
            const chronic = container.querySelector('input[name="chronic"]:checked')?.value === '5';
            const oxyMethod = container.querySelector('input[name="oxy_method"]:checked')?.value;

            const values = {
                temp: parseFloat(container.querySelector('#apache-ii-temp').value),
                map: parseFloat(container.querySelector('#apache-ii-map').value),
                hr: parseFloat(container.querySelector('#apache-ii-hr').value),
                rr: parseFloat(container.querySelector('#apache-ii-rr').value),
                ph: parseFloat(container.querySelector('#apache-ii-ph').value),
                sodium: parseFloat(container.querySelector('#apache-ii-sodium').value),
                potassium: parseFloat(container.querySelector('#apache-ii-potassium').value),
                creatinine: parseFloat(container.querySelector('#apache-ii-creatinine').value),
                hct: parseFloat(container.querySelector('#apache-ii-hct').value),
                wbc: parseFloat(container.querySelector('#apache-ii-wbc').value),
                gcs: parseInt(container.querySelector('#apache-ii-gcs').value),
                age: parseInt(ageInput.value),
                fio2: parseFloat(container.querySelector('#apache-ii-fio2').value),
                pao2: parseFloat(container.querySelector('#apache-ii-pao2').value),
                paco2: parseFloat(container.querySelector('#apache-ii-paco2').value),
                pao2_only: parseFloat(container.querySelector('#apache-ii-pao2-only').value)
            };

            const resultEl = container.querySelector('#apache-ii-result');

            try {
                let aps = 0;
                aps += getPoints.temp(values.temp);
                aps += getPoints.map(values.map);
                aps += getPoints.ph(values.ph);
                aps += getPoints.hr(values.hr);
                aps += getPoints.rr(values.rr);
                aps += getPoints.sodium(values.sodium);
                aps += getPoints.potassium(values.potassium);
                aps += getPoints.creatinine(values.creatinine, arf);
                aps += getPoints.hct(values.hct);
                aps += getPoints.wbc(values.wbc);
                aps += getPoints.gcs(values.gcs);

                if (oxyMethod === 'fio2_pao2' && values.fio2 >= 0.5) {
                    aps += getPoints.oxygenation(values.fio2, values.pao2, values.paco2);
                } else {
                    aps += getPoints.oxygenation(0.21, values.pao2_only || values.pao2, null);
                }

                const agePoints = getPoints.age(values.age);
                const chronicPoints = chronic ? 5 : 0;

                const score = aps + agePoints + chronicPoints;
                const mortality =
                    (Math.exp(-3.517 + 0.146 * score) / (1 + Math.exp(-3.517 + 0.146 * score))) *
                    100;

                let mortalityClass = 'low';
                let riskLevel = 'Low Risk';

                if (mortality < 10) {
                    mortalityClass = 'low';
                    riskLevel = 'Low Risk';
                } else if (mortality < 25) {
                    mortalityClass = 'moderate';
                    riskLevel = 'Moderate Risk';
                } else if (mortality < 50) {
                    mortalityClass = 'high';
                    riskLevel = 'High Risk';
                } else {
                    mortalityClass = 'high';
                    riskLevel = 'Very High Risk';
                }

                resultEl.innerHTML = `
                    <div class="result-header">
                        <h4>APACHE II Results</h4>
                    </div>
                    
                    <div class="result-score">
                        <span class="result-score-value">${score}</span>
                        <span class="result-score-unit">points</span>
                    </div>
                    
                    <div class="result-item">
                        <span class="result-item-label">Component Scores</span>
                        <span class="result-item-value">APS ${aps} + Age ${agePoints} + Chronic Health ${chronicPoints}</span>
                    </div>
                    
                    <div class="result-item">
                        <span class="result-item-label">Predicted ICU Mortality</span>
                        <span class="result-item-value">${mortality.toFixed(1)}%</span>
                    </div>
                    
                    <div class="severity-indicator ${mortalityClass} mt-20">
                        <span class="severity-indicator-text">${riskLevel}</span>
                    </div>
                    
                    <div class="alert ${mortalityClass === 'high' ? 'warning' : 'info'} mt-20">
                        <span class="alert-icon">${mortalityClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                        <div class="alert-content">
                            <p>The APACHE II score is used to predict ICU mortality. Higher scores correlate with increased mortality risk. Serial assessments may provide additional prognostic value.</p>
                        </div>
                    </div>
                `;
                resultEl.style.display = 'block';
                resultEl.classList.add('show');
            } catch (e) {
                resultEl.innerHTML = `
                    <div class="alert warning">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <p>Please fill out all required fields to calculate the APACHE II score.</p>
                        </div>
                    </div>
                `;
                resultEl.style.display = 'block';
            }
        };

        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                this.classList.add('selected');
                radio.checked = true;
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

        // Handle oxygen method switching with auto-calculate
        const oxyMethodInputs = container.querySelectorAll('input[name="oxy_method"]');
        const fio2Inputs = container.querySelector('#fio2_pao2_inputs');
        const pao2OnlyInputs = container.querySelector('#pao2_only_inputs');

        oxyMethodInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === 'fio2_pao2') {
                    fio2Inputs.style.display = 'block';
                    pao2OnlyInputs.style.display = 'none';
                } else {
                    fio2Inputs.style.display = 'none';
                    pao2OnlyInputs.style.display = 'block';
                }
                calculate();
            });
        });

        // Auto-calculate on input changes
        const numberInputs = container.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('input', () => {
                calculate();
            });
        });

        // Initial calculation
        calculate();
    }
};
