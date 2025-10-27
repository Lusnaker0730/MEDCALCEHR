// js/calculator-page.js
import { displayPatientInfo } from '/js/utils.js';
import { calculatorModules } from '/js/calculators/index.js'; // Keep for title lookup

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
    const calculatorInfo = calculatorModules.find(c => c.id === calculatorId);

    if (!calculatorInfo) {
        container.innerHTML = `<h2>Calculator "${calculatorId}" not found.</h2>`;
        return;
    }

    // Set page title immediately from metadata
    pageTitle.textContent = calculatorInfo.title;
    const card = document.createElement('div');
    card.className = 'calculator-card';
    container.appendChild(card);

    const loadCalculator = async () => {
        try {
            // Dynamically import the specific calculator module from its own folder
            const module = await import(`/js/calculators/${calculatorId}/index.js`);
            // The calculator object is usually the main export, let's find it.
            const calculator = Object.values(module)[0];

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
            card.innerHTML =
                '<div class="error-box">This calculator is temporarily unavailable due to an error.</div>';
        }
    };

    loadCalculator();
};
