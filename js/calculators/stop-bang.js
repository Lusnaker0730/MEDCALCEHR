export const stopBang = {
    id: 'stop-bang',
    title: 'STOP-BANG Score for Obstructive Sleep Apnea',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Screens for obstructive sleep apnea.</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="sb-snoring" data-points="1"><label for="sb-snoring"><b>S</b>noring: Do you snore loudly?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-tired" data-points="1"><label for="sb-tired"><b>T</b>ired: Do you often feel tired, fatigued, or sleepy during daytime?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-observed" data-points="1"><label for="sb-observed"><b>O</b>bserved: Has anyone observed you stop breathing during your sleep?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-pressure" data-points="1"><label for="sb-pressure"><b>P</b>ressure: Do you have or are you being treated for high blood pressure?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-bmi" data-points="1"><label for="sb-bmi"><b>B</b>MI more than 35 kg/m²?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-age" data-points="1"><label for="sb-age"><b>A</b>ge over 50 years old?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-neck" data-points="1"><label for="sb-neck"><b>N</b>eck circumference greater than 40 cm?</label></div>
                <div class="check-item"><input type="checkbox" id="sb-gender" data-points="1"><label for="sb-gender"><b>G</b>ender: Male?</label></div>
            </div>
            <button id="calculate-stop-bang">Calculate Score</button>
            <div id="stop-bang-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-stop-bang').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.calculator-card .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let risk = '';
            if (score <= 2) {
                risk = 'Low risk of moderate to severe OSA';
            } else if (score <= 4) {
                risk = 'Intermediate risk of moderate to severe OSA';
            } else {
                risk = 'High risk of moderate to severe OSA';
            }

            const resultEl = document.getElementById('stop-bang-result');
            resultEl.innerHTML = `
                <p>STOP-BANG Score: ${score}</p>
                <p>Risk: ${risk}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
