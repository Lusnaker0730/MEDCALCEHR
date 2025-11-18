// js/calculators/caprini.js
import { calculateAge } from '../../utils.js';

export const caprini = {
    id: 'caprini',
    title: 'Caprini Score for Venous Thromboembolism (2005)',
    description: 'Stratifies VTE risk in surgical patients, guiding prophylaxis decisions.',
    generateHTML: function () {
        const riskFactors = {
            '1 Point': [
                { id: 'age41', label: 'Age 41-60 years' },
                { id: 'minor-surgery', label: 'Minor surgery planned' },
                { id: 'major-surgery', label: 'Major open surgery (>45 min)' },
                { id: 'laparoscopy', label: 'Laparoscopic surgery (>45 min)' },
                { id: 'arthroscopy', label: 'Arthroscopic surgery' },
                { id: 'bmi', label: 'BMI > 25 kg/m²' },
                { id: 'swollen-legs', label: 'Swollen legs (current)' },
                { id: 'varicose', label: 'Varicose veins' },
                { id: 'sepsis', label: 'Sepsis (<1 month)' },
                { id: 'pneumonia', label: 'Serious lung disease incl. pneumonia (<1 month)' },
                { id: 'bed-rest', label: 'Confined to bed (>72 hours)' },
                { id: 'cast', label: 'Immobilizing plaster cast' },
                { id: 'central-venous', label: 'Central venous access' }
            ],
            '2 Points': [
                { id: 'age61', label: 'Age 61-74 years' },
                { id: 'malignancy', label: 'Malignancy (present or previous)' }
            ],
            '3 Points': [
                { id: 'age75', label: 'Age ≥ 75 years' },
                { id: 'history-vte', label: 'History of VTE' },
                { id: 'family-history-vte', label: 'Family history of VTE' },
                {
                    id: 'thrombophilia',
                    label: 'Thrombophilia (e.g., Factor V Leiden, Prothrombin 20210A)'
                }
            ],
            '5 Points': [
                { id: 'stroke-paralysis', label: 'Stroke with paralysis (<1 month)' },
                { id: 'elective-hip-knee', label: 'Elective major lower extremity arthroplasty' },
                { id: 'hip-pelvis-fracture', label: 'Hip, pelvis, or leg fracture (<1 month)' },
                { id: 'spinal-cord-injury', label: 'Acute spinal cord injury (<1 month)' }
            ]
        };

        let html = `<h3>${this.title}</h3><p>${this.description}</p>`;

        for (const [points, factors] of Object.entries(riskFactors)) {
            html += `<h4>${points}</h4><div class="checklist">`;
            factors.forEach(factor => {
                html += `<div class="check-item"><input type="checkbox" id="${factor.id}" data-points="${points.split(' ')[0]}"><label for="${factor.id}">${factor.label}</label></div>`;
            });
            html += '</div>';
        }

        html += `
            <div id="caprini-result" class="result" style="display:none;"></div>
        `;
        return html;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            let score = 0;
            container.querySelectorAll('.checklist input[type="checkbox"]').forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            // Handle mutually exclusive age points
            if (container.querySelector('#age75')?.checked) {
                if (container.querySelector('#age61')?.checked) {
                    score -= 2;
                }
                if (container.querySelector('#age41')?.checked) {
                    score -= 1;
                }
            } else if (container.querySelector('#age61')?.checked) {
                if (container.querySelector('#age41')?.checked) {
                    score -= 1;
                }
            }

            let riskCategory = '';
            let recommendation = '';
            let alertClass = '';
            if (score === 0) {
                riskCategory = 'Lowest Risk';
                recommendation = 'Early ambulation.';
                alertClass = 'success';
            } else if (score >= 1 && score <= 2) {
                riskCategory = 'Low Risk';
                recommendation =
                    'Mechanical prophylaxis (e.g., intermittent pneumatic compression devices).';
                alertClass = 'info';
            } else if (score >= 3 && score <= 4) {
                riskCategory = 'Moderate Risk';
                recommendation =
                    'Pharmacologic prophylaxis (e.g., LMWH or UFH) OR Mechanical prophylaxis.';
                alertClass = 'warning';
            } else {
                riskCategory = 'High Risk';
                recommendation =
                    'Pharmacologic prophylaxis (e.g., LMWH or UFH) AND Mechanical prophylaxis.';
                alertClass = 'danger';
            }

            const resultEl = container.querySelector('#caprini-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>Caprini Score Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">points</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${riskCategory}</strong>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommended Prophylaxis:</strong> ${recommendation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Pre-fill based on patient data
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 75) {
                container.querySelector('#age75').checked = true;
            } else if (age >= 61) {
                container.querySelector('#age61').checked = true;
            } else if (age >= 41) {
                container.querySelector('#age41').checked = true;
            }
        }

        // Add event listeners
        container.querySelectorAll('.checklist input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });

        calculate();
    }
};
