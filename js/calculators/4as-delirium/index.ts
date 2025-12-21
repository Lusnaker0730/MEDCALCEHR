import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const fourAsDelirium: CalculatorModule = {
    id: '4as-delirium',
    title: "4 A's Test for Delirium Screening",
    description: 'Diagnoses delirium in older patients.',

    generateHTML: function () {
        const alertnessSection = uiBuilder.createSection({
            title: '1. Alertness',
            subtitle: 'May ask patient to state name and address to help with rating',
            content: uiBuilder.createRadioGroup({
                name: 'alertness',
                options: [
                    { value: '0', label: 'Normal (0)', checked: true },
                    { value: '0', label: 'Mild sleepiness for <10 seconds after waking, then normal (0)' },
                    { value: '4', label: 'Clearly abnormal (+4)' }
                ]
            })
        });

        const amt4Section = uiBuilder.createSection({
            title: '2. AMT 4',
            subtitle: 'Age, date of birth, place (name of the hospital or building), current year',
            content: uiBuilder.createRadioGroup({
                name: 'amt4',
                options: [
                    { value: '0', label: 'No mistakes (0)', checked: true },
                    { value: '1', label: '1 mistake (+1)' },
                    { value: '2', label: '≥2 mistakes or untestable (+2)' }
                ]
            })
        });

        const attentionSection = uiBuilder.createSection({
            title: '3. Attention',
            subtitle: 'Instruct patient to list months in reverse order, starting at December',
            content: uiBuilder.createRadioGroup({
                name: 'attention',
                options: [
                    { value: '0', label: 'Lists ≥7 months correctly (0)', checked: true },
                    { value: '1', label: 'Starts but lists <7 months, or refuses to start (+1)' },
                    { value: '2', label: 'Untestable (cannot start because unwell, drowsy, inattentive) (+2)' }
                ]
            })
        });

        const acuteChangeSection = uiBuilder.createSection({
            title: '4. Acute change or fluctuating course',
            subtitle: 'Evidence of significant change or fluctuation in mental status within the last 2 weeks and still persisting in the last 24 hours',
            content: uiBuilder.createRadioGroup({
                name: 'acute_change',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '4', label: 'Yes (+4)' }
                ]
            })
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="calculator-image-container" style="margin-bottom: 20px; text-align: center;">
                <img id="ref-image-thumb" src="js/calculators/4as-delirium/article_river_7d53d1600bfa11f098351dbcb3e30ef3-4AT-Poster-2.png" alt="4AT Reference Poster" style="max-width: 100%; max-height: 600px; width: auto; border-radius: 8px; cursor: pointer; border: 1px solid #eee;" />
                <div style="font-size: 0.8em; color: #666; margin-top: 5px;">(Click to enlarge reference poster)</div>
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.9);">
                <span class="close-btn" style="position: absolute; top: 15px; right: 35px; color: #f1f1f1; font-size: 40px; font-weight: bold; cursor: pointer;">&times;</span>
                <img class="modal-content" id="modal-image" style="margin: auto; display: block; width: 95%; max-width: 1400px; margin-top: 50px;">
            </div>

            ${alertnessSection}
            ${amt4Section}
            ${attentionSection}
            ${acuteChangeSection}
            
            <div id="four-as-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'four-as-result', title: '4AT Score Result' })}
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Bellelli, G., et al. (2014). Validation of the 4AT, a new instrument for rapid delirium screening: a study in 234 hospitalised older people. <em>Age and Ageing</em>, 43(4), 496–502.</p>
            </div>
        `;
    },

    initialize: (client: any, patient: any, container: HTMLElement) => {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#four-as-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const alertnessScore = parseInt(
                    (container.querySelector('input[name="alertness"]:checked') as HTMLInputElement)?.value || '0'
                );
                const amt4Score = parseInt(
                    (container.querySelector('input[name="amt4"]:checked') as HTMLInputElement)?.value || '0'
                );
                const attentionScore = parseInt(
                    (container.querySelector('input[name="attention"]:checked') as HTMLInputElement)?.value || '0'
                );
                const acuteChangeScore = parseInt(
                    (container.querySelector('input[name="acute_change"]:checked') as HTMLInputElement)?.value || '0'
                );

                const totalScore = alertnessScore + amt4Score + attentionScore + acuteChangeScore;

                let interpretation = '';
                let alertClass = '';

                if (totalScore >= 4) {
                    interpretation = 'Likely delirium. Formal assessment for delirium is recommended.';
                    alertClass = 'ui-alert-danger';
                } else if (totalScore >= 1 && totalScore <= 3) {
                    interpretation = 'Possible cognitive impairment. Further investigation is required.';
                    alertClass = 'ui-alert-warning';
                } else {
                    interpretation = 'Delirium or severe cognitive impairment unlikely. Note that delirium is still possible if "acute change or fluctuating course" is questionable.';
                    alertClass = 'ui-alert-success';
                }

                const resultBox = container.querySelector('#four-as-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: totalScore.toString(),
                            unit: 'points',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#four-as-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: '4as-delirium', action: 'calculate' });
            }
        };

        // Add event listeners for all radio buttons
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Image Modal Logic
        const modal = container.querySelector('#image-modal') as HTMLElement;
        const imgThumb = container.querySelector('#ref-image-thumb') as HTMLImageElement;
        const modalImg = container.querySelector('#modal-image') as HTMLImageElement;
        const closeBtn = container.querySelector('.close-btn') as HTMLElement;

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
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Initial calculation
        calculate();
    }
};
