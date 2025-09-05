
export const graceAcs = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk and Mortality Calculator',
    description: 'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="sofa-grid">
                <div class="sofa-item">
                    <label for="grace-age">Age</label>
                    <input type="number" id="grace-age" placeholder="Years">
                </div>
                <div class="sofa-item">
                    <label for="grace-hr">Heart Rate (bpm)</label>
                    <input type="number" id="grace-hr">
                </div>
                <div class="sofa-item">
                    <label for="grace-sbp">Systolic BP (mmHg)</label>
                    <input type="number" id="grace-sbp">
                </div>
                <div class="sofa-item">
                    <label for="grace-creatinine">Creatinine (mg/dL)</label>
                    <input type="number" id="grace-creatinine" step="0.1">
                </div>
                <div class="sofa-item">
                    <label for="grace-killip">Killip Class</label>
                    <select id="grace-killip">
                        <option value="0">Class I</option>
                        <option value="20">Class II</option>
                        <option value="39">Class III</option>
                        <option value="59">Class IV</option>
                    </select>
                </div>
                <div class="sofa-item">
                    <label for="grace-cardiac-arrest">Cardiac Arrest at Admission</label>
                    <select id="grace-cardiac-arrest">
                        <option value="0">No</option>
                        <option value="39">Yes</option>
                    </select>
                </div>
                <div class="sofa-item">
                    <label for="grace-st-deviation">ST Segment Deviation</label>
                    <select id="grace-st-deviation">
                        <option value="0">No</option>
                        <option value="28">Yes</option>
                    </select>
                </div>
                <div class="sofa-item">
                    <label for="grace-cardiac-enzymes">Abnormal Cardiac Enzymes</label>
                    <select id="grace-cardiac-enzymes">
                        <option value="0">No</option>
                        <option value="14">Yes</option>
                    </select>
                </div>
            </div>
            <button id="calculate-grace">Calculate Score</button>
            <div id="grace-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-grace').addEventListener('click', () => {
            const age = parseInt(document.getElementById('grace-age').value);
            const hr = parseInt(document.getElementById('grace-hr').value);
            const sbp = parseInt(document.getElementById('grace-sbp').value);
            const creatinine = parseFloat(document.getElementById('grace-creatinine').value);
            const killip = parseInt(document.getElementById('grace-killip').value);
            const arrest = parseInt(document.getElementById('grace-cardiac-arrest').value);
            const st = parseInt(document.getElementById('grace-st-deviation').value);
            const enzymes = parseInt(document.getElementById('grace-cardiac-enzymes').value);

            if (isNaN(age) || isNaN(hr) || isNaN(sbp) || isNaN(creatinine)) {
                alert('Please fill out all fields.');
                return;
            }

            let agePoints = 0;
            if (age >= 40 && age <= 49) agePoints = 18; else if (age <= 59) agePoints = 36; else if (age <= 69) agePoints = 55; else if (age <= 79) agePoints = 73; else if (age >= 80) agePoints = 91;

            let hrPoints = 0;
            if (hr >= 90 && hr <= 109) hrPoints = 7; else if (hr <= 149) hrPoints = 13; else if (hr <= 199) hrPoints = 23; else if (hr >= 200) hrPoints = 36;

            let sbpPoints = 0;
            if (sbp >= 120 && sbp <= 139) sbpPoints = 25; else if (sbp <= 119) sbpPoints = 34; else if (sbp <= 99) sbpPoints = 43; else if (sbp < 80) sbpPoints = 53;

            let crPoints = 0;
            if (creatinine >= 0.4 && creatinine <= 0.79) crPoints = 4; else if (creatinine <= 1.19) crPoints = 7; else if (creatinine <= 1.99) crPoints = 13; else if (creatinine >= 2.0) crPoints = 21;

            const totalScore = agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;
            
            // GRACE 2.0 Risk estimation for in-hospital mortality
            let inHospitalMortality = "<1%";
            if (totalScore > 140) inHospitalMortality = ">3%";
            else if (totalScore > 118) inHospitalMortality = "1-3%";

            document.getElementById('grace-result').innerHTML = `
                <p>GRACE Score: ${totalScore}</p>
                <p>In-Hospital Mortality Risk: ${inHospitalMortality}</p>
            `;
            document.getElementById('grace-result').style.display = 'block';
        });
    }
};
