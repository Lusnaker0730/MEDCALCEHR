/**
 * Language Toggle - 語言切換功能
 * Pattern mirrors theme-toggle.ts for consistency.
 */

import { getLocale, setLocale, hydrateI18n, onLocaleChange } from './i18n/index.js';
import type { Locale } from './i18n/types.js';

interface ILanguageManager {
    init(): void;
    toggleLanguage(): void;
    updateToggleLabel(): void;
    bindToggleButton(): void;
    getCurrentLocale(): Locale;
}

const LanguageManager: ILanguageManager = {
    init(): void {
        this.bindToggleButton();
        this.updateToggleLabel();

        // Re-hydrate on locale change
        onLocaleChange(() => {
            this.updateToggleLabel();
            hydrateI18n();
        });
    },

    toggleLanguage(): void {
        const current = getLocale();
        const next: Locale = current === 'en' ? 'zh-TW' : 'en';
        setLocale(next);
    },

    updateToggleLabel(): void {
        const btn = document.getElementById('language-toggle');
        if (!btn) return;

        const locale = getLocale();
        const label = btn.querySelector('.lang-label');
        if (label) {
            label.textContent = locale === 'en' ? '中文' : 'EN';
        }
    },

    bindToggleButton(): void {
        const btn = document.getElementById('language-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleLanguage());
        }
    },

    getCurrentLocale(): Locale {
        return getLocale();
    },
};

// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LanguageManager.init());
} else {
    LanguageManager.init();
}

export { LanguageManager };
