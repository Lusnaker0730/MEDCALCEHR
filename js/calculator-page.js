// src/calculator-page.ts
import { displayPatientInfo } from './utils.js';
import { loadCalculator, getCalculatorMetadata } from './calculators/index.js';
import { favoritesManager } from './favorites.js';
import { displayError } from './errorHandler.js';
import { auditEventService } from './audit-event-service.js';
import { provenanceService } from './provenance-service.js';
import { sessionManager } from './session-manager.js';
// Cache version - increment this when you update calculators to force reload
window.CACHE_VERSION = '1.0.5';
/**
 * Show loading indicator
 */
function showLoading(element) {
    element.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading calculator...</p>
        </div>
    `;
}
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const calculatorId = params.get('name');
    const patientInfoDiv = document.getElementById('patient-info');
    const container = document.getElementById('calculator-container');
    const pageTitle = document.getElementById('page-title');
    if (!patientInfoDiv || !container || !pageTitle) {
        console.error('Required DOM elements not found');
        return;
    }
    if (!calculatorId) {
        container.innerHTML = '<h2>No calculator specified.</h2>';
        return;
    }
    // Find metadata for title
    const calculatorInfo = getCalculatorMetadata(calculatorId);
    if (!calculatorInfo) {
        // Use textContent to prevent XSS from URL parameter
        const errorHeading = document.createElement('h2');
        errorHeading.textContent = `Calculator "${calculatorId}" not found.`;
        container.appendChild(errorHeading);
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
            const calculator = (await loadCalculator(calculatorId));
            if (!calculator || typeof calculator.generateHTML !== 'function') {
                throw new Error('Invalid calculator module structure.');
            }
            card.innerHTML = calculator.generateHTML();
            // 初始化計算器的輔助函數
            const initializeCalculator = (client, patient) => {
                if (typeof calculator.initialize === 'function') {
                    try {
                        calculator.initialize(client, patient, card);
                    }
                    catch (initError) {
                        console.error('Error during calculator initialization:', initError);
                        card.innerHTML =
                            '<div class="error-box">An error occurred while initializing this calculator.</div>';
                    }
                }
            };
            window.FHIR.oauth2
                .ready()
                .then((client) => {
                displayPatientInfo(client, patientInfoDiv).then((patient) => {
                    // Log patient access to audit trail (IHE BALP)
                    if (patient?.id) {
                        const patientName = patient.name?.[0]?.text ||
                            `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`.trim();
                        // Set audit and provenance context
                        auditEventService.setPatientContext(patient.id, patientName);
                        provenanceService.setPatientContext(patient.id, patientName);
                        auditEventService.logPatientAccess(patient.id, patientName, 'Calculator', calculatorId).catch(err => {
                            console.warn('[MedCalc] Failed to log patient access audit:', err);
                        });
                    }
                    initializeCalculator(client, patient);
                });
            })
                .catch((error) => {
                console.error(error);
                patientInfoDiv.innerText =
                    'No patient data available. Please launch from the EHR.';
                // 即使沒有 FHIR 客戶端，也要初始化計算器（讓用戶可以手動輸入）
                initializeCalculator(null, null);
            });
        }
        catch (error) {
            console.error(`Failed to load calculator module: ${calculatorId}`, error);
            displayError(card, error, 'This calculator is temporarily unavailable. Please try again later or contact support.');
        }
    };
    // ========== Session Management ==========
    sessionManager.start();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionManager.logout();
        });
    }
    loadCalculatorModule();
};
