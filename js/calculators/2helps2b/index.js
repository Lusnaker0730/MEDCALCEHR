export const helps2bScore = {
    id: '2helps2b-score',
    title: '2HELPS2B Score',
    description:
        'Estimates seizure risk in acutely ill patients undergoing continuous EEG (cEEG), based on the 2HELPS2B score and seizure probability table.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            <div class="calculator-image-container">
                <img id="ref-image-thumb" src="js/calculators/2helps2b/jarkvkkq-1289547-1-img.png" alt="2HELPS2B Score Reference" style="max-width: 1000px; width: 100%; border-radius: 8px; cursor: pointer;" />
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal">
                <span class="close-btn">&times;</span>
                <img class="modal-content" id="modal-image">
            </div>

            <div class="checklist">
                <div class="check-item"><input type="checkbox" data-points="1"><label>Frequency > 2Hz</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Sporadic epileptiform discharges</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>LPD/BIPD/LRDA</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Plus features</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Prior seizure</label></div>
                <div class="check-item"><input type="checkbox" data-points="2"><label>Brief ictal rhythmic discharges (BIRDs)</label></div>
            </div>
            <button id="calculate-2helps2b">Calculate Score</button>
            <div id="2helps2b-result" class="result" style="display:none;"></div>
            <div class="citation">
                <h4>Source:</h4>
                <p>Struck, A. F., et al. (2017). Association of an Electroencephalography-Based Risk Score With Seizure Probability in Hospitalized Patients. <em>JAMA Neurology</em>, 74(12), 1419–1424. <a href="https://doi.org/10.1001/jamaneurol.2017.2459" target="_blank">doi:10.1001/jamaneurol.2017.2459</a>. PMID: 29052706.</p>
            </div>
        `;
    },
    initialize: function () {
        document.getElementById('calculate-2helps2b').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll(
                '#calculator-container .check-item input[type="checkbox"]'
            );
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            const riskMap = {
                0: '<5%',
                1: '12%',
                2: '27%',
                3: '50%',
                4: '73%',
                5: '88%'
            };

            const seizureRisk = score >= 6 ? '>95%' : riskMap[score];

            document.getElementById('2helps2b-result').innerHTML = `
                <p>2HELPS2B Score: ${score}</p>
                <p>Risk of Seizure: ${seizureRisk}</p>
            `;
            document.getElementById('2helps2b-result').style.display = 'block';
        });

        // Image Modal Logic
        const modal = document.getElementById('image-modal');
        const imgThumb = document.getElementById('ref-image-thumb');
        const modalImg = document.getElementById('modal-image');
        const closeBtn = document.querySelector('.close-btn');

        imgThumb.onclick = function () {
            modal.style.display = 'block';
            modalImg.src = this.src;
        };

        closeBtn.onclick = function () {
            modal.style.display = 'none';
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
};
