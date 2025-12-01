// tests/security.test.js

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    escapeHTML,
    escapeHTMLFast,
    sanitizeHTML,
    createSafeElement,
    isValidURL,
    sanitizeFHIRField,
    validateInput,
    setSafeInnerHTML,
    setSafeTextContent
} from '../js/security.js';

describe('Security Utilities', () => {
    describe('escapeHTML', () => {
        it('should escape HTML special characters', () => {
            expect(escapeHTML('<script>alert("XSS")</script>')).toBe(
                '&lt;script&gt;alert("XSS")&lt;/script&gt;'
            );
        });

        it('should escape ampersands', () => {
            expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('should escape quotes', () => {
            expect(escapeHTML('Say "Hello"')).toBe('Say &quot;Hello&quot;');
            expect(escapeHTML("It's")).toContain('&#');
        });

        it('should handle null and undefined', () => {
            expect(escapeHTML(null)).toBe('');
            expect(escapeHTML(undefined)).toBe('');
        });

        it('should handle empty string', () => {
            expect(escapeHTML('')).toBe('');
        });
    });

    describe('escapeHTMLFast', () => {
        it('should escape HTML special characters', () => {
            const input = '<script>alert("XSS")</script>';
            const output = escapeHTMLFast(input);
            expect(output).not.toContain('<script>');
            expect(output).toContain('&lt;');
            expect(output).toContain('&gt;');
        });

        it('should escape all dangerous characters', () => {
            const input = '& < > " \' /';
            const output = escapeHTMLFast(input);
            expect(output).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
        });
    });

    describe('sanitizeHTML', () => {
        it('should remove script tags', () => {
            const input = '<div>Hello<script>alert("XSS")</script>World</div>';
            const output = sanitizeHTML(input);
            expect(output).not.toContain('<script>');
            expect(output).toContain('Hello');
            expect(output).toContain('World');
        });

        it('should remove event handlers', () => {
            const input = '<button onclick="alert(\'XSS\')">Click</button>';
            const output = sanitizeHTML(input);
            expect(output).not.toContain('onclick');
            expect(output).toContain('Click');
        });

        it('should remove javascript: URLs', () => {
            const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
            const output = sanitizeHTML(input);
            expect(output).not.toContain('javascript:');
        });

        it('should preserve safe HTML', () => {
            const input = '<div class="container"><p>Safe content</p></div>';
            const output = sanitizeHTML(input);
            expect(output).toContain('Safe content');
            expect(output).toContain('class="container"');
        });

        it('should handle empty input', () => {
            expect(sanitizeHTML('')).toBe('');
            expect(sanitizeHTML(null)).toBe('');
        });
    });

    describe('createSafeElement', () => {
        it('should create element with text content', () => {
            const element = createSafeElement('div', 'Hello World');
            expect(element.tagName).toBe('DIV');
            expect(element.textContent).toBe('Hello World');
        });

        it('should escape HTML in text content', () => {
            const element = createSafeElement('div', '<script>alert("XSS")</script>');
            expect(element.innerHTML).not.toContain('<script>');
            expect(element.textContent).toContain('<script>');
        });

        it('should set attributes safely', () => {
            const element = createSafeElement('a', 'Link', {
                href: 'https://example.com',
                class: 'btn'
            });
            expect(element.getAttribute('href')).toBe('https://example.com');
            expect(element.getAttribute('class')).toBe('btn');
        });

        it('should block event handler attributes', () => {
            const element = createSafeElement('button', 'Click', {
                onclick: 'alert("XSS")'
            });
            expect(element.getAttribute('onclick')).toBeNull();
        });

        it('should block dangerous URLs', () => {
            const element = createSafeElement('a', 'Link', {
                href: 'javascript:alert("XSS")'
            });
            expect(element.getAttribute('href')).toBeNull();
        });
    });

    describe('isValidURL', () => {
        it('should allow http and https URLs', () => {
            expect(isValidURL('http://example.com')).toBe(true);
            expect(isValidURL('https://example.com')).toBe(true);
        });

        it('should allow relative URLs', () => {
            expect(isValidURL('/path/to/page')).toBe(true);
            expect(isValidURL('./relative/path')).toBe(true);
            expect(isValidURL('../parent/path')).toBe(true);
        });

        it('should allow anchor links', () => {
            expect(isValidURL('#section')).toBe(true);
        });

        it('should block javascript: URLs', () => {
            expect(isValidURL('javascript:alert("XSS")')).toBe(false);
            expect(isValidURL('JAVASCRIPT:alert("XSS")')).toBe(false);
        });

        it('should block data: URLs', () => {
            expect(isValidURL('data:text/html,<script>alert("XSS")</script>')).toBe(false);
        });

        it('should block vbscript: URLs', () => {
            expect(isValidURL('vbscript:msgbox("XSS")')).toBe(false);
        });

        it('should block file: URLs', () => {
            expect(isValidURL('file:///etc/passwd')).toBe(false);
        });

        it('should handle null and undefined', () => {
            expect(isValidURL(null)).toBe(false);
            expect(isValidURL(undefined)).toBe(false);
        });
    });

    describe('sanitizeFHIRField', () => {
        it('should extract and escape simple fields', () => {
            const fhirData = { name: '<script>alert("XSS")</script>' };
            const result = sanitizeFHIRField(fhirData, 'name');
            expect(result).not.toContain('<script>');
        });

        it('should handle nested fields', () => {
            const fhirData = {
                name: [{ text: 'John <Doe>' }]
            };
            const result = sanitizeFHIRField(fhirData, 'name.0.text');
            expect(result).toContain('John');
            expect(result).not.toContain('<Doe>');
        });

        it('should handle missing fields', () => {
            const fhirData = { name: 'John' };
            const result = sanitizeFHIRField(fhirData, 'nonexistent');
            expect(result).toBe('');
        });

        it('should handle null data', () => {
            expect(sanitizeFHIRField(null, 'field')).toBe('');
            expect(sanitizeFHIRField({}, null)).toBe('');
        });
    });

    describe('validateInput', () => {
        it('should validate required fields', () => {
            const result = validateInput('', { required: true });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('should validate max length', () => {
            const result = validateInput('a'.repeat(100), { maxLength: 50 });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('maximum length');
        });

        it('should validate pattern', () => {
            const result = validateInput('abc123', {
                pattern: /^[0-9]+$/
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('format');
        });

        it('should sanitize valid input', () => {
            const result = validateInput('<script>test</script>', {
                allowHTML: false
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized).not.toContain('<script>');
        });

        it('should allow HTML when specified', () => {
            const result = validateInput('<p>Safe content</p>', {
                allowHTML: true
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized).toContain('<p>');
        });
    });

    describe('setSafeInnerHTML', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
        });

        it('should set sanitized HTML', () => {
            setSafeInnerHTML(container, '<p>Hello</p><script>alert("XSS")</script>');
            expect(container.innerHTML).toContain('<p>Hello</p>');
            expect(container.innerHTML).not.toContain('<script>');
        });

        it('should handle null element gracefully', () => {
            expect(() => setSafeInnerHTML(null, '<p>Test</p>')).not.toThrow();
        });
    });

    describe('setSafeTextContent', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
        });

        it('should set text content without HTML parsing', () => {
            setSafeTextContent(container, '<script>alert("XSS")</script>');
            expect(container.textContent).toBe('<script>alert("XSS")</script>');
            expect(container.innerHTML).not.toContain('<script>');
        });

        it('should handle null element gracefully', () => {
            expect(() => setSafeTextContent(null, 'Test')).not.toThrow();
        });

        it('should handle null text', () => {
            setSafeTextContent(container, null);
            expect(container.textContent).toBe('');
        });
    });

    describe('XSS Attack Vectors', () => {
        const xssVectors = [
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            '<iframe src="javascript:alert(\'XSS\')">',
            '<body onload=alert("XSS")>',
            '<input onfocus=alert("XSS") autofocus>',
            '<select onfocus=alert("XSS") autofocus>',
            '<textarea onfocus=alert("XSS") autofocus>',
            '<marquee onstart=alert("XSS")>',
            '<div style="background:url(javascript:alert(\'XSS\'))">',
            '"><script>alert(String.fromCharCode(88,83,83))</script>'
        ];

        xssVectors.forEach((vector, index) => {
            it(`should block XSS vector #${index + 1}`, () => {
                const sanitized = sanitizeHTML(vector);
                // Should not contain script execution
                expect(sanitized.toLowerCase()).not.toContain('alert(');
                expect(sanitized.toLowerCase()).not.toContain('javascript:');
            });
        });
    });
});
