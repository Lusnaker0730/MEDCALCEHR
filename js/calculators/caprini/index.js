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
            <button id="calculate-caprini">Calculate Score</button>
            <div id="caprini-result" class="result" style="display:none;"></div>
        `;
        return html;
    },
    initialize: function (client, patient) {
        // Pre-fill based on patient data
        const age = calculateAge(patient.birthDate);
        if (age >= 75) {
            document.getElementById('age75').checked = true;
        } else if (age >= 61) {
            document.getElementById('age61').checked = true;
        } else if (age >= 41) {
            document.getElementById('age41').checked = true;
        }

        document.getElementById('calculate-caprini').addEventListener('click', () => {
            let score = 0;
            document.querySelectorAll('.checklist input[type="checkbox"]').forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            // Handle mutually exclusive age points
            if (document.getElementById('age75').checked) {
                if (document.getElementById('age61').checked) {
                    score -= 2;
                }
                if (document.getElementById('age41').checked) {
                    score -= 1;
                }
            } else if (document.getElementById('age61').checked) {
                if (document.getElementById('age41').checked) {
                    score -= 1;
                }
            }

            let riskCategory = '';
            let recommendation = '';
            if (score === 0) {
                riskCategory = 'Lowest Risk';
                recommendation = 'Early ambulation.';
            } else if (score >= 1 && score <= 2) {
                riskCategory = 'Low Risk';
                recommendation =
                    'Mechanical prophylaxis (e.g., intermittent pneumatic compression devices).';
            } else if (score >= 3 && score <= 4) {
                riskCategory = 'Moderate Risk';
                recommendation =
                    'Pharmacologic prophylaxis (e.g., LMWH or UFH) OR Mechanical prophylaxis.';
            } else {
                // score >= 5
                riskCategory = 'High Risk';
                recommendation =
                    'Pharmacologic prophylaxis (e.g., LMWH or UFH) AND Mechanical prophylaxis.';
            }

            const resultEl = document.getElementById('caprini-result');
            resultEl.innerHTML = `
                <p><strong>Caprini Score:</strong> ${score}</p>
                <p><strong>Risk Category:</strong> ${riskCategory}</p>
                <hr>
                <p><strong>Recommended Prophylaxis:</strong> ${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
