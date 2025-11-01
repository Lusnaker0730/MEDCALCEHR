import { getMostRecentObservation, calculateAge } from '../../utils.js';

// Point allocation functions based on GWTG-HF score algorithm
const getPoints = {
    sbp: v => {
        if (v < 90) {
            return 28;
        }
        if (v < 100) {
            return 23;
        }
        if (v < 110) {
            return 18;
        }
        if (v < 120) {
            return 14;
        }
        if (v < 130) {
            return 9;
        }
        if (v < 140) {
            return 5;
        }
        return 0;
    },
    bun: v => {
        if (v < 20) {
            return 0;
        }
        if (v < 30) {
            return 4;
        }
        if (v < 40) {
            return 9;
        }
        if (v < 50) {
            return 13;
        }
        if (v < 60) {
            return 18;
        }
        if (v < 70) {
            return 22;
        }
        return 28;
    },
    sodium: v => {
        if (v > 140) {
            return 4;
        }
        if (v > 135) {
            return 2;
        }
        return 0;
    },
    age: v => {
        if (v < 40) {
            return 0;
        }
        if (v < 50) {
            return 7;
        }
        if (v < 60) {
            return 14;
        }
        if (v < 70) {
            return 21;
        }
        if (v < 80) {
            return 28;
        }
        return 28;
    },
    hr: v => {
        if (v < 70) {
            return 0;
        }
        if (v < 80) {
            return 1;
        }
        if (v < 90) {
            return 3;
        }
        if (v < 100) {
            return 5;
        }
        if (v < 110) {
            return 6;
        }
        return 8;
    }
};

const getMortality = score => {
    if (score <= 32) {
        return '<1%';
    }
    if (score <= 41) {
        return '1-2%';
    } // MDCalc combines some ranges
    if (score <= 50) {
        return '2-5%';
    }
    if (score <= 56) {
        return '5-10%';
    }
    if (score <= 61) {
        return '10-15%';
    }
    if (score <= 65) {
        return '15-20%';
    }
    if (score <= 72) {
        return '20-30%';
    }
    if (score <= 74) {
        return '30-40%';
    }
    if (score <= 79) {
        return '40-50%';
    }
    return '>50%';
};

