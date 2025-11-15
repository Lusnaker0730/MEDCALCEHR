// js/i18n.js - 國際化（i18n）語言管理系統

/**
 * 翻譯內容
 */
const translations = {
    'zh-TW': {
        // 應用標題
        'app.title': 'CGMH EHRCALC on FHIR',
        'app.subtitle': '92個臨床計算器',

        // 導航與搜尋
        'nav.calculators': '可用計算器',
        'search.placeholder': '搜尋計算器...',
        'search.noResults': '找不到符合的計算器',
        
        // 排序
        'sort.label': '排序：',
        'sort.az': 'A → Z',
        'sort.za': 'Z → A',
        'sort.recentlyAdded': '最近新增',
        'sort.mostUsed': '最常使用',
        
        // 過濾器
        'filter.label': '分類：',
        'filter.all': '全部',
        'filter.favorites': '⭐ 我的收藏',
        'filter.recent': '🕒 最近使用',
        
        // 分類
        'category.all': '全部分類',
        'category.cardiovascular': '心血管',
        'category.renal': '腎臟功能',
        'category.critical-care': '重症醫學',
        'category.pediatric': '兒科',
        'category.drug-conversion': '藥物換算',
        'category.infection': '感染評估',
        'category.neurology': '神經科',
        'category.respiratory': '呼吸系統',
        'category.metabolic': '代謝疾病',
        'category.hematology': '血液科',
        'category.gastroenterology': '消化系統',
        'category.obstetrics': '產科',
        'category.psychiatry': '精神科',
        'category.general': '一般醫學',
        
        // 患者資訊
        'patient.loading': '載入患者資料中...',
        'patient.noData': '無患者資料',
        'patient.name': '患者姓名',
        'patient.age': '年齡',
        'patient.gender': '性別',
        'patient.gender.male': '男',
        'patient.gender.female': '女',
        'patient.mrn': '病歷號',
        
        // 計算器頁面
        'calculator.loading': '載入計算器中...',
        'calculator.error': '計算器載入失敗',
        'calculator.notFound': '找不到此計算器',
        'calculator.backToList': '← 返回列表',
        
        // 收藏功能
        'favorites.add': '加入收藏',
        'favorites.remove': '取消收藏',
        'favorites.empty': '尚無收藏的計算器',
        'favorites.count': '個收藏',
        
        // 最近使用
        'recent.empty': '尚無使用記錄',
        'recent.count': '個最近使用',
        
        // 錯誤訊息
        'error.fhirNotAvailable': '無法連接到 FHIR 伺服器',
        'error.calculationFailed': '計算失敗',
        'error.invalidInput': '輸入值無效',
        'error.networkError': '網路錯誤',
        
        // 通用
        'common.yes': '是',
        'common.no': '否',
        'common.cancel': '取消',
        'common.confirm': '確認',
        'common.save': '儲存',
        'common.close': '關閉',
        'common.loading': '載入中...',
        'common.error': '錯誤',
        'common.success': '成功',
        
        // 統計
        'stats.totalCalculators': '計算器總數',
        'stats.showing': '顯示',
        'stats.outOf': '共',
        'stats.results': '個結果'
    },
    
    'en-US': {
        // Application title
        'app.title': 'CGMH EHRCALC on FHIR',
        'app.subtitle': '92 Clinical Calculators',

        // Navigation & Search
        'nav.calculators': 'Available Calculators',
        'search.placeholder': 'Search calculators...',
        'search.noResults': 'No calculators found',
        
        // Sorting
        'sort.label': 'Sort:',
        'sort.az': 'A → Z',
        'sort.za': 'Z → A',
        'sort.recentlyAdded': 'Recently Added',
        'sort.mostUsed': 'Most Used',
        
        // Filters
        'filter.label': 'Category:',
        'filter.all': 'All',
        'filter.favorites': '⭐ Favorites',
        'filter.recent': '🕒 Recent',
        
        // Categories
        'category.all': 'All Categories',
        'category.cardiovascular': 'Cardiovascular',
        'category.renal': 'Renal Function',
        'category.critical-care': 'Critical Care',
        'category.pediatric': 'Pediatrics',
        'category.drug-conversion': 'Drug Conversion',
        'category.infection': 'Infection',
        'category.neurology': 'Neurology',
        'category.respiratory': 'Respiratory',
        'category.metabolic': 'Metabolic',
        'category.hematology': 'Hematology',
        'category.gastroenterology': 'Gastroenterology',
        'category.obstetrics': 'Obstetrics',
        'category.psychiatry': 'Psychiatry',
        'category.general': 'General',
        
        // Patient Information
        'patient.loading': 'Loading patient data...',
        'patient.noData': 'No patient data available',
        'patient.name': 'Patient Name',
        'patient.age': 'Age',
        'patient.gender': 'Gender',
        'patient.gender.male': 'Male',
        'patient.gender.female': 'Female',
        'patient.mrn': 'MRN',
        
        // Calculator Page
        'calculator.loading': 'Loading calculator...',
        'calculator.error': 'Failed to load calculator',
        'calculator.notFound': 'Calculator not found',
        'calculator.backToList': '← Back to List',
        
        // Favorites
        'favorites.add': 'Add to Favorites',
        'favorites.remove': 'Remove from Favorites',
        'favorites.empty': 'No favorite calculators yet',
        'favorites.count': 'favorites',
        
        // Recent
        'recent.empty': 'No recent calculators',
        'recent.count': 'recent',
        
        // Error Messages
        'error.fhirNotAvailable': 'Cannot connect to FHIR server',
        'error.calculationFailed': 'Calculation failed',
        'error.invalidInput': 'Invalid input',
        'error.networkError': 'Network error',
        
        // Common
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.save': 'Save',
        'common.close': 'Close',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        
        // Statistics
        'stats.totalCalculators': 'Total Calculators',
        'stats.showing': 'Showing',
        'stats.outOf': 'of',
        'stats.results': 'results'
    }
};

