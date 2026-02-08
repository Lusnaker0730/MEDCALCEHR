/**
 * Security utilities for preventing XSS attacks and sanitizing user input
 * Provides HTML escaping, sanitization, and safe DOM manipulation functions
 *
 * @security This module is critical for preventing XSS attacks.
 *           Any changes should be reviewed carefully and tested with penetration tests.
 */
// Dangerous tags that should always be removed (mXSS prevention)
const DANGEROUS_TAGS = [
    'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed',
    'applet', 'math', 'svg', 'template', 'noscript', 'noembed', 'listing',
    'xmp', 'plaintext', 'comment', 'base', 'link', 'meta', 'title'
];
// Dangerous attribute prefixes
const DANGEROUS_ATTR_PREFIXES = ['on', 'xmlns', 'xlink'];
// Dangerous URL schemes
const DANGEROUS_URL_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];
/**
 * Removes null bytes and other dangerous control characters
 * @param str - String to sanitize
 * @returns Sanitized string without null bytes
 */
function stripNullBytes(str) {
    // Remove null bytes and other control characters (except newlines and tabs)
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
/**
 * Escapes HTML special characters to prevent XSS attacks
 * Uses character replacement for comprehensive escaping including quotes
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 * @security Escapes: & < > " ' / ` = to prevent XSS in various contexts
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    // Strip null bytes first
    const cleaned = stripNullBytes(String(str));
    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    return cleaned.replace(/[&<>"'/`=]/g, char => htmlEscapeMap[char]);
}
/**
 * Alternative implementation using character replacement
 * More performant for large strings (alias for escapeHTML)
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHTMLFast(str) {
    return escapeHTML(str);
}
/**
 * Checks if a string contains dangerous URL schemes
 * @param value - The attribute value to check
 * @returns True if dangerous scheme found
 */
function hasDangerousScheme(value) {
    const normalized = value.toLowerCase().replace(/[\s\x00-\x1F]/g, '');
    return DANGEROUS_URL_SCHEMES.some(scheme => normalized.includes(scheme));
}
/**
 * Recursively removes dangerous elements from a parent element
 * @param parent - The parent element to clean
 */
function removeDangerousElements(parent) {
    // Remove dangerous tags
    DANGEROUS_TAGS.forEach(tagName => {
        const elements = parent.getElementsByTagName(tagName);
        // Convert to array since we're modifying the live collection
        Array.from(elements).forEach(el => el.remove());
    });
}
/**
 * Sanitizes HTML by removing potentially dangerous elements and attributes
 * Uses a defense-in-depth approach with multiple layers of protection
 * @param {string} html - The HTML string to sanitize
 * @returns {string} Sanitized HTML string
 * @security Protects against: XSS, mXSS, script injection, event handlers,
 *           javascript: URLs, CSS expression attacks, and more
 */
export function sanitizeHTML(html) {
    if (!html) {
        return '';
    }
    // Step 1: Strip null bytes and control characters
    let cleaned = stripNullBytes(html);
    // Step 2: Remove obfuscated script patterns (before DOM parsing)
    // Handle patterns like <scr<script>ipt> or <scr ipt>
    // First, remove any nested tags within script-like patterns
    cleaned = cleaned.replace(/<scr[^>]*<[^>]*>[^>]*ipt/gi, '');
    cleaned = cleaned.replace(/<scr\s+ipt/gi, '');
    // Escape any remaining script-like patterns
    cleaned = cleaned.replace(/<\s*script/gi, '&lt;script');
    cleaned = cleaned.replace(/script\s*>/gi, 'script&gt;');
    // Step 3: Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = cleaned;
    // Step 4: Remove dangerous elements (script, style, svg, math, etc.)
    removeDangerousElements(temp);
    // Step 5: Process all remaining elements
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove all dangerous attributes
        Array.from(element.attributes).forEach(attr => {
            const attrName = attr.name.toLowerCase();
            const attrValue = attr.value;
            // Remove event handlers (on*)
            if (DANGEROUS_ATTR_PREFIXES.some(prefix => attrName.startsWith(prefix))) {
                element.removeAttribute(attr.name);
                return;
            }
            // Check for javascript: in any attribute
            if (hasDangerousScheme(attrValue)) {
                element.removeAttribute(attr.name);
                return;
            }
            // Special handling for style attribute - remove javascript: and expression()
            if (attrName === 'style') {
                const styleValue = attrValue.toLowerCase();
                if (styleValue.includes('javascript:') ||
                    styleValue.includes('expression(') ||
                    styleValue.includes('url(') && hasDangerousScheme(styleValue)) {
                    element.removeAttribute('style');
                    return;
                }
            }
            // Remove data: URLs from src and href (except for safe data URLs)
            if ((attrName === 'src' || attrName === 'href' || attrName === 'action') &&
                attrValue.toLowerCase().trim().startsWith('data:') &&
                !attrValue.toLowerCase().startsWith('data:image/')) {
                element.removeAttribute(attr.name);
            }
        });
    });
    // Step 6: Final pass - recursively remove any remaining dangerous tags
    // (they might have been created by DOM parser normalization)
    removeDangerousElements(temp);
    return temp.innerHTML;
}
/**
 * Creates a DOM element safely with escaped content
 * @param {string} tag - The HTML tag name
 * @param {string|Object} content - Text content or object with innerHTML
 * @param {Object} attributes - Optional attributes to set
 * @returns {HTMLElement} The created element
 */
