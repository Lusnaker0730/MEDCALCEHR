// src/main.ts
import FHIR from 'fhirclient';
import { displayPatientInfo } from './utils.js';
import {
    calculatorModules,
    categories,
    CalculatorMetadata,
    CategoryKey
} from './calculators/index.js';
import { favoritesManager } from './favorites.js';
import { auditEventService } from './audit-event-service.js';
import { provenanceService } from './provenance-service.js';
import { sessionManager } from './session-manager.js';
import { initSentry } from './sentry.js';
import { logger } from './logger.js';
import { initWebVitals } from './web-vitals.js';
import { FuzzySearch } from './fuzzy-search.js';
import { calculationHistory } from './calculation-history.js';

// Initialize Sentry early
initSentry();

// Initialize Web Vitals
initWebVitals();

type SortType = 'a-z' | 'z-a' | 'recently-added' | 'most-used';
type FilterType = 'all' | 'favorites' | 'recent' | 'history';

const fuzzySearch = new FuzzySearch(calculatorModules);

/**
 * Sort calculator list
 */
function sortCalculators(
    calculators: CalculatorMetadata[],
    sortType: SortType
): CalculatorMetadata[] {
    const sorted = [...calculators];

    switch (sortType) {
        case 'a-z':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'z-a':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'recently-added':
            return sorted.reverse();
        case 'most-used': {
            // Sort by usage stats
            const usage = favoritesManager.getUsage();
            return sorted.sort((a, b) => {
                const countA = usage[a.id] || 0;
                const countB = usage[b.id] || 0;
                return countB - countA;
            });
        }
        default:
            return sorted;
    }
}

/**
 * Filter calculator list
 */
function filterCalculators(
    calculators: CalculatorMetadata[],
    filterType: FilterType,
    category: string,
    searchTerm: string = ''
): CalculatorMetadata[] {
    let filtered = [...calculators];

    // Filter by special filters
    switch (filterType) {
        case 'favorites': {
            const favorites = favoritesManager.getFavorites();
            filtered = filtered.filter(calc => favorites.includes(calc.id));
            break;
        }
        case 'recent': {
            const recent = favoritesManager.getRecent();
            filtered = recent
                .map(id => calculators.find(calc => calc.id === id))
                .filter((calc): calc is CalculatorMetadata => calc !== undefined);
            return filtered; // Keep order for recent
        }
        case 'history': {
            const entries = calculationHistory.getEntries(20);
            const seen = new Set<string>();
            filtered = entries
                .map(entry => calculators.find(calc => calc.id === entry.calculatorId))
                .filter((calc): calc is CalculatorMetadata => {
                    if (!calc || seen.has(calc.id)) return false;
                    seen.add(calc.id);
                    return true;
                });
            return filtered;
        }
        case 'all':
        default:
            // No special filter
            break;
    }

    // Filter by category
    if (category && category !== 'all') {
        filtered = filtered.filter(calc => calc.category === category);
    }

    // Filter by search term (fuzzy search for 2+ chars, substring for 1 char)
    if (searchTerm) {
        if (searchTerm.trim().length >= 2) {
            const fuzzyResults = fuzzySearch.search(searchTerm);
            const filteredIds = new Set(filtered.map(c => c.id));
            filtered = fuzzyResults.filter(c => filteredIds.has(c.id));
        } else {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                calc =>
                    calc.title.toLowerCase().includes(term) ||
                    (calc.description && calc.description.toLowerCase().includes(term))
            );
        }
    }

    return filtered;
}

/**
 * Render calculator list
 */
