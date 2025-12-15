import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const benzoConversion = {
    id: 'benzo-conversion',
    title: 'Benzodiazepine Conversion Calculator',
    description:
        'Provides equivalents between different benzodiazepines based on a conversion factor table.',

    generateHTML: () => {
        const drugs = [
            { value: 'alprazolam', label: 'Alprazolam (Xanax)' },
            { value: 'chlordiazepoxide', label: 'Chlordiazepoxide (Librium)' },
            { value: 'diazepam', label: 'Diazepam (Valium)' },
            { value: 'clonazepam', label: 'Clonazepam (Klonopin)' },
            { value: 'lorazepam', label: 'Lorazepam (Ativan)' },
            { value: 'oxazepam', label: 'Oxazepam (Serax)' },
            { value: 'temazepam', label: 'Temazepam (Restoril)' },
            { value: 'triazolam', label: 'Triazolam (Halcion)' }
        ];

        return `
            <div class="calculator-header">
                <h3>Benzodiazepine Conversion Calculator</h3>
                <p class="description">Provides equivalents between different benzodiazepines based on a conversion factor table.</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>IMPORTANT:</strong> This calculator should be used as a reference for oral benzodiazepine conversions. Equipotent benzodiazepine doses are reported as ranges due to paucity of literature supporting exact conversions.'
        })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>INSTRUCTIONS:</strong> Do not use to calculate initial dose for a benzo-naïve patient.'
        })}

            ${uiBuilder.createSection({
            title: 'Conversion Parameters',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'benzo-from',
                label: 'Converting from:',
                options: drugs.map(d => ({ ...d, checked: d.value === 'alprazolam' }))
            })}
                    
                    ${uiBuilder.createInput({
                id: 'benzo-dosage',
                label: 'Total daily drug dosage',
                unit: 'mg',
                type: 'number',
                defaultValue: '10'
            })}
                    
                    ${uiBuilder.createRadioGroup({
                name: 'benzo-to',
                label: 'Converting to:',
                options: drugs.map(d => ({ ...d, checked: d.value === 'diazepam' }))
            })}
                `
        })}
            
            <div id="benzo-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'benzo-result', title: 'Conversion Result' })}
        `;
    },

    initialize: (client, patient, container) => {
        uiBuilder.initializeComponents(container);

        const drugs = {
            alprazolam: 'Alprazolam (Xanax)',
            chlordiazepoxide: 'Chlordiazepoxide (Librium)',
            diazepam: 'Diazepam (Valium)',
            clonazepam: 'Clonazepam (Klonopin)',
            lorazepam: 'Lorazepam (Ativan)',
            oxazepam: 'Oxazepam (Serax)',
            temazepam: 'Temazepam (Restoril)',
            triazolam: 'Triazolam (Halcion)'
        };

        const conversionTable = {
            alprazolam: {
                chlordiazepoxide: { factor: 25, range: [15, 50] },
                diazepam: { factor: 10, range: [5, 20] },
                clonazepam: { factor: 0.5, range: [0.5, 4] },
                lorazepam: { factor: 0.5, range: [1, 4] },
                oxazepam: { factor: 20, range: [5, 40] },
                temazepam: { factor: 20, range: [5, 40] },
                triazolam: { factor: 0.5, range: [1, 4] }
            },
            chlordiazepoxide: {
                alprazolam: { factor: 1 / 25, range: [15, 50] },
                diazepam: { factor: 1 / 3, range: [1.25, 5] },
                clonazepam: { factor: 1 / 20, range: [6.25, 50] },
                lorazepam: { factor: 1 / 10, range: [6.25, 25] },
                oxazepam: { factor: 0.5, range: [0.2, 1.6] },
                temazepam: { factor: 0.5, range: [0.2, 1.6] },
                triazolam: { factor: 1 / 75, range: [25, 100] }
            },
            diazepam: {
                alprazolam: { factor: 1 / 10, range: [5, 20] },
                chlordiazepoxide: { factor: 3, range: [1.25, 5] },
                clonazepam: { factor: 1 / 10, range: [2.5, 20] },
                lorazepam: { factor: 1 / 6, range: [2.5, 10] },
                oxazepam: { factor: 0.5, range: [0.5, 4] },
                temazepam: { factor: 0.5, range: [0.5, 4] },
                triazolam: { factor: 1 / 20, range: [10, 40] }
            },
            clonazepam: {
                alprazolam: { factor: 2, range: [0.5, 4] },
                chlordiazepoxide: { factor: 20, range: [6.25, 50] },
                diazepam: { factor: 10, range: [2.5, 20] },
                lorazepam: { factor: 2, range: [0.5, 4] },
                oxazepam: { factor: 20, range: [2.5, 40] },
                temazepam: { factor: 20, range: [2.5, 40] },
                triazolam: { factor: 1 / 4, range: [1, 8] }
            },
            lorazepam: {
                alprazolam: { factor: 2, range: [1, 4] },
                chlordiazepoxide: { factor: 10, range: [6.25, 25] },
                diazepam: { factor: 6, range: [2.5, 10] },
                clonazepam: { factor: 2, range: [0.5, 4] },
                oxazepam: { factor: 10, range: [2.5, 20] },
                temazepam: { factor: 10, range: [2.5, 20] },
                triazolam: { factor: 1 / 4, range: [2, 8] }
            },
            oxazepam: {
                alprazolam: { factor: 1 / 20, range: [5, 40] },
                chlordiazepoxide: { factor: 2, range: [0.2, 1.6] },
                diazepam: { factor: 2, range: [0.5, 4] },
                clonazepam: { factor: 1 / 20, range: [2.5, 40] },
                lorazepam: { factor: 1 / 10, range: [2.5, 20] },
                temazepam: { factor: 1, range: [0.25, 4] },
                triazolam: { factor: 1 / 40, range: [10, 80] }
            },
            temazepam: {
                alprazolam: { factor: 1 / 20, range: [5, 40] },
                chlordiazepoxide: { factor: 2, range: [0.2, 1.6] },
                diazepam: { factor: 2, range: [0.5, 4] },
                clonazepam: { factor: 1 / 20, range: [2.5, 40] },
                lorazepam: { factor: 1 / 10, range: [2.5, 20] },
                oxazepam: { factor: 1, range: [0.25, 4] },
                triazolam: { factor: 1 / 40, range: [10, 80] }
            },
            triazolam: {
                alprazolam: { factor: 2, range: [1, 4] },
                chlordiazepoxide: { factor: 75, range: [25, 100] },
                diazepam: { factor: 20, range: [10, 40] },
                clonazepam: { factor: 4, range: [1, 8] },
                lorazepam: { factor: 4, range: [2, 8] },
                oxazepam: { factor: 40, range: [10, 80] },
                temazepam: { factor: 40, range: [10, 80] }
            }
        };

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#benzo-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            try {
                const fromDrugKey = container.querySelector('input[name="benzo-from"]:checked').value;
                const toDrugKey = container.querySelector('input[name="benzo-to"]:checked').value;
                const dosageInput = container.querySelector('#benzo-dosage');
                const dosage = parseFloat(dosageInput.value) || 0;

                const resultBox = container.querySelector('#benzo-result');
                const resultContent = resultBox.querySelector('.ui-result-content');
                const fromDrugName = drugs[fromDrugKey].split(' ')[0];
                const toDrugName = drugs[toDrugKey].split(' ')[0];

                if (dosageInput.value) {
                    const validation = validateCalculatorInput({ dosage }, {
                        dosage: {
                            required: true,
                            min: 0,
                            max: 1000,
                            message: "Dosage must be a positive number less than 1000mg."
                        }
                    });

                    if (!validation.isValid) {
                        displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        resultBox.classList.remove('show');
                        return;
                    }
                }

                if (fromDrugKey === toDrugKey) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({ label: 'Equivalent Dose', value: `${dosage.toFixed(1)} mg`, unit: '', interpretation: 'Same drug selected' })}
                    `;
                    resultBox.classList.add('show');
                    return;
                }

                const conversion = conversionTable[fromDrugKey]?.[toDrugKey];

                if (!conversion || dosage === 0) {
                    if (dosage === 0 && Number(container.querySelector('#benzo-dosage').value) === 0) {
                        // Valid 0 input
                    } else {
                        // Wait or invalid
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                const equivalentDose = dosage * conversion.factor;
                const lowerRange = dosage * conversion.range[0];
                const upperRange = dosage * conversion.range[1];

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: `Equivalent ${toDrugName} Dose`,
                    value: equivalentDose.toFixed(1),
                    unit: 'mg'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Estimated Range',
                    value: `${lowerRange.toFixed(1)} - ${upperRange.toFixed(1)}`,
                    unit: 'mg'
                })}
                    ${uiBuilder.createAlert({
                    type: 'info',
                    message: `${toDrugName} dose equivalent to ${dosage} mg ${fromDrugName}`
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'benzo-conversion', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        calculate();
    }
};
