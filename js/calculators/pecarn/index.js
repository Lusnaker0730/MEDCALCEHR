import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const pecarn = {
    id: 'pecarn',
    title: 'PECARN Pediatric Head Injury/Trauma Algorithm',
    description: 'Predicts need for brain imaging after pediatric head injury.',
    generateHTML: function () {
        const criteriaUnder2 = [
            {
                id: 'pecarn-gcs-not-15',
                label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)',
                value: 'gcs'
            },
            { id: 'pecarn-palpable-fracture', label: 'Palpable skull fracture', value: 'fracture' },
            { id: 'pecarn-loc-5-sec', label: 'LOC ≥ 5 seconds', value: 'loc' },
            { id: 'pecarn-not-acting-normally', label: 'Guardian feels child is not acting normally', value: 'acting' },
            {
                id: 'pecarn-severe-mechanism',
                label: 'Severe mechanism of injury (e.g., fall >3ft, MVA, struck by high-impact object)',
                value: 'mechanism'
            },
            { id: 'pecarn-hematoma', label: 'Non-frontal scalp hematoma', value: 'hematoma' }
        ];
        const criteriaOver2 = [
            {
                id: 'pecarn-gcs-not-15-over2',
                label: 'Altered mental status (GCS < 15, irritable, lethargic, etc.)',
                value: 'gcs'
            },
            {
                id: 'pecarn-signs-basilar-fracture',
                label: 'Signs of basilar skull fracture (e.g., hemotympanum, raccoon eyes)',
                value: 'basilar'
            },
            { id: 'pecarn-loc', label: 'Any loss of consciousness', value: 'loc' },
            { id: 'pecarn-vomiting', label: 'Vomiting', value: 'vomiting' },
            { id: 'pecarn-severe-headache', label: 'Severe headache', value: 'headache' },
            { id: 'pecarn-severe-mechanism-over2', label: 'Severe mechanism of injury', value: 'mechanism' }
        ];
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Patient Age',
            icon: '👶',
            content: uiBuilder.createRadioGroup({
                name: 'pecarn-age',
                options: [
                    { value: 'under2', label: '< 2 years', checked: true },
                    { value: 'over2', label: '≥ 2 years' }
                ]
            })
        })}

            <div id="pecarn-group-under2">
                ${uiBuilder.createSection({
            title: 'Criteria for Children < 2 Years',
            icon: '📋',
            content: uiBuilder.createCheckboxGroup({
                name: 'pecarn-criteria-under2',
                options: criteriaUnder2
            })
        })}
            </div>

            <div id="pecarn-group-over2" style="display:none;">
                ${uiBuilder.createSection({
            title: 'Criteria for Children ≥ 2 Years',
            icon: '📋',
            content: uiBuilder.createCheckboxGroup({
                name: 'pecarn-criteria-over2',
                options: criteriaOver2
            })
        })}
            </div>

            <div id="pecarn-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'pecarn-result', title: 'PECARN Assessment' })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Risk Interpretation</h4>
                    <div class="ui-data-table">
                        <table>
                            <thead>
                                <tr><th>Recommendation</th><th>Risk of ciTBI</th><th>Clinical Action</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><span class="ui-alert-danger">CT Recommended</span></td><td>13-16%</td><td>Obtain immediate CT imaging</td></tr>
                                <tr><td><span class="ui-alert-warning">Observation vs. CT</span></td><td>~4.4%</td><td>Shared decision-making based on clinical factors</td></tr>
                                <tr><td><span class="ui-alert-success">CT Not Recommended</span></td><td><0.05%</td><td>Observation without imaging</td></tr>
                            </tbody>
                        </table>
                    </div>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const groupUnder2 = container.querySelector('#pecarn-group-under2');
        const groupOver2 = container.querySelector('#pecarn-group-over2');
        const resultBox = container.querySelector('#pecarn-result');
        const setAgeGroup = (isUnder2) => {
            if (isUnder2) {
                if (groupUnder2)
                    groupUnder2.style.display = 'block';
                if (groupOver2)
                    groupOver2.style.display = 'none';
            }
            else {
                if (groupUnder2)
                    groupUnder2.style.display = 'none';
                if (groupOver2)
                    groupOver2.style.display = 'block';
            }
            calculate();
        };
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#pecarn-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                const under2Radio = container.querySelector('input[name="pecarn-age"][value="under2"]');
                const isUnder2 = under2Radio?.checked;
                let recommendation = '';
                let risk = '';
                let alertType = 'info';
                let detail = '';
                if (isUnder2) {
                    const criteria = Array.from(container.querySelectorAll('input[name="pecarn-criteria-under2"]:checked')).map(cb => cb.value);
                    const hasGCS = criteria.includes('gcs');
                    const hasFracture = criteria.includes('fracture');
                    if (hasGCS || hasFracture) {
                        recommendation = 'CT Recommended';
                        risk = '13-16% risk of ciTBI';
                        alertType = 'danger';
                    }
                    else if (criteria.length > 0) {
                        recommendation = 'Observation vs. CT';
                        risk = '4.4% risk of ciTBI';
                        alertType = 'warning';
                        detail = 'Clinical factors to consider: Physician experience, multiple findings, parental preference, age <3 months, worsening symptoms.';
                    }
                    else {
                        recommendation = 'CT Not Recommended';
                        risk = '<0.02% risk of ciTBI';
                        alertType = 'success';
                    }
                }
                else {
                    const criteria = Array.from(container.querySelectorAll('input[name="pecarn-criteria-over2"]:checked')).map(cb => cb.value);
                    const hasGCS = criteria.includes('gcs');
                    const hasBasilar = criteria.includes('basilar');
                    if (hasGCS || hasBasilar) {
                        recommendation = 'CT Recommended';
                        risk = '14% risk of ciTBI';
                        alertType = 'danger';
                    }
                    else if (criteria.length > 0) {
                        recommendation = 'Observation vs. CT';
                        risk = '4.3% risk of ciTBI';
                        alertType = 'warning';
                        detail = 'Clinical factors to consider: Physician experience, multiple findings, parental preference, worsening symptoms.';
                    }
                    else {
                        recommendation = 'CT Not Recommended';
                        risk = '<0.05% risk of ciTBI';
                        alertType = 'success';
                    }
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Recommendation',
                            value: recommendation,
                            interpretation: risk,
                            alertClass: `ui-alert-${alertType}`
                        })}
                        ${detail ? uiBuilder.createAlert({ type: 'info', message: detail }) : ''}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#pecarn-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'pecarn', action: 'calculate' });
            }
        };
        // Event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.name === 'pecarn-age') {
                    setAgeGroup(radio.value === 'under2');
                }
                calculate();
            });
        });
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', calculate);
        });
        // Auto-populate
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            const isUnder2 = age < 2;
            const radio = container.querySelector(`input[name="pecarn-age"][value="${isUnder2 ? 'under2' : 'over2'}"]`);
            if (radio) {
                radio.checked = true;
                setAgeGroup(isUnder2);
            }
        }
        calculate();
    }
};
