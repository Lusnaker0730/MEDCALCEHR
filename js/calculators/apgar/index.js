import { uiBuilder } from '../../ui-builder.js';

export const apgarScore = {
    id: 'apgar',
    title: 'APGAR Score',
    description: 'Assesses neonates 1 and 5 minutes after birth.',
    generateHTML: function () {
        const criteria = [
            {
                id: 'appearance',
                title: 'Appearance (Skin Color)',
                options: [
                    { value: '2', label: 'Normal color all over (hands and feet are pink)' },
                    { value: '1', label: 'Normal color (but hands and feet are blue)', checked: true },
                    { value: '0', label: 'Blue-gray or pale all over' }
                ]
            },
            {
                id: 'pulse',
                title: 'Pulse (Heart Rate)',
                options: [
                    { value: '2', label: '> 100 bpm', checked: true },
                    { value: '1', label: '< 100 bpm' },
                    { value: '0', label: 'Absent (no pulse)' }
                ]
            },
            {
                id: 'grimace',
                title: 'Grimace (Reflex Irritability)',
                options: [
                    { value: '2', label: 'Pulling away, sneezes, coughs, or cries with stimulation', checked: true },
                    { value: '1', label: 'Facial movement only (grimace) with stimulation' },
                    { value: '0', label: 'Absent (no response to stimulation)' }
                ]
            },
            {
                id: 'activity',
                title: 'Activity (Muscle Tone)',
                options: [
                    { value: '2', label: 'Active, spontaneous movement', checked: true },
                    { value: '1', label: 'Arms and legs flexed with little movement' },
                    { value: '0', label: 'No movement, "floppy" tone' }
                ]
            },
            {
                id: 'respiration',
                title: 'Respiration (Breathing Rate & Effort)',
                options: [
                    { value: '2', label: 'Normal rate and effort, good cry', checked: true },
                    { value: '1', label: 'Slow or irregular breathing, weak cry' },
                    { value: '0', label: 'Absent (no breathing)' }
                ]
            }
        ];

        const sectionsHTML = criteria.map(item => 
            uiBuilder.createSection({
                title: item.title,
                content: uiBuilder.createRadioGroup({
                    name: `apgar-${item.id}`,
                    options: item.options
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: 'Score is usually recorded at 1 and 5 minutes after birth.'
            })}
            
            ${sectionsHTML}
            
            ${uiBuilder.createResultBox({ id: 'apgar-result', title: 'APGAR Score Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const criteria = ['apgar-appearance', 'apgar-pulse', 'apgar-grimace', 'apgar-activity', 'apgar-respiration'];
            let score = 0;
            let allSelected = true;

            criteria.forEach(name => {
                const checked = container.querySelector(`input[name="${name}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                } else {
                    allSelected = false;
                }
            });

            if (!allSelected) return;

            let interpretation = '';
            let alertClass = '';

            if (score >= 7) {
                interpretation = 'Reassuring (Normal)';
                alertClass = 'ui-alert-success';
            } else if (score >= 4) {
                interpretation = 'Moderately Abnormal (May need intervention)';
                alertClass = 'ui-alert-warning';
            } else {
                interpretation = 'Low (Immediate medical intervention required)';
                alertClass = 'ui-alert-danger';
            }

            const resultBox = container.querySelector('#apgar-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total APGAR Score', 
                    value: score, 
                    unit: '/ 10 points',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();
    }
};