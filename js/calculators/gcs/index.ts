import { uiBuilder } from '../../ui-builder';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Patient } from '../../types/fhir';

export const gcs: Calculator = {
    id: 'gcs',
    title: 'Glasgow Coma Scale (GCS)',
    description: 'Coma severity based on Eye (4), Verbal (5), and Motor (6) criteria.',
    generateHTML: function (): string {
        const sections = [
            {
                id: 'eye',
                title: 'Eye Opening Response',
                icon: '👁️',
                options: [
                    { value: '4', label: 'Spontaneous - open with blinking at baseline (4)', checked: true },
                    { value: '3', label: 'To verbal stimuli, command, speech (3)' },
                    { value: '2', label: 'To pain only (not applied to face) (2)' },
                    { value: '1', label: 'No response (1)' }
                ]
            },
            {
                id: 'verbal',
                title: 'Verbal Response',
                icon: '💬',
                options: [
                    { value: '5', label: 'Oriented (5)', checked: true },
                    { value: '4', label: 'Confused speech, but able to answer questions (4)' },
                    { value: '3', label: 'Inappropriate words (3)' },
                    { value: '2', label: 'Incomprehensible speech (2)' },
                    { value: '1', label: 'No response (1)' }
                ]
            },
            {
                id: 'motor',
                title: 'Motor Response',
                icon: '💪',
                options: [
                    { value: '6', label: 'Obeys commands for movement (6)', checked: true },
                    { value: '5', label: 'Purposeful movement to painful stimulus (5)' },
                    { value: '4', label: 'Withdraws from pain (4)' },
                    { value: '3', label: 'Abnormal (spastic) flexion, decorticate posture (3)' },
                    { value: '2', label: 'Extensor (rigid) response, decerebrate posture (2)' },
                    { value: '1', label: 'No response (1)' }
                ]
            }
        ];

        const sectionsHTML = sections.map(section =>
            uiBuilder.createSection({
                title: section.title,
                icon: section.icon,
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
            
            ${sectionsHTML}
            
            ${uiBuilder.createResultBox({ id: 'gcs-result', title: 'Glasgow Coma Scale Results' })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Interpretation</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li><strong>13-15:</strong> Mild Brain Injury</li>
                        <li><strong>9-12:</strong> Moderate Brain Injury</li>
                        <li><strong>3-8:</strong> Severe Brain Injury (Coma)</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client: FHIRClient, patient: Patient, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const eyeInput = container.querySelector('input[name="eye"]:checked') as HTMLInputElement;
            const verbalInput = container.querySelector('input[name="verbal"]:checked') as HTMLInputElement;
            const motorInput = container.querySelector('input[name="motor"]:checked') as HTMLInputElement;

            const eyeScore = parseInt(eyeInput.value);
            const verbalScore = parseInt(verbalInput.value);
            const motorScore = parseInt(motorInput.value);

            const totalScore = eyeScore + verbalScore + motorScore;

            let severity = '';
            let alertClass = '';

            if (totalScore >= 13) {
                severity = 'Mild Brain Injury';
                alertClass = 'ui-alert-success';
            } else if (totalScore >= 9) {
                severity = 'Moderate Brain Injury';
                alertClass = 'ui-alert-warning';
            } else {
                severity = 'Severe Brain Injury (Coma)';
                alertClass = 'ui-alert-danger';
            }

            const resultBox = container.querySelector('#gcs-result') as HTMLElement;
            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                label: 'Total GCS Score',
                value: totalScore,
                unit: 'points',
                interpretation: severity,
                alertClass: alertClass
            })}
                
                <div style="margin-top: 15px; text-align: center; font-weight: 500; color: #666;">
                    Component Breakdown: E${eyeScore} V${verbalScore} M${motorScore}
                </div>
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
