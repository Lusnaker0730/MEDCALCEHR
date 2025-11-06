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
            
            <div class="alert info">
                <strong>📋 EEG Risk Factors</strong>
                <p>Select all that apply from the continuous EEG (cEEG) findings:</p>
            </div>
            
            <div class="section">
                <div class="section-title">EEG Findings</div>
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="1">
                        <span class="checkbox-label">Frequency > 2Hz <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="1">
                        <span class="checkbox-label">Sporadic epileptiform discharges <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="1">
                        <span class="checkbox-label">LPD/BIPD/LRDA <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="1">
                        <span class="checkbox-label">Plus features <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="1">
                        <span class="checkbox-label">Prior seizure <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" data-points="2">
                        <span class="checkbox-label">Brief ictal rhythmic discharges (BIRDs) <strong>+2</strong></span>
                    </label>
                </div>
            </div>

            <div class="result-container">
                <div class="result-header">2HELPS2B Score Results</div>
                <div class="result-score">
                    <span id="helps2b-score" style="font-size: 4rem; font-weight: bold; color: #667eea;">0</span>
                    <span style="font-size: 1.2rem; color: #718096; margin-left: 10px;">points</span>
                </div>
                <div class="result-item">
                    <span class="label">Risk of Seizure</span>
                    <span class="value" id="helps2b-risk">< 5%</span>
                </div>
                <div class="result-item">
                    <span class="label">Risk Category</span>
                    <span class="value risk-badge" id="helps2b-category">Very Low</span>
                </div>
            </div>

            <div class="chart-container">
                <img id="ref-image-thumb" src="js/calculators/2helps2b/jarkvkkq-1289547-1-img.png" alt="2HELPS2B Score Reference" class="reference-image" style="cursor: pointer;" />
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal">
                <span class="close-btn">&times;</span>
                <img class="modal-content" id="modal-image">
            </div>

            <div class="info-section">
                <h4>📚 Reference</h4>
                <p>Struck, A. F., et al. (2017). Association of an Electroencephalography-Based Risk Score With Seizure Probability in Hospitalized Patients. <em>JAMA Neurology</em>, 74(12), 1419–1424. <a href="https://doi.org/10.1001/jamaneurol.2017.2459" target="_blank">doi:10.1001/jamaneurol.2017.2459</a>. PMID: 29052706.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const root = container || document;

        const calculate = () => {
            const checkboxes = root.querySelectorAll('.checkbox-option input[type="checkbox"]');
            let score = 0;

            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            // Risk mapping
            const riskData = {
                0: { risk: '< 5%', category: 'Very Low', level: 'low' },
                1: { risk: '12%', category: 'Low', level: 'low' },
                2: { risk: '27%', category: 'Moderate', level: 'moderate' },
                3: { risk: '50%', category: 'Moderate-High', level: 'moderate' },
                4: { risk: '73%', category: 'High', level: 'high' },
                5: { risk: '88%', category: 'Very High', level: 'high' }
            };

            const result =
                score >= 6
                    ? { risk: '> 95%', category: 'Extremely High', level: 'critical' }
                    : riskData[score];

            // Update result display
            const resultContainer = root.querySelector('.result-container');
            const scoreEl = root.querySelector('#helps2b-score');
            const riskEl = root.querySelector('#helps2b-risk');
            const categoryEl = root.querySelector('#helps2b-category');

            if (resultContainer) {
                resultContainer.classList.add('show');
            }

            if (scoreEl) scoreEl.textContent = score;
            if (riskEl) riskEl.textContent = result.risk;

            if (categoryEl) {
                categoryEl.textContent = result.category;
                // Remove all risk level classes
                categoryEl.classList.remove(
                    'risk-low',
                    'risk-moderate',
                    'risk-high',
                    'risk-critical'
                );
                // Add appropriate risk level class
                categoryEl.classList.add(`risk-${result.level}`);
            }
        };

        // Add event listeners for all checkboxes
        root.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Add visual feedback
                const parent = checkbox.closest('.checkbox-option');
                if (checkbox.checked) {
                    parent.classList.add('selected');
                } else {
                    parent.classList.remove('selected');
                }

                calculate();
            });
        });

        // Image Modal Logic
        const modal = root.querySelector('#image-modal');
        const imgThumb = root.querySelector('#ref-image-thumb');
        const modalImg = root.querySelector('#modal-image');
        const closeBtn = root.querySelector('.close-btn');

        if (imgThumb && modal && modalImg) {
            imgThumb.onclick = function () {
                modal.style.display = 'block';
                modalImg.src = this.src;
            };
        }

        if (closeBtn && modal) {
            closeBtn.onclick = function () {
                modal.style.display = 'none';
            };
        }

        if (modal) {
            window.onclick = function (event) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }

        // Initial calculation
        calculate();
    }
};
