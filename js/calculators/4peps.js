
export const peps4Score = {
    id: '4peps-score',
    title: '4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)',
    description: 'Rules out PE based on clinical criteria.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" data-points="11"><label>Age > 50 years</label></div>
                <div class="check-item"><input type="checkbox" data-points="8"><label>History of VTE or cancer</label></div>
                <div class="check-item"><input type="checkbox" data-points="5"><label>Unilateral leg swelling</label></div>
                <div class="check-item"><input type="checkbox" data-points="5"><label>Tachycardia (>100 bpm)</label></div>
                <div class="check-item"><input type="checkbox" data-points="4"><label>Recent surgery or immobilization</label></div>
                <div class="check-item"><input type="checkbox" data-points="4"><label>Hemoptysis</label></div>
                <div class="check-item"><input type="checkbox" data-points="-6"><label>PE is not the most likely diagnosis</label></div>
                <div class="check-item"><input type="checkbox" data-points="-5"><label>Estrogen use</label></div>
            </div>
            <button id="calculate-4peps">Calculate Score</button>
            <div id="4peps-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-4peps').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#calculator-container .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let riskLevel = '';
            if (score <= 0) riskLevel = 'Very Low Risk';
            else if (score <= 5) riskLevel = 'Low Risk';
            else if (score <= 13) riskLevel = 'Moderate Risk';
            else riskLevel = 'High Risk';

            document.getElementById('4peps-result').innerHTML = `
                <p>4PEPS Score: ${score}</p>
                <p>Clinical Probability: ${riskLevel}</p>
            `;
            document.getElementById('4peps-result').style.display = 'block';
        });
    }
};
