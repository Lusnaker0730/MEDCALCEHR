export const dueDate = {
    id: 'due-date',
    title: 'Pregnancy Due Dates Calculator',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>Calculates pregnancy dates from last period, gestational age, or date of conception.</p>
            <div class="form-group">
                <label for="lmp-date" style="font-size: 20px; font-weight: 600; display: block; margin-bottom: 12px;">First Day of Last Menstrual Period (LMP):</label>
                <input type="text" id="lmp-date" placeholder="YYYY-MM-DD (e.g., 2025-10-08)" style="font-size: 54px; padding: 20px; width: 100%; box-sizing: border-box; border: 2px solid #d1d5db; border-radius: 10px; font-weight: 600; letter-spacing: 2px;">
                <small style="display: block; margin-top: 12px; color: #6b7280; font-size: 18px;">
                    📅 Enter date in format: YYYY-MM-DD (Year-Month-Day)
                </small>
            </div>
            <button id="calculate-due-date">Calculate</button>
            <div id="due-date-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        // Set default date to today
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        const lmpInput = container.querySelector('#lmp-date');
        lmpInput.value = todayString;

        // Add input validation and formatting
        lmpInput.addEventListener('input', e => {
            let value = e.target.value.replace(/[^\d-]/g, ''); // Only allow digits and dashes

            // Auto-format as user types
            if (value.length >= 4 && value[4] !== '-') {
                value = value.slice(0, 4) + '-' + value.slice(4);
            }
            if (value.length >= 7 && value[7] !== '-') {
                value = value.slice(0, 7) + '-' + value.slice(7);
            }

            // Limit length to YYYY-MM-DD format
            if (value.length > 10) {
                value = value.slice(0, 10);
            }

            e.target.value = value;
        });

        container.querySelector('#calculate-due-date').addEventListener('click', () => {
            const lmpDateString = lmpInput.value.trim();

            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(lmpDateString)) {
                alert('請輸入正確的日期格式：YYYY-MM-DD\n例如：2025-10-08');
                return;
            }

            // Parse and validate date
            const [year, month, day] = lmpDateString.split('-').map(Number);
            const lmpDate = new Date(year, month - 1, day);

            // Check if date is valid
            if (
                isNaN(lmpDate.getTime()) ||
                lmpDate.getFullYear() !== year ||
                lmpDate.getMonth() !== month - 1 ||
                lmpDate.getDate() !== day
            ) {
                alert('請輸入有效的日期！\n請確認月份（01-12）和日期（01-31）是否正確。');
                return;
            }

            // Check if date is not in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (lmpDate > today) {
                alert('⚠️ 注意：您輸入的日期是未來的日期。\n最後月經日期通常應該是過去的日期。');
            }

            // Calculate Estimated Due Date (EDD) by adding 280 days (40 weeks)
            const edd = new Date(lmpDate.getTime());
            edd.setDate(edd.getDate() + 280);

            // Calculate Gestational Age
            const todayForCalc = new Date();
            const differenceInTime = todayForCalc.getTime() - lmpDate.getTime();
            const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
            const gestationalWeeks = Math.floor(differenceInDays / 7);
            const gestationalDays = differenceInDays % 7;

            // Format dates for display
            const formatDate = date => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const weekday = [
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ][date.getDay()];
                return `${year}-${month}-${day} (${weekday})`;
            };

            const resultEl = container.querySelector('#due-date-result');

            let gestationalAgeText = '';
            if (differenceInDays < 0) {
                gestationalAgeText =
                    '<p style="color: #ef4444; font-weight: 600;">⚠️ LMP date is in the future. Please check the date.</p>';
            } else if (differenceInDays > 294) {
                // More than 42 weeks
                gestationalAgeText = `<p style="color: #ef4444; font-weight: 600;">Current Gestational Age: ${gestationalWeeks} weeks, ${gestationalDays} days</p>
                <p style="color: #ef4444;">⚠️ Post-term pregnancy (>42 weeks). Please consult healthcare provider.</p>`;
            } else {
                gestationalAgeText = `<p><strong>Current Gestational Age:</strong> ${gestationalWeeks} weeks, ${gestationalDays} days</p>`;
            }

            resultEl.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; color: white;">📅 Estimated Due Date (EDD)</h4>
                    <p style="font-size: 1.5em; font-weight: 700; margin: 0; color: white;">${formatDate(edd)}</p>
                </div>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h5 style="margin: 0 0 10px 0; color: #374151;">📊 Pregnancy Information</h5>
                    <p><strong>LMP Date:</strong> ${formatDate(lmpDate)}</p>
                    ${gestationalAgeText}
                    <p><strong>Days until due date:</strong> ${Math.max(0, Math.floor((edd.getTime() - todayForCalc.getTime()) / (1000 * 3600 * 24)))} days</p>
                </div>
                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
                    <h5 style="margin: 0 0 10px 0; color: #92400e;">ℹ️ Important Notes</h5>
                    <ul style="margin: 5px 0; padding-left: 20px; color: #78350f;">
                        <li>This calculation assumes a 28-day menstrual cycle</li>
                        <li>Actual due date may vary by ±2 weeks</li>
                        <li>Ultrasound dating is more accurate, especially in first trimester</li>
                        <li>Full term is considered 37-42 weeks</li>
                    </ul>
                </div>
            `;
            resultEl.style.display = 'block';
        });
    }
};
