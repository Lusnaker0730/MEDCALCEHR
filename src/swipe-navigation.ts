import { calculatorModules } from './calculators/index.js';

const MIN_DISTANCE = 50;
const MAX_VERTICAL_RATIO = 0.75;
const MAX_TIME = 500;

export function initSwipeNavigation(currentCalcId: string): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const sortedIds = calculatorModules.map(c => c.id);
    const currentIndex = sortedIds.indexOf(currentCalcId);
    if (currentIndex === -1) return;

    const prevId = currentIndex > 0 ? sortedIds[currentIndex - 1] : null;
    const nextId = currentIndex < sortedIds.length - 1 ? sortedIds[currentIndex + 1] : null;

    if (!prevId && !nextId) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e: TouchEvent) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        if (deltaTime > MAX_TIME) return;
        if (Math.abs(deltaX) < MIN_DISTANCE) return;
        if (Math.abs(deltaY) / Math.abs(deltaX) > MAX_VERTICAL_RATIO) return;

        // Don't navigate if user was interacting with an input
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
            return;
        }

        if (deltaX > 0 && prevId) {
            window.location.href = `calculator.html?name=${prevId}`;
        } else if (deltaX < 0 && nextId) {
            window.location.href = `calculator.html?name=${nextId}`;
        }
    }, { passive: true });

    showSwipeIndicators(prevId, nextId);
}

function showSwipeIndicators(prevId: string | null, nextId: string | null): void {
    const container = document.getElementById('calculator-container');
    if (!container) return;

    if (prevId) {
        const meta = calculatorModules.find(c => c.id === prevId);
        const el = document.createElement('div');
        el.className = 'swipe-indicator swipe-indicator-left';
        el.textContent = '\u2039';
        el.title = meta?.title || 'Previous';
        container.appendChild(el);
    }
    if (nextId) {
        const meta = calculatorModules.find(c => c.id === nextId);
        const el = document.createElement('div');
        el.className = 'swipe-indicator swipe-indicator-right';
        el.textContent = '\u203A';
        el.title = meta?.title || 'Next';
        container.appendChild(el);
    }
}
