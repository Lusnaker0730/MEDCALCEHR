
// js/calculators/geneva-score.js
export const genevaScore = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <form id="geneva-form">
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-age" value="1"><label for="geneva-age">Age > 65 years</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-prev-dvt" value="1"><label for="geneva-prev-dvt">Previous DVT or PE</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-surgery" value="1"><label for="geneva-surgery">Surgery or fracture within 1 month</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-malignancy" value="1"><label for="geneva-malignancy">Active malignancy</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-limb-pain" value="1"><label for="geneva-limb-pain">Unilateral lower limb pain</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-hemoptysis" value="1"><label for="geneva-hemoptysis">Hemoptysis</label>
                </div>
                <div class="input-group">
                    <label for="geneva-hr">Heart Rate (bpm):</label>
                    <input type="number" id="geneva-hr" placeholder="e.g., 85">
                </div>
                 <div class="checkbox-group">
                    <input type="checkbox" id="geneva-palpation" value="1"><label for="geneva-palpation">Pain on deep vein palpation AND unilateral edema</label>
                </div>
            </form>
            <button id="calculate-geneva">Calculate Score</button>
            <div id="geneva-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        // If only one parameter is passed (old style), use it as container
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }
        
        // Use document if container is not a DOM element
        const root = container || document;
        
        const calculateBtn = root.querySelector('#calculate-geneva');
        if (!calculateBtn) {
            console.error('Calculate button not found');
            return;
        }
        
        calculateBtn.addEventListener('click', () => {
            let score = 0;
            const checkboxes = root.querySelectorAll('#geneva-form input[type="checkbox"]:checked');
            checkboxes.forEach(box => {
                score += parseInt(box.value, 10);
            });

            const hrInput = root.querySelector('#geneva-hr');
            const hr = parseInt(hrInput.value, 10);
            if (hr >= 75 && hr <= 94) {
                score += 1;
            } else if (hr >= 95) {
                score += 2;
            }

            let probability = '';
            let riskLevel = '';
            let bgColor = '';
            
            // Using three-level classification
            if (score <= 1) {
                probability = 'Low Clinical Probability';
                riskLevel = 'Low Risk';
                bgColor = '#28a745';
            } else if (score <= 4) {
                probability = 'Intermediate Clinical Probability';
                riskLevel = 'Intermediate Risk';
                bgColor = '#ffc107';
            } else {
                probability = 'High Clinical Probability';
                riskLevel = 'High Risk';
                bgColor = '#dc3545';
            }

            const resultEl = root.querySelector('#geneva-result');
            resultEl.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Revised Geneva Score</h3>
                    <div style="font-size: 3em; font-weight: bold; color: ${bgColor}; margin: 15px 0;">
                        ${score}
                    </div>
                    <div style="display: inline-block; padding: 8px 16px; background: ${bgColor}; color: white; border-radius: 20px; font-weight: 600; margin: 10px 0;">
                        ${riskLevel}
                    </div>
                    <p style="font-size: 1.1em; margin: 15px 0 0 0; color: #495057;">
                        ${probability}
                    </p>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666;">
                    <strong>PE Risk by Score:</strong><br>
                    0-1: Low (8% prevalence)<br>
                    2-4: Intermediate (28% prevalence)<br>
                    ≥5: High (74% prevalence)
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor = score <= 1 ? '#d4edda' : (score <= 4 ? '#fff3cd' : '#f8d7da');
            resultEl.style.borderColor = score <= 1 ? '#c3e6cb' : (score <= 4 ? '#ffc107' : '#f5c6cb');
        });
        
        // Auto-populate patient age if available
        if (patient && patient.birthDate) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age > 65) {
                const ageCheckbox = root.querySelector('#geneva-age');
                if (ageCheckbox) ageCheckbox.checked = true;
            }
        }
    }
};
