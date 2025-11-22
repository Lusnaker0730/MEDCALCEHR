import { uiBuilder } from '../../ui-builder.js';

export const nihss = {
    id: 'nihss',
    title: 'NIH Stroke Scale/Score (NIHSS)',
    description: 'Quantifies stroke severity and monitors for neurological changes over time.',

    generateHTML: function () {
        const sections = [
            {
                id: 'nihss-1a',
                title: '1a. Level of Consciousness',
                options: [
                    { value: '0', label: '0 - Alert', checked: true },
                    { value: '1', label: '1 - Not alert, but arousable by minor stimulation' },
                    { value: '2', label: '2 - Not alert, requires repeated stimulation to attend' },
                    { value: '3', label: '3 - Unresponsive, or reflex motor responses only' }
                ]
            },
            {
                id: 'nihss-1b',
                title: '1b. LOC Questions (Month, Age)',
                options: [
                    { value: '0', label: '0 - Answers both correctly', checked: true },
                    { value: '1', label: '1 - Answers one correctly' },
                    { value: '2', label: '2 - Answers neither correctly' }
                ]
            },
            {
                id: 'nihss-1c',
                title: '1c. LOC Commands (Open/close eyes, grip/release hand)',
                options: [
                    { value: '0', label: '0 - Performs both correctly', checked: true },
                    { value: '1', label: '1 - Performs one correctly' },
                    { value: '2', label: '2 - Performs neither correctly' }
                ]
            },
            {
                id: 'nihss-2',
                title: '2. Best Gaze',
                options: [
                    { value: '0', label: '0 - Normal', checked: true },
                    { value: '1', label: '1 - Partial gaze palsy' },
                    { value: '2', label: '2 - Forced deviation' }
                ]
            },
            {
                id: 'nihss-3',
                title: '3. Visual Fields',
                options: [
                    { value: '0', label: '0 - No visual loss', checked: true },
                    { value: '1', label: '1 - Partial hemianopia' },
                    { value: '2', label: '2 - Complete hemianopia' },
                    { value: '3', label: '3 - Bilateral hemianopia' }
                ]
            },
            {
                id: 'nihss-4',
                title: '4. Facial Palsy',
                options: [
                    { value: '0', label: '0 - Normal', checked: true },
                    { value: '1', label: '1 - Minor paralysis' },
                    { value: '2', label: '2 - Partial paralysis' },
                    { value: '3', label: '3 - Complete paralysis of one or both sides' }
                ]
            },
            {
                id: 'nihss-5a',
                title: '5a. Motor Arm - Left',
                options: [
                    { value: '0', label: '0 - No drift', checked: true },
                    { value: '1', label: '1 - Drift' },
                    { value: '2', label: '2 - Some effort against gravity' },
                    { value: '3', label: '3 - No effort against gravity, but moves' },
                    { value: '4', label: '4 - No movement' }
                ]
            },
            {
                id: 'nihss-5b',
                title: '5b. Motor Arm - Right',
                options: [
                    { value: '0', label: '0 - No drift', checked: true },
                    { value: '1', label: '1 - Drift' },
                    { value: '2', label: '2 - Some effort against gravity' },
                    { value: '3', label: '3 - No effort against gravity, but moves' },
                    { value: '4', label: '4 - No movement' }
                ]
            },
            {
                id: 'nihss-6a',
                title: '6a. Motor Leg - Left',
                options: [
                    { value: '0', label: '0 - No drift', checked: true },
                    { value: '1', label: '1 - Drift' },
                    { value: '2', label: '2 - Some effort against gravity' },
                    { value: '3', label: '3 - No effort against gravity, but moves' },
                    { value: '4', label: '4 - No movement' }
                ]
            },
            {
                id: 'nihss-6b',
                title: '6b. Motor Leg - Right',
                options: [
                    { value: '0', label: '0 - No drift', checked: true },
                    { value: '1', label: '1 - Drift' },
                    { value: '2', label: '2 - Some effort against gravity' },
                    { value: '3', label: '3 - No effort against gravity, but moves' },
                    { value: '4', label: '4 - No movement' }
                ]
            },
            {
                id: 'nihss-7',
                title: '7. Limb Ataxia',
                options: [
                    { value: '0', label: '0 - Absent', checked: true },
                    { value: '1', label: '1 - Present in one limb' },
                    { value: '2', label: '2 - Present in two or more limbs' }
                ]
            },
            {
                id: 'nihss-8',
                title: '8. Sensory',
                options: [
                    { value: '0', label: '0 - Normal', checked: true },
                    { value: '1', label: '1 - Mild-to-moderate loss' },
                    { value: '2', label: '2 - Severe-to-total loss' }
                ]
            },
            {
                id: 'nihss-9',
                title: '9. Best Language',
                options: [
                    { value: '0', label: '0 - No aphasia', checked: true },
                    { value: '1', label: '1 - Mild-to-moderate aphasia' },
                    { value: '2', label: '2 - Severe aphasia' },
                    { value: '3', label: '3 - Mute, global aphasia' }
                ]
            },
            {
                id: 'nihss-10',
                title: '10. Dysarthria',
                options: [
                    { value: '0', label: '0 - Normal articulation', checked: true },
                    { value: '1', label: '1 - Mild-to-moderate dysarthria' },
                    { value: '2', label: '2 - Severe dysarthria (unintelligible)' }
                ]
            },
            {
                id: 'nihss-11',
                title: '11. Extinction and Inattention (Neglect)',
                options: [
                    { value: '0', label: '0 - No neglect', checked: true },
                    { value: '1', label: '1 - Partial neglect' },
                    { value: '2', label: '2 - Complete neglect' }
                ]
            }
        ];

        const formContent = sections.map(section => 
            uiBuilder.createSection({
                title: section.title,
                content: uiBuilder.createRadioGroup({
                    name: section.id,
                    options: section.options
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Clinical Use</div>
                    <p>Perform assessments within 24 hours of symptom onset and repeat serially to monitor progression or recovery.</p>
                </div>
            </div>
            
            ${formContent}
            
            ${uiBuilder.createResultBox({ id: 'nihss-result', title: 'NIHSS Assessment Results' })}
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Brott T, Adams HP Jr, Olinger CP, et al. Measurements of acute cerebral infarction: a clinical examination scale. <em>Stroke</em>. 1989;20(7):864-870.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const groups = [
                'nihss-1a', 'nihss-1b', 'nihss-1c', 'nihss-2', 'nihss-3',
                'nihss-4', 'nihss-5a', 'nihss-5b', 'nihss-6a', 'nihss-6b',
                'nihss-7', 'nihss-8', 'nihss-9', 'nihss-10', 'nihss-11'
            ];

            let score = 0;
            let allSelected = true;

            groups.forEach(groupName => {
                const checked = container.querySelector(`input[name="${groupName}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                } else {
                    allSelected = false;
                }
            });

            if (!allSelected) return;

            let severity = '';
            let alertClass = '';
            let interpretation = '';

            if (score === 0) {
                severity = 'No Stroke';
                alertClass = 'ui-alert-success';
                interpretation = 'No stroke symptoms detected.';
            } else if (score >= 1 && score <= 4) {
                severity = 'Minor Stroke';
                alertClass = 'ui-alert-info';
                interpretation = 'Minor stroke. Consider outpatient management with close follow-up.';
            } else if (score >= 5 && score <= 15) {
                severity = 'Moderate Stroke';
                alertClass = 'ui-alert-warning';
                interpretation = 'Moderate stroke. Requires inpatient monitoring and treatment.';
            } else if (score >= 16 && score <= 20) {
                severity = 'Moderate-to-Severe Stroke';
                alertClass = 'ui-alert-danger';
                interpretation = 'Moderate-to-severe stroke. Intensive monitoring and intervention required.';
            } else {
                severity = 'Severe Stroke';
                alertClass = 'ui-alert-danger';
                interpretation = 'Severe stroke. Critical care and aggressive intervention needed.';
            }

            const resultBox = container.querySelector('#nihss-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: '/ 42 points',
                    interpretation: severity,
                    alertClass: alertClass
                })}
                
                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">${score >= 16 ? '⚠️' : 'ℹ️'}</span>
                    <div class="ui-alert-content">${interpretation}</div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Event listeners for all radio buttons
        const radios = container.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Initial calculation
        calculate();
    }
};