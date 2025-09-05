// js/calculator-page.js
import { displayPatientInfo } from './utils.js';
import { calculatorModules } from './calculators/index.js';

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
    
    const calculator = calculatorModules.find(c => c.id === calculatorId);

    if (!calculator) {
        container.innerHTML = `<h2>Calculator "${calculatorId}" not found.</h2>`;
        return;
    }

    // Set the page title and render the calculator's HTML
    pageTitle.textContent = calculator.title;
    const card = document.createElement('div');
    card.className = 'calculator-card';
    card.innerHTML = calculator.generateHTML();
    container.appendChild(card);
    
    FHIR.oauth2.ready().then(client => {
        displayPatientInfo(client, patientInfoDiv).then(patient => {
            // Once patient data is loaded, initialize the calculator logic
            if (typeof calculator.initialize === 'function') {
                calculator.initialize(client, patient, card);
            }
        });
    }).catch(error => {
        console.error(error);
        patientInfoDiv.innerText = "Failed to initialize SMART on FHIR client.";
    });
};

