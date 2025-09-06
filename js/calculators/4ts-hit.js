
export const a4tsHit = {
    id: '4ts-hit',
    title: '4Ts Score for Heparin-Induced Thrombocytopenia',
    description: 'Differentiates patients with HIT from those with other causes of thrombocytopenia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container">
                <div class="form-group">
                    <label>Thrombocytopenia</label>
                    <div class="radio-group" id="4ts-platelets">
                        <label><input type="radio" name="platelets" value="2"> >50% fall in platelets</label>
                        <label><input type="radio" name="platelets" value="1"> 30-50% fall in platelets</label>
                        <label><input type="radio" name="platelets" value="0"> <30% fall in platelets</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Timing of platelet count fall</label>
                    <div class="radio-group" id="4ts-timing">
                        <label><input type="radio" name="timing" value="2"> Clear onset between days 5-10</label>
                        <label><input type="radio" name="timing" value="1"> Consistent with 5-10 day onset, but not clear</label>
                        <label><input type="radio" name="timing" value="0"> Platelet fall < day 4 without prior heparin</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Thrombosis or other sequelae</label>
                    <div class="radio-group" id="4ts-thrombosis">
                        <label><input type="radio" name="thrombosis" value="2"> New thrombosis confirmed</label>
                        <label><input type="radio" name="thrombosis" value="1"> Progressive or recurrent thrombosis</label>
                        <label><input type="radio" name="thrombosis" value="0"> None</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other causes for thrombocytopenia</label>
                    <div class="radio-group" id="4ts-other-causes">
                        <label><input type="radio" name="other-causes" value="2"> None apparent</label>
                        <label><input type="radio" name="other-causes" value="1"> Possible</label>
                        <label><input type="radio" name="other-causes" value="0"> Definite</label>
                    </div>
                </div>
            </div>
            <div id="4ts-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        const calculate = () => {
            const platelets = document.querySelector('input[name="platelets"]:checked');
            const timing = document.querySelector('input[name="timing"]:checked');
            const thrombosis = document.querySelector('input[name="thrombosis"]:checked');
            const otherCauses = document.querySelector('input[name="other-causes"]:checked');

            if (platelets && timing && thrombosis && otherCauses) {
                const totalScore = parseInt(platelets.value) + parseInt(timing.value) + parseInt(thrombosis.value) + parseInt(otherCauses.value);

                let probability = '';
                let probabilityClass = '';
                if (totalScore >= 6) {
                    probability = 'High Probability';
                    probabilityClass = 'high-prob';
                } else if (totalScore >= 4) {
                    probability = 'Intermediate Probability';
                    probabilityClass = 'intermediate-prob';
                } else {
                    probability = 'Low Probability';
                    probabilityClass = 'low-prob';
                }

                document.getElementById('4ts-result').innerHTML = `
                    <div class="result-box ${probabilityClass}">
                        <div class="result-score">
                            <span>${totalScore} points</span>
                        </div>
                        <div class="result-interpretation">
                            <span>${probability} of HIT</span>
                        </div>
                    </div>
                `;
                document.getElementById('4ts-result').style.display = 'block';
            }
        };

        document.querySelectorAll('.radio-group input').forEach(radio => {
            radio.addEventListener('change', (event) => {
                // Handle selected class for labels
                const group = event.target.closest('.radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                
                calculate();
            });
        });
    }
};
