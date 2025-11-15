// js/favorites.js - 收藏與最近使用管理系統

/**
 * 收藏與最近使用管理類別
 */
export class FavoritesManager {
    constructor() {
        this.storageKey = 'calculator-favorites';
        this.recentKey = 'calculator-recent';
        this.usageKey = 'calculator-usage';
        this.maxRecent = 10; // 最多保留10個最近使用記錄
        this.listeners = [];
    }

    // ========== 收藏功能 ==========

    /**
     * 切換收藏狀態
     * @param {string} calculatorId - 計算器ID
     * @returns {boolean} 切換後的收藏狀態
     */
    toggleFavorite(calculatorId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(calculatorId);
        
        if (index > -1) {
            // 已收藏，移除
            favorites.splice(index, 1);
        } else {
            // 未收藏，添加
            favorites.push(calculatorId);
        }
        
        this.saveFavorites(favorites);
        this.notifyListeners('favorites', calculatorId);
        
        return index === -1; // 返回新狀態（true = 已收藏）
    }

    /**
     * 添加到收藏
     * @param {string} calculatorId - 計算器ID
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
     * 從收藏移除
     * @param {string} calculatorId - 計算器ID
     */
    removeFavorite(calculatorId) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(id => id !== calculatorId);
        this.saveFavorites(filtered);
        this.notifyListeners('favorites', calculatorId);
    }

    /**
     * 檢查是否已收藏
     * @param {string} calculatorId - 計算器ID
     * @returns {boolean} 是否已收藏
     */
    isFavorite(calculatorId) {
        return this.getFavorites().includes(calculatorId);
    }

    /**
     * 獲取所有收藏
     * @returns {Array<string>} 收藏的計算器ID列表
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
     * 儲存收藏列表
     * @param {Array<string>} favorites - 收藏的計算器ID列表
     */
    saveFavorites(favorites) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }

    /**
     * 獲取收藏數量
     * @returns {number} 收藏數量
     */
    getFavoritesCount() {
        return this.getFavorites().length;
    }

    // ========== 最近使用功能 ==========

    /**
     * 添加到最近使用
     * @param {string} calculatorId - 計算器ID
     */
    addToRecent(calculatorId) {
        let recent = this.getRecent();
        
        // 移除重複項目
        recent = recent.filter(id => id !== calculatorId);
        
        // 添加到最前面
        recent.unshift(calculatorId);
        
        // 只保留最近 N 個
        recent = recent.slice(0, this.maxRecent);
        
        this.saveRecent(recent);
        this.notifyListeners('recent', calculatorId);
    }

    /**
     * 獲取最近使用列表
     * @param {number} limit - 限制數量（可選）
     * @returns {Array<string>} 最近使用的計算器ID列表
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
     * 儲存最近使用列表
     * @param {Array<string>} recent - 最近使用的計算器ID列表
     */
    saveRecent(recent) {
        try {
            localStorage.setItem(this.recentKey, JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to save recent:', error);
        }
    }

    /**
     * 清空最近使用
     */
    clearRecent() {
        this.saveRecent([]);
        this.notifyListeners('recent', null);
    }

    // ========== 使用統計功能 ==========

    /**
     * 記錄計算器使用次數
     * @param {string} calculatorId - 計算器ID
     */
    trackUsage(calculatorId) {
        const usage = this.getUsage();
        usage[calculatorId] = (usage[calculatorId] || 0) + 1;
        this.saveUsage(usage);
    }

    /**
     * 獲取使用統計
     * @returns {Object} 使用統計對象
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
     * 儲存使用統計
     * @param {Object} usage - 使用統計對象
     */
    saveUsage(usage) {
        try {
            localStorage.setItem(this.usageKey, JSON.stringify(usage));
        } catch (error) {
            console.error('Failed to save usage:', error);
        }
    }

    /**
     * 獲取計算器使用次數
     * @param {string} calculatorId - 計算器ID
     * @returns {number} 使用次數
     */
    getUsageCount(calculatorId) {
        const usage = this.getUsage();
        return usage[calculatorId] || 0;
    }

    /**
     * 獲取最常使用的計算器列表
     * @param {number} limit - 限制數量
     * @returns {Array<{id: string, count: number}>} 最常使用的計算器列表
     */
    getMostUsed(limit = 10) {
        const usage = this.getUsage();
        return Object.entries(usage)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    // ========== 監聽器功能 ==========

    /**
     * 添加變更監聽器
     * @param {Function} callback - 回調函數
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除監聽器
     * @param {Function} callback - 回調函數
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * 通知所有監聽器
     * @param {string} type - 變更類型（'favorites' 或 'recent'）
     * @param {string} calculatorId - 計算器ID
     */
    notifyListeners(type, calculatorId) {
        this.listeners.forEach(callback => {
            try {
                callback(type, calculatorId);
            } catch (error) {
                console.error('Listener error:', error);
            }
        });

        // 觸發全域事件
        window.dispatchEvent(new CustomEvent('favoriteschange', {
            detail: { type, calculatorId }
        }));
    }

    // ========== 資料管理 ==========

    /**
     * 清空所有資料
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.recentKey);
        localStorage.removeItem(this.usageKey);
        this.notifyListeners('clear', null);
    }

    /**
     * 匯出資料
     * @returns {Object} 包含所有資料的對象
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
     * 匯入資料
     * @param {Object} data - 要匯入的資料
     * @returns {boolean} 是否成功
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
     * 獲取統計摘要
     * @returns {Object} 統計摘要
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

// 創建全域實例
export const favoritesManager = new FavoritesManager();

export default favoritesManager;

