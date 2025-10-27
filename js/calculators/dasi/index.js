// js/calculators/dasi.js

export const dasi = {
    id: 'dasi',
    title: 'Duke Activity Status Index (DASI)',
    description: 'Estimates functional capacity.',
    generateHTML: function () {
        const activities = [
            {
                id: 'dasi-care',
                label: 'Can you take care of yourself, (i.e., eating, dressing, bathing or using the toilet)?',
                weight: 2.75
            },
            {
                id: 'dasi-walk-indoors',
                label: 'Can you walk indoors, such as around your house?',
                weight: 1.75
            },
            {
                id: 'dasi-walk-flat',
                label: 'Can you walk a block or two on level ground?',
                weight: 2.75
            },
            {
                id: 'dasi-climb-stairs',
                label: 'Can you climb a flight of stairs or walk up a hill?',
                weight: 5.5
            },
            { id: 'dasi-run', label: 'Can you run a short distance?', weight: 8.0 },
            {
                id: 'dasi-light-housework',
                label: 'Can you do light work around the house like dusting or washing dishes?',
                weight: 2.7
            },
            {
                id: 'dasi-moderate-housework',
                label: 'Can you do moderate work around the house like vacuuming, sweeping floors or carrying in groceries?',
                weight: 3.5
            },
            {
                id: 'dasi-heavy-housework',
                label: 'Can you do heavy work around the house like scrubbing floors or lifting or moving heavy furniture?',
                weight: 8.0
            },
            {
                id: 'dasi-yardwork',
                label: 'Can you do yardwork like raking leaves, weeding or pushing a power mower?',
                weight: 4.5
            },
            { id: 'dasi-sex', label: 'Can you have sexual relations?', weight: 5.25 },
            {
                id: 'dasi-recreation-mild',
                label: 'Can you participate in mild recreational activities like bowling or dancing?',
                weight: 6.0
            },
            {
                id: 'dasi-recreation-strenuous',
                label: 'Can you participate in strenuous sports like swimming, singles tennis, football, basketball or skiing?',
                weight: 7.5
            }
        ];

        let html = `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <p>Please check all activities you are able to perform:</p>
            <div class="checklist">
        `;
        activities.forEach(act => {
            html += `<div class="check-item"><input type="checkbox" id="${act.id}" data-weight="${act.weight}"><label for="${act.id}">${act.label}</label></div>`;
        });
        html += `
            </div>
            <button id="calculate-dasi">Calculate DASI Score</button>
            <div id="dasi-result" class="result" style="display:none;"></div>

            <div class="references">
                <h4>📚 Reference Information</h4>
                <div class="reference-images">
                    <div class="reference-image-container">
                        <h5>DASI Scoring Table</h5>
                        <img src="/js/calculators/dasi/cohn_cvperiopupdate_t1.jpg" alt="The Duke Activity Status Index - Scoring Table" />
                        <p class="image-caption">DASI weights for each activity question. Maximum score: 58.20</p>
                    </div>
                    
                    <div class="reference-image-container">
                        <h5>METs Calculation Formula</h5>
                        <img src="/js/calculators/dasi/Duke-Activity-Status-Index-DASI-DASI-SUM-values-for-all-12-questions-Maximum-value_W640.jpg" alt="DASI to METs conversion formula" />
                        <p class="image-caption">
                            Formula: VO₂peak = (0.43 × DASI) + 9.6 mL/kg/min<br>
                            METs = VO₂peak / 3.5
                        </p>
                    </div>
                </div>
                
                <div class="reference-citation">
                    <h5>📖 Citation</h5>
                    <p>
                        Hlatky MA, Boineau RE, Higginbotham MB, et al. 
                        <strong>A brief self-administered questionnaire to determine functional capacity (The Duke Activity Status Index).</strong> 
                        <em>Am J Cardiol.</em> 1989;64(10):651-654. 
                        <a href="https://doi.org/10.1016/0002-9149(89)90496-7" target="_blank">doi:10.1016/0002-9149(89)90496-7</a>
                    </p>
                </div>
            </div>
        `;
        return html;
    },
    initialize: function () {
        document.getElementById('calculate-dasi').addEventListener('click', () => {
            let score = 0;
            document.querySelectorAll('.checklist input[type="checkbox"]:checked').forEach(box => {
                score += parseFloat(box.dataset.weight);
            });

            // Formula to estimate METs from DASI score
            // VO2peak (mL/kg/min) = (0.43 × DASI) + 9.6
            // METs = VO2peak / 3.5
            const vo2peak = 0.43 * score + 9.6;
            const mets = vo2peak / 3.5;

            let interpretation = '';
            if (mets < 4) {
                interpretation =
                    '<span style="color: #dc3545; font-weight: 600;">Poor functional capacity</span>';
            } else if (mets < 7) {
                interpretation =
                    '<span style="color: #ffc107; font-weight: 600;">Moderate functional capacity</span>';
            } else {
                interpretation =
                    '<span style="color: #28a745; font-weight: 600;">Good functional capacity</span>';
            }

            const resultEl = document.getElementById('dasi-result');
            resultEl.innerHTML = `
                <p><strong>DASI Score:</strong> ${score.toFixed(2)}</p>
                <p><strong>Estimated Peak METs:</strong> ${mets.toFixed(1)}</p>
                <p>${interpretation}</p>
                <small><em>Functional capacity is often considered poor if METs < 4, moderate if 4-7, and good if >7.</em></small>
            `;
            resultEl.style.display = 'block';
        });
    }
};
