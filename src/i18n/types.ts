/**
 * i18n Type Definitions
 */

export type Locale = 'en' | 'zh-TW';

export interface TranslationParams {
    [key: string]: string | number;
}

/**
 * Nested translation dictionary structure.
 * Supports dot-notation key lookup (e.g., 'app.title' -> { app: { title: '...' } })
 */
export interface TranslationDictionary {
    [key: string]: string | TranslationDictionary;
}
