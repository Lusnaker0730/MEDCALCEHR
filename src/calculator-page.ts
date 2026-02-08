// src/calculator-page.ts
import FHIR from 'fhirclient';
import { displayPatientInfo } from './utils.js';
import { loadCalculator, getCalculatorMetadata, CalculatorModule } from './calculators/index.js';
import { favoritesManager } from './favorites.js';
import { displayError } from './errorHandler.js';
import { auditEventService } from './audit-event-service.js';
import { provenanceService } from './provenance-service.js';
import { sessionManager } from './session-manager.js';
import { initSentry } from './sentry.js';
import { logger } from './logger.js';
import { initWebVitals } from './web-vitals.js';

// Initialize Sentry early
initSentry();

// Initialize Web Vitals
initWebVitals();

// Window.CACHE_VERSION type declared in src/types/global.d.ts

interface FHIRClient {
    patient: {
        read(): Promise<Patient>;
    };
}

interface Patient {
    id?: string;
    name?: Array<{
        given?: string[];
        family?: string;
        text?: string;
    }>;
}

// Cache version - increment this when you update calculators to force reload
window.CACHE_VERSION = '1.0.5';

/**
 * Show loading indicator
 */
function showLoading(element: HTMLElement): void {
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
        logger.error('Required DOM elements not found');
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

    const loadCalculatorModule = async (): Promise<void> => {
        try {
            // Use the new loadCalculator function from index.js
            const calculator = (await loadCalculator(calculatorId)) as CalculatorModule;

            if (!calculator || typeof calculator.generateHTML !== 'function') {
                throw new Error('Invalid calculator module structure.');
            }

            card.innerHTML = calculator.generateHTML();

            // 初始化計算器的輔助函數
            const initializeCalculator = (
                client: FHIRClient | null,
                patient: Patient | null
            ): void => {
                if (typeof calculator.initialize === 'function') {
                    try {
                        calculator.initialize(client, patient, card);
                    } catch (initError) {
                        logger.error('Error during calculator initialization', { error: String(initError), calculatorId });
                        card.innerHTML =
                            '<div class="error-box">An error occurred while initializing this calculator.</div>';
                    }
                }
            };

            FHIR.oauth2
                .ready()
                .then((client: FHIRClient) => {
                    displayPatientInfo(client, patientInfoDiv).then((patient: Patient | null) => {
                        // Log patient access to audit trail (IHE BALP)
                        if (patient?.id) {
                            const patientName = patient.name?.[0]?.text ||
                                `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`.trim();

                            // Set audit and provenance context
                            auditEventService.setPatientContext(patient.id, patientName);
                            provenanceService.setPatientContext(patient.id, patientName);

                            auditEventService.logPatientAccess(
                                patient.id,
                                patientName,
                                'Calculator',
                                calculatorId
                            ).catch(err => {
                                logger.warn('Failed to log patient access audit', { error: String(err) });
                            });
                        }

                        initializeCalculator(client, patient);
                    });
                })
                .catch((error: Error) => {
                    logger.error('FHIR client error', { error: error.message });
                    patientInfoDiv.innerText =
                        'No patient data available. Please launch from the EHR.';
                    // 即使沒有 FHIR 客戶端，也要初始化計算器（讓用戶可以手動輸入）
                    initializeCalculator(null, null);
                });
        } catch (error) {
            logger.error('Failed to load calculator module', { calculatorId, error: String(error) });
            displayError(
                card,
                error as Error,
                'This calculator is temporarily unavailable. Please try again later or contact support.'
            );
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
