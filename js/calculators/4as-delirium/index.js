// This calculator does not require any utils at the moment, but the path would be '../../utils.js'

export const fourAsDelirium = {
    id: '4as-delirium',
    title: '4 A\'s Test for Delirium Screening',
    description: 'Diagnoses delirium in older patients.',

    generateHTML: function () {
        return `
        <div class="calculator-header">
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
        </div>
        <div class="calculator-image-container">
            <img id="ref-image-thumb" src="js/calculators/4as-delirium/article_river_7d53d1600bfa11f098351dbcb3e30ef3-4AT-Poster-2.png" alt="4AT Reference Poster" style="max-width: 1000px; width: 100%; border-radius: 8px; cursor: pointer;" />
        </div>
        
        <!-- Modal for the image -->
        <div id="image-modal" class="modal">
            <span class="close-btn">&times;</span>
            <img class="modal-content" id="modal-image">
        </div>

        <div class="section">
            <div class="section-title">
                <h4>Alertness</h4>
                <small>May ask patient to state name and address to help with rating</small>
            </div>
            <div class="radio-group" data-name="alertness">
                <label class="radio-option">
                    <input type="radio" name="alertness" value="0" checked>
                    <span class="radio-label">Normal <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="alertness" value="0">
                    <span class="radio-label">Mild sleepiness for <10 seconds after waking, then normal <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="alertness" value="4">
                    <span class="radio-label">Clearly abnormal <strong>+4</strong></span>
                </label>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <h4>AMT 4</h4>
                <small>Age, date of birth, place (name of the hospital or building), current year</small>
            </div>
            <div class="radio-group" data-name="amt4">
                <label class="radio-option">
                    <input type="radio" name="amt4" value="0" checked>
                    <span class="radio-label">No mistakes <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="amt4" value="1">
                    <span class="radio-label">1 mistake <strong>+1</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="amt4" value="2">
                    <span class="radio-label">≥2 mistakes or untestable <strong>+2</strong></span>
                </label>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <h4>Attention</h4>
                <small>Instruct patient to list months in reverse order, starting at December</small>
            </div>
            <div class="radio-group" data-name="attention">
                <label class="radio-option">
                    <input type="radio" name="attention" value="0" checked>
                    <span class="radio-label">Lists ≥7 months correctly <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="attention" value="1">
                    <span class="radio-label">Starts but lists <7 months, or refuses to start <strong>+1</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="attention" value="2">
                    <span class="radio-label">Untestable (cannot start because unwell, drowsy, inattentive) <strong>+2</strong></span>
                </label>
            </div>
        </div>

        <div class="section">
            <div class="section-title">
                <h4>Acute change or fluctuating course</h4>
                <small>Evidence of significant change or fluctuation in mental status within the last 2 weeks and still persisting in the last 24 hours</small>
            </div>
            <div class="radio-group" data-name="acute_change">
                <label class="radio-option">
                    <input type="radio" name="acute_change" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="acute_change" value="4">
                    <span class="radio-label">Yes <strong>+4</strong></span>
                </label>
            </div>
        </div>

        <div class="result-container">
            <div class="result-header">4AT Score</div>
            <div class="result-score" id="four-as-score">0</div>
            <div class="result-item">
                <span class="label">Interpretation</span>
                <span class="value" id="four-as-interpretation">Delirium or severe cognitive impairment unlikely</span>
            </div>
        </div>
        
        <div class="info-section">
            <h4>📚 Reference</h4>
            <p>Bellelli, G., et al. (2014). Validation of the 4AT, a new instrument for rapid delirium screening: a study in 234 hospitalised older people. <em>Age and Ageing</em>, 43(4), 496–502. <a href="https://doi.org/10.1093/ageing/afu021" target="_blank">doi:10.1093/ageing/afu021</a>.</p>
        </div>
    `;
    },

    initialize: (client, patient, container) => {
        const root = container || document;
        
        const calculate = () => {
            const alertnessScore = parseInt(
                root.querySelector('input[name="alertness"]:checked')?.value || '0'
            );
            const amt4Score = parseInt(
                root.querySelector('input[name="amt4"]:checked')?.value || '0'
            );
            const attentionScore = parseInt(
                root.querySelector('input[name="attention"]:checked')?.value || '0'
            );
            const acuteChangeScore = parseInt(
                root.querySelector('input[name="acute_change"]:checked')?.value || '0'
            );

            const totalScore = alertnessScore + amt4Score + attentionScore + acuteChangeScore;

            const scoreEl = root.querySelector('#four-as-score');
            const interpretationEl = root.querySelector('#four-as-interpretation');
            const resultContainer = root.querySelector('.result-container');

            // Show result container
            if (resultContainer) {
                resultContainer.classList.add('show');
            }

            if (scoreEl) {
                scoreEl.textContent = totalScore;
            }

            if (interpretationEl) {
                if (totalScore >= 4) {
                    interpretationEl.textContent =
                        'Likely delirium. Formal assessment for delirium is recommended.';
                } else if (totalScore >= 1 && totalScore <= 3) {
                    interpretationEl.textContent =
                        'Possible cognitive impairment. Further investigation is required.';
                } else {
                    interpretationEl.textContent =
                        'Delirium or severe cognitive impairment unlikely. Note that delirium is still possible if "acute change or fluctuating course" is questionable.';
                }
            }
        };

        // Add event listeners for all radio buttons
        root.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Add visual feedback
                const parent = radio.closest('.radio-option');
                const siblings = parent.parentElement.querySelectorAll('.radio-option');
                siblings.forEach(s => s.classList.remove('selected'));
                parent.classList.add('selected');
                
                calculate();
            });
        });

        // Set initial selected state for checked radio buttons
        root.querySelectorAll('.radio-option input[type="radio"]:checked').forEach(radio => {
            radio.closest('.radio-option').classList.add('selected');
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