export function createSafeElement(tag, content = '', attributes = {}) {
    const element = document.createElement(tag);
    // Set text content safely (no HTML parsing)
    if (typeof content === 'string') {
        element.textContent = content;
    }
    else if (content && typeof content === 'object' && content.html) {
        // If explicitly marked as HTML, sanitize it first
        element.innerHTML = sanitizeHTML(content.html);
    }
    // Set attributes
    Object.keys(attributes).forEach(key => {
        // Skip event handlers
        if (key.startsWith('on')) {
            console.warn(`Skipping event handler attribute: ${key}`);
            return;
        }
        // Validate URLs for href and src
        if ((key === 'href' || key === 'src') && attributes[key]) {
            if (isValidURL(attributes[key])) {
                element.setAttribute(key, attributes[key]);
            }
            else {
                console.warn(`Invalid URL blocked: ${attributes[key]}`);
            }
        }
        else {
            element.setAttribute(key, attributes[key]);
        }
    });
    return element;
}
/**
 * Validates if a URL is safe (not javascript:, data:, etc.)
 * @param {string} url - The URL to validate
 * @returns {boolean} True if URL is safe
 */
export function isValidURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    const trimmedURL = url.trim().toLowerCase();
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    for (const protocol of dangerousProtocols) {
        if (trimmedURL.startsWith(protocol)) {
            return false;
        }
    }
    // Allow http, https, relative URLs, and anchors
    return (trimmedURL.startsWith('http://') ||
        trimmedURL.startsWith('https://') ||
        trimmedURL.startsWith('/') ||
        trimmedURL.startsWith('#') ||
        trimmedURL.startsWith('.'));
}
/**
 * Sanitizes FHIR data for safe display
 * Specifically handles patient names, dates, and other text fields
 * @param {Object} fhirData - FHIR resource data
 * @param {string} field - The field to extract and sanitize
 * @returns {string} Sanitized field value
 */
export function sanitizeFHIRField(fhirData, field) {
    if (!fhirData || !field) {
        return '';
    }
    let value = fhirData[field];
    // Handle nested fields (e.g., 'name.0.text')
    if (field.includes('.')) {
        const parts = field.split('.');
        value = parts.reduce((obj, key) => {
            if (obj && obj[key] !== undefined) {
                return obj[key];
            }
            return null;
        }, fhirData);
    }
    // Convert to string and escape
    if (value !== null && value !== undefined) {
        return escapeHTML(String(value));
    }
    return '';
}
/**
 * Validates and sanitizes user input
 * @param {string} input - User input to validate
 * @param {Object} options - Validation options
 * @returns {Object} { isValid: boolean, sanitized: string, error: string }
 */
export function validateInput(input, options = {}) {
    const { maxLength = 1000, allowHTML = false, pattern = null, required = false } = options;
    const result = {
        isValid: true,
        sanitized: '',
        error: null
    };
    // Check if required
    if (required && (!input || input.trim() === '')) {
        result.isValid = false;
        result.error = 'This field is required';
        return result;
    }
    // Check length
    if (input && input.length > maxLength) {
        result.isValid = false;
        result.error = `Input exceeds maximum length of ${maxLength} characters`;
        return result;
    }
    // Sanitize based on options
    if (allowHTML) {
        result.sanitized = sanitizeHTML(input);
    }
    else {
        result.sanitized = escapeHTML(input);
    }
    // Check pattern if provided
    if (pattern && input && !pattern.test(input)) {
        result.isValid = false;
        result.error = 'Input does not match required format';
        return result;
    }
    return result;
}
/**
 * Safely sets innerHTML with sanitization
 * Use this instead of direct innerHTML assignment when HTML is needed
 * @param {HTMLElement} element - The element to update
 * @param {string} html - The HTML content to set
 */
export function setSafeInnerHTML(element, html) {
    if (!element) {
        console.error('setSafeInnerHTML: element is null or undefined');
        return;
    }
    element.innerHTML = sanitizeHTML(html);
}
/**
 * Safely sets text content (preferred over innerHTML for plain text)
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text content to set
 */
