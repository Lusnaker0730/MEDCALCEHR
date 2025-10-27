// js/calculators/steroid-conversion.js

export const steroidConversion = {
    id: 'steroid-conversion',
    title: 'Steroid Conversion Calculator',
    description: 'Converts steroid dosages using dosing equivalencies.',
    generateHTML: function () {
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

            <div class="steroid-conversion-table-container">
                <h4>📊 Steroid Equivalence Conversion Table</h4>
                <p class="table-description">
                    <strong>How to use:</strong> Find your steroid in the left column. The numbers show how many mg of each steroid (column headers) equals the reference dose in the left column.
                </p>
                <p class="table-note">
                    <strong>Note:</strong> These are approximate glucocorticoid potency equivalents. Individual patient response may vary. Consider mineralocorticoid activity when switching between different corticosteroids.
                </p>
                
                <div class="table-wrapper">
                    <table class="steroid-equivalence-table">
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

                <div class="potency-info">
                    <h5>💡 Relative Potency Information</h5>
                    <div class="potency-grid">
                        <div class="potency-item high-potency">
                            <strong>Highest Potency</strong>
                            <p>Dexamethasone (0.75 mg)</p>
                        </div>
                        <div class="potency-item medium-potency">
                            <strong>Medium Potency</strong>
                            <p>Methylprednisolone (4 mg)<br>Triamcinolone (4 mg)</p>
                        </div>
                        <div class="potency-item standard-potency">
                            <strong>Standard Potency</strong>
                            <p>Prednisolone (5 mg)<br>Prednisone (5 mg)</p>
                        </div>
                        <div class="potency-item low-potency">
                            <strong>Lower Potency</strong>
                            <p>Hydrocortisone (20 mg)<br>Cortisone (25 mg)</p>
                        </div>
                    </div>
                </div>

                <div class="clinical-pearls">
                    <h5>🩺 Clinical Pearls</h5>
                    <ul>
                        <li><strong>Hydrocortisone</strong> has significant mineralocorticoid activity - good for adrenal insufficiency</li>
                        <li><strong>Prednisone</strong> requires hepatic conversion to prednisolone (active form)</li>
                        <li><strong>Dexamethasone</strong> longest half-life (36-54 hrs) - useful once daily dosing</li>
                        <li><strong>Methylprednisolone</strong> commonly used IV in acute settings</li>
                        <li>Consider tapering when stopping prolonged steroid use (>2-3 weeks)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const fromDoseEl = container.querySelector('#steroid-from-dose');
        const fromTypeEl = container.querySelector('#steroid-from-type');
        const toDoseEl = container.querySelector('#steroid-to-dose');
        const toTypeEl = container.querySelector('#steroid-to-type');

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

        // Initial calculation
        calculateConversion();
    }
};
