// js/main.js
import { displayPatientInfo } from './utils.js';
import { calculatorModules } from './calculators/index.js';

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

    FHIR.oauth2.ready().then(client => {
        displayPatientInfo(client, patientInfoDiv);

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

    }).catch(error => {
        console.error(error);
        patientInfoDiv.innerText = "Failed to initialize SMART on FHIR client.";
    });
};
