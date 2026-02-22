import { uiBuilder } from '../../ui-builder.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export function calculatePregnancyDates(
    method: string,
    cycleLength: number,
    inputDateStr: string,
    egaWeeks: number,
    egaDays: number,
    now: Date = new Date()
): { lmp: Date; edc: Date; edd: Date; gaWeeks: number; gaDays: number; diffDays: number; remainingDays: number } | null {
    if (!inputDateStr && method !== 'ega_today') return null;

    let baseDateLocal: Date | null = null;
    if (inputDateStr) {
        const [y, m, d] = inputDateStr.split('-').map(Number);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
        baseDateLocal = new Date(y, m - 1, d);
    }

    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const gaInputDays = egaWeeks * 7 + egaDays;

    let lmpDateLocal = new Date();
    const conceptOffset = 14 + (cycleLength - 28);
    const eddOffset = 280 + (cycleLength - 28);

    const calculateOffsetDate = (date: Date, diffDays: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + diffDays);
        return result;
    };

    switch (method) {
        case 'lmp':
            lmpDateLocal = baseDateLocal!;
            break;
        case 'ega_today':
            lmpDateLocal = calculateOffsetDate(todayLocal, -gaInputDays);
            break;
        case 'ega_date':
            lmpDateLocal = calculateOffsetDate(baseDateLocal!, -gaInputDays);
            break;
        case 'concept':
            lmpDateLocal = calculateOffsetDate(baseDateLocal!, -conceptOffset);
            break;
        case 'edd':
            lmpDateLocal = calculateOffsetDate(baseDateLocal!, -eddOffset);
            break;
        default:
            return null;
    }

    const edcLocal = calculateOffsetDate(lmpDateLocal, conceptOffset);
    const eddLocal = calculateOffsetDate(lmpDateLocal, eddOffset);

    // Use UTC for difference calculation to avoid DST shifts
    const lmpUtc = Date.UTC(lmpDateLocal.getFullYear(), lmpDateLocal.getMonth(), lmpDateLocal.getDate());
    const todayUtc = Date.UTC(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate());

    const diffTime = todayUtc - lmpUtc;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const gaWeeksDisplay = Math.floor(diffDays / 7);
    const gaDaysDisplay = diffDays % 7;

    const remainingDays = eddOffset - diffDays;

    return {
        lmp: lmpDateLocal,
        edc: edcLocal,
        edd: eddLocal,
        gaWeeks: gaWeeksDisplay,
        gaDays: gaDaysDisplay,
        diffDays,
        remainingDays
    };
}

