export const dueDate = {
    id: 'due-date',
    title: 'Pregnancy Due Dates Calculator',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Calculates pregnancy dates from last period, gestational age, or date of conception.</p>
            <div class="form-group">
                <label for="lmp-date">First Day of Last Menstrual Period (LMP):</label>
                <input type="date" id="lmp-date">
            </div>
            <button id="calculate-due-date">Calculate</button>
            <div id="due-date-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lmp-date').value = today;

        document.getElementById('calculate-due-date').addEventListener('click', () => {
            const lmpDateString = document.getElementById('lmp-date').value;
            if (!lmpDateString) {
                alert('Please select a date.');
                return;
            }
            
            // The input date is UTC, convert it to local time zone by adding the timezone offset
            const lmpDate = new Date(lmpDateString);
            const userTimezoneOffset = lmpDate.getTimezoneOffset() * 60000;
            const lmpDateLocal = new Date(lmpDate.getTime() + userTimezoneOffset);

            // Calculate Estimated Due Date (EDD) by adding 280 days
            const edd = new Date(lmpDateLocal.getTime());
            edd.setDate(edd.getDate() + 280);

            // Calculate Gestational Age
            const today = new Date();
            const differenceInTime = today.getTime() - lmpDateLocal.getTime();
            const differenceInDays = differenceInTime / (1000 * 3600 * 24);
            const gestationalWeeks = Math.floor(differenceInDays / 7);
            const gestationalDays = Math.floor(differenceInDays % 7);

            const resultEl = document.getElementById('due-date-result');
            resultEl.innerHTML = `
                <p>Estimated Due Date (EDD): ${edd.toDateString()}</p>
                <p>Current Gestational Age: ${gestationalWeeks} weeks, ${gestationalDays} days</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
