// src/lazyLoader.ts
/**
 * Lazy Loading Utilities
 * - Dynamic calculator imports
 * - Image lazy loading
 * - CSS lazy loading
 */

interface LazyLoaderOptions {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number;
}

interface Resource {
    url: string;
    type: 'script' | 'style' | 'font' | 'image' | 'fetch';
}

interface IdleCallbackOptions {
    timeout?: number;
}

/**
 * Lazy load CSS files
 * @param href - CSS file path
 * @param id - Optional link element ID
 */
export function loadCSS(href: string, id: string | null = null): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (id && document.getElementById(id)) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (id) {
            link.id = id;
        }

        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));

        document.head.appendChild(link);
    });
}

/**
 * Preload CSS file
 * @param href - CSS file path
 */
export function preloadCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * Lazy load calculator module
 * @param calculatorId - Calculator ID
 * @returns Calculator module
 */
export async function loadCalculator(calculatorId: string): Promise<unknown> {
    try {
        // Dynamic import with webpack magic comment for code splitting
        const module = await import(
            /* webpackChunkName: "calculator-[request]" */
            /* webpackMode: "lazy" */
            `./calculators/${calculatorId}/index.js`
        );

        return module;
    } catch (error) {
        throw new Error(`Calculator "${calculatorId}" not found`);
    }
}

/**
 * Lazy load Chart.js only when needed (bundled via Vite)
 * @returns Chart.js module
 */
let chartJsPromise: Promise<unknown> | null = null;

export function loadChartJS(): Promise<unknown> {
    if (chartJsPromise) {
        return chartJsPromise;
    }

    chartJsPromise = import('chart.js').then(module => {
        return module.Chart;
    });

    return chartJsPromise;
}

/**
 * Image Lazy Loading using Intersection Observer
 */
export class ImageLazyLoader {
    private options: LazyLoaderOptions;
    private observer: IntersectionObserver | null = null;

    constructor(options: LazyLoaderOptions = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        this.init();
    }

    private init(): void {
        // Check for Intersection Observer support
        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target as HTMLImageElement);
                    this.observer?.unobserve(entry.target);
                }
            });
        }, this.options);

        this.observeImages();
    }

    private observeImages(): void {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => {
            this.observer?.observe(img);
        });
    }

    private loadImage(img: HTMLImageElement): void {
        const src = img.dataset.src || img.getAttribute('src');

        if (!src) {
            return;
        }

        // Create new image to preload
        const tempImg = new Image();

        tempImg.onload = () => {
            img.src = src;
            img.classList.add('loaded');
            img.removeAttribute('data-src');

            // Trigger custom event instead of eval() for security
            // This prevents XSS attacks through data-onload attribute
            if (img.dataset.onload) {
                const event = new CustomEvent('imageLoaded', {
                    detail: { img, callback: img.dataset.onload }
                });
                img.dispatchEvent(event);
            }
        };

        tempImg.onerror = () => {
            img.classList.add('error');
        };

        // Add loading class
        img.classList.add('loading');

        // Start loading
        tempImg.src = src;
    }

    private loadAllImages(): void {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const src = (img as HTMLImageElement).dataset.src;
            if (src) {
                (img as HTMLImageElement).src = src;
                img.removeAttribute('data-src');
            }
        });
    }

    // Add new images to observer
    observe(element: Element): void {
        if (this.observer) {
            if (element.tagName === 'IMG') {
                this.observer.observe(element);
            } else {
                const images = element.querySelectorAll('img[data-src]');
                images.forEach(img => this.observer?.observe(img));
            }
        }
    }

    // Disconnect observer
    disconnect(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

/**
 * Resource Prefetching
 */
export function prefetchResource(url: string, type: string = 'fetch'): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = type;
    link.href = url;
    document.head.appendChild(link);
}

/**
 * Preload important resources
 */
export function preloadResources(resources: Resource[]): void {
    resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = resource.type;
        link.href = resource.url;

        if (resource.type === 'font') {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
    });
}

/**
 * Idle callback for non-critical tasks
 * @param callback - Function to execute when idle
 * @param options - Options for requestIdleCallback
 */
export function onIdle(
    callback: IdleRequestCallback,
    options: IdleCallbackOptions = { timeout: 2000 }
): void {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, options);
    } else {
        // Fallback to setTimeout
        setTimeout(
            () => callback({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline),
            100
        );
    }
}

/**
 * Load module when network is idle
 * @param importFn - Dynamic import function
 */
export function loadOnIdle<T>(importFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        onIdle(async () => {
            try {
                const module = await importFn();
                resolve(module);
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Initialize image lazy loader on DOM ready
let imageLazyLoader: ImageLazyLoader | null = null;

export function initImageLazyLoading(): ImageLazyLoader {
    if (!imageLazyLoader) {
        imageLazyLoader = new ImageLazyLoader();
    }
    return imageLazyLoader;
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageLazyLoading);
} else {
    initImageLazyLoading();
}

export default {
    loadCSS,
    preloadCSS,
    loadCalculator,
    loadChartJS,
    ImageLazyLoader,
    prefetchResource,
    preloadResources,
    onIdle,
    loadOnIdle,
    initImageLazyLoading
};
