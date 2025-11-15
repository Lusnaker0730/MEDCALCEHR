// js/main.js
import { displayPatientInfo } from '/js/utils.js';
import { calculatorModules, categories } from '/js/calculators/index.js';
import { i18n } from '/js/i18n.js';
import { favoritesManager } from '/js/favorites.js';

/**
 * 排序計算器列表
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
            // 根據使用統計排序
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
 * 過濾計算器列表
 */
function filterCalculators(calculators, filterType, category, searchTerm = '') {
    let filtered = [...calculators];

    // 按特殊過濾器篩選
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
            return filtered; // 最近使用保持原順序
        case 'all':
        default:
            // 不做特殊過濾
            break;
    }

    // 按分類篩選
    if (category && category !== 'all') {
        filtered = filtered.filter(calc => calc.category === category);
    }

    // 按搜尋詞篩選
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
 * 渲染計算器列表
 */
function renderCalculatorList(calculators, container) {
    container.innerHTML = '';

    if (calculators.length === 0) {
        container.innerHTML = `<p class="no-results">${i18n.t('search.noResults')}</p>`;
        return;
    }

    calculators.forEach(calc => {
        const link = document.createElement('a');
        link.href = `calculator.html?name=${calc.id}`;
        link.className = 'list-item';

        // 內容區域
        const contentDiv = document.createElement('div');
        contentDiv.className = 'list-item-content';

        const title = document.createElement('span');
        title.className = 'list-item-title';
        title.textContent = calc.title;
        contentDiv.appendChild(title);

        // 分類標籤
        if (calc.category) {
            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'category-badge';
            categoryBadge.textContent = i18n.t(`category.${calc.category}`);
            categoryBadge.setAttribute('data-category', calc.category);
            contentDiv.appendChild(categoryBadge);
        }

        // 描述（如果有）
        if (calc.description) {
            const description = document.createElement('span');
            description.className = 'list-item-description';
            description.textContent = calc.description;
            contentDiv.appendChild(description);
        }

        link.appendChild(contentDiv);

        // 收藏按鈕
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.setAttribute('data-calculator-id', calc.id);
        favoriteBtn.innerHTML = favoritesManager.isFavorite(calc.id) ? '⭐' : '☆';
        favoriteBtn.title = favoritesManager.isFavorite(calc.id)
            ? i18n.t('favorites.remove')
            : i18n.t('favorites.add');
        
        // 阻止點擊收藏按鈕時觸發連結
        favoriteBtn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const isFavorite = favoritesManager.toggleFavorite(calc.id);
            favoriteBtn.innerHTML = isFavorite ? '⭐' : '☆';
            favoriteBtn.title = isFavorite ? i18n.t('favorites.remove') : i18n.t('favorites.add');
        });

        link.appendChild(favoriteBtn);
        container.appendChild(link);
    });
}

/**
 * 更新統計顯示
 */
function updateStats(total, showing) {
    const statsEl = document.getElementById('calculator-stats');
    if (statsEl) {
        statsEl.textContent = i18n.t('stats.showing') + ` ${showing} / ${total} ` + i18n.t('stats.results');
    }
}

/**
 * 主程式
 */
window.onload = () => {
    // 獲取DOM元素
    const patientInfoDiv = document.getElementById('patient-info');
    const calculatorListDiv = document.getElementById('calculator-list');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');
    const categorySelect = document.getElementById('category-select');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const languageToggle = document.getElementById('language-toggle');

    // 狀態變數
    let currentSortType = 'a-z';
    let currentFilterType = 'all';
    let currentCategory = 'all';

    /**
     * 更新顯示
     */
    function updateDisplay() {
        const searchTerm = searchBar.value;
        
        // 過濾和排序
        let filtered = filterCalculators(
            calculatorModules,
            currentFilterType,
            currentCategory,
            searchTerm
        );
        
        const sorted = sortCalculators(filtered, currentSortType);
        
        // 渲染
        renderCalculatorList(sorted, calculatorListDiv);
        
        // 更新統計
        updateStats(calculatorModules.length, sorted.length);
    }

    /**
     * 更新過濾按鈕狀態
     */
    function updateFilterButtons() {
        filterBtns.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            if (filterType === currentFilterType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            // 更新計數
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

    // ========== 初始化 FHIR ==========
    displayPatientInfo(null, patientInfoDiv);

    FHIR.oauth2
        .ready()
        .then(client => {
            displayPatientInfo(client, patientInfoDiv);
        })
        .catch(error => {
            console.log('FHIR client not ready, patient info will be loaded from cache if available.');
        });

    // ========== 初始化分類選擇器 ==========
    if (categorySelect) {
        // 添加全部選項
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = i18n.t('category.all');
        categorySelect.appendChild(allOption);

        // 添加分類選項
        Object.keys(categories).forEach(categoryKey => {
            const option = document.createElement('option');
            option.value = categoryKey;
            option.textContent = i18n.t(`category.${categoryKey}`);
            categorySelect.appendChild(option);
        });

        categorySelect.addEventListener('change', e => {
            currentCategory = e.target.value;
            updateDisplay();
        });
    }

    // ========== 初始化過濾按鈕 ==========
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilterType = btn.getAttribute('data-filter');
            updateFilterButtons();
            updateDisplay();
        });
    });

    // ========== 搜尋功能 ==========
    searchBar.addEventListener('input', updateDisplay);

    // ========== 排序功能 ==========
    sortSelect.addEventListener('change', e => {
        currentSortType = e.target.value;
        updateDisplay();
    });

    // ========== 語言切換 ==========
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            const currentLocale = i18n.getLocale();
            const newLocale = currentLocale === 'zh-TW' ? 'en-US' : 'zh-TW';
            i18n.setLocale(newLocale);
            languageToggle.textContent = newLocale === 'zh-TW' ? 'EN' : '中';
            
            // 重新渲染
            updateDisplay();
            updateFilterButtons();
        });

        // 設定初始語言按鈕
        languageToggle.textContent = i18n.getLocale() === 'zh-TW' ? 'EN' : '中';
    }

    // ========== 監聽收藏變更 ==========
    favoritesManager.addListener((type) => {
        updateFilterButtons();
        // 如果當前顯示收藏，更新列表
        if (currentFilterType === 'favorites' || currentFilterType === 'recent') {
            updateDisplay();
        }
    });

    // ========== 初始渲染 ==========
    updateDisplay();
    updateFilterButtons();

    // ========== i18n 翻譯頁面 ==========
    i18n.translatePage();
};
