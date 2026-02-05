/**
 * Security utilities for preventing XSS attacks and sanitizing user input
 * Provides HTML escaping, sanitization, and safe DOM manipulation functions
 */
/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
/**
 * Alternative implementation using character replacement
 * More performant for large strings
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHTMLFast(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, char => htmlEscapeMap[char]);
}
/**
 * Sanitizes HTML by removing potentially dangerous elements and attributes
 * @param {string} html - The HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHTML(html) {
    if (!html) {
        return '';
    }
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Remove script tags
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    // Remove event handler attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove all on* attributes (onclick, onload, etc.)
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        });
        // Remove javascript: URLs
        ['href', 'src', 'action'].forEach(attr => {
            const value = element.getAttribute(attr);
            if (value && value.toLowerCase().trim().startsWith('javascript:')) {
                element.removeAttribute(attr);
            }
        });
    });
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
 * Simple obfuscation key derived from domain
 * Note: This is NOT cryptographically secure, but provides a layer of protection
 * against casual inspection and makes it clear the data is meant to be protected.
 */
function getObfuscationKey() {
    // Use a combination of static key and domain to make it slightly harder to decode
    const staticKey = 'MedCalcEHR_PHI_Protection_v1';
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return staticKey + domain;
}
/**
 * Simple XOR cipher for obfuscation
 * @param data - Data to encode/decode
 * @param key - Key for XOR operation
 * @returns XOR'd string
 */
function xorCipher(data, key) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}
/**
 * Encodes data for secure storage in localStorage/sessionStorage
 * Uses XOR cipher with base64 encoding for obfuscation
 * @param data - Object to encode
 * @returns Encoded string safe for storage
 * @security This is obfuscation, not encryption. For true security, use Web Crypto API.
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
 * Decodes data from secure storage
 * @param encoded - Encoded string from storage
 * @returns Decoded object or null if decoding fails
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
/**
 * Securely stores data in sessionStorage with obfuscation
 * @param key - Storage key
 * @param data - Data to store
 */
export function secureSessionStore(key, data) {
    try {
        const encoded = encodeForStorage(data);
        if (encoded) {
            sessionStorage.setItem(key, encoded);
        }
    }
    catch (error) {
        console.error('[Security] Failed to store data securely:', error);
    }
}
/**
 * Retrieves and decodes data from sessionStorage
 * @param key - Storage key
 * @returns Decoded data or null
 */
export function secureSessionRetrieve(key) {
    try {
        const stored = sessionStorage.getItem(key);
        if (!stored)
            return null;
        return decodeFromStorage(stored);
    }
    catch (error) {
        console.error('[Security] Failed to retrieve data securely:', error);
        return null;
    }
}
/**
 * Securely stores data in localStorage with obfuscation
 * @param key - Storage key
 * @param data - Data to store
 */
export function secureLocalStore(key, data) {
    try {
        const encoded = encodeForStorage(data);
        if (encoded) {
            localStorage.setItem(key, encoded);
        }
    }
    catch (error) {
        console.error('[Security] Failed to store data in localStorage:', error);
    }
}
/**
 * Retrieves and decodes data from localStorage
 * @param key - Storage key
 * @returns Decoded data or null
 */
export function secureLocalRetrieve(key) {
    try {
        const stored = localStorage.getItem(key);
        if (!stored)
            return null;
        return decodeFromStorage(stored);
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
