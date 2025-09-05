// js/calculators/gcs.js

export const gcs = {
    id: 'gcs',
    title: 'Glasgow Coma Scale (GCS)',
    description: 'Coma severity based on Eye (4), Verbal (5), and Motor (6) criteria.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Coma severity based on Eye (4), Verbal (5), and Motor (6) criteria.</p>
            
            <div class="gcs-category">
                <h4>Eye Opening Response</h4>
                <div class="input-group-radio">
                    <input type="radio" id="eye4" name="eye" value="4" checked><label for="eye4">Spontaneous - open with blinking at baseline (4)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="eye3" name="eye" value="3"><label for="eye3">To verbal stimuli, command, speech (3)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="eye2" name="eye" value="2"><label for="eye2">To pain only (not applied to face) (2)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="eye1" name="eye" value="1"><label for="eye1">No response (1)</label>
                </div>
            </div>

            <div class="gcs-category">
                <h4>Verbal Response</h4>
                <div class="input-group-radio">
                    <input type="radio" id="verbal5" name="verbal" value="5" checked><label for="verbal5">Oriented (5)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="verbal4" name="verbal" value="4"><label for="verbal4">Confused speech, but able to answer questions (4)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="verbal3" name="verbal" value="3"><label for="verbal3">Inappropriate words (3)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="verbal2" name="verbal" value="2"><label for="verbal2">Incomprehensible speech (2)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="verbal1" name="verbal" value="1"><label for="verbal1">No response (1)</label>
                </div>
            </div>

            <div class="gcs-category">
                <h4>Motor Response</h4>
                <div class="input-group-radio">
                    <input type="radio" id="motor6" name="motor" value="6" checked><label for="motor6">Obeys commands for movement (6)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="motor5" name="motor" value="5"><label for="motor5">Purposeful movement to painful stimulus (5)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="motor4" name="motor" value="4"><label for="motor4">Withdraws from pain (4)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="motor3" name="motor" value="3"><label for="motor3">Abnormal (spastic) flexion, decorticate posture (3)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="motor2" name="motor" value="2"><label for="motor2">Extensor (rigid) response, decerebrate posture (2)</label>
                </div>
                <div class="input-group-radio">
                    <input type="radio" id="motor1" name="motor" value="1"><label for="motor1">No response (1)</label>
                </div>
            </div>

            <button id="calculate-gcs">Calculate GCS</button>
            <div id="gcs-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-gcs').addEventListener('click', () => {
            const eyeScore = parseInt(document.querySelector('input[name="eye"]:checked').value);
            const verbalScore = parseInt(document.querySelector('input[name="verbal"]:checked').value);
            const motorScore = parseInt(document.querySelector('input[name="motor"]:checked').value);
            const totalScore = eyeScore + verbalScore + motorScore;

            let severity = '';
            if (totalScore >= 13) {
                severity = 'Mild brain injury';
            } else if (totalScore >= 9) {
                severity = 'Moderate brain injury';
            } else { // <= 8
                severity = 'Severe brain injury';
            }
            
            const resultEl = document.getElementById('gcs-result');
            resultEl.innerHTML = `
                <p><strong>Total GCS Score:</strong> ${totalScore} (E${eyeScore}V${verbalScore}M${motorScore})</p>
                <p><strong>Severity:</strong> ${severity}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
