/**
 * @jest-environment jsdom
 */

/**
 * Lazy Loader Module Tests
 * Tests for CSS loading, calculator dynamic imports, Chart.js loading,
 * ImageLazyLoader class, resource prefetching, idle callbacks, and
 * singleton initialization.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Helpers & Mocks
// ---------------------------------------------------------------------------

/**
 * Mock IntersectionObserver class that captures its callback and options
 * so tests can simulate intersection events.
 */
class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;
    observedElements: Element[] = [];
    unobservedElements: Element[] = [];
    disconnected = false;

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        this.options = options;
    }

    observe(el: Element) {
        this.observedElements.push(el);
    }

    unobserve(el: Element) {
        this.unobservedElements.push(el);
    }

    disconnect() {
        this.disconnected = true;
    }

    // Helper: simulate entries intersecting
    triggerEntries(entries: Partial<IntersectionObserverEntry>[]) {
        this.callback(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
    }
}

// Keep a reference so tests can access the last created instance
let mockObserverInstance: MockIntersectionObserver | null = null;

/**
 * Dynamically import the lazyLoader module.
 * Must be called after jest.resetModules() for fresh module state.
 */
async function importLazyLoader() {
    const mod = await import('../lazyLoader.js');
    return mod;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Lazy Loader Module', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();

        // Clear document.head of any test-added elements
        document.head.innerHTML = '';
        document.body.innerHTML = '';

        // Install mock IntersectionObserver
        mockObserverInstance = null;
        (window as any).IntersectionObserver = class extends MockIntersectionObserver {
            constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
                super(callback, options);
                mockObserverInstance = this;
            }
        };

        // Ensure window.Chart is cleared
        delete (window as any).Chart;

        // Suppress console.error noise
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
        // Clean up requestIdleCallback mock
        delete (window as any).requestIdleCallback;
    });

    // =========================================
    // loadCSS
    // =========================================
    describe('loadCSS', () => {
        test('should create a link element and append to head', async () => {
            const { loadCSS } = await importLazyLoader();

            const promise = loadCSS('/styles/main.css');

            // Find the link element in head
            const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
            expect(link).not.toBeNull();
            expect(link.href).toContain('/styles/main.css');
            expect(link.rel).toBe('stylesheet');

            // Simulate onload
            link.onload!(new Event('load'));
            await expect(promise).resolves.toBeUndefined();
        });

        test('should set the id on the link element when provided', async () => {
            const { loadCSS } = await importLazyLoader();

            const promise = loadCSS('/styles/theme.css', 'theme-css');

            const link = document.head.querySelector('#theme-css') as HTMLLinkElement;
            expect(link).not.toBeNull();
            expect(link.id).toBe('theme-css');

            // Resolve
            link.onload!(new Event('load'));
            await expect(promise).resolves.toBeUndefined();
        });

        test('should resolve immediately if element with the same id already exists', async () => {
            const { loadCSS } = await importLazyLoader();

            // Pre-add an element with the target id
            const existing = document.createElement('link');
            existing.id = 'existing-css';
            document.head.appendChild(existing);

            // Should resolve immediately (idempotent)
            await expect(loadCSS('/styles/duplicate.css', 'existing-css')).resolves.toBeUndefined();

            // Should NOT create a new link (only the pre-existing one)
            const links = document.head.querySelectorAll('#existing-css');
            expect(links.length).toBe(1);
        });

        test('should reject when onerror fires', async () => {
            const { loadCSS } = await importLazyLoader();

            const promise = loadCSS('/styles/broken.css');

            const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
            link.onerror!(new Event('error'));

            await expect(promise).rejects.toThrow('Failed to load CSS: /styles/broken.css');
        });

        test('should not set id when id parameter is null', async () => {
            const { loadCSS } = await importLazyLoader();

            const promise = loadCSS('/styles/noid.css', null);

            const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
            expect(link.id).toBe('');

            link.onload!(new Event('load'));
            await expect(promise).resolves.toBeUndefined();
        });
    });

    // =========================================
    // preloadCSS
    // =========================================
    describe('preloadCSS', () => {
        test('should create a preload link element', async () => {
            const { preloadCSS } = await importLazyLoader();

            preloadCSS('/styles/critical.css');

            const link = document.head.querySelector('link[rel="preload"]') as HTMLLinkElement;
            expect(link).not.toBeNull();
            expect(link.rel).toBe('preload');
            expect(link.as).toBe('style');
            expect(link.href).toContain('/styles/critical.css');
        });
    });

    // =========================================
    // loadCalculator
    // =========================================
    describe('loadCalculator', () => {
        test('should dynamically import the calculator module', async () => {
            const mockModule = { id: 'bmi-bsa', calculate: jest.fn() };

            // Mock the dynamic import - use jest.unstable_mockModule before re-importing
            jest.resetModules();

            // We can't easily mock dynamic import() directly, so we'll test the error path
            // and the success path by mocking at the module level
            const { loadCalculator } = await importLazyLoader();

            // The dynamic import will fail because the calculator module doesn't exist in test env
            await expect(loadCalculator('nonexistent-calc')).rejects.toThrow(
                'Calculator "nonexistent-calc" not found'
            );

            expect(console.error).toHaveBeenCalledWith(
                'Failed to load calculator: nonexistent-calc',
                expect.anything()
            );
        });

        test('should throw a formatted error when calculator module fails to load', async () => {
            const { loadCalculator } = await importLazyLoader();

            try {
                await loadCalculator('missing-calculator');
                // Should not reach here
                expect(true).toBe(false);
            } catch (error: any) {
                expect(error.message).toBe('Calculator "missing-calculator" not found');
            }
        });
    });

    // =========================================
    // loadChartJS
    // =========================================
    describe('loadChartJS', () => {
        test('should resolve with window.Chart when already loaded', async () => {
            (window as any).Chart = { version: '3.9.1' };

            const { loadChartJS } = await importLazyLoader();
            const result = await loadChartJS();

            expect(result).toEqual({ version: '3.9.1' });
        });

        test('should create a script element and load Chart.js from CDN', async () => {
            const { loadChartJS } = await importLazyLoader();

            const promise = loadChartJS();

            const script = document.head.querySelector('script') as HTMLScriptElement;
            expect(script).not.toBeNull();
            expect(script.src).toContain('chart.js');
            expect(script.async).toBe(true);

            // Simulate successful load
            (window as any).Chart = { version: '3.9.1' };
            script.onload!(new Event('load'));

            const result = await promise;
            expect(result).toEqual({ version: '3.9.1' });
        });

        test('should return the same cached promise on subsequent calls (singleton)', async () => {
            const { loadChartJS } = await importLazyLoader();

            const promise1 = loadChartJS();
            const promise2 = loadChartJS();

            expect(promise1).toBe(promise2);

            // Resolve both
            const script = document.head.querySelector('script') as HTMLScriptElement;
            (window as any).Chart = { version: '3.9.1' };
            script.onload!(new Event('load'));

            await promise1;
            await promise2;
        });

        test('should reject when script.onerror fires', async () => {
            const { loadChartJS } = await importLazyLoader();

            const promise = loadChartJS();

            const script = document.head.querySelector('script') as HTMLScriptElement;
            script.onerror!(new Event('error'));

            await expect(promise).rejects.toThrow('Failed to load Chart.js');
        });

        test('should reject when script loads but window.Chart is still undefined', async () => {
            const { loadChartJS } = await importLazyLoader();

            const promise = loadChartJS();

            const script = document.head.querySelector('script') as HTMLScriptElement;
            // Do NOT set window.Chart before triggering onload
            script.onload!(new Event('load'));

            await expect(promise).rejects.toThrow('Chart.js failed to load');
        });
    });

    // =========================================
    // ImageLazyLoader
    // =========================================
    describe('ImageLazyLoader', () => {
        describe('constructor with IntersectionObserver available', () => {
            test('should create an IntersectionObserver with default options', async () => {
                const { ImageLazyLoader } = await importLazyLoader();

                const loader = new ImageLazyLoader();

                expect(mockObserverInstance).not.toBeNull();
                expect(mockObserverInstance!.options).toEqual(
                    expect.objectContaining({
                        root: null,
                        rootMargin: '50px',
                        threshold: 0.01
                    })
                );
            });

            test('should allow custom options to override defaults', async () => {
                const { ImageLazyLoader } = await importLazyLoader();

                const loader = new ImageLazyLoader({
                    rootMargin: '100px',
                    threshold: 0.5
                });

                expect(mockObserverInstance!.options).toEqual(
                    expect.objectContaining({
                        root: null,
                        rootMargin: '100px',
                        threshold: 0.5
                    })
                );
            });

            test('should observe existing images with data-src on init', async () => {
                // Add images to DOM before creating loader
                const img1 = document.createElement('img');
                img1.setAttribute('data-src', '/images/photo1.jpg');
                document.body.appendChild(img1);

                const img2 = document.createElement('img');
                img2.setAttribute('loading', 'lazy');
                document.body.appendChild(img2);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                expect(mockObserverInstance!.observedElements).toContain(img1);
                expect(mockObserverInstance!.observedElements).toContain(img2);
            });
        });

        describe('constructor without IntersectionObserver', () => {
            test('should fall back to loading all images immediately', async () => {
                // Remove IntersectionObserver from window
                delete (window as any).IntersectionObserver;

                // Add images with data-src
                const img1 = document.createElement('img');
                img1.setAttribute('data-src', '/images/fallback1.jpg');
                document.body.appendChild(img1);

                const img2 = document.createElement('img');
                img2.setAttribute('data-src', '/images/fallback2.jpg');
                document.body.appendChild(img2);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                // Images should have their src set directly
                expect(img1.src).toContain('/images/fallback1.jpg');
                expect(img2.src).toContain('/images/fallback2.jpg');
                // data-src attribute should be removed
                expect(img1.hasAttribute('data-src')).toBe(false);
                expect(img2.hasAttribute('data-src')).toBe(false);
            });
        });

        describe('loadImage (via observer callback)', () => {
            test('should load image from data-src when intersecting', async () => {
                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/lazy.jpg');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                // Simulate intersection
                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                // The loading class should be added
                expect(img.classList.contains('loading')).toBe(true);

                // Simulate the temp image onload
                // The loadImage method creates `new Image()` internally. In jsdom,
                // we can find out the behavior by checking the img element after events fire.
                // We need to trigger the onload of the temp Image created in loadImage.
                // Since we can't easily access the temp Image, let's verify the loading class was added.
            });

            test('should unobserve the element after intersection', async () => {
                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/lazy.jpg');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                expect(mockObserverInstance!.unobservedElements).toContain(img);
            });

            test('should NOT load image when entry is not intersecting', async () => {
                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/hidden.jpg');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: false, target: img }
                ]);

                // Should not have loading class
                expect(img.classList.contains('loading')).toBe(false);
                // Should not have been unobserved
                expect(mockObserverInstance!.unobservedElements).not.toContain(img);
            });

            test('should handle image with no data-src (use src attribute)', async () => {
                const img = document.createElement('img');
                img.setAttribute('src', '/images/direct.jpg');
                // No data-src attribute
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                // Should still add loading class because src is set
                expect(img.classList.contains('loading')).toBe(true);
            });

            test('should skip loading when no src and no data-src', async () => {
                const img = document.createElement('img');
                // No src, no data-src
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                // Should NOT add loading class since there is nothing to load
                expect(img.classList.contains('loading')).toBe(false);
            });
        });

        describe('loadImage — onload and onerror paths', () => {
            let originalImage: typeof Image;

            beforeEach(() => {
                originalImage = (window as any).Image;
            });

            afterEach(() => {
                (window as any).Image = originalImage;
            });

            test('should set src, add loaded class, remove data-src on successful load', async () => {
                // Mock the Image constructor to capture and trigger onload
                let tempImgOnload: (() => void) | null = null;
                (window as any).Image = class {
                    onload: (() => void) | null = null;
                    onerror: (() => void) | null = null;
                    private _src = '';
                    get src() { return this._src; }
                    set src(val: string) {
                        this._src = val;
                        // Trigger onload asynchronously to simulate successful load
                        if (this.onload) {
                            tempImgOnload = this.onload;
                        }
                    }
                };

                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/success.jpg');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                // Trigger intersection
                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                expect(img.classList.contains('loading')).toBe(true);

                // Fire the temp image onload
                expect(tempImgOnload).not.toBeNull();
                tempImgOnload!();

                expect(img.src).toContain('/images/success.jpg');
                expect(img.classList.contains('loaded')).toBe(true);
                expect(img.hasAttribute('data-src')).toBe(false);
            });

            test('should dispatch imageLoaded custom event when data-onload is set', async () => {
                let tempImgOnload: (() => void) | null = null;
                (window as any).Image = class {
                    onload: (() => void) | null = null;
                    onerror: (() => void) | null = null;
                    private _src = '';
                    get src() { return this._src; }
                    set src(val: string) {
                        this._src = val;
                        if (this.onload) {
                            tempImgOnload = this.onload;
                        }
                    }
                };

                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/event.jpg');
                img.setAttribute('data-onload', 'someCallback');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                // Listen for the custom event
                let eventFired = false;
                let eventDetail: any = null;
                img.addEventListener('imageLoaded', ((e: CustomEvent) => {
                    eventFired = true;
                    eventDetail = e.detail;
                }) as EventListener);

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                // Fire onload
                tempImgOnload!();

                expect(eventFired).toBe(true);
                expect(eventDetail.callback).toBe('someCallback');
                expect(eventDetail.img).toBe(img);
            });

            test('should add error class and log error when image fails to load', async () => {
                let tempImgOnerror: (() => void) | null = null;
                (window as any).Image = class {
                    onload: (() => void) | null = null;
                    onerror: (() => void) | null = null;
                    private _src = '';
                    get src() { return this._src; }
                    set src(val: string) {
                        this._src = val;
                        if (this.onerror) {
                            tempImgOnerror = this.onerror;
                        }
                    }
                };

                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/broken.jpg');
                document.body.appendChild(img);

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                mockObserverInstance!.triggerEntries([
                    { isIntersecting: true, target: img }
                ]);

                expect(tempImgOnerror).not.toBeNull();
                tempImgOnerror!();

                expect(img.classList.contains('error')).toBe(true);
                expect(console.error).toHaveBeenCalledWith(
                    'Failed to load image: /images/broken.jpg'
                );
            });
        });

        describe('observe method', () => {
            test('should observe an IMG element directly', async () => {
                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/new.jpg');

                loader.observe(img);

                expect(mockObserverInstance!.observedElements).toContain(img);
            });

            test('should observe all img[data-src] children of a container element', async () => {
                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                const container = document.createElement('div');
                const img1 = document.createElement('img');
                img1.setAttribute('data-src', '/images/child1.jpg');
                const img2 = document.createElement('img');
                img2.setAttribute('data-src', '/images/child2.jpg');
                container.appendChild(img1);
                container.appendChild(img2);

                loader.observe(container);

                expect(mockObserverInstance!.observedElements).toContain(img1);
                expect(mockObserverInstance!.observedElements).toContain(img2);
            });

            test('should do nothing when observer is null (no IntersectionObserver)', async () => {
                delete (window as any).IntersectionObserver;

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                const img = document.createElement('img');
                img.setAttribute('data-src', '/images/test.jpg');

                // Should not throw
                expect(() => loader.observe(img)).not.toThrow();
            });
        });

        describe('disconnect method', () => {
            test('should call observer.disconnect()', async () => {
                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                loader.disconnect();

                expect(mockObserverInstance!.disconnected).toBe(true);
            });

            test('should not throw when observer is null', async () => {
                delete (window as any).IntersectionObserver;

                const { ImageLazyLoader } = await importLazyLoader();
                const loader = new ImageLazyLoader();

                expect(() => loader.disconnect()).not.toThrow();
            });
        });
    });

    // =========================================
    // prefetchResource
    // =========================================
    describe('prefetchResource', () => {
        test('should create a prefetch link element', async () => {
            const { prefetchResource } = await importLazyLoader();

            prefetchResource('/api/data', 'fetch');

            const link = document.head.querySelector('link[rel="prefetch"]') as HTMLLinkElement;
            expect(link).not.toBeNull();
            expect(link.rel).toBe('prefetch');
            expect(link.as).toBe('fetch');
            expect(link.href).toContain('/api/data');
        });

        test('should default type to fetch', async () => {
            const { prefetchResource } = await importLazyLoader();

            prefetchResource('/api/resource');

            const link = document.head.querySelector('link[rel="prefetch"]') as HTMLLinkElement;
            expect(link.as).toBe('fetch');
        });

        test('should accept custom type (e.g., script)', async () => {
            const { prefetchResource } = await importLazyLoader();

            prefetchResource('/scripts/module.js', 'script');

            const link = document.head.querySelector('link[rel="prefetch"]') as HTMLLinkElement;
            expect(link.as).toBe('script');
        });
    });

    // =========================================
    // preloadResources
    // =========================================
    describe('preloadResources', () => {
        test('should create preload links for multiple resources', async () => {
            const { preloadResources } = await importLazyLoader();

            preloadResources([
                { url: '/scripts/app.js', type: 'script' },
                { url: '/styles/main.css', type: 'style' }
            ]);

            const links = document.head.querySelectorAll('link[rel="preload"]');
            expect(links.length).toBe(2);

            const scriptLink = links[0] as HTMLLinkElement;
            expect(scriptLink.as).toBe('script');
            expect(scriptLink.href).toContain('/scripts/app.js');

            const styleLink = links[1] as HTMLLinkElement;
            expect(styleLink.as).toBe('style');
            expect(styleLink.href).toContain('/styles/main.css');
        });

        test('should set crossOrigin for font resources', async () => {
            const { preloadResources } = await importLazyLoader();

            preloadResources([
                { url: '/fonts/roboto.woff2', type: 'font' }
            ]);

            const link = document.head.querySelector('link[rel="preload"]') as HTMLLinkElement;
            expect(link).not.toBeNull();
            expect(link.as).toBe('font');
            expect(link.crossOrigin).toBe('anonymous');
        });

        test('should NOT set crossOrigin for non-font resources', async () => {
            const { preloadResources } = await importLazyLoader();

            preloadResources([
                { url: '/images/hero.jpg', type: 'image' }
            ]);

            const link = document.head.querySelector('link[rel="preload"]') as HTMLLinkElement;
            expect(link.crossOrigin).toBe('');
        });

        test('should handle an empty resources array', async () => {
            const { preloadResources } = await importLazyLoader();

            preloadResources([]);

            const links = document.head.querySelectorAll('link[rel="preload"]');
            expect(links.length).toBe(0);
        });
    });

    // =========================================
    // onIdle
    // =========================================
    describe('onIdle', () => {
        test('should use requestIdleCallback when available', async () => {
            const mockRIC = jest.fn();
            (window as any).requestIdleCallback = mockRIC;

            const { onIdle } = await importLazyLoader();

            const callback = jest.fn() as jest.Mock<any>;
            onIdle(callback);

            expect(mockRIC).toHaveBeenCalledWith(callback, { timeout: 2000 });
        });

        test('should pass custom options to requestIdleCallback', async () => {
            const mockRIC = jest.fn();
            (window as any).requestIdleCallback = mockRIC;

            const { onIdle } = await importLazyLoader();

            const callback = jest.fn() as jest.Mock<any>;
            onIdle(callback, { timeout: 5000 });

            expect(mockRIC).toHaveBeenCalledWith(callback, { timeout: 5000 });
        });

        test('should fall back to setTimeout when requestIdleCallback is not available', async () => {
            delete (window as any).requestIdleCallback;
            jest.useFakeTimers();

            const { onIdle } = await importLazyLoader();

            const callback = jest.fn() as jest.Mock<any>;
            onIdle(callback);

            // Callback should not have been called yet
            expect(callback).not.toHaveBeenCalled();

            // Advance timer past the 100ms setTimeout
            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalledTimes(1);

            // Verify the fallback IdleDeadline shape
            const arg = callback.mock.calls[0][0] as IdleDeadline;
            expect(arg.didTimeout).toBe(false);
            expect(arg.timeRemaining()).toBe(0);
        });
    });

    // =========================================
    // loadOnIdle
    // =========================================
    describe('loadOnIdle', () => {
        test('should resolve with the imported module via idle callback', async () => {
            const mockRIC = jest.fn((cb: IdleRequestCallback) => {
                // Execute immediately for test
                cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
                return 1;
            });
            (window as any).requestIdleCallback = mockRIC;

            const { loadOnIdle } = await importLazyLoader();

            const fakeModule = { name: 'test-module' };
            const importFn = jest.fn<() => Promise<typeof fakeModule>>().mockResolvedValue(fakeModule);

            const result = await loadOnIdle(importFn);
            expect(result).toEqual(fakeModule);
            expect(importFn).toHaveBeenCalledTimes(1);
        });

        test('should reject when the import function fails', async () => {
            const mockRIC = jest.fn((cb: IdleRequestCallback) => {
                cb({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
                return 1;
            });
            (window as any).requestIdleCallback = mockRIC;

            const { loadOnIdle } = await importLazyLoader();

            const importFn = jest.fn<() => Promise<unknown>>().mockRejectedValue(
                new Error('Network failed')
            );

            await expect(loadOnIdle(importFn)).rejects.toThrow('Network failed');
        });

        test('should work with setTimeout fallback', async () => {
            delete (window as any).requestIdleCallback;
            jest.useFakeTimers();

            const { loadOnIdle } = await importLazyLoader();

            const fakeModule = { loaded: true };
            const importFn = jest.fn<() => Promise<typeof fakeModule>>().mockResolvedValue(fakeModule);

            const promise = loadOnIdle(importFn);

            // The onIdle fallback uses setTimeout(…, 100)
            jest.advanceTimersByTime(100);

            const result = await promise;
            expect(result).toEqual(fakeModule);
        });
    });

    // =========================================
    // initImageLazyLoading (singleton pattern)
    // =========================================
    describe('initImageLazyLoading', () => {
        test('should return an ImageLazyLoader instance', async () => {
            const { initImageLazyLoading, ImageLazyLoader } = await importLazyLoader();

            const loader = initImageLazyLoading();
            expect(loader).toBeInstanceOf(ImageLazyLoader);
        });

        test('should return the same instance on subsequent calls (singleton)', async () => {
            const { initImageLazyLoading } = await importLazyLoader();

            const loader1 = initImageLazyLoading();
            const loader2 = initImageLazyLoading();

            expect(loader1).toBe(loader2);
        });
    });

    // =========================================
    // Module auto-initialization side effects
    // =========================================
    describe('auto-initialization on module import', () => {
        test('should auto-initialize when document.readyState is not loading', async () => {
            // jsdom defaults readyState to 'complete', so importing the module
            // should trigger initImageLazyLoading() immediately
            Object.defineProperty(document, 'readyState', {
                value: 'complete',
                writable: true,
                configurable: true
            });

            const { initImageLazyLoading, ImageLazyLoader } = await importLazyLoader();

            // Calling init again should return the already-created instance
            const loader = initImageLazyLoading();
            expect(loader).toBeInstanceOf(ImageLazyLoader);
        });

        test('should register DOMContentLoaded listener when readyState is loading', async () => {
            Object.defineProperty(document, 'readyState', {
                value: 'loading',
                writable: true,
                configurable: true
            });

            const addEventSpy = jest.spyOn(document, 'addEventListener');

            // Reset modules so the auto-init code runs with readyState='loading'
            jest.resetModules();
            const mod = await importLazyLoader();

            // Verify that DOMContentLoaded listener was registered
            const dclCalls = addEventSpy.mock.calls.filter(
                call => call[0] === 'DOMContentLoaded'
            );
            expect(dclCalls.length).toBeGreaterThanOrEqual(1);

            // Restore readyState
            Object.defineProperty(document, 'readyState', {
                value: 'complete',
                writable: true,
                configurable: true
            });
        });
    });

    // =========================================
    // Default export
    // =========================================
    describe('default export', () => {
        test('should export all functions and the ImageLazyLoader class', async () => {
            const mod = await importLazyLoader();
            const defaultExport = mod.default;

            expect(defaultExport).toHaveProperty('loadCSS');
            expect(defaultExport).toHaveProperty('preloadCSS');
            expect(defaultExport).toHaveProperty('loadCalculator');
            expect(defaultExport).toHaveProperty('loadChartJS');
            expect(defaultExport).toHaveProperty('ImageLazyLoader');
            expect(defaultExport).toHaveProperty('prefetchResource');
            expect(defaultExport).toHaveProperty('preloadResources');
            expect(defaultExport).toHaveProperty('onIdle');
            expect(defaultExport).toHaveProperty('loadOnIdle');
            expect(defaultExport).toHaveProperty('initImageLazyLoading');
        });
    });

    // =========================================
    // Multiple intersection entries
    // =========================================
    describe('ImageLazyLoader with multiple entries', () => {
        test('should process multiple entries in a single observer callback', async () => {
            const img1 = document.createElement('img');
            img1.setAttribute('data-src', '/images/multi1.jpg');
            document.body.appendChild(img1);

            const img2 = document.createElement('img');
            img2.setAttribute('data-src', '/images/multi2.jpg');
            document.body.appendChild(img2);

            const img3 = document.createElement('img');
            img3.setAttribute('data-src', '/images/multi3.jpg');
            document.body.appendChild(img3);

            const { ImageLazyLoader } = await importLazyLoader();
            const loader = new ImageLazyLoader();

            // Trigger mixed intersection results
            mockObserverInstance!.triggerEntries([
                { isIntersecting: true, target: img1 },
                { isIntersecting: false, target: img2 },
                { isIntersecting: true, target: img3 }
            ]);

            // img1 and img3 should be loading
            expect(img1.classList.contains('loading')).toBe(true);
            expect(img2.classList.contains('loading')).toBe(false);
            expect(img3.classList.contains('loading')).toBe(true);

            // img1 and img3 should be unobserved, img2 should not
            expect(mockObserverInstance!.unobservedElements).toContain(img1);
            expect(mockObserverInstance!.unobservedElements).not.toContain(img2);
            expect(mockObserverInstance!.unobservedElements).toContain(img3);
        });
    });

    // =========================================
    // loadAllImages fallback (no IntersectionObserver)
    // =========================================
    describe('loadAllImages fallback', () => {
        test('should skip images without data-src attribute', async () => {
            delete (window as any).IntersectionObserver;

            const img = document.createElement('img');
            img.setAttribute('data-src', '/images/real.jpg');
            document.body.appendChild(img);

            const imgNoSrc = document.createElement('img');
            // No data-src but has the attribute selector won't match it
            document.body.appendChild(imgNoSrc);

            const { ImageLazyLoader } = await importLazyLoader();
            const loader = new ImageLazyLoader();

            expect(img.src).toContain('/images/real.jpg');
            // imgNoSrc should remain unchanged
            expect(imgNoSrc.src).toBe('');
        });
    });
});
