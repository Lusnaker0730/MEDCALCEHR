/**
 * ESLint 10 flat config — migrated from .eslintrc.json (closes #19).
 *
 * Preserves the existing rule set as-is:
 *   - eslint:recommended
 *   - plugin:@typescript-eslint/recommended
 *   - eqeqeq with null ignored (idiomatic null/undefined check)
 *   - no-console / no-unused-vars relaxed per project conventions
 *
 * Migrating to flat config is required because ESLint 9+ removed
 * support for the legacy `.eslintrc.*` format.
 */

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const browserGlobals = {
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    console: 'readonly',
    localStorage: 'readonly',
    sessionStorage: 'readonly',
    fetch: 'readonly',
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
    requestIdleCallback: 'readonly',
    cancelIdleCallback: 'readonly',
    URL: 'readonly',
    URLSearchParams: 'readonly',
    Event: 'readonly',
    CustomEvent: 'readonly',
    EventTarget: 'readonly',
    HTMLElement: 'readonly',
    HTMLInputElement: 'readonly',
    HTMLSelectElement: 'readonly',
    HTMLButtonElement: 'readonly',
    HTMLAnchorElement: 'readonly',
    HTMLDivElement: 'readonly',
    HTMLLabelElement: 'readonly',
    HTMLLinkElement: 'readonly',
    HTMLFormElement: 'readonly',
    HTMLTemplateElement: 'readonly',
    HTMLSpanElement: 'readonly',
    HTMLOptionElement: 'readonly',
    HTMLScriptElement: 'readonly',
    HTMLCanvasElement: 'readonly',
    HTMLImageElement: 'readonly',
    Element: 'readonly',
    Node: 'readonly',
    NodeList: 'readonly',
    NodeFilter: 'readonly',
    DocumentFragment: 'readonly',
    IntersectionObserver: 'readonly',
    IntersectionObserverEntry: 'readonly',
    IntersectionObserverCallback: 'readonly',
    IntersectionObserverInit: 'readonly',
    MutationObserver: 'readonly',
    ResizeObserver: 'readonly',
    Headers: 'readonly',
    Request: 'readonly',
    Response: 'readonly',
    Storage: 'readonly',
    StorageEvent: 'readonly',
    ServiceWorker: 'readonly',
    ServiceWorkerRegistration: 'readonly',
    MessageEvent: 'readonly',
    MessageChannel: 'readonly',
    BroadcastChannel: 'readonly',
    Worker: 'readonly',
    AbortController: 'readonly',
    AbortSignal: 'readonly',
    PromiseRejectionEvent: 'readonly',
    FormData: 'readonly',
    Blob: 'readonly',
    File: 'readonly',
    FileReader: 'readonly',
    Image: 'readonly',
    CanvasRenderingContext2D: 'readonly',
    TouchEvent: 'readonly',
    KeyboardEvent: 'readonly',
    MouseEvent: 'readonly',
    PointerEvent: 'readonly',
    FocusEvent: 'readonly',
    InputEvent: 'readonly',
    Touch: 'readonly',
    getComputedStyle: 'readonly',
    MediaQueryListEvent: 'readonly',
    MediaQueryList: 'readonly',
    crypto: 'readonly',
    Crypto: 'readonly',
    SubtleCrypto: 'readonly',
    BufferSource: 'readonly',
    btoa: 'readonly',
    atob: 'readonly',
    TextEncoder: 'readonly',
    TextDecoder: 'readonly',
    location: 'readonly',
    history: 'readonly',
    alert: 'readonly',
    confirm: 'readonly',
    prompt: 'readonly',
    FHIR: 'readonly',
    Chart: 'readonly',
    CSS: 'readonly',
    // Node-like (tests, build, scripts)
    process: 'readonly',
    globalThis: 'readonly',
    global: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    module: 'readonly',
    require: 'readonly'
};

export default [
    {
        ignores: ['js/', 'node_modules/', 'coverage/', 'dist/', 'scripts/', 'e2e/']
    },
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: browserGlobals
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-console': 'off',
            'prefer-const': 'error',
            'no-var': 'error',
            // TypeScript handles undefined-symbol detection at compile time;
            // eslint's no-undef would otherwise require an exhaustive global
            // declaration list.
            'no-undef': 'off',
            // ESLint 10 default: warn on assignments whose result is never
            // read. Project has accumulated 140+ pre-existing instances;
            // demoting to warning keeps the lint signal without blocking CI.
            'no-useless-assignment': 'warn',
            // Stricter ESLint 10 / 'recommended' rules — kept as errors now
            // that the pre-existing violations in the codebase have been
            // fixed (see commits referencing #57's follow-up).
            // null-checks via `== null` / `!= null` are an idiomatic
            // TS/JS pattern (covers both null and undefined in one op).
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            curly: 'off',
            indent: 'off',
            quotes: 'off',
            semi: 'off',
            'brace-style': 'off',
            'comma-dangle': 'off',
            'arrow-spacing': 'off',
            'no-trailing-spaces': 'off',
            '@typescript-eslint/indent': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/ban-ts-comment': 'off'
        }
    }
];
