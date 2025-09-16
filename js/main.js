// js/main.js
import { displayPatientInfo } from '/js/utils.js';
import { calculatorModules } from '/js/calculators/index.js';

function renderCalculatorList(calculators, container) {
    container.innerHTML = ''; // Clear the list first

    if (calculators.length === 0) {
        container.innerHTML = '<p class="no-results">No calculators found.</p>';
        return;
    }

    calculators.forEach(calc => {
        const link = document.createElement('a');
        link.href = `calculator.html?name=${calc.id}`;
        link.className = 'list-item'; // Use a more generic class name

        // Create the content structure
        const contentDiv = document.createElement('div');
        contentDiv.className = 'list-item-content';

        const title = document.createElement('span');
        title.className = 'list-item-title';
        title.textContent = calc.title;
        contentDiv.appendChild(title);
        
        // Add description if it exists in the calculator object
        if (calc.description) {
            const description = document.createElement('span');
            description.className = 'list-item-description';
            description.textContent = calc.description;
            contentDiv.appendChild(description);
        }

        link.appendChild(contentDiv);
        
        // Add a star icon
        const star = document.createElement('span');
        star.className = 'list-item-star';
        star.innerHTML = '&#9734;'; // Star character
        link.appendChild(star);

        container.appendChild(link);
    });
}

window.onload = () => {
    const patientInfoDiv = document.getElementById('patient-info');
    const calculatorListDiv = document.getElementById('calculator-list');
    const searchBar = document.getElementById('search-bar');

    // Immediately try to render patient info from cache, without waiting for the FHIR client.
    displayPatientInfo(null, patientInfoDiv);

    // Then, try to initialize the FHIR client to refresh the data.
    FHIR.oauth2.ready().then(client => {
        displayPatientInfo(client, patientInfoDiv);
    }).catch(error => {
        console.log("FHIR client not ready, patient info will be loaded from cache if available.");
    });

    // Initial render of the full list
    renderCalculatorList(calculatorModules, calculatorListDiv);

    // Add search functionality
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        const filteredCalculators = calculatorModules.filter(calc => 
            calc.title.toLowerCase().includes(searchTerm)
        );
        renderCalculatorList(filteredCalculators, calculatorListDiv);
    });
};
