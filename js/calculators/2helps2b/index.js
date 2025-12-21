import { uiBuilder } from '../../ui-builder.js';
export const helps2bScore = {
    id: '2helps2b',
    title: '2HELPS2B Score',
    description: 'Estimates seizure risk in acutely ill patients undergoing continuous EEG (cEEG), based on the 2HELPS2B score and seizure probability table.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>📋 EEG Risk Factors</strong><br>Select all that apply from the continuous EEG (cEEG) findings:'
        })}
            
            ${uiBuilder.createSection({
            title: 'EEG Findings',
            icon: '🧠',
            content: `
                    ${uiBuilder.createCheckbox({ id: 'freq-gt-2hz', label: 'Frequency > 2Hz (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'sporadic-epileptiform', label: 'Sporadic epileptiform discharges (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'lpd-bipd-lrda', label: 'LPD / BIPD / LRDA (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'plus-features', label: 'Plus features (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'prior-seizure', label: 'Prior seizure (+1)', value: '1' })}
                    ${uiBuilder.createCheckbox({ id: 'birds', label: 'Brief ictal rhythmic discharges (BIRDs) (+2)', value: '2' })}
                `
        })}

            ${uiBuilder.createResultBox({ id: 'helps2b-result', title: '2HELPS2B Score Results' })}

            <div class="chart-container" style="margin-top: 20px; text-align: center;">
                <img id="ref-image-thumb" src="js/calculators/2helps2b/jarkvkkq-1289547-1-img.png" alt="2HELPS2B Score Reference" class="reference-image" style="cursor: pointer; max-width: 100%; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
                <p style="font-size: 0.8em; color: #666; margin-top: 5px;">Click to enlarge reference chart</p>
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.9);">
                <span class="close-btn" style="position: absolute; top: 15px; right: 35px; color: #f1f1f1; font-size: 40px; font-weight: bold; cursor: pointer;">&times;</span>
                <img class="modal-content" id="modal-image" style="margin: auto; display: block; width: 80%; max-width: 700px; margin-top: 60px;">
            </div>

            <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                <h4>📚 Reference</h4>
                <p>Struck, A. F., et al. (2017). Association of an Electroencephalography-Based Risk Score With Seizure Probability in Hospitalized Patients. <em>JAMA Neurology</em>, 74(12), 1419–1424.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const calculate = () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.value);
                }
            });
            // Risk mapping
            const riskData = {
                0: { risk: '< 5%', category: 'Very Low', alertType: 'success' },
                1: { risk: '12%', category: 'Low', alertType: 'success' },
                2: { risk: '27%', category: 'Moderate', alertType: 'warning' },
                3: { risk: '50%', category: 'Moderate-High', alertType: 'warning' },
                4: { risk: '73%', category: 'High', alertType: 'danger' },
                5: { risk: '88%', category: 'Very High', alertType: 'danger' }
            };
            const result = score >= 6
                ? { risk: '> 95%', category: 'Extremely High', alertType: 'danger' }
                : riskData[score];
            const resultBox = container.querySelector('#helps2b-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'Total Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: result.category,
                        alertClass: `ui-alert-${result.alertType}`
                    })}
                    ${uiBuilder.createResultItem({
                        label: 'Risk of Seizure',
                        value: result.risk,
                        alertClass: `ui-alert-${result.alertType}`
                    })}
                `;
                }
                resultBox.classList.add('show');
            }
        };
        container.querySelectorAll('input[type="checkbox"]').forEach(box => {
            box.addEventListener('change', calculate);
        });
        // Image Modal Logic (Custom)
        const modal = container.querySelector('#image-modal');
        const imgThumb = container.querySelector('#ref-image-thumb');
        const modalImg = container.querySelector('#modal-image');
        const closeBtn = container.querySelector('.close-btn');
        if (imgThumb && modal && modalImg) {
            imgThumb.onclick = function () {
                modal.style.display = 'block';
                modalImg.src = imgThumb.src;
            };
        }
        if (closeBtn && modal) {
            closeBtn.onclick = function () {
                modal.style.display = 'none';
            };
        }
        if (modal) {
            // Use addEventListener instead of onclick to avoid overwriting invalid global handler
            // But scoping it to window means it affects everything globally.
            // A better way is to attach the click listener to the modal background itself.
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        calculate();
    }
};
