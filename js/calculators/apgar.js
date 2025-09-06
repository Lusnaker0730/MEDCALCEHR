
export const apgarScore = {
    id: 'apgar-score',
    title: 'APGAR Score',
    description: 'Assesses neonates 1 and 5 minutes after birth.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row vertical">
                    <div class="input-label">Activity/muscle tone</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="activity" value="2"> Active</label>
                        <label><input type="radio" name="activity" value="1"> Some extremity flexion</label>
                        <label><input type="radio" name="activity" value="0"> Limp</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Pulse</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="pulse" value="2"> ≥100 BPM</label>
                        <label><input type="radio" name="pulse" value="1"> &lt;100 BPM</label>
                        <label><input type="radio" name="pulse" value="0"> Absent</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Grimace</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="grimace" value="2"> Sneeze/cough</label>
                        <label><input type="radio" name="grimace" value="1"> Grimace</label>
                        <label><input type="radio" name="grimace" value="0"> None</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Appearance/color</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="appearance" value="2"> All pink</label>
                        <label><input type="radio" name="appearance" value="1"> Blue extremities, pink body</label>
                        <label><input type="radio" name="appearance" value="0"> Blue/pale</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Respirations</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="respirations" value="2"> Good/crying</label>
                        <label><input type="radio" name="respirations" value="1"> Irregular/slow</label>
                        <label><input type="radio" name="respirations" value="0"> Absent</label>
                    </div>
                </div>
            </div>
            <div id="apgar-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#apgar-result');

        const calculate = () => {
            const groups = ['activity', 'pulse', 'grimace', 'appearance', 'respirations'];
            let score = 0;
            const allAnswered = groups.every(groupName => container.querySelector(`input[name="${groupName}"]:checked`));

            if (!allAnswered) {
                resultEl.style.display = 'none';
                return;
            }

            groups.forEach(groupName => {
                score += parseInt(container.querySelector(`input[name="${groupName}"]:checked`).value);
            });
            
            let interpretation = '';
            if (score < 7) {
                interpretation = 'Scores <7 suggest potential need for medical intervention, like suction, drying, warming, and stimulating the neonate. Supplemental oxygen may be indicated as well.';
            } else {
                interpretation = 'A score of 7-10 is generally considered normal and reassuring.';
            }

            resultEl.innerHTML = `
                <div class="score-section" style="justify-content: center;">
                    <div class="score-value">${score}</div>
                    <div class="score-label">points</div>
                </div>
                <div class="interpretation-section">
                    <div class="interp-details">${interpretation}</div>
                </div>
            `;
            resultEl.style.display = 'flex';
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
    }
};
