import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const map = {
    id: 'map',
    title: 'Mean Arterial Pressure (MAP)',
    description: 'Calculates the average arterial pressure during one cardiac cycle, important for organ perfusion assessment.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Blood Pressure Measurements',
            content: [
                uiBuilder.createInput({
                    id: 'map-sbp',
                    label: 'Systolic BP',
                    type: 'number',
                    placeholder: 'e.g., 120',
                    unit: 'mmHg'
                }),
                uiBuilder.createInput({
                    id: 'map-dbp',
                    label: 'Diastolic BP',
                    type: 'number',
                    placeholder: 'e.g., 80',
                    unit: 'mmHg'
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'Formula', formula: 'MAP = DBP + (1/3 × (SBP - DBP))' },
                { label: 'Or equivalently', formula: 'MAP = (SBP + 2 × DBP) / 3' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${inputs}
            
            ${uiBuilder.createResultBox({ id: 'map-result', title: 'MAP Results' })}
            
            ${formulaSection}
            
            <div class="alert info mt-20">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Clinical Note:</strong> MAP > 65 mmHg is generally required to maintain adequate organ perfusion.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const sbpInput = container.querySelector('#map-sbp');
        const dbpInput = container.querySelector('#map-dbp');

        const calculateAndUpdate = () => {
            const sbp = parseFloat(sbpInput.value);
            const dbp = parseFloat(dbpInput.value);

            const resultBox = container.querySelector('#map-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            if (!sbp || !dbp || isNaN(sbp) || isNaN(dbp) || sbp < 0 || dbp < 0) {
                resultBox.classList.remove('show');
                return;
            }

            if (sbp < dbp) {
                resultContent.innerHTML = uiBuilder.createAlert({
                    type: 'danger',
                    message: 'Error: Systolic BP must be greater than or equal to Diastolic BP'
                });
                resultBox.classList.add('show');
                return;
            }

            const mapCalc = dbp + (sbp - dbp) / 3;

            let severity = '';
            let interpretation = '';
            let alertClass = '';

            if (mapCalc < 60) {
                severity = 'Critically Low (Shock Risk)';
                interpretation = 'MAP <60 mmHg indicates severe hypotension and risk of organ hypoperfusion.';
                alertClass = 'ui-alert-danger';
            } else if (mapCalc < 70) {
                severity = 'Below Normal';
                interpretation = 'Borderline low MAP. Monitor closely.';
                alertClass = 'ui-alert-warning';
            } else if (mapCalc <= 100) {
                severity = 'Normal';
                interpretation = 'Normal MAP (70-100 mmHg) indicates adequate organ perfusion.';
                alertClass = 'ui-alert-success';
            } else {
                severity = 'Elevated (Hypertension)';
                interpretation = 'Sustained MAP >100 mmHg requires management.';
                alertClass = 'ui-alert-danger';
            }

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Mean Arterial Pressure', 
                    value: mapCalc.toFixed(1), 
                    unit: 'mmHg',
                    interpretation: severity,
                    alertClass: alertClass
                })}
                
                <div class="ui-alert ${alertClass.replace('ui-alert-', '') === 'success' ? 'ui-alert-info' : alertClass} mt-10">
                    <span class="ui-alert-icon">${mapCalc < 60 ? '⚠️' : 'ℹ️'}</span>
                    <div class="ui-alert-content">${interpretation}</div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners for automatic calculation on input change
        sbpInput.addEventListener('input', calculateAndUpdate);
        dbpInput.addEventListener('input', calculateAndUpdate);

        // Auto-populate from FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BP_PANEL)
                .then(bpPanel => {
                    if (bpPanel && bpPanel.component) {
                        const sbpComp = bpPanel.component.find(
                            c => c.code.coding[0].code === '8480-6'
                        ); // Systolic
                        const dbpComp = bpPanel.component.find(
                            c => c.code.coding[0].code === '8462-4'
                        ); // Diastolic

                        if (sbpComp && sbpComp.valueQuantity) {
                            sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                            sbpInput.dispatchEvent(new Event('input'));
                        }

                        if (dbpComp && dbpComp.valueQuantity) {
                            dbpInput.value = dbpComp.valueQuantity.value.toFixed(0);
                            dbpInput.dispatchEvent(new Event('input'));
                        }
                    }
                })
                .catch(err => console.log('BP data not available'));
        }
    }
};