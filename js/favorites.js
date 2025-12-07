// js/favorites.js - Favorites and Recent Usage Management System

/**
 * Favorites and Recent Usage Manager Class
 */
export class FavoritesManager {
    constructor() {
        this.storageKey = 'calculator-favorites';
        this.recentKey = 'calculator-recent';
        this.usageKey = 'calculator-usage';
        this.maxRecent = 10; // Maximum number of recent items to keep
        this.listeners = [];
    }

    // ========== Favorites Functionality ==========

    /**
     * Toggle favorite status
     * @param {string} calculatorId - Calculator ID
     * @returns {boolean} New favorite status
     */
    toggleFavorite(calculatorId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(calculatorId);

        if (index > -1) {
            // Already favorited, remove it
            favorites.splice(index, 1);
        } else {
            // Not favorited, add it
            favorites.push(calculatorId);
        }

        this.saveFavorites(favorites);
        this.notifyListeners('favorites', calculatorId);

        return index === -1; // Return new status (true = favorited)
    }

    /**
     * Add to favorites
     * @param {string} calculatorId - Calculator ID
     */
    addFavorite(calculatorId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(calculatorId)) {
            favorites.push(calculatorId);
            this.saveFavorites(favorites);
            this.notifyListeners('favorites', calculatorId);
        }
    }

    /**
     * Remove from favorites
     * @param {string} calculatorId - Calculator ID
     */
    removeFavorite(calculatorId) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(id => id !== calculatorId);
        this.saveFavorites(filtered);
        this.notifyListeners('favorites', calculatorId);
    }

    /**
     * Check if is favorite
     * @param {string} calculatorId - Calculator ID
     * @returns {boolean} Whether it is in favorites
     */
    isFavorite(calculatorId) {
        return this.getFavorites().includes(calculatorId);
    }

    /**
     * Get all favorites
     * @returns {Array<string>} List of favorite calculator IDs
     */
    getFavorites() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    }

    /**
     * Save favorites list
     * @param {Array<string>} favorites - List of favorite calculator IDs
     */
    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    /**
     * Get favorites count
     * @returns {number} Count of favorites
     */
    getFavoritesCount() {
        return this.getFavorites().length;
    }

    // ========== Recent Usage Functionality ==========

    /**
     * Add to recent usage
     * @param {string} calculatorId - Calculator ID
     */
    addToRecent(calculatorId) {
        let recent = this.getRecent();

        // Remove duplicates
        recent = recent.filter(id => id !== calculatorId);

        // Add to front
        recent.unshift(calculatorId);

        // Keep only N most recent
        recent = recent.slice(0, this.maxRecent);

        this.saveRecent(recent);
        this.notifyListeners('recent', calculatorId);
    }

    /**
     * Get recent usage list
     * @param {number} limit - Limit number (optional)
     * @returns {Array<string>} List of recent calculator IDs
     */
    getRecent(limit = null) {
        try {
            const stored = localStorage.getItem(this.recentKey);
            const recent = stored ? JSON.parse(stored) : [];
            return limit ? recent.slice(0, limit) : recent;
        } catch (error) {
            console.error('Failed to load recent:', error);
            return [];
        }
    }

    /**
     * Save recent usage list
     * @param {Array<string>} recent - List of recent calculator IDs
     */
    saveRecent(recent) {
        try {
            localStorage.setItem(this.recentKey, JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to save recent:', error);
        }
    }

    /**
     * Clear recent usage
     */
    clearRecent() {
        this.saveRecent([]);
        this.notifyListeners('recent', null);
    }

    // ========== Usage Statistics Functionality ==========

    /**
     * Track calculator usage count
     * @param {string} calculatorId - Calculator ID
     */
    trackUsage(calculatorId) {
        const usage = this.getUsage();
        usage[calculatorId] = (usage[calculatorId] || 0) + 1;
        this.saveUsage(usage);
    }

    /**
     * Get usage statistics
     * @returns {Object} Usage statistics object
     */
    getUsage() {
        try {
            const stored = localStorage.getItem(this.usageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load usage:', error);
            return {};
        }
    }

    /**
     * Save usage statistics
     * @param {Object} usage - Usage statistics object
     */
    saveUsage(usage) {
        try {
            localStorage.setItem(this.usageKey, JSON.stringify(usage));
        } catch (error) {
            console.error('Failed to save usage:', error);
        }
    }

    /**
     * Get specific calculator usage count
     * @param {string} calculatorId - Calculator ID
     * @returns {number} Usage count
     */
    getUsageCount(calculatorId) {
        const usage = this.getUsage();
        return usage[calculatorId] || 0;
    }

    /**
     * Get most used calculators
     * @param {number} limit - Limit number
     * @returns {Array<{id: string, count: number}>} List of most used calculators
     */
    getMostUsed(limit = 10) {
        const usage = this.getUsage();
        return Object.entries(usage)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    // ========== Listener Functionality ==========

    /**
     * Add change listener
     * @param {Function} callback - Callback function
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove listener
     * @param {Function} callback - Callback function
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * Notify all listeners
     * @param {string} type - Change type ('favorites' or 'recent')
     * @param {string} calculatorId - Calculator ID
     */
    notifyListeners(type, calculatorId) {
        this.listeners.forEach(callback => {
            try {
                callback(type, calculatorId);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });

        // Trigger global event
        window.dispatchEvent(new CustomEvent('favoriteschange', {
            detail: { type, calculatorId }
        }));
    }

    // ========== Data Management ==========

    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.recentKey);
        localStorage.removeItem(this.usageKey);
        this.notifyListeners('clear', null);
    }

    /**
     * Export data
     * @returns {Object} Object containing all data
     */
    exportData() {
        return {
            favorites: this.getFavorites(),
            recent: this.getRecent(),
            usage: this.getUsage(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.favorites) this.saveFavorites(data.favorites);
            if (data.recent) this.saveRecent(data.recent);
            if (data.usage) this.saveUsage(data.usage);
            this.notifyListeners('import', null);
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    /**
     * Get stats summary
     * @returns {Object} Stats summary
     */
    getStatsSummary() {
        return {
            favoritesCount: this.getFavoritesCount(),
            recentCount: this.getRecent().length,
            totalUsage: Object.values(this.getUsage()).reduce((sum, count) => sum + count, 0),
            uniqueCalculatorsUsed: Object.keys(this.getUsage()).length
        };
    }
}

// Create global instance
export const favoritesManager = new FavoritesManager();

export default favoritesManager;

