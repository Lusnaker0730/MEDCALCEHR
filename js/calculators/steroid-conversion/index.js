import { uiBuilder } from '../../ui-builder.js';

export const steroidConversion = {
    id: 'steroid-conversion',
    title: 'Steroid Conversion Calculator',
    description: 'Converts steroid dosages using dosing equivalencies.',
    generateHTML: function () {
        const steroids = [
            { name: 'Cortisone', dose: 25, value: '25' },
            { name: 'Dexamethasone', dose: 0.75, value: '0.75' },
            { name: 'Hydrocortisone', dose: 20, value: '20' },
            { name: 'Methylprednisolone', dose: 4, value: '4' },
            { name: 'Prednisolone', dose: 5, value: '5' },
            { name: 'Prednisone', dose: 5, value: '5' },
            { name: 'Triamcinolone', dose: 4, value: '4' }
        ];

        const steroidOptions = steroids.map(s => ({ label: s.name, value: s.value }));

        // Generate conversion table
        let tableRows = '';
        steroids.forEach(steroid => {
            let conversions = '';
            steroids.forEach(targetSteroid => {
                const equivalentDose = (steroid.dose / targetSteroid.dose).toFixed(2);
                conversions += `<td>${equivalentDose}</td>`;
            });
            tableRows += `
                <tr>
                    <td class="steroid-name">${steroid.name} ${steroid.dose} mg</td>
                    ${conversions}
                </tr>
            `;
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Conversion',
                content: `
                    <div class="conversion-row" style="display: flex; gap: 1rem; align-items: flex-end;">
                        <div style="flex: 1;">
                            ${uiBuilder.createInput({
                                id: 'steroid-from-dose',
                                label: 'Dose',
                                type: 'number',
                                placeholder: 'Enter dose',
                                min: 0
                            })}
                        </div>
                        <div style="flex: 1;">
                            ${uiBuilder.createSelect({
                                id: 'steroid-from-type',
                                label: 'Steroid',
                                options: steroidOptions
                            })}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 1rem 0; font-weight: bold;">IS EQUIVALENT TO</div>
                     <div class="conversion-row" style="display: flex; gap: 1rem; align-items: flex-end;">
                        <div style="flex: 1;">
                            ${uiBuilder.createInput({
                                id: 'steroid-to-dose',
                                label: 'Equivalent Dose',
                                type: 'text', // Readonly usually
                                placeholder: 'Result',
                                min: 0
                            })}
                        </div>
                        <div style="flex: 1;">
                            ${uiBuilder.createSelect({
                                id: 'steroid-to-type',
                                label: 'Steroid',
                                options: steroidOptions
                            })}
                        </div>
                    </div>
                `
            })}
            
            ${uiBuilder.createSection({
                title: 'Steroid Equivalence Table',
                content: `
                    <div class="ui-data-table" style="overflow-x: auto;">
                        <table class="steroid-equivalence-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th class="sticky-col">Reference Dose</th>
                                    ${steroids.map(s => `<th>${s.name}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                    <p class="table-note" style="font-size: 0.9em; color: #666; margin-top: 10px;">
                        <strong>Note:</strong> These are approximate glucocorticoid potency equivalents. Individual patient response may vary.
                    </p>
                `
            })}

             ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Relative Potency Information</h4>
                    <ul>
                        <li><strong>Highest Potency:</strong> Dexamethasone (0.75 mg)</li>
                        <li><strong>Medium Potency:</strong> Methylprednisolone (4 mg), Triamcinolone (4 mg)</li>
                        <li><strong>Standard Potency:</strong> Prednisolone (5 mg), Prednisone (5 mg)</li>
                        <li><strong>Lower Potency:</strong> Hydrocortisone (20 mg), Cortisone (25 mg)</li>
                    </ul>
                    <h4>Clinical Pearls</h4>
                    <ul>
                         <li><strong>Hydrocortisone</strong> has significant mineralocorticoid activity - good for adrenal insufficiency</li>
                         <li><strong>Prednisone</strong> requires hepatic conversion to prednisolone (active form)</li>
                         <li><strong>Dexamethasone</strong> longest half-life (36-54 hrs) - useful once daily dosing</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const fromDoseEl = container.querySelector('#steroid-from-dose');
        const fromTypeEl = container.querySelector('#steroid-from-type');
        const toDoseEl = container.querySelector('#steroid-to-dose');
        const toTypeEl = container.querySelector('#steroid-to-type');
        
        // Make result readonly
        toDoseEl.readOnly = true;

        const calculateConversion = () => {
            const fromDose = parseFloat(fromDoseEl.value);
            const fromEquivalent = parseFloat(fromTypeEl.value);
            const toEquivalent = parseFloat(toTypeEl.value);

            if (
                isNaN(fromDose) ||
                isNaN(fromEquivalent) ||
                isNaN(toEquivalent) ||
                fromEquivalent === 0
            ) {
                toDoseEl.value = '';
                return;
            }

            const toDose = (fromDose / fromEquivalent) * toEquivalent;
            toDoseEl.value = toDose.toFixed(2);
        };

        fromDoseEl.addEventListener('input', calculateConversion);
        fromTypeEl.addEventListener('change', calculateConversion);
        toTypeEl.addEventListener('change', calculateConversion);

        calculateConversion();
    }
};
