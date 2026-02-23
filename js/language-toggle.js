/**
 * Language Toggle - 語言切換功能
 * Pattern mirrors theme-toggle.ts for consistency.
 */
import { getLocale, setLocale, hydrateI18n, onLocaleChange } from './i18n/index.js';
const LanguageManager = {
    init() {
        this.bindToggleButton();
        this.updateToggleLabel();
        // Re-hydrate on locale change
        onLocaleChange(() => {
            this.updateToggleLabel();
            hydrateI18n();
        });
    },
    toggleLanguage() {
        const current = getLocale();
        const next = current === 'en' ? 'zh-TW' : 'en';
        setLocale(next);
    },
    updateToggleLabel() {
        const btn = document.getElementById('language-toggle');
        if (!btn)
            return;
        const locale = getLocale();
        const label = btn.querySelector('.lang-label');
        if (label) {
            label.textContent = locale === 'en' ? '中文' : 'EN';
        }
    },
    bindToggleButton() {
        const btn = document.getElementById('language-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggleLanguage());
        }
    },
    getCurrentLocale() {
        return getLocale();
    },
};
// Auto-initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LanguageManager.init());
}
else {
    LanguageManager.init();
}
export { LanguageManager };
