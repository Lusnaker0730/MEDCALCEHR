/**
 * i18n Core Module
 * Lightweight key-based translation with parameter interpolation.
 *
 * Usage:
 *   import { t, setLocale, getLocale } from './i18n/index.js';
 *   t('app.title')                    // -> 'CGMH EHRCALC on FHIR'
 *   t('validation.range', { min: 0, max: 150 })  // -> 'Value must be between 0 and 150'
 */

import type { Locale, TranslationParams, TranslationDictionary } from './types.js';

// Import locale files statically for Vite bundling
import en from './locales/en.json';
import zhTW from './locales/zh-TW.json';

const STORAGE_KEY = 'MEDCALC_LOCALE';
const DEFAULT_LOCALE: Locale = 'zh-TW';

const dictionaries: Record<Locale, TranslationDictionary> = {
    'en': en as TranslationDictionary,
    'zh-TW': zhTW as TranslationDictionary,
};

let currentLocale: Locale = DEFAULT_LOCALE;

// Listeners for locale changes
type LocaleChangeListener = (locale: Locale) => void;
const listeners: LocaleChangeListener[] = [];

/**
 * Resolve a dot-notation key from a nested dictionary.
 * e.g., 'app.title' resolves to dict.app.title
 */
function resolve(dict: TranslationDictionary, key: string): string | undefined {
    const parts = key.split('.');
    let current: string | TranslationDictionary = dict;

    for (const part of parts) {
        if (typeof current !== 'object' || current === null) return undefined;
        if (part === '__proto__' || part === 'constructor' || part === 'prototype') return undefined;
        if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
        current = (current as TranslationDictionary)[part];
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key with optional parameter interpolation.
 * Parameters are replaced using {{paramName}} syntax.
 *
 * @param key - Dot-notation translation key (e.g., 'app.title')
 * @param params - Optional interpolation parameters
 * @returns Translated string, or the key itself if not found (fallback)
 */
export function t(key: string, params?: TranslationParams): string {
    const dict = dictionaries[currentLocale];
    let value = resolve(dict, key);

    // Fallback to English if key not found in current locale
    if (value === undefined && currentLocale !== 'en') {
        value = resolve(dictionaries['en'], key);
    }

    // Final fallback: return the key itself
    if (value === undefined) {
        return key;
    }

    // Parameter interpolation: replace {{paramName}} with values
    if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, paramName: string) => {
            return params[paramName] !== undefined ? String(params[paramName]) : `{{${paramName}}}`;
        });
    }

    return value;
}

/**
 * Set the current locale and persist to localStorage.
 */
export function setLocale(locale: Locale): void {
    if (!dictionaries[locale]) return;
    currentLocale = locale;

    try {
        localStorage.setItem(STORAGE_KEY, locale);
    } catch {
        // localStorage may not be available
    }

    // Update html lang attribute
    document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant-TW' : 'en';

    // Notify listeners
    listeners.forEach(fn => fn(locale));
}

/**
 * Get the current locale.
 */
export function getLocale(): Locale {
    return currentLocale;
}

/**
 * Get all available locales.
 */
export function getAvailableLocales(): Locale[] {
    return Object.keys(dictionaries) as Locale[];
}

/**
 * Register a callback for locale changes.
 */
export function onLocaleChange(fn: LocaleChangeListener): void {
    listeners.push(fn);
}

/**
 * Remove a locale change listener.
 */
export function offLocaleChange(fn: LocaleChangeListener): void {
    const index = listeners.indexOf(fn);
    if (index !== -1) listeners.splice(index, 1);
}

/**
 * Hydrate all elements with data-i18n attributes.
 * Elements with data-i18n="key" will have their textContent set to t(key).
 * Elements with data-i18n-placeholder="key" will have their placeholder set.
 * Elements with data-i18n-title="key" will have their title set.
 */
export function hydrateI18n(root: Element | Document = document): void {
    // Text content
    root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.textContent = t(key);
        }
    });

    // Placeholders
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key && el instanceof HTMLInputElement) {
            el.placeholder = t(key);
        }
    });

    // Titles
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key && el instanceof HTMLElement) {
            el.title = t(key);
        }
    });

    // aria-labels
    root.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (key) {
            el.setAttribute('aria-label', t(key));
        }
    });
}

/**
 * Initialize i18n: load saved locale from localStorage or use default.
 */
export function initI18n(): void {
    try {
        const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (saved && dictionaries[saved]) {
            currentLocale = saved;
        }
    } catch {
        // localStorage not available
    }

    // Set html lang
    document.documentElement.lang = currentLocale === 'zh-TW' ? 'zh-Hant-TW' : 'en';
}
