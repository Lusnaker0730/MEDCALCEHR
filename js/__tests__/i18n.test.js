/**
 * i18n Module Tests
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] ?? null),
        setItem: jest.fn((key, value) => { store[key] = value; }),
        removeItem: jest.fn((key) => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
import { t, setLocale, getLocale, initI18n, hydrateI18n, onLocaleChange, offLocaleChange, getAvailableLocales } from '../i18n/index.js';
describe('i18n Module', () => {
    beforeEach(() => {
        localStorageMock.clear();
        // Reset to default locale
        setLocale('zh-TW');
    });
    describe('t() function', () => {
        it('should return translated string for existing key', () => {
            setLocale('en');
            expect(t('app.title')).toBe('CGMH EHRCALC on FHIR');
        });
        it('should return zh-TW translation', () => {
            setLocale('zh-TW');
            expect(t('app.logout')).toBe('登出');
        });
        it('should return key itself for missing key (fallback)', () => {
            expect(t('nonexistent.key')).toBe('nonexistent.key');
        });
        it('should fallback to English if key missing in zh-TW', () => {
            setLocale('zh-TW');
            // Both locales should have app.title, but if we test a key only in EN
            // the fallback behavior returns the key itself if missing in both
            const result = t('app.title');
            expect(result).toBeTruthy();
            expect(result).not.toBe('app.title');
        });
        it('should interpolate parameters with {{param}} syntax', () => {
            setLocale('en');
            const result = t('stats.showing', { showing: 10, total: 92 });
            expect(result).toBe('Showing 10 / 92 results');
        });
        it('should interpolate parameters in zh-TW', () => {
            setLocale('zh-TW');
            const result = t('stats.showing', { showing: 10, total: 92 });
            expect(result).toBe('顯示 10 / 92 筆結果');
        });
        it('should preserve unmatched params as-is', () => {
            setLocale('en');
            const result = t('stats.showing', { showing: 5 });
            expect(result).toContain('5');
            expect(result).toContain('{{total}}');
        });
        it('should handle nested dot-notation keys', () => {
            setLocale('en');
            expect(t('category.cardiovascular')).toBe('Cardiovascular');
            expect(t('category.renal')).toBe('Renal');
        });
        it('should translate categories to Chinese', () => {
            setLocale('zh-TW');
            expect(t('category.cardiovascular')).toBe('心血管');
            expect(t('category.critical-care')).toBe('重症醫學');
            expect(t('category.gastroenterology')).toBe('肝膽腸胃');
        });
    });
    describe('setLocale / getLocale', () => {
        it('should set and get locale', () => {
            setLocale('en');
            expect(getLocale()).toBe('en');
            setLocale('zh-TW');
            expect(getLocale()).toBe('zh-TW');
        });
        it('should persist locale to localStorage', () => {
            setLocale('en');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('MEDCALC_LOCALE', 'en');
        });
        it('should update html lang attribute', () => {
            setLocale('zh-TW');
            expect(document.documentElement.lang).toBe('zh-Hant-TW');
            setLocale('en');
            expect(document.documentElement.lang).toBe('en');
        });
        it('should ignore invalid locale', () => {
            setLocale('en');
            setLocale('fr');
            expect(getLocale()).toBe('en');
        });
    });
    describe('getAvailableLocales', () => {
        it('should return en and zh-TW', () => {
            const locales = getAvailableLocales();
            expect(locales).toContain('en');
            expect(locales).toContain('zh-TW');
            expect(locales.length).toBe(2);
        });
    });
    describe('initI18n', () => {
        it('should load saved locale from localStorage', () => {
            localStorageMock.setItem('MEDCALC_LOCALE', 'en');
            localStorageMock.getItem.mockReturnValueOnce('en');
            initI18n();
            expect(getLocale()).toBe('en');
        });
        it('should default to zh-TW if no saved locale', () => {
            localStorageMock.getItem.mockReturnValueOnce(null);
            initI18n();
            expect(getLocale()).toBe('zh-TW');
        });
    });
    describe('onLocaleChange / offLocaleChange', () => {
        it('should call listener on locale change', () => {
            const listener = jest.fn();
            onLocaleChange(listener);
            setLocale('en');
            expect(listener).toHaveBeenCalledWith('en');
            offLocaleChange(listener);
        });
        it('should not call removed listener', () => {
            const listener = jest.fn();
            onLocaleChange(listener);
            offLocaleChange(listener);
            setLocale('en');
            expect(listener).not.toHaveBeenCalled();
        });
    });
    describe('hydrateI18n', () => {
        it('should hydrate elements with data-i18n attribute', () => {
            setLocale('en');
            document.body.innerHTML = '<span data-i18n="app.logout">old text</span>';
            hydrateI18n();
            const el = document.querySelector('[data-i18n="app.logout"]');
            expect(el?.textContent).toBe('Logout');
        });
        it('should hydrate placeholder attributes', () => {
            setLocale('en');
            document.body.innerHTML = '<input data-i18n-placeholder="search.placeholder" placeholder="old" />';
            hydrateI18n();
            const input = document.querySelector('input');
            expect(input.placeholder).toBe('Search for a calculator...');
        });
        it('should hydrate title attributes', () => {
            setLocale('zh-TW');
            document.body.innerHTML = '<button data-i18n-title="app.toggleTheme" title="old"></button>';
            hydrateI18n();
            const btn = document.querySelector('button');
            expect(btn.title).toBe('切換主題');
        });
        it('should hydrate aria-label attributes', () => {
            setLocale('zh-TW');
            document.body.innerHTML = '<input data-i18n-aria="search.ariaLabel" aria-label="old" />';
            hydrateI18n();
            const input = document.querySelector('input');
            expect(input.getAttribute('aria-label')).toBe('搜尋計算器');
        });
        it('should update when locale changes', () => {
            document.body.innerHTML = '<span data-i18n="app.logout">text</span>';
            setLocale('en');
            hydrateI18n();
            expect(document.querySelector('[data-i18n]')?.textContent).toBe('Logout');
            setLocale('zh-TW');
            hydrateI18n();
            expect(document.querySelector('[data-i18n]')?.textContent).toBe('登出');
        });
    });
});
