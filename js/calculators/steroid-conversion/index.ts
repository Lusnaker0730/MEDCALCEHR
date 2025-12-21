import { uiBuilder } from '../../ui-builder.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const steroidConversion: CalculatorModule = {
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

        // Generate conversion table data
        const headers = ['Reference Dose', ...steroids.map(s => s.name)];

        const rows = steroids.map(steroid => {
            const firstCell = `${steroid.name} ${steroid.dose} mg`;
            const conversions = steroids.map(targetSteroid =>
                (steroid.dose / targetSteroid.dose).toFixed(2)
            );
            return [firstCell, ...conversions];
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
                ${uiBuilder.createTable({
                headers,
                rows,
                stickyFirstColumn: true
            })}
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

        const fromDoseEl = container.querySelector('#steroid-from-dose') as HTMLInputElement;
        const fromTypeEl = container.querySelector('#steroid-from-type') as HTMLSelectElement;
        const toDoseEl = container.querySelector('#steroid-to-dose') as HTMLInputElement;
        const toTypeEl = container.querySelector('#steroid-to-type') as HTMLSelectElement;

        // Make result readonly
        if (toDoseEl) toDoseEl.readOnly = true;

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
                if (toDoseEl) toDoseEl.value = '';
                return;
            }

            const toDose = (fromDose / fromEquivalent) * toEquivalent;
            if (toDoseEl) toDoseEl.value = toDose.toFixed(2);
        };

        if (fromDoseEl) fromDoseEl.addEventListener('input', calculateConversion);
        if (fromTypeEl) fromTypeEl.addEventListener('change', calculateConversion);
        if (toTypeEl) toTypeEl.addEventListener('change', calculateConversion);

        calculateConversion();
    }
};
