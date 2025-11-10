// js/main.js
import { displayPatientInfo } from '/js/utils.js';
import { calculatorModules } from '/js/calculators/index.js';

function sortCalculators(calculators, sortType) {
    const sorted = [...calculators]; // Create a copy to avoid mutating original

    switch (sortType) {
        case 'a-z':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'z-a':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'recently-added':
            // For now, reverse the default order (assuming newer ones are at the end)
            return sorted.reverse();
        case 'most-used':
            // For now, use the default order (could be enhanced with usage tracking)
            return sorted;
        default:
            return sorted;
    }
}

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
    const sortSelect = document.getElementById('sort-select');

    const currentCalculators = calculatorModules;
    let currentSortType = 'a-z';

    // Function to update the display based on current filters and sort
    function updateDisplay() {
        const searchTerm = searchBar.value.toLowerCase();
        const filteredCalculators = currentCalculators.filter(calc =>
            calc.title.toLowerCase().includes(searchTerm)
        );

        const sortedCalculators = sortCalculators(filteredCalculators, currentSortType);
        renderCalculatorList(sortedCalculators, calculatorListDiv);
    }

    // Immediately try to render patient info from cache, without waiting for the FHIR client.
    displayPatientInfo(null, patientInfoDiv);

    // Then, try to initialize the FHIR client to refresh the data.
    FHIR.oauth2
        .ready()
        .then(client => {
            displayPatientInfo(client, patientInfoDiv);
        })
        .catch(error => {
            console.log(
                'FHIR client not ready, patient info will be loaded from cache if available.'
            );
        });

    // Initial render of the full list
    updateDisplay();

    // Add search functionality
    searchBar.addEventListener('input', updateDisplay);

    // Add sort functionality
    sortSelect.addEventListener('change', e => {
        currentSortType = e.target.value;
        updateDisplay();
    });
};