export const dueDate: CalculatorModule = {
    id: 'due-date',
    title: 'Pregnancy Due Dates Calculator',
    description: 'Calculates pregnancy dates from last period, gestational age, or date of conception.',

    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Inputs',
            content: `
                    <div id="cycle-length-container">
                        ${uiBuilder.createInput({
                id: 'cycle-length',
                label: 'Cycle length',
                type: 'number',
                defaultValue: 28,
                min: 20,
                max: 60,
                unit: 'days'
            })}
                    </div>
                    <div id="calc-method-container">
                        ${uiBuilder.createSelect({
                id: 'calc-method',
                label: 'Dates to enter',
                options: [
                    { value: 'lmp', label: 'Last menstrual period', selected: true },
                    { value: 'ega_today', label: 'Estimated gestational age (EGA) as of today' },
                    { value: 'ega_date', label: 'EGA as of another date' },
                    { value: 'concept', label: 'Estimated date of conception' },
                    { value: 'edd', label: 'Estimated due date' }
                ],
                helpText: '"Last menstrual period" should be first day of LMP;'
            })}
                    </div>
                    
                    <div id="method-inputs-container">
                        <div id="input-date-container">
                            ${uiBuilder.createInput({
                id: 'input-date',
                label: 'Last Menstrual Period Date',
                type: 'date'
            })}
                        </div>
                        <div id="input-ega-container" style="display: none;">
                            ${uiBuilder.createInput({
                id: 'ega-weeks',
                label: 'EGA Weeks',
                type: 'number',
                min: 0,
                max: 44,
                defaultValue: 0
            })}
                            ${uiBuilder.createInput({
                id: 'ega-days',
                label: 'EGA Days',
                type: 'number',
                min: 0,
                max: 6,
                defaultValue: 0
            })}
                        </div>
                    </div>
                `
        })}

            ${uiBuilder.createResultBox({ id: 'due-date-result', title: 'Pregnancy Dating' })}

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    title: 'Estimated gestational age (EGA)',
                    formula: 'Time since 1st day of last menstrual period (LMP)'
                },
                {
                    title: 'Estimated date of conception (EDC)',
                    formula: 'Two weeks* since 1st day of LMP'
                },
                {
                    title: 'Estimated due date (EDD)',
                    formula: "1st day of LMP + 40 weeks* (Naegele's Rule)"
                },
                {
                    title: '*Note',
                    formula: 'Assumes 28 day cycle. If cycle is longer than 28 days, this calculator adds the number of days more than 28 to obtain EDD. Example: if cycle length is 35 days, add 7 days (= 35 – 28) to 40 weeks.'
                }
            ]
        })}
        `;
    },

    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const cycleLengthInput = container.querySelector('#cycle-length') as HTMLInputElement;
        const methodSelect = container.querySelector('#calc-method') as HTMLSelectElement;
        const dateInput = container.querySelector('#input-date') as HTMLInputElement;
        const egaWeeksInput = container.querySelector('#ega-weeks') as HTMLInputElement;
        const egaDaysInput = container.querySelector('#ega-days') as HTMLInputElement;

        const dateContainer = container.querySelector('#input-date-container') as HTMLElement;
        const dateLabel = dateContainer.querySelector('label') as HTMLLabelElement;
        const egaContainer = container.querySelector('#input-ega-container') as HTMLElement;

        const dateInputRaw = container.querySelector('#input-date');

        // Set default date to today
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateInputRaw) {
            (dateInputRaw as HTMLInputElement).value = todayStr;
        }

        const updateUI = () => {
            const method = methodSelect.value;

            if (method === 'lmp') {
                dateContainer.style.display = 'block';
                dateLabel.innerHTML = 'Last Menstrual Period Date<span class="required">*</span>';
                egaContainer.style.display = 'none';
            } else if (method === 'ega_today') {
                dateContainer.style.display = 'none';
                egaContainer.style.display = 'block';
            } else if (method === 'ega_date') {
                dateContainer.style.display = 'block';
                dateLabel.innerHTML = 'Date of Ultrasound / Exam<span class="required">*</span>';
                egaContainer.style.display = 'block';
            } else if (method === 'concept') {
                dateContainer.style.display = 'block';
                dateLabel.innerHTML = 'Estimated Date of Conception<span class="required">*</span>';
                egaContainer.style.display = 'none';
            } else if (method === 'edd') {
                dateContainer.style.display = 'block';
                dateLabel.innerHTML = 'Estimated Due Date<span class="required">*</span>';
                egaContainer.style.display = 'none';
            }
        };

        methodSelect.addEventListener('change', () => {
            updateUI();
            calculate();
        });

        updateUI();

        const calculate = () => {
            const method = methodSelect.value;
            const cycleLength = Number(cycleLengthInput.value) || 28;
            const inputDateStr = dateInput.value;
            const egaWeeks = Number(egaWeeksInput.value) || 0;
            const egaDays = Number(egaDaysInput.value) || 0;

            const resultBox = container.querySelector('#due-date-result');
            const resultContent = resultBox?.querySelector('.ui-result-content');

            if (!resultBox || !resultContent) return;

            const result = calculatePregnancyDates(method, cycleLength, inputDateStr, egaWeeks, egaDays);

            if (!result) {
                resultBox.classList.remove('show');
                return;
            }

            const { lmp, edc, edd, gaWeeks, gaDays, diffDays, remainingDays } = result;

            const options: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };

            const lmpStr = lmp.toLocaleDateString(undefined, options);
            const edcStr = edc.toLocaleDateString(undefined, options);
            const eddStr = edd.toLocaleDateString(undefined, options);

            let alertType: 'info' | 'success' | 'danger' | 'warning' = 'info';
            let statusMessage = '';

            if (diffDays < 0) {
                statusMessage = 'Calculated LMP is in the future.';
                alertType = 'danger';
            } else if (diffDays > 294) {
                statusMessage = 'Post-term pregnancy (>42 weeks).';
                alertType = 'warning';
            } else {
                statusMessage = 'Normal gestational age range.';
                alertType = 'success';
            }

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                label: 'Estimated Due Date (EDD)',
                value: eddStr,
                alertClass: 'ui-alert-success'
            })
                }
                ${uiBuilder.createResultItem({
                    label: 'Gestational Age (EGA)',
                    value: `${gaWeeks} weeks, ${gaDays} days`,
                    alertClass: `ui-alert-${alertType}`
                })
                }
                ${uiBuilder.createResultItem({
                    label: 'Estimated Date of Conception (EDC)',
                    value: edcStr
                })
                }
                ${uiBuilder.createResultItem({
                    label: 'Calculated LMP Date',
                    value: lmpStr
                })
                }
                ${uiBuilder.createResultItem({
                    label: 'Days Remaining to EDD',
                    value: Math.max(0, remainingDays).toString(),
                    unit: 'days'
                })
                }
                ${uiBuilder.createAlert({ type: alertType, message: statusMessage })}
`;

            resultBox.classList.add('show');
        };

        const inputs = [cycleLengthInput, dateInput, egaWeeksInput, egaDaysInput];
        inputs.forEach(input => {
            if (input) input.addEventListener('input', calculate);
        });

        // Initial calculation timeout to ensure DOM is ready
        setTimeout(calculate, 0);
    }
};