export const gwtgHf = {
    id: 'gwtg-hf',
    title: 'GWTG-Heart Failure Risk Score',
    description: 'Predicts in-hospital all-cause heart failure mortality.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="alert warning">
                <strong>⚠️ IMPORTANT</strong>
                <p>This calculator includes inputs based on race, which may or may not provide better estimates, so we have decided to make race optional. For the same other inputs, this calculator estimates lower in-hospital mortality risk in Black patients.</p>
            </div>

            <div class="section">
                <div class="section-title">Systolic BP</div>
                <div class="input-with-unit">
                    <input type="number" id="gwtg-sbp" placeholder="120">
                    <span>mm Hg</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">BUN</div>
                <div class="input-with-unit">
                    <input type="number" id="gwtg-bun" placeholder="30">
                    <span>mg/dL</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Sodium</div>
                <div class="input-with-unit">
                    <input type="number" id="gwtg-sodium" placeholder="140">
                    <span>mEq/L</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Age</div>
                <div class="input-with-unit">
                    <input type="number" id="gwtg-age" placeholder="65">
                    <span>years</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Heart rate</div>
                <div class="input-with-unit">
                    <input type="number" id="gwtg-hr" placeholder="80">
                    <span>beats/min</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">COPD history</div>
                <div class="radio-group">
                    <label class="radio-option"><input type="radio" name="copd" value="0" checked><span class="radio-label">No <strong>0</strong></span></label>
                    <label class="radio-option"><input type="radio" name="copd" value="2"><span class="radio-label">Yes <strong>+2</strong></span></label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Black race</div>
                <p class="help-text">Race may/may not provide better estimates of in-hospital mortality; optional</p>
                <div class="radio-group">
                    <label class="radio-option"><input type="radio" name="race" value="0" checked><span class="radio-label">No <strong>0</strong></span></label>
                    <label class="radio-option"><input type="radio" name="race" value="-3"><span class="radio-label">Yes <strong>-3</strong></span></label>
                </div>
            </div>

            <div id="gwtg-hf-result" class="result-container"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const fields = {
            sbp: container.querySelector('#gwtg-sbp'),
            bun: container.querySelector('#gwtg-bun'),
            sodium: container.querySelector('#gwtg-sodium'),
            age: container.querySelector('#gwtg-age'),
            hr: container.querySelector('#gwtg-hr'),
            copd: container.querySelector('input[name="copd"]:checked'),
            race: container.querySelector('input[name="race"]:checked')
        };
        const resultEl = container.querySelector('#gwtg-hf-result');

        const calculate = () => {
            fields.copd = container.querySelector('input[name="copd"]:checked');
            fields.race = container.querySelector('input[name="race"]:checked');
            const allFilled = ['sbp', 'bun', 'sodium', 'age', 'hr', 'copd'].every(
                key => fields[key] && fields[key].value !== ''
            );

            if (!allFilled) {
                resultEl.classList.remove('show');
                return;
            }

            let score = 0;
            score += getPoints.sbp(parseFloat(fields.sbp.value));
            score += getPoints.bun(parseFloat(fields.bun.value));
            score += getPoints.sodium(parseFloat(fields.sodium.value));
            score += getPoints.age(parseFloat(fields.age.value));
            score += getPoints.hr(parseFloat(fields.hr.value));
            score += parseInt(fields.copd.value);
            if (fields.race) {
                // Race is optional
                score += parseInt(fields.race.value);
            }

            const mortality = getMortality(score);
            
            let riskLevel = 'low';
            if (mortality.includes('>50%') || mortality.includes('40-50') || mortality.includes('30-40')) {
                riskLevel = 'high';
            } else if (mortality.includes('20-30') || mortality.includes('15-20') || mortality.includes('10-15')) {
                riskLevel = 'medium';
            }

            resultEl.innerHTML = `
                <div class="result-header">
                    <h3>GWTG-HF Score</h3>
                </div>
                <div class="result-score" style="font-size: 4rem; font-weight: bold; color: #667eea;">${score}</div>
                <div class="result-label">points</div>
                
                <div class="result-item">
                    <span class="result-label">In-hospital mortality:</span>
                    <span class="result-value" style="font-size: 2rem; font-weight: bold; color: #667eea;">${mortality}</span>
                </div>
                
                <div class="severity-indicator ${riskLevel}">${riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Moderate Risk' : 'Low Risk'}</div>
            `;
            resultEl.classList.add('show');
        };

        // Auto-populate data
        fields.age.value = calculateAge(patient.birthDate);
        getMostRecentObservation(client, '8480-6').then(obs => {
            if (obs) {
                fields.sbp.value = obs.valueQuantity.value.toFixed(0);
            }
            calculate();
        });
        getMostRecentObservation(client, '3094-0').then(obs => {
            if (obs) {
                fields.bun.value = obs.valueQuantity.value.toFixed(0);
            }
            calculate();
        }); // BUN
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs) {
                fields.sodium.value = obs.valueQuantity.value.toFixed(0);
            }
            calculate();
        });
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs) {
                fields.hr.value = obs.valueQuantity.value.toFixed(0);
            }
            calculate();
        });

        // Add visual feedback for radio options
        container.querySelectorAll('.radio-option').forEach(option => {
            option.addEventListener('click', () => {
                const input = option.querySelector('input[type="radio"]');
                if (input) {
                    input.checked = true;
                    const radioGroup = option.closest('.radio-group');
                    radioGroup.querySelectorAll('.radio-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    calculate();
                }
            });
        });

        // Add event listeners for number inputs
        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // Initial visual feedback
        container.querySelectorAll('.radio-group').forEach(group => {
            const checkedInput = group.querySelector('input[type="radio"]:checked');
            if (checkedInput) {
                checkedInput.closest('.radio-option').classList.add('selected');
            }
        });

        calculate();
    }
};
