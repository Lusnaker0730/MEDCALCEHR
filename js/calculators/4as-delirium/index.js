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

        <div class="form-container">
            <div class="ciwa-ar-category">
                <div class="ciwa-ar-left">
                    <h4>Alertness</h4>
                    <p>May ask patient to state name and address to help with rating</p>
                </div>
                <div class="ciwa-ar-right vertical-radio-group" data-name="alertness">
                    <button data-value="0" class="ciwa-ar-option active"><span>Normal</span><span class="ciwa-ar-score">0</span></button>
                    <button data-value="0" class="ciwa-ar-option"><span>Mild sleepiness for <10 seconds after waking, then normal</span><span class="ciwa-ar-score">0</span></button>
                    <button data-value="4" class="ciwa-ar-option"><span>Clearly abnormal</span><span class="ciwa-ar-score">+4</span></button>
                </div>
            </div>

            <div class="ciwa-ar-category">
                <div class="ciwa-ar-left">
                    <h4>AMT 4</h4>
                    <p>Age, date of birth, place (name of the hospital or building), current year</p>
                </div>
                <div class="ciwa-ar-right vertical-radio-group" data-name="amt4">
                    <button data-value="0" class="ciwa-ar-option active"><span>No mistakes</span><span class="ciwa-ar-score">0</span></button>
                    <button data-value="1" class="ciwa-ar-option"><span>1 mistake</span><span class="ciwa-ar-score">+1</span></button>
                    <button data-value="2" class="ciwa-ar-option"><span>≥2 mistakes or untestable</span><span class="ciwa-ar-score">+2</span></button>
                </div>
            </div>

            <div class="ciwa-ar-category">
                <div class="ciwa-ar-left">
                    <h4>Attention</h4>
                    <p>Instruct patient to list months in reverse order, starting at December</p>
                </div>
                <div class="ciwa-ar-right vertical-radio-group" data-name="attention">
                    <button data-value="0" class="ciwa-ar-option active"><span>Lists ≥7 months correctly</span><span class="ciwa-ar-score">0</span></button>
                    <button data-value="1" class="ciwa-ar-option"><span>Starts but lists <7 months, or refuses to start</span><span class="ciwa-ar-score">+1</span></button>
                    <button data-value="2" class="ciwa-ar-option"><span>Untestable (cannot start because unwell, drowsy, inattentive)</span><span class="ciwa-ar-score">+2</span></button>
                </div>
            </div>

            <div class="ciwa-ar-category">
                <div class="ciwa-ar-left">
                    <h4>Acute change or fluctuating course</h4>
                    <p>Evidence of significant change or fluctuation in mental status within the last 2 weeks and still persisting in the last 24 hours</p>
                </div>
                <div class="ciwa-ar-right segmented-control" data-name="acute_change">
                    <button data-value="0" class="active">No <strong>0</strong></button>
                    <button data-value="4">Yes <strong>+4</strong></button>
                </div>
            </div>
        </div>
        <div class="result-box four-as-result">
            <h3><span id="four-as-score">0</span> points</h3>
            <p id="four-as-interpretation">Delirium or severe cognitive impairment unlikely. Note that delirium is still possible if "acute change or fluctuating course" is questionable.</p>
        </div>
        <div class="citation">
            <h4>Source:</h4>
            <p>Bellelli, G., et al. (2014). Validation of the 4AT, a new instrument for rapid delirium screening: a study in 234 hospitalised older people. <em>Age and Ageing</em>, 43(4), 496–502. <a href="https://doi.org/10.1093/ageing/afu021" target="_blank">doi:10.1093/ageing/afu021</a>.</p>
        </div>
    `;
    },

    initialize: () => {
        const calculate = () => {
            const alertnessScore = parseInt(
                document.querySelector('.vertical-radio-group[data-name="alertness"] button.active')
                    ?.dataset.value || '0'
            );
            const amt4Score = parseInt(
                document.querySelector('.vertical-radio-group[data-name="amt4"] button.active')
                    ?.dataset.value || '0'
            );
            const attentionScore = parseInt(
                document.querySelector('.vertical-radio-group[data-name="attention"] button.active')
                    ?.dataset.value || '0'
            );
            const acuteChangeScore = parseInt(
                document.querySelector('.segmented-control[data-name="acute_change"] button.active')
                    ?.dataset.value || '0'
            );

            const totalScore = alertnessScore + amt4Score + attentionScore + acuteChangeScore;

            const scoreEl = document.getElementById('four-as-score');
            const interpretationEl = document.getElementById('four-as-interpretation');

            scoreEl.textContent = totalScore;

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
        };

        document.querySelectorAll('.vertical-radio-group, .segmented-control').forEach(group => {
            group.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button) {
                    return;
                }

                group.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                calculate();
            });
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

        calculate(); // Initial calculation
    }
};