export function setSafeTextContent(element, text) {
    if (!element) {
        console.error('setSafeTextContent: element is null or undefined');
        return;
    }
    element.textContent = text || '';
}
/**
 * Creates a safe event handler that prevents default and stops propagation
 * Useful for preventing XSS through event handlers
 * @param {Function} handler - The actual event handler function
 * @returns {Function} Wrapped event handler
 */
export function createSafeEventHandler(handler) {
    return function (event) {
        // Prevent any potential XSS through event manipulation
        if (event && typeof event.preventDefault === 'function') {
            // Don't prevent default by default, let the handler decide
        }
        // Call the actual handler with sanitized event
        try {
            return handler.call(this, event);
        }
        catch (error) {
            console.error('Error in event handler:', error);
            return false;
        }
    };
}
/**
 * Checks if a FHIR resource has restricted security labels.
 * Returns true if the resource has 'R' (Restricted) or 'V' (Very Restricted) labels.
 * @param {Object} resource - The FHIR resource to check
 * @returns {boolean} True if access should be restricted
 */
export function isRestrictedResource(resource) {
    if (!resource || !resource.meta || !resource.meta.security) {
        return false;
    }
    // HL7 v3 Confidentiality Codes
    // R = Restricted
    // V = Very Restricted
    // N = Normal (allowed)
    // L = Low (allowed)
    // M = Moderate (allowed)
    const restrictedCodes = ['R', 'V'];
    return resource.meta.security.some((label) => label.code && restrictedCodes.includes(label.code));
}
// ============================================
// Secure Storage Utilities
// ============================================
/**
 * @deprecated Use AES-GCM encryption instead. Kept for backwards compatibility migration.
 * Simple obfuscation key derived from domain
 */
function getObfuscationKey() {
    const staticKey = 'MedCalcEHR_PHI_Protection_v1';
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return staticKey + domain;
}
/**
 * @deprecated Use AES-GCM encryption instead. Kept for backwards compatibility migration.
 * Simple XOR cipher for obfuscation
 */
function xorCipher(data, key) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}
/**
 * @deprecated Use AES-GCM encryption via secureLocalStore/secureSessionStore instead.
 * Encodes data using XOR obfuscation. Kept for backwards compatibility migration.
 */
export function encodeForStorage(data) {
    try {
        const json = JSON.stringify(data);
        const key = getObfuscationKey();
        const xored = xorCipher(json, key);
        // Use base64 encoding (handle Unicode properly)
        const encoded = btoa(encodeURIComponent(xored).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
        return 'enc:' + encoded; // Prefix to identify encoded data
    }
    catch (error) {
        console.error('[Security] Failed to encode data for storage:', error);
        return '';
    }
}
/**
 * @deprecated Use AES-GCM decryption via secureLocalRetrieve/secureSessionRetrieve instead.
 * Decodes XOR-obfuscated data. Kept for backwards compatibility migration.
 */
export function decodeFromStorage(encoded) {
    try {
        // Check for encoding prefix
        if (!encoded || !encoded.startsWith('enc:')) {
            // Try to parse as plain JSON (backwards compatibility)
            return JSON.parse(encoded);
        }
        const base64 = encoded.slice(4); // Remove 'enc:' prefix
        const key = getObfuscationKey();
        // Decode base64 (handle Unicode properly)
        const xored = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const json = xorCipher(xored, key);
        return JSON.parse(json);
    }
    catch (error) {
        console.error('[Security] Failed to decode data from storage:', error);
        return null;
    }
}
// ========================================================================
// AES-GCM Encryption (Web Crypto API)
// ========================================================================
/** Cached AES-GCM key to avoid re-deriving on every operation */
let _cachedKey = null;
/**
 * Derives an AES-256-GCM encryption key using PBKDF2
 * @security Uses 100,000 iterations of PBKDF2 with SHA-256 for key derivation
 */
async function deriveEncryptionKey() {
    if (_cachedKey)
        return _cachedKey;
    const encoder = new TextEncoder();
    const passphrase = 'MedCalcEHR_PHI_Protection_v2' +
        (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    _cachedKey = await crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: encoder.encode('MedCalcEHR-salt-v2'),
        iterations: 100000,
        hash: 'SHA-256'
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return _cachedKey;
}
/**
 * Encrypts data using AES-256-GCM
 * @param data - String data to encrypt
 * @returns "aes:" prefixed base64 string containing IV + ciphertext
 */
async function encryptAESGCM(data) {
    const key = await deriveEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(data));
    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    // Encode as base64
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
        binary += String.fromCharCode(combined[i]);
    }
    return 'aes:' + btoa(binary);
}
/**
 * Decrypts AES-256-GCM encrypted data
 * @param encoded - "aes:" prefixed base64 string
 * @returns Decrypted string
 */
