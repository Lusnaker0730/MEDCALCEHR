
export const benzoConversion = {
    id: 'benzo-conversion',
    title: 'Benzodiazepine Conversion Calculator',
    description: 'Provides equivalents between different benzodiazepines based on a conversion factor table.',

    generateHTML: () => {
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

        const createDrugList = (groupName) => {
            let html = '';
            for (const key in drugs) {
                const drugName = drugs[key];
                // Default selection
                const checked = (groupName === 'from' && key === 'alprazolam') || (groupName === 'to' && key === 'diazepam') ? 'checked' : '';
                html += `<label><input type="radio" name="${groupName}" value="${key}" ${checked}><span>${drugName}</span></label>`;
            }
            return html;
        };

        return `
            <div class="form-container">
                <div class="instructions-box important">
                    <strong>IMPORTANT:</strong> This calculator should be used as a reference for oral benzodiazepine conversions. Equipotent benzodiazepine doses are reported as ranges due to paucity of literature supporting exact conversions, thus reported ranges are based on expert opinion and clinical experience published in psychiatric literature.
                </div>
                <div class="instructions-box dark-blue">
                    <strong>INSTRUCTIONS:</strong> Do not use to calculate initial dose for a benzo-naïve patient.
                </div>

                <div class="input-row vertical">
                    <div class="input-label">Converting from:</div>
                    <div class="radio-group vertical-group" data-name="from">
                        ${createDrugList('from')}
                    </div>
                </div>

                <div class="input-row">
                    <div class="input-label">Total daily drug dosage (mg)</div>
                    <div class="input-with-unit">
                        <input type="number" id="dosage" class="input-field" value="10">
                        <span>mg</span>
                    </div>
                </div>

                <div class="input-row vertical">
                    <div class="input-label">Converting to:</div>
                    <div class="radio-group vertical-group" data-name="to">
                        ${createDrugList('to')}
                    </div>
                </div>
            </div>
            <div class="result-grid">
                <div class="result-box">
                    <div class="result-score" id="result-equivalent">- mg</div>
                    <div class="result-interpretation" id="result-equivalent-desc"></div>
                </div>
                <div class="result-box">
                    <div class="result-score" id="result-range">- mg</div>
                    <div class="result-interpretation" id="result-range-desc"></div>
                </div>
            </div>
        `;
    },

    initialize: () => {
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

        // Data transcribed directly from the user-provided conversion table image.
        // `factor` is the multiplication factor. `range` is the multiplier range.
        const conversionTable = {
            alprazolam: { // From Xanax
                chlordiazepoxide: { factor: 25,    range: [15, 50] },
                diazepam:         { factor: 10,    range: [5, 20] },
                clonazepam:       { factor: 0.5,   range: [0.5, 4] },
                lorazepam:        { factor: 0.5,   range: [1, 4] },
                oxazepam:         { factor: 20,    range: [5, 40] },
                temazepam:        { factor: 20,    range: [5, 40] },
                triazolam:        { factor: 0.5,   range: [1, 4] },
            },
            chlordiazepoxide: { // From Librium
                alprazolam:       { factor: 1/25,  range: [15, 50] },
                diazepam:         { factor: 1/3,   range: [1.25, 5] },
                clonazepam:       { factor: 1/20,  range: [6.25, 50] },
                lorazepam:        { factor: 1/10,  range: [6.25, 25] },
                oxazepam:         { factor: 0.5,   range: [0.2, 1.6] },
                temazepam:        { factor: 0.5,   range: [0.2, 1.6] },
                triazolam:        { factor: 1/75,  range: [25, 100] },
            },
            diazepam: { // From Valium
                alprazolam:       { factor: 1/10,  range: [5, 20] },
                chlordiazepoxide: { factor: 3,     range: [1.25, 5] },
                clonazepam:       { factor: 1/10,  range: [2.5, 20] },
                lorazepam:        { factor: 1/6,   range: [2.5, 10] },
                oxazepam:         { factor: 0.5,   range: [0.5, 4] },
                temazepam:        { factor: 0.5,   range: [0.5, 4] },
                triazolam:        { factor: 1/20,  range: [10, 40] },
            },
            clonazepam: { // From Klonopin
                alprazolam:       { factor: 2,     range: [0.5, 4] },
                chlordiazepoxide: { factor: 20,    range: [6.25, 50] },
                diazepam:         { factor: 10,    range: [2.5, 20] },
                lorazepam:        { factor: 2,     range: [0.5, 4] },
                oxazepam:         { factor: 20,    range: [2.5, 40] },
                temazepam:        { factor: 20,    range: [2.5, 40] },
                triazolam:        { factor: 1/4,   range: [1, 8] },
            },
            lorazepam: { // From Ativan
                alprazolam:       { factor: 2,     range: [1, 4] },
                chlordiazepoxide: { factor: 10,    range: [6.25, 25] },
                diazepam:         { factor: 6,     range: [2.5, 10] },
                clonazepam:       { factor: 2,     range: [0.5, 4] },
                oxazepam:         { factor: 10,    range: [2.5, 20] },
                temazepam:        { factor: 10,    range: [2.5, 20] },
                triazolam:        { factor: 1/4,   range: [2, 8] },
            },
            oxazepam: { // From Serax
                alprazolam:       { factor: 1/20,  range: [5, 40] },
                chlordiazepoxide: { factor: 2,     range: [0.2, 1.6] }, // factor is ÷ 0.5 = 2
                diazepam:         { factor: 2,     range: [0.5, 4] },
                clonazepam:       { factor: 1/20,  range: [2.5, 40] },
                lorazepam:        { factor: 1/10,  range: [2.5, 20] },
                temazepam:        { factor: 1,     range: [0.25, 4] },
                triazolam:        { factor: 1/40,  range: [10, 80] },
            },
            temazepam: { // From Restoril
                alprazolam:       { factor: 1/20,  range: [5, 40] },
                chlordiazepoxide: { factor: 2,     range: [0.2, 1.6] }, // factor is ÷ 0.5 = 2
                diazepam:         { factor: 2,     range: [0.5, 4] },
                clonazepam:       { factor: 1/20,  range: [2.5, 40] },
                lorazepam:        { factor: 1/10,  range: [2.5, 20] },
                oxazepam:         { factor: 1,     range: [0.25, 4] },
                triazolam:        { factor: 1/40,  range: [10, 80] },
            },
            triazolam: { // From Halcion
                alprazolam:       { factor: 2,     range: [1, 4] },
                chlordiazepoxide: { factor: 75,    range: [25, 100] },
                diazepam:         { factor: 20,    range: [10, 40] },
                clonazepam:       { factor: 4,     range: [1, 8] },
                lorazepam:        { factor: 4,     range: [2, 8] },
                oxazepam:         { factor: 40,    range: [10, 80] },
                temazepam:        { factor: 40,    range: [10, 80] },
            },
        };

        const calculate = () => {
            const fromDrugKey = document.querySelector('input[name="from"]:checked').value;
            const toDrugKey = document.querySelector('input[name="to"]:checked').value;
            const dosage = parseFloat(document.getElementById('dosage').value) || 0;

            const resultEqEl = document.getElementById('result-equivalent');
            const resultEqDescEl = document.getElementById('result-equivalent-desc');
            const resultRangeEl = document.getElementById('result-range');
            const resultRangeDescEl = document.getElementById('result-range-desc');

            const fromDrugName = drugs[fromDrugKey].split(' ')[0];
            const toDrugName = drugs[toDrugKey].split(' ')[0];

            if (fromDrugKey === toDrugKey) {
                resultEqEl.textContent = `${dosage.toFixed(1)} mg`;
                resultRangeEl.textContent = 'n/a';
                resultEqDescEl.textContent = `Dose is unchanged.`;
                resultRangeDescEl.textContent = `Cannot convert to the same drug.`;
                return;
            }

            const conversion = conversionTable[fromDrugKey]?.[toDrugKey];

            if (!conversion || dosage === 0) {
                resultEqEl.textContent = '- mg';
                resultRangeEl.textContent = '- mg';
                resultEqDescEl.textContent = 'Please enter a valid dosage.';
                resultRangeDescEl.textContent = 'Please enter a valid dosage.';
                return;
            }
            
            const equivalentDose = dosage * conversion.factor;
            const lowerRange = dosage * conversion.range[0];
            const upperRange = dosage * conversion.range[1];

            resultEqEl.textContent = `${equivalentDose.toFixed(1)} mg`;
            resultRangeEl.textContent = `${lowerRange.toFixed(1)}-${upperRange.toFixed(1)} mg`;
            
            resultEqDescEl.textContent = `${toDrugName} dose equivalent to ${dosage} mg ${fromDrugName}`;
            resultRangeDescEl.textContent = `Range of ${toDrugName} dose equivalent to ${dosage} mg ${fromDrugName}`;
        };

        document.querySelectorAll('.form-container input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.type === 'radio') {
                    const groupName = input.name;
                    document.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
                        radio.parentElement.classList.remove('selected');
                    });
                    input.parentElement.classList.add('selected');
                }
                calculate();
            });
        });

        // Set initial selected styles
        document.querySelectorAll('input[name="from"]:checked, input[name="to"]:checked').forEach(radio => {
            radio.parentElement.classList.add('selected');
        });

        calculate(); // Initial calculation
    }
};