/**
 * i18n 類別
 */
class I18n {
    constructor(defaultLocale = 'zh-TW') {
        this.locale = this.getStoredLocale() || defaultLocale;
        this.listeners = [];
    }

    /**
     * 從 localStorage 獲取已儲存的語言設定
     */
    getStoredLocale() {
        return localStorage.getItem('locale');
    }

    /**
     * 儲存語言設定到 localStorage
     */
    setStoredLocale(locale) {
        localStorage.setItem('locale', locale);
    }

    /**
     * 翻譯鍵值
     * @param {string} key - 翻譯鍵
     * @param {Object} params - 參數替換對象
     * @returns {string} 翻譯後的文字
     */
    t(key, params = {}) {
        let text = translations[this.locale]?.[key] || translations['zh-TW'][key] || key;
        
        // 支援參數替換：t('welcome.user', { name: 'John' })
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });
        
        return text;
    }

    /**
     * 設定語言
     * @param {string} locale - 語言代碼
     */
    setLocale(locale) {
        if (translations[locale]) {
            this.locale = locale;
            this.setStoredLocale(locale);
            
            // 通知所有監聽器
            this.notifyListeners();
            
            // 觸發全域事件
            window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
        }
    }

    /**
     * 獲取當前語言
     * @returns {string} 當前語言代碼
     */
    getLocale() {
        return this.locale;
    }

    /**
     * 獲取可用語言列表
     * @returns {Array} 語言列表
     */
    getAvailableLocales() {
        return Object.keys(translations);
    }

    /**
     * 添加語言變更監聽器
     * @param {Function} callback - 回調函數
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 移除語言變更監聽器
     * @param {Function} callback - 回調函數
     */
    removeListener(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    /**
     * 通知所有監聽器
     */
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.locale));
    }

    /**
     * 自動翻譯頁面中的元素
     * 使用 data-i18n 屬性標記需要翻譯的元素
     */
    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // 根據元素類型設定翻譯
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.placeholder !== undefined) {
                    element.placeholder = translation;
                } else {
                    element.value = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // 翻譯 title 屬性
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
    }
}

// 創建全域 i18n 實例
export const i18n = new I18n();

// 在頁面載入時自動翻譯
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        i18n.translatePage();
    });

    // 監聽語言變更事件
    window.addEventListener('localechange', () => {
        i18n.translatePage();
    });
}

export default i18n;