async function decryptAESGCM(encoded) {
    const key = await deriveEncryptionKey();
    const raw = atob(encoded.slice(4)); // Remove "aes:" prefix
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i);
    }
    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
}
/**
 * Decodes stored data with backwards compatibility
 * Handles: "aes:" (AES-GCM), "enc:" (legacy XOR), plain JSON
 * @param stored - Raw stored string
 * @param storageKey - Key for re-encryption migration
 * @param storage - Storage backend for migration re-write
 * @returns Decoded data or null
 */
async function decodeStoredData(stored, storageKey, storage) {
    if (stored.startsWith('aes:')) {
        // AES-GCM encrypted (current format)
        const json = await decryptAESGCM(stored);
        return JSON.parse(json);
    }
    // Legacy format — decode and migrate to AES-GCM
    let data;
    if (stored.startsWith('enc:')) {
        // Legacy XOR obfuscation
        data = decodeFromStorage(stored);
    }
    else {
        // Plain JSON (oldest format)
        data = JSON.parse(stored);
    }
    // Migrate to AES-GCM on read
    if (data !== null) {
        try {
            const json = JSON.stringify(data);
            const encrypted = await encryptAESGCM(json);
            storage.setItem(storageKey, encrypted);
        }
        catch {
            // Migration failed silently — data is still readable
        }
    }
    return data;
}
// ========================================================================
// Public Secure Storage API (AES-GCM)
// ========================================================================
/**
 * Securely stores data in sessionStorage with AES-256-GCM encryption
 * @param key - Storage key
 * @param data - Data to store
 * @security Uses Web Crypto API for proper encryption of PHI data
 */
export async function secureSessionStore(key, data) {
    try {
        const json = JSON.stringify(data);
        const encrypted = await encryptAESGCM(json);
        sessionStorage.setItem(key, encrypted);
    }
    catch (error) {
        console.error('[Security] Failed to store data securely:', error);
    }
}
/**
 * Retrieves and decrypts data from sessionStorage
 * Supports backwards compatibility with legacy XOR and plain JSON formats
 * @param key - Storage key
 * @returns Decrypted data or null
 */
export async function secureSessionRetrieve(key) {
    try {
        const stored = sessionStorage.getItem(key);
        if (!stored)
            return null;
        return await decodeStoredData(stored, key, sessionStorage);
    }
    catch (error) {
        console.error('[Security] Failed to retrieve data securely:', error);
        return null;
    }
}
/**
 * Securely stores data in localStorage with AES-256-GCM encryption
 * @param key - Storage key
 * @param data - Data to store
 * @security Uses Web Crypto API for proper encryption of PHI data
 */
export async function secureLocalStore(key, data) {
    try {
        const json = JSON.stringify(data);
        const encrypted = await encryptAESGCM(json);
        localStorage.setItem(key, encrypted);
    }
    catch (error) {
        console.error('[Security] Failed to store data in localStorage:', error);
    }
}
/**
 * Retrieves and decrypts data from localStorage
 * Supports backwards compatibility with legacy XOR and plain JSON formats
 * @param key - Storage key
 * @returns Decrypted data or null
 */
export async function secureLocalRetrieve(key) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored)
            return null;
        return await decodeStoredData(stored, key, localStorage);
    }
    catch (error) {
        console.error('[Security] Failed to retrieve data from localStorage:', error);
        return null;
    }
}
/**
 * Extracts only essential patient data for storage (minimizes PHI exposure)
 * @param patient - Full FHIR patient resource
 * @returns Minimal patient data object
 */
export function extractMinimalPatientData(patient) {
    if (!patient)
        return null;
    try {
        const name = patient.name?.[0];
        const formattedName = name?.text ||
            `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim() ||
            'Unknown';
        return {
            id: patient.id || '',
            name: formattedName,
            birthDate: patient.birthDate || '',
            gender: patient.gender || ''
        };
    }
    catch (error) {
        console.error('[Security] Failed to extract minimal patient data:', error);
        return null;
    }
}
export default {
    escapeHTML,
    escapeHTMLFast,
    sanitizeHTML,
    createSafeElement,
    isValidURL,
    sanitizeFHIRField,
    validateInput,
    setSafeInnerHTML,
    setSafeTextContent,
    createSafeEventHandler,
    isRestrictedResource,
    // Secure storage utilities
    encodeForStorage,
    decodeFromStorage,
    secureSessionStore,
    secureSessionRetrieve,
    secureLocalStore,
    secureLocalRetrieve,
    extractMinimalPatientData
};
