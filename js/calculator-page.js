// js/calculator-page.js
import { displayPatientInfo } from '/js/utils.js';
import { loadCalculator, getCalculatorMetadata } from '/js/calculators/index.js';
import { favoritesManager } from '/js/favorites.js';


// Cache version - increment this when you update calculators to force reload
window.CACHE_VERSION = '1.0.5';

/**
 * Show loading indicator
 */
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-container" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            min-height: 200px;
        ">
            <div class="loading-spinner" style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
            "></div>
            <p style="margin-top: 20px; color: #666; font-size: 0.95em;">載入計算器中...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

/**
 * Show error message
 */
function showError(element, message) {
    element.innerHTML = `
        <div class="error-box" style="
            background: #fee;
            border-left: 4px solid #d32f2f;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        ">
            <div style="font-weight: 600; color: #d32f2f; margin-bottom: 8px;">
                ⚠️ 錯誤
            </div>
            <div style="color: #555; font-size: 0.9em;">
                ${message}
            </div>
        </div>
    `;
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const calculatorId = params.get('name');

    const patientInfoDiv = document.getElementById('patient-info');
    const container = document.getElementById('calculator-container');
    const pageTitle = document.getElementById('page-title');

    if (!calculatorId) {
        container.innerHTML = '<h2>No calculator specified.</h2>';
        return;
    }

    // Find metadata for title
    const calculatorInfo = getCalculatorMetadata(calculatorId);

    if (!calculatorInfo) {
        container.innerHTML = `<h2>Calculator "${calculatorId}" not found.</h2>`;
        return;
    }

    // Set page title immediately from metadata
    pageTitle.textContent = calculatorInfo.title;
    const card = document.createElement('div');
    card.className = 'calculator-card';
    container.appendChild(card);

    // 記錄最近使用和使用統計
    favoritesManager.addToRecent(calculatorId);
    favoritesManager.trackUsage(calculatorId);

    // Show loading indicator
    showLoading(card);

    const loadCalculatorModule = async () => {
        try {
            // Use the new loadCalculator function from index.js
            const calculator = await loadCalculator(calculatorId);

            if (!calculator || typeof calculator.generateHTML !== 'function') {
                throw new Error('Invalid calculator module structure.');
            }

            card.innerHTML = calculator.generateHTML();

            FHIR.oauth2
                .ready()
                .then(client => {
                    displayPatientInfo(client, patientInfoDiv).then(patient => {
                        if (typeof calculator.initialize === 'function') {
                            // Add a try-catch here as well to catch runtime errors during initialization
                            try {
                                calculator.initialize(client, patient, card);
                            } catch (initError) {
                                console.error('Error during calculator initialization:', initError);
                                card.innerHTML =
                                    '<div class="error-box">An error occurred while initializing this calculator.</div>';
                            }
                        }
                    });
                })
                .catch(error => {
                    console.error(error);
                    patientInfoDiv.innerText = 'Failed to initialize SMART on FHIR client.';
                });
        } catch (error) {
            console.error(`Failed to load calculator module: ${calculatorId}`, error);
            showError(
                card,
                '此計算器暫時無法使用。請稍後再試或聯繫技術支援。'
            );
        }
    };

    loadCalculatorModule();
};
