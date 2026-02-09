jest.mock('../logger.js', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } }));
jest.mock('../sentry.js', () => ({ initSentry: jest.fn() }));
jest.mock('../calculators/index.js', () => ({
    calculatorModules: [
        { id: 'calc-a', title: 'Calc A' },
        { id: 'calc-b', title: 'Calc B' },
        { id: 'calc-c', title: 'Calc C' },
    ],
    categories: {},
    loadCalculator: jest.fn(),
    getCalculatorMetadata: jest.fn(),
}));

import { initSwipeNavigation } from '../swipe-navigation.js';

// Helper to create mock touch events
function createTouchEvent(type: string, clientX: number, clientY: number): Event {
    const event = new Event(type, { bubbles: true });
    if (type === 'touchstart') {
        Object.defineProperty(event, 'touches', {
            value: [{ clientX, clientY }]
        });
    } else {
        Object.defineProperty(event, 'changedTouches', {
            value: [{ clientX, clientY }]
        });
    }
    Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
        writable: true
    });
    return event;
}

describe('SwipeNavigation', () => {
    let mockMatchMedia: jest.Mock;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="calculator-container"></div>';

        // Mock matchMedia — default: no reduced motion
        mockMatchMedia = jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }));
        Object.defineProperty(window, 'matchMedia', { writable: true, value: mockMatchMedia });

        // Mock location
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    it('does nothing if prefers-reduced-motion is set', () => {
        mockMatchMedia.mockImplementation(() => ({ matches: true }));

        const addSpy = jest.spyOn(document, 'addEventListener');
        initSwipeNavigation('calc-b');

        // Should not have added touch listeners
        const touchCalls = addSpy.mock.calls.filter(
            c => c[0] === 'touchstart' || c[0] === 'touchend'
        );
        expect(touchCalls).toHaveLength(0);
        addSpy.mockRestore();
    });

    it('does nothing for unknown calculator ID', () => {
        const addSpy = jest.spyOn(document, 'addEventListener');
        initSwipeNavigation('unknown-calc');

        const touchCalls = addSpy.mock.calls.filter(
            c => c[0] === 'touchstart' || c[0] === 'touchend'
        );
        expect(touchCalls).toHaveLength(0);
        addSpy.mockRestore();
    });

    it('adds touch event listeners for valid calculator', () => {
        const addSpy = jest.spyOn(document, 'addEventListener');
        initSwipeNavigation('calc-b');

        const touchCalls = addSpy.mock.calls.filter(
            c => c[0] === 'touchstart' || c[0] === 'touchend'
        );
        expect(touchCalls).toHaveLength(2);
        addSpy.mockRestore();
    });

    it('shows swipe indicators when container exists', () => {
        initSwipeNavigation('calc-b');

        const container = document.getElementById('calculator-container')!;
        const indicators = container.querySelectorAll('.swipe-indicator');
        expect(indicators.length).toBe(2); // prev and next
    });

    it('shows only next indicator for first calculator', () => {
        initSwipeNavigation('calc-a');

        const container = document.getElementById('calculator-container')!;
        const left = container.querySelectorAll('.swipe-indicator-left');
        const right = container.querySelectorAll('.swipe-indicator-right');
        expect(left.length).toBe(0);
        expect(right.length).toBe(1);
    });

    it('shows only prev indicator for last calculator', () => {
        initSwipeNavigation('calc-c');

        const container = document.getElementById('calculator-container')!;
        const left = container.querySelectorAll('.swipe-indicator-left');
        const right = container.querySelectorAll('.swipe-indicator-right');
        expect(left.length).toBe(1);
        expect(right.length).toBe(0);
    });

    it('navigates to next on swipe left', () => {
        initSwipeNavigation('calc-b');

        // Simulate swipe left (finger moves from right to left)
        const start = createTouchEvent('touchstart', 300, 200);
        document.dispatchEvent(start);

        // Small delay to simulate time passing (within MAX_TIME)
        const end = createTouchEvent('touchend', 200, 200); // deltaX = -100
        document.dispatchEvent(end);

        expect(window.location.href).toBe('calculator.html?name=calc-c');
    });

    it('navigates to prev on swipe right', () => {
        initSwipeNavigation('calc-b');

        const start = createTouchEvent('touchstart', 200, 200);
        document.dispatchEvent(start);

        const end = createTouchEvent('touchend', 300, 200); // deltaX = +100
        document.dispatchEvent(end);

        expect(window.location.href).toBe('calculator.html?name=calc-a');
    });

    it('does not navigate for too-short swipes', () => {
        initSwipeNavigation('calc-b');
        (window as any).location.href = '';

        const start = createTouchEvent('touchstart', 200, 200);
        document.dispatchEvent(start);

        const end = createTouchEvent('touchend', 230, 200); // deltaX = 30 < 50
        document.dispatchEvent(end);

        expect(window.location.href).toBe('');
    });

    it('does not navigate when target is INPUT', () => {
        initSwipeNavigation('calc-b');
        (window as any).location.href = '';

        const start = createTouchEvent('touchstart', 300, 200);
        document.dispatchEvent(start);

        const end = createTouchEvent('touchend', 200, 200);
        const input = document.createElement('input');
        Object.defineProperty(end, 'target', { value: input, writable: true });
        document.dispatchEvent(end);

        expect(window.location.href).toBe('');
    });
});
