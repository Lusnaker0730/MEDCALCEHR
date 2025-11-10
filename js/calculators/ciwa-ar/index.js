// js/calculators/ciwa-ar.js

export const ciwaAr = {
    id: 'ciwa-ar',
    title: 'CIWA-Ar for Alcohol Withdrawal',
    description: 'The CIWA-Ar objectifies severity of alcohol withdrawal.',
    generateHTML: function () {
        const categories = [
            {
                id: 'nausea',
                title: 'Nausea/vomiting',
                prompt: 'Ask \'Do you feel sick to your stomach? Have you vomited?\'',
                options: [
                    { score: 0, text: 'No nausea and no vomiting' },
                    { score: 1, text: 'Mild nausea and no vomiting' },
                    { score: 2, text: '(More severe symptoms)' },
                    { score: 3, text: '(More severe symptoms)' },
                    { score: 4, text: 'Intermittent nausea with dry heaves' },
                    { score: 5, text: '(More severe symptoms)' },
                    { score: 6, text: '(More severe symptoms)' },
                    { score: 7, text: 'Constant nausea, frequent dry heaves and vomiting' }
                ]
            },
            {
                id: 'tremor',
                title: 'Tremor',
                prompt: 'Arms extended and fingers spread apart',
                options: [
                    { score: 0, text: 'No tremor' },
                    { score: 1, text: 'Not visible, but can be felt fingertip to fingertip' },
                    { score: 2, text: '(More severe symptoms)' },
                    { score: 3, text: '(More severe symptoms)' },
                    { score: 4, text: 'Moderate, with patient\'s arms extended' },
                    { score: 5, text: '(More severe symptoms)' },
                    { score: 6, text: '(More severe symptoms)' },
                    { score: 7, text: 'Severe, even with arms not extended' }
                ]
            },
            {
                id: 'sweats',
                title: 'Paroxysmal Sweats',
                prompt: 'Observation',
                options: [
                    { score: 0, text: 'No sweat visible' },
                    { score: 1, text: 'Barely perceptible sweating, palms moist' },
                    { score: 2, text: '(More severe symptoms)' },
                    { score: 3, text: '(More severe symptoms)' },
                    { score: 4, text: 'Beads of sweat obvious on forehead' },
                    { score: 5, text: '(More severe symptoms)' },
                    { score: 6, text: '(More severe symptoms)' },
                    { score: 7, text: 'Drenching sweats' }
                ]
            },
            {
                id: 'anxiety',
                title: 'Anxiety',
                prompt: 'Ask "Do you feel nervous?"',
                options: [
                    { score: 0, text: 'No anxiety, at ease' },
                    { score: 1, text: 'Mildly anxious' },
                    { score: 2, text: '(More severe symptoms)' },
                    { score: 3, text: '(More severe symptoms)' },
                    { score: 4, text: 'Moderately anxious, or guarded' },
                    { score: 5, text: '(More severe symptoms)' },
                    { score: 6, text: '(More severe symptoms)' },
                    { score: 7, text: 'Equivalent to acute panic states' }
                ]
            },
            {
                id: 'agitation',
                title: 'Agitation',
                prompt: 'Observation',
                options: [
                    { score: 0, text: 'Normal activity' },
                    { score: 1, text: 'Somewhat more than normal activity' },
                    { score: 2, text: '(More severe symptoms)' },
                    { score: 3, text: '(More severe symptoms)' },
                    { score: 4, text: 'Moderately fidgety and restless' },
                    { score: 5, text: '(More severe symptoms)' },
                    { score: 6, text: '(More severe symptoms)' },
                    { score: 7, text: 'Paces back and forth, or constantly thrashes about' }
                ]
            },
            {
                id: 'tactile',
                title: 'Tactile Disturbances',
                prompt: 'Ask "Have you any itching, pins and needles sensations, any burning, any numbness, or do you feel bugs crawling on or under your skin?"',
                options: [
                    { score: 0, text: 'None' },
                    { score: 1, text: 'Very mild itching, pins and needles, burning or numbness' },
                    { score: 2, text: 'Mild itching, pins and needles, burning or numbness' },
                    { score: 3, text: 'Moderate itching, pins and needles, burning or numbness' },
                    { score: 4, text: 'Moderately severe hallucinations' },
                    { score: 5, text: 'Severe hallucinations' },
                    { score: 6, text: 'Extremely severe hallucinations' },
                    { score: 7, text: 'Continuous hallucinations' }
                ]
            },
            {
                id: 'auditory',
                title: 'Auditory Disturbances',
                prompt: 'Ask "Are you more aware of sounds around you? Are they harsh? Do they frighten you? Are you hearing anything that is disturbing to you? Are you hearing things you know are not there?"',
                options: [
                    { score: 0, text: 'Not present' },
                    { score: 1, text: 'Very mild harshness or ability to frighten' },
                    { score: 2, text: 'Mild harshness or ability to frighten' },
                    { score: 3, text: 'Moderate harshness or ability to frighten' },
                    { score: 4, text: 'Moderately severe hallucinations' },
                    { score: 5, text: 'Severe hallucinations' },
                    { score: 6, text: 'Extremely severe hallucinations' },
                    { score: 7, text: 'Continuous hallucinations' }
                ]
            },
            {
                id: 'visual',
                title: 'Visual Disturbances',
                prompt: 'Ask "Does the light appear to be too bright? Is its color different? Does it hurt your eyes? Are you seeing anything that is disturbing to you? Are you seeing things you know are not there?"',
                options: [
                    { score: 0, text: 'Not present' },
                    { score: 1, text: 'Very mild sensitivity' },
                    { score: 2, text: 'Mild sensitivity' },
                    { score: 3, text: 'Moderate sensitivity' },
                    { score: 4, text: 'Moderately severe hallucinations' },
                    { score: 5, text: 'Severe hallucinations' },
                    { score: 6, text: 'Extremely severe hallucinations' },
                    { score: 7, text: 'Continuous hallucinations' }
                ]
            },
            {
                id: 'headache',
                title: 'Headache, Fullness in Head',
                prompt: 'Ask "Does your head feel different? Does it feel like there is a band around your head?" Do not rate dizziness or lightheadedness.',
                options: [
                    { score: 0, text: 'Not present' },
                    { score: 1, text: 'Very mild' },
                    { score: 2, text: 'Mild' },
                    { score: 3, text: 'Moderate' },
                    { score: 4, text: 'Moderately severe' },
                    { score: 5, text: 'Severe' },
                    { score: 6, text: 'Very severe' },
                    { score: 7, text: 'Extremely severe' }
                ]
            },
            {
                id: 'orientation',
                title: 'Orientation & Clouding of Sensorium',
                prompt: 'Ask "What day is this? Where are you? Who am I?"',
                options: [
                    { score: 0, text: 'Oriented and can do serial additions' },
                    { score: 1, text: 'Cannot do serial additions or is uncertain about date' },
                    { score: 2, text: 'Disoriented for date by no more than 2 calendar days' },
                    { score: 3, text: 'Disoriented for date by more than 2 calendar days' },
                    { score: 4, text: 'Disoriented for place and/or person' }
                ]
            }
        ];

        let html = `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div id="ciwa-ar-container">
        `;

        categories.forEach(cat => {
            html += `
                <div class="ciwa-ar-category" id="ciwa-cat-${cat.id}" data-score="0">
                    <div class="ciwa-ar-left">
                        <h4>${cat.title}</h4>
                        <p>${cat.prompt}</p>
                    </div>
                    <div class="ciwa-ar-right">
            `;
            cat.options.forEach(opt => {
                html += `<div class="ciwa-ar-option" data-score="${opt.score}">${opt.text}<span class="ciwa-ar-score">+${opt.score}</span></div>`;
            });
            html += `
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <div id="ciwa-ar-result" class="result" style="display:none;"></div>
        `;
        return html;
    },
    initialize: function (client, patient, container) {
        const categories = container.querySelectorAll('.ciwa-ar-category');

        // Auto-calculation function
        const calculate = () => {
            let score = 0;
            categories.forEach(cat => {
                score += parseInt(cat.dataset.score || 0);
            });

            let severity = '';
            let recommendation = '';
            if (score <= 9) {
                severity = 'Absent or minimal withdrawal';
                recommendation = 'Supportive care. Medication may not be necessary.';
            } else if (score <= 15) {
                severity = 'Mild to moderate withdrawal';
                recommendation = 'Medication is usually indicated.';
            } else {
                // score > 15
                severity = 'Severe withdrawal';
                recommendation =
                    'Medication is indicated. Consider ICU admission if score is very high or patient is unstable.';
            }

            const resultEl = container.querySelector('#ciwa-ar-result');
            resultEl.innerHTML = `
                <p><strong>CIWA-Ar Score:</strong> ${score}</p>
                <p><strong>Severity:</strong> ${severity}</p>
                <hr>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        };

        categories.forEach(cat => {
            const options = cat.querySelectorAll('.ciwa-ar-option');
            options.forEach(opt => {
                // Pre-select the '0' score option
                if (opt.dataset.score === '0') {
                    opt.classList.add('selected');
                }
                opt.addEventListener('click', () => {
                    // Deselect other options in the same category
                    options.forEach(otherOpt => otherOpt.classList.remove('selected'));
                    // Select the clicked option
                    opt.classList.add('selected');
                    // Update the category's score
                    cat.dataset.score = opt.dataset.score;
                    // Auto-calculate on every change
                    calculate();
                });
            });
        });

        // Initial calculation
        calculate();
    }
};
