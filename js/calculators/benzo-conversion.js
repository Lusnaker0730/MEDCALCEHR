export const benzoConversion = {
    id: 'benzo-conversion',
    title: 'Benzodiazepine Conversion Calculator',
    description: 'Provides equivalents between different benzodiazepines.',

    generateHTML: () => {
        const benzoEquivalents = {
            alprazolam: { name: 'Alprazolam (Xanax)', equivalent: 1 },
            chlordiazepoxide: { name: 'Chlordiazepoxide (Librium)', equivalent: 30 },
            diazepam: { name: 'Diazepam (Valium)', equivalent: 10 },
            clonazepam: { name: 'Clonazepam (Klonopin)', equivalent: 0.5 },
            lorazepam: { name: 'Lorazepam (Ativan)', equivalent: 1 },
            oxazepam: { name: 'Oxazepam (Serax)', equivalent: 15 },
            temazepam: { name: 'Temazepam (Restoril)', equivalent: 20 },
            triazolam: { name: 'Triazolam (Halcion)', equivalent: 0.25 }
        };

        const createDrugList = groupName => {
            let html = '';
            for (const key in benzoEquivalents) {
                const drug = benzoEquivalents[key];
                const checked =
                    (groupName === 'from' && key === 'alprazolam') ||
                    (groupName === 'to' && key === 'diazepam')
                        ? 'checked'
                        : '';
                html += `<label><input type="radio" name="${groupName}" value="${key}" ${checked}><span>${drug.name}</span></label>`;
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
                    <div class="result-score" id="result-equivalent">100.0 mg</div>
                    <div class="result-interpretation" id="result-equivalent-desc">Valium dose equivalent to 10 mg Xanax</div>
                </div>
                <div class="result-box">
                    <div class="result-score" id="result-range">50.0-200.0 mg</div>
                    <div class="result-interpretation" id="result-range-desc">Range of Valium dose equivalent to 10 mg Xanax</div>
                </div>
            </div>
        `;
    },

    initialize: () => {
        const benzoEquivalents = {
            alprazolam: { name: 'Alprazolam (Xanax)', equivalent: 1 },
            chlordiazepoxide: { name: 'Chlordiazepoxide (Librium)', equivalent: 30 },
            diazepam: { name: 'Diazepam (Valium)', equivalent: 10 },
            clonazepam: { name: 'Clonazepam (Klonopin)', equivalent: 0.5 },
            lorazepam: { name: 'Lorazepam (Ativan)', equivalent: 1 },
            oxazepam: { name: 'Oxazepam (Serax)', equivalent: 15 },
            temazepam: { name: 'Temazepam (Restoril)', equivalent: 20 },
            triazolam: { name: 'Triazolam (Halcion)', equivalent: 0.25 }
        };

        const calculate = () => {
            const fromDrugKey = document.querySelector('input[name="from"]:checked').value;
            const toDrugKey = document.querySelector('input[name="to"]:checked').value;
            const dosage = parseFloat(document.getElementById('dosage').value) || 0;

            const fromDrug = benzoEquivalents[fromDrugKey];
            const toDrug = benzoEquivalents[toDrugKey];

            if (!fromDrug || !toDrug || dosage === 0) {
                document.getElementById('result-equivalent').textContent = '- mg';
                document.getElementById('result-range').textContent = '- mg';
                document.getElementById('result-equivalent-desc').textContent =
                    'Please enter a valid dosage.';
                document.getElementById('result-range-desc').textContent =
                    'Please enter a valid dosage.';
                return;
            }

            const equivalentDose = (dosage / fromDrug.equivalent) * toDrug.equivalent;
            const lowerRange = equivalentDose * 0.5;
            const upperRange = equivalentDose * 2.0;

            document.getElementById('result-equivalent').textContent =
                `${equivalentDose.toFixed(1)} mg`;
            document.getElementById('result-range').textContent =
                `${lowerRange.toFixed(1)}-${upperRange.toFixed(1)} mg`;

            const fromDrugShortName = fromDrug.name.split(' ')[0];
            const toDrugShortName = toDrug.name.split(' ')[0];

            document.getElementById('result-equivalent-desc').textContent =
                `${toDrugShortName} dose equivalent to ${dosage} mg ${fromDrugShortName}`;
            document.getElementById('result-range-desc').textContent =
                `Range of ${toDrugShortName} dose equivalent to ${dosage} mg ${fromDrugShortName}`;
        };

        document.querySelectorAll('.form-container input').forEach(input => {
            input.addEventListener('input', () => {
                // Update selected styles for radio buttons
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
        document
            .querySelectorAll('input[name="from"]:checked, input[name="to"]:checked')
            .forEach(radio => {
                radio.parentElement.classList.add('selected');
            });

        calculate(); // Initial calculation
    }
};
