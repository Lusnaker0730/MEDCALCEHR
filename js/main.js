// js/main.js
import { displayPatientInfo } from '/js/utils.js';
import { calculatorModules, categories } from '/js/calculators/index.js';
import { favoritesManager } from '/js/favorites.js';

/**
 * Sort calculator list
 */
function sortCalculators(calculators, sortType) {
    const sorted = [...calculators];

    switch (sortType) {
        case 'a-z':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'z-a':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'recently-added':
            return sorted.reverse();
        case 'most-used':
            // Sort by usage stats
            const usage = favoritesManager.getUsage();
            return sorted.sort((a, b) => {
                const countA = usage[a.id] || 0;
                const countB = usage[b.id] || 0;
                return countB - countA;
            });
        default:
            return sorted;
    }
}

/**
 * Filter calculator list
 */
function filterCalculators(calculators, filterType, category, searchTerm = '') {
    let filtered = [...calculators];

    // Filter by special filters
    switch (filterType) {
        case 'favorites':
            const favorites = favoritesManager.getFavorites();
            filtered = filtered.filter(calc => favorites.includes(calc.id));
            break;
        case 'recent':
            const recent = favoritesManager.getRecent();
            filtered = recent
                .map(id => calculators.find(calc => calc.id === id))
                .filter(calc => calc !== undefined);
            return filtered; // Keep order for recent
        case 'all':
        default:
            // No special filter
            break;
    }

    // Filter by category
    if (category && category !== 'all') {
        filtered = filtered.filter(calc => calc.category === category);
    }

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(calc =>
            calc.title.toLowerCase().includes(term) ||
            (calc.description && calc.description.toLowerCase().includes(term))
        );
    }

    return filtered;
}

/**
 * Render calculator list
 */
function renderCalculatorList(calculators, container) {
    container.innerHTML = '';

    if (calculators.length === 0) {
        container.innerHTML = `<p class="no-results">No calculators found matching your criteria.</p>`;
        return;
    }

    calculators.forEach(calc => {
        const link = document.createElement('a');
        link.href = `calculator.html?name=${calc.id}`;
        link.className = 'list-item';

        // Content area
        const contentDiv = document.createElement('div');
        contentDiv.className = 'list-item-content';

        const title = document.createElement('span');
        title.className = 'list-item-title';
        title.textContent = calc.title;
        contentDiv.appendChild(title);

        // Category badge
        if (calc.category) {
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'category-badge';
            categoryBadge.textContent = categories[calc.category] || calc.category;
            categoryBadge.setAttribute('data-category', calc.category);
            contentDiv.appendChild(categoryBadge);
        }

        // Description (if any)
        if (calc.description) {
            const description = document.createElement('span');
            description.className = 'list-item-description';
            description.textContent = calc.description;
            contentDiv.appendChild(description);
        }

        link.appendChild(contentDiv);

        // Favorite button
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.setAttribute('data-calculator-id', calc.id);
        favoriteBtn.innerHTML = favoritesManager.isFavorite(calc.id) ? '⭐' : '☆';
        favoriteBtn.title = favoritesManager.isFavorite(calc.id)
            ? 'Remove from Favorites'
            : 'Add to Favorites';

        // Prevent clicking favorite button from triggering link
        favoriteBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const isFavorite = favoritesManager.toggleFavorite(calc.id);
            favoriteBtn.innerHTML = isFavorite ? '⭐' : '☆';
            favoriteBtn.title = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
        });

        link.appendChild(favoriteBtn);
        container.appendChild(link);
    });
}

/**
 * Update stats display
 */
function updateStats(total, showing) {
    const statsEl = document.getElementById('calculator-stats');
    if (statsEl) {
        statsEl.textContent = `Showing ${showing} / ${total} results`;
    }
}

/**
 * Main program
 */
window.onload = () => {
    // Get DOM elements
    const patientInfoDiv = document.getElementById('patient-info');
    const calculatorListDiv = document.getElementById('calculator-list');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const categorySelect = document.getElementById('category-select');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // State variables
    let currentSortType = 'a-z';
    let currentFilterType = 'all';
    let currentCategory = 'all';

    /**
     * Update display
     */
    function updateDisplay() {
        const searchTerm = searchBar.value;

        // Filter and sort
        let filtered = filterCalculators(
            calculatorModules,
            currentFilterType,
            currentCategory,
            searchTerm
        );

        const sorted = sortCalculators(filtered, currentSortType);

        // Render
        renderCalculatorList(sorted, calculatorListDiv);

        // Update stats
        updateStats(calculatorModules.length, sorted.length);
    }

    /**
     * Update filter button states
     */
    function updateFilterButtons() {
        filterBtns.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            if (filterType === currentFilterType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            // Update counts
            if (filterType === 'favorites') {
                const count = favoritesManager.getFavoritesCount();
                btn.querySelector('.filter-count')?.remove();
                if (count > 0) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'filter-count';
                    countBadge.textContent = count;
                    btn.appendChild(countBadge);
                }
            } else if (filterType === 'recent') {
                const count = favoritesManager.getRecent().length;
                btn.querySelector('.filter-count')?.remove();
                if (count > 0) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'filter-count';
                    countBadge.textContent = count;
                    btn.appendChild(countBadge);
                }
            }
        });
    }

    // ========== Initialize FHIR ==========
    displayPatientInfo(null, patientInfoDiv);

    FHIR.oauth2
        .ready()
        .then(client => {
            displayPatientInfo(client, patientInfoDiv);
        })
        .catch(error => {
            console.log('FHIR client not ready, patient info will be loaded from cache if available.');
        });

    // ========== Initialize Category Selector ==========
    if (categorySelect) {
        // Add All option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Categories';
        categorySelect.appendChild(allOption);

        // Add category options
        Object.keys(categories).forEach(categoryKey => {
            const option = document.createElement('option');
            option.value = categoryKey;
            option.textContent = categories[categoryKey];
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', e => {
            currentCategory = e.target.value;
            updateDisplay();
        });
    }

    // ========== Initialize Filter Buttons ==========
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilterType = btn.getAttribute('data-filter');
            updateFilterButtons();
            updateDisplay();
        });
    });

    // ========== Search Function ==========
    searchBar.addEventListener('input', updateDisplay);

    // ========== Sort Function ==========
    sortSelect.addEventListener('change', e => {
        currentSortType = e.target.value;
        updateDisplay();
    });

    // ========== Listen for Favorite Changes ==========
    favoritesManager.addListener((type) => {
        updateFilterButtons();
        // If currently showing favorites/recent, update list
        if (currentFilterType === 'favorites' || currentFilterType === 'recent') {
            updateDisplay();
        }
    });

    // ========== Initial Render ==========
    updateDisplay();
    updateFilterButtons();
};