function renderCalculatorList(calculators: CalculatorMetadata[], container: HTMLElement): void {
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
            categoryBadge.textContent = categories[calc.category as CategoryKey] || calc.category;
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
        favoriteBtn.addEventListener('click', (e: Event) => {
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
function updateStats(total: number, showing: number): void {
    const statsEl = document.getElementById('calculator-stats');
    if (statsEl) {
        statsEl.textContent = `Showing ${showing} / ${total} results`;
    }
}

/**
 * Render category chips (desktop horizontal bar)
 */
function renderCategoryChips(
    container: HTMLElement,
    currentCategory: string,
    onCategoryChange: (category: string) => void
): void {
    container.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.className = `category-chip${currentCategory === 'all' ? ' active' : ''}`;
    allChip.textContent = 'All';
    allChip.addEventListener('click', () => onCategoryChange('all'));
    container.appendChild(allChip);

    (Object.keys(categories) as CategoryKey[]).forEach(key => {
        const count = calculatorModules.filter(c => c.category === key).length;
        const chip = document.createElement('button');
        chip.className = `category-chip${currentCategory === key ? ' active' : ''}`;

        const label = document.createTextNode(categories[key] + ' ');
        chip.appendChild(label);

        const badge = document.createElement('span');
        badge.className = 'chip-count';
        badge.textContent = String(count);
        chip.appendChild(badge);

        chip.addEventListener('click', () => onCategoryChange(key));
        container.appendChild(chip);
    });
}

/**
 * Render recently used calculator strip
 */
function renderRecentStrip(container: HTMLElement): void {
    const recent = favoritesManager.getRecent().slice(0, 5);
    if (recent.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = '';
    container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'recent-strip-title';
    title.textContent = 'Recently Used';
    container.appendChild(title);

    const list = document.createElement('div');
    list.className = 'recent-strip-list';

    recent.forEach(id => {
        const calc = calculatorModules.find(c => c.id === id);
        if (!calc) return;
        const item = document.createElement('a');
        item.href = `calculator.html?name=${calc.id}`;
        item.className = 'recent-strip-item';
        item.textContent = calc.title;
        list.appendChild(item);
    });

    container.appendChild(list);
}

/**
 * Render calculation history list
 */
function renderHistoryList(container: HTMLElement): void {
    const entries = calculationHistory.getEntries(50);
    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = '<p class="no-results">No calculation history yet.</p>';
        return;
    }

    const list = document.createElement('div');
    list.className = 'history-list';

    entries.forEach(entry => {
        const item = document.createElement('a');
        item.href = `calculator.html?name=${entry.calculatorId}`;
        item.className = 'history-entry';

        const header = document.createElement('div');
        header.className = 'history-entry-header';

        const titleEl = document.createElement('span');
        titleEl.className = 'history-entry-title';
        titleEl.textContent = entry.calculatorTitle;
        header.appendChild(titleEl);

        const time = document.createElement('span');
        time.className = 'history-entry-time';
        time.textContent = new Date(entry.timestamp).toLocaleString();
        header.appendChild(time);

        item.appendChild(header);

        const summary = document.createElement('div');
        summary.className = 'history-entry-summary';
        summary.textContent = entry.resultSummary;
        item.appendChild(summary);

        list.appendChild(item);
    });

    container.appendChild(list);
}

/**
 * Main program
 */
window.onload = () => {
    // Get DOM elements
    const patientInfoEl = document.getElementById('patient-info');
    const calculatorListEl = document.getElementById('calculator-list');
    const searchBarEl = document.getElementById('search-bar') as HTMLInputElement | null;
    const sortSelectEl = document.getElementById('sort-select') as HTMLSelectElement | null;
    const categorySelectEl = document.getElementById('category-select') as HTMLSelectElement | null;
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!patientInfoEl || !calculatorListEl || !searchBarEl || !sortSelectEl) {
        logger.error('Required DOM elements not found');
        return;
    }

    // Type narrowing - these are guaranteed to be non-null after the check above
    const patientInfoDiv = patientInfoEl;
    const calculatorListDiv = calculatorListEl;
    const searchBar = searchBarEl;
    const sortSelect = sortSelectEl;
    const categorySelect = categorySelectEl;

    // State variables
    let currentSortType: SortType = 'a-z';
    let currentFilterType: FilterType = 'all';
    let currentCategory: string = 'all';

    /**
     * Update display
     */
    function updateDisplay(): void {
        const searchTerm = searchBar.value;

        // Show/hide recent strip (only when filter='all' and no search)
        const recentStripEl = document.getElementById('recent-strip');
        if (recentStripEl) {
            if (currentFilterType === 'all' && !searchTerm) {
                renderRecentStrip(recentStripEl);
            } else {
                recentStripEl.style.display = 'none';
            }
        }

        // Render category chips (sync with dropdown)
        const categoryChipsEl = document.getElementById('category-chips');
        if (categoryChipsEl) {
            renderCategoryChips(categoryChipsEl, currentCategory, (cat) => {
                currentCategory = cat;
                if (categorySelect) categorySelect.value = cat;
                updateDisplay();
            });
        }

        // History mode: render history entries directly
        if (currentFilterType === 'history') {
            renderHistoryList(calculatorListDiv);
            updateStats(calculatorModules.length, calculationHistory.getEntryCount());
            return;
        }

        // Filter and sort
        const filtered = filterCalculators(
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
    function updateFilterButtons(): void {
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
                    countBadge.textContent = count.toString();
                    btn.appendChild(countBadge);
                }
            } else if (filterType === 'recent') {
                const count = favoritesManager.getRecent().length;
                btn.querySelector('.filter-count')?.remove();
                if (count > 0) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'filter-count';
                    countBadge.textContent = count.toString();
                    btn.appendChild(countBadge);
                }
            } else if (filterType === 'history') {
                const count = calculationHistory.getEntryCount();
                btn.querySelector('.filter-count')?.remove();
                if (count > 0) {
                    const countBadge = document.createElement('span');
                    countBadge.className = 'filter-count';
                    countBadge.textContent = count.toString();
                    btn.appendChild(countBadge);
                }
            }
        });
    }

    // ========== Initialize FHIR ==========
    displayPatientInfo(null, patientInfoDiv);

    FHIR.oauth2
        .ready()
        .then(async (client: any) => {
            displayPatientInfo(client, patientInfoDiv!);

            // Fetch User/Practitioner Info
            try {
                // Try to read the user (Practitioner) from the client
                const user = await client.user.read();
                const practitionerNameEl = document.getElementById('practitioner-name');
                const practitionerInfoEl = document.getElementById('practitioner-info');

                if (
                    user &&
                    (user.resourceType === 'Practitioner' ||
                        user.resourceType === 'PractitionerRole')
                ) {
                    let name = 'Unknown Practitioner';

                    if (user.resourceType === 'Practitioner') {
                        name =
                            user.name?.[0]?.text ||
                            `${user.name?.[0]?.family || ''} ${user.name?.[0]?.given?.join(' ') || ''}`.trim();
                    } else if (
                        user.resourceType === 'PractitionerRole' &&
                        user.practitioner?.display
                    ) {
                        name = user.practitioner.display;
                    }

                    if (practitionerNameEl)
                        practitionerNameEl.textContent = name || 'Practitioner';
                    if (practitionerInfoEl) {
                        practitionerInfoEl.classList.remove('hidden');
                        practitionerInfoEl.style.display = 'flex';
                    }

                    // Set Practitioner ID for favorites
                    if (user.id) {
                        favoritesManager.setPractitionerId(user.id);
                        calculationHistory.setPractitionerId(user.id);
                        logger.info('Practitioner set', { practitionerId: user.id });

                        // Log login event to audit trail (IHE BALP)
                        auditEventService.logLogin(user.id, name, true).catch(err => {
                            logger.warn('Failed to log audit event', { error: String(err) });
                        });

                        // Set provenance context for data lineage tracking
                        provenanceService.setPractitioner(user.id, name);
                    }
                }
            } catch (error) {
                logger.warn('Failed to fetch user info', { error: String(error) });
            }
        })
        .catch(() => {
            logger.info(
                'FHIR client not ready, patient info will be loaded from cache if available.'
            );
        });

    // ========== Initialize Category Selector ==========
    if (categorySelect) {
        // Add All option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Categories';
        categorySelect.appendChild(allOption);

        // Add category options
        (Object.keys(categories) as CategoryKey[]).forEach(categoryKey => {
            const option = document.createElement('option');
            option.value = categoryKey;
            option.textContent = categories[categoryKey];
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', (e: Event) => {
            currentCategory = (e.target as HTMLSelectElement).value;
            updateDisplay();
        });
    }

    // ========== Initialize Filter Buttons ==========
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilterType = btn.getAttribute('data-filter') as FilterType;
            updateFilterButtons();
            updateDisplay();
        });
    });

    // ========== Search Function ==========
    searchBar.addEventListener('input', updateDisplay);

    // ========== Sort Function ==========
    sortSelect.addEventListener('change', (e: Event) => {
        currentSortType = (e.target as HTMLSelectElement).value as SortType;
        updateDisplay();
    });

    // ========== Listen for Favorite Changes ==========
    favoritesManager.addListener(() => {
        updateFilterButtons();
        // If currently showing favorites/recent, update list
        if (currentFilterType === 'favorites' || currentFilterType === 'recent' || currentFilterType === 'history') {
            updateDisplay();
        }
    });

    // ========== Session Management ==========
    sessionManager.start();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionManager.logout();
        });
    }

    // ========== Initial Render ==========
    updateDisplay();
    updateFilterButtons();
};
