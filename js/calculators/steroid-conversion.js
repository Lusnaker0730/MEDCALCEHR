// js/calculators/steroid-conversion.js

export const steroidConversion = {
    id: 'steroid-conversion',
    title: 'Steroid Conversion Calculator',
    description: 'Converts steroid dosages using dosing equivalencies.',
    generateHTML: function() {
        const steroids = [
            { name: 'Cortisone', dose: 25 },
            { name: 'Dexamethasone', dose: 0.75 },
            { name: 'Hydrocortisone', dose: 20 },
            { name: 'Methylprednisolone', dose: 4 },
            { name: 'Prednisolone', dose: 5 },
            { name: 'Prednisone', dose: 5 },
            { name: 'Triamcinolone', dose: 4 }
        ];

        let fromOptions = '';
        let toOptions = '';
        steroids.forEach(s => {
            fromOptions += `<option value="${s.dose}">${s.name}</option>`;
            toOptions += `<option value="${s.dose}">${s.name}</option>`;
        });

        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="mme-opioid-item">
                <input type="number" id="steroid-from-dose" class="opioid-dose" placeholder="Dose">
                <select id="steroid-from-type" class="opioid-select">${fromOptions}</select>
            </div>
            <p style="text-align:center; font-weight: bold;">is equivalent to</p>
            <div class="mme-opioid-item">
                <input type="number" id="steroid-to-dose" class="opioid-dose" readonly placeholder="Equivalent Dose">
                <select id="steroid-to-type" class="opioid-select">${toOptions}</select>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const fromDoseEl = container.querySelector('#steroid-from-dose');
        const fromTypeEl = container.querySelector('#steroid-from-type');
        const toDoseEl = container.querySelector('#steroid-to-dose');
        const toTypeEl = container.querySelector('#steroid-to-type');

        const calculateConversion = () => {
            const fromDose = parseFloat(fromDoseEl.value);
            const fromEquivalent = parseFloat(fromTypeEl.value);
            const toEquivalent = parseFloat(toTypeEl.value);

            if (isNaN(fromDose) || isNaN(fromEquivalent) || isNaN(toEquivalent) || fromEquivalent === 0) {
                toDoseEl.value = '';
                return;
            }

            const toDose = (fromDose / fromEquivalent) * toEquivalent;
            toDoseEl.value = toDose.toFixed(2);
        };

        fromDoseEl.addEventListener('input', calculateConversion);
        fromTypeEl.addEventListener('change', calculateConversion);
        toTypeEl.addEventListener('change', calculateConversion);
        
        // Initial calculation
        calculateConversion();
    }
};
