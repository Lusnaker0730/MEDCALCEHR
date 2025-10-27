export const nihss = {
    id: 'nihss',
    title: 'NIH Stroke Scale/Score (NIHSS)',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>Quantifies stroke severity and monitors for neurological changes over time.</p>
            <div class="form-container">
                <div class="form-group">
                    <label for="nihss-1a">1a. Level of Consciousness</label>
                    <select id="nihss-1a">
                        <option value="0">0 - Alert</option>
                        <option value="1">1 - Not alert, but arousable by minor stimulation</option>
                        <option value="2">2 - Not alert, requires repeated stimulation to attend</option>
                        <option value="3">3 - Unresponsive, or reflex motor responses only</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-1b">1b. LOC Questions (Month, Age)</label>
                    <select id="nihss-1b">
                        <option value="0">0 - Answers both correctly</option>
                        <option value="1">1 - Answers one correctly</option>
                        <option value="2">2 - Answers neither correctly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-1c">1c. LOC Commands (Open/close eyes, grip/release hand)</label>
                    <select id="nihss-1c">
                        <option value="0">0 - Performs both correctly</option>
                        <option value="1">1 - Performs one correctly</option>
                        <option value="2">2 - Performs neither correctly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-2">2. Best Gaze</label>
                    <select id="nihss-2">
                        <option value="0">0 - Normal</option>
                        <option value="1">1 - Partial gaze palsy</option>
                        <option value="2">2 - Forced deviation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-3">3. Visual Fields</label>
                    <select id="nihss-3">
                        <option value="0">0 - No visual loss</option>
                        <option value="1">1 - Partial hemianopia</option>
                        <option value="2">2 - Complete hemianopia</option>
                        <option value="3">3 - Bilateral hemianopia</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-4">4. Facial Palsy</label>
                    <select id="nihss-4">
                        <option value="0">0 - Normal</option>
                        <option value="1">1 - Minor paralysis</option>
                        <option value="2">2 - Partial paralysis</option>
                        <option value="3">3 - Complete paralysis of one or both sides</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-5a">5a. Motor Arm Left</label>
                    <select id="nihss-5a">
                        <option value="0">0 - No drift</option>
                        <option value="1">1 - Drift</option>
                        <option value="2">2 - Some effort against gravity</option>
                        <option value="3">3 - No effort against gravity, but moves</option>
                        <option value="4">4 - No movement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-5b">5b. Motor Arm Right</label>
                    <select id="nihss-5b">
                        <option value="0">0 - No drift</option>
                        <option value="1">1 - Drift</option>
                        <option value="2">2 - Some effort against gravity</option>
                        <option value="3">3 - No effort against gravity, but moves</option>
                        <option value="4">4 - No movement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-6a">6a. Motor Leg Left</label>
                    <select id="nihss-6a">
                        <option value="0">0 - No drift</option>
                        <option value="1">1 - Drift</option>
                        <option value="2">2 - Some effort against gravity</option>
                        <option value="3">3 - No effort against gravity, but moves</option>
                        <option value="4">4 - No movement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-6b">6b. Motor Leg Right</label>
                    <select id="nihss-6b">
                        <option value="0">0 - No drift</option>
                        <option value="1">1 - Drift</option>
                        <option value="2">2 - Some effort against gravity</option>
                        <option value="3">3 - No effort against gravity, but moves</option>
                        <option value="4">4 - No movement</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-7">7. Limb Ataxia</label>
                    <select id="nihss-7">
                        <option value="0">0 - Absent</option>
                        <option value="1">1 - Present in one limb</option>
                        <option value="2">2 - Present in two or more limbs</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-8">8. Sensory</label>
                    <select id="nihss-8">
                        <option value="0">0 - Normal</option>
                        <option value="1">1 - Mild-to-moderate loss</option>
                        <option value="2">2 - Severe-to-total loss</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-9">9. Best Language</label>
                    <select id="nihss-9">
                        <option value="0">0 - No aphasia</option>
                        <option value="1">1 - Mild-to-moderate aphasia</option>
                        <option value="2">2 - Severe aphasia</option>
                        <option value="3">3 - Mute, global aphasia</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-10">10. Dysarthria</label>
                    <select id="nihss-10">
                        <option value="0">0 - Normal articulation</option>
                        <option value="1">1 - Mild-to-moderate dysarthria</option>
                        <option value="2">2 - Severe dysarthria (unintelligible)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="nihss-11">11. Extinction and Inattention (Neglect)</label>
                    <select id="nihss-11">
                        <option value="0">0 - No neglect</option>
                        <option value="1">1 - Partial neglect</option>
                        <option value="2">2 - Complete neglect</option>
                    </select>
                </div>
            </div>
            <button id="calculate-nihss">Calculate Score</button>
            <div id="nihss-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function () {
        document.getElementById('calculate-nihss').addEventListener('click', () => {
            const selects = document.querySelectorAll('.calculator-card select');
            let score = 0;
            selects.forEach(select => {
                score += parseInt(select.value);
            });

            let severity = '';
            if (score === 0) {
                severity = 'No stroke symptoms';
            } else if (score >= 1 && score <= 4) {
                severity = 'Minor stroke';
            } else if (score >= 5 && score <= 15) {
                severity = 'Moderate stroke';
            } else if (score >= 16 && score <= 20) {
                severity = 'Moderate-to-severe stroke';
            } else if (score >= 21) {
                severity = 'Severe stroke';
            }

            const resultEl = document.getElementById('nihss-result');
            resultEl.innerHTML = `
                <p>NIHSS Score: ${score}</p>
                <p>Stroke Severity: ${severity}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
