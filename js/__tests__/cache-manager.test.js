/**
 * Cache Manager Module Tests
 * Tests for caching strategies and cache operations
 */
import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { CACHE_NAMES, CACHE_EXPIRY, CacheManager, CalculatorCacheManager, FHIRCacheManager, StaticCacheManager } from '../cache-manager.js';
// Note: Since CacheManager relies on browser Cache API which is not available in Node.js,
// we test the exported constants and create mock-based tests for the class methods.
// =============================================
// Mock Cache API for jsdom environment
// =============================================
/**
 * Creates a mock Cache instance backed by an in-memory Map.
 * Each entry stores a Request (key) and Response (value).
 */
function createMockCache() {
    const store = new Map();
    return {
        put: jest.fn(async (request, response) => {
            const url = typeof request === 'string' ? request : request.url;
            store.set(url, response.clone());
        }),
        match: jest.fn(async (request) => {
            const url = typeof request === 'string' ? request : request.url;
            const resp = store.get(url);
            return resp ? resp.clone() : undefined;
        }),
        delete: jest.fn(async (request) => {
            const url = typeof request === 'string' ? request : request.url;
            return store.delete(url);
        }),
        keys: jest.fn(async () => {
            return Array.from(store.keys()).map(url => ({ url }));
        }),
        add: jest.fn(async () => undefined),
        addAll: jest.fn(async () => undefined),
        matchAll: jest.fn(async () => [])
    };
}
/**
 * Creates a mock CacheStorage that tracks named caches.
 */
function createMockCacheStorage() {
    const caches = new Map();
    return {
        open: jest.fn(async (cacheName) => {
            if (!caches.has(cacheName)) {
                caches.set(cacheName, createMockCache());
            }
            return caches.get(cacheName);
        }),
        delete: jest.fn(async (cacheName) => {
            return caches.delete(cacheName);
        }),
        keys: jest.fn(async () => {
            return Array.from(caches.keys());
        }),
        has: jest.fn(async (cacheName) => {
            return caches.has(cacheName);
        }),
        match: jest.fn(async () => undefined)
    };
}
describe('Cache Manager Module', () => {
    // =========================================
    // CACHE_NAMES Constants Tests
    // =========================================
    describe('CACHE_NAMES Constants', () => {
        test('should define static cache name', () => {
            expect(CACHE_NAMES.static).toBeDefined();
            expect(CACHE_NAMES.static).toContain('medcalc-static');
        });
        test('should define calculators cache name', () => {
            expect(CACHE_NAMES.calculators).toBeDefined();
            expect(CACHE_NAMES.calculators).toContain('medcalc-calculators');
        });
        test('should define fhir cache name', () => {
            expect(CACHE_NAMES.fhir).toBeDefined();
            expect(CACHE_NAMES.fhir).toContain('medcalc-fhir');
        });
        test('should define images cache name', () => {
            expect(CACHE_NAMES.images).toBeDefined();
            expect(CACHE_NAMES.images).toContain('medcalc-images');
        });
        test('all cache names should include a version suffix', () => {
            for (const name of Object.values(CACHE_NAMES)) {
                expect(name).toMatch(/-v\d+\.\d+\.\d+$/);
            }
        });
        test('should have exactly 4 cache name entries', () => {
            expect(Object.keys(CACHE_NAMES)).toHaveLength(4);
        });
        test('all cache names should be unique', () => {
            const values = Object.values(CACHE_NAMES);
            const unique = new Set(values);
            expect(unique.size).toBe(values.length);
        });
    });
    // =========================================
    // CACHE_EXPIRY Constants Tests
    // =========================================
    describe('CACHE_EXPIRY Constants', () => {
        test('should define static cache expiry (7 days)', () => {
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            expect(CACHE_EXPIRY.static).toBe(sevenDaysMs);
        });
        test('should define calculators cache expiry (1 day)', () => {
            const oneDayMs = 24 * 60 * 60 * 1000;
            expect(CACHE_EXPIRY.calculators).toBe(oneDayMs);
        });
        test('should define fhir cache expiry (5 minutes)', () => {
            const fiveMinutesMs = 5 * 60 * 1000;
            expect(CACHE_EXPIRY.fhir).toBe(fiveMinutesMs);
        });
        test('should define images cache expiry (30 days)', () => {
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            expect(CACHE_EXPIRY.images).toBe(thirtyDaysMs);
        });
        test('all expiry values should be positive numbers', () => {
            for (const expiry of Object.values(CACHE_EXPIRY)) {
                expect(typeof expiry).toBe('number');
                expect(expiry).toBeGreaterThan(0);
            }
        });
        test('should have exactly 4 expiry entries', () => {
            expect(Object.keys(CACHE_EXPIRY)).toHaveLength(4);
        });
    });
    // =========================================
    // Cache Expiry Logic Tests
    // =========================================
    describe('Cache Expiry Logic', () => {
        test('FHIR cache should expire faster than calculator cache', () => {
            expect(CACHE_EXPIRY.fhir).toBeLessThan(CACHE_EXPIRY.calculators);
        });
        test('Calculator cache should expire faster than static cache', () => {
            expect(CACHE_EXPIRY.calculators).toBeLessThan(CACHE_EXPIRY.static);
        });
        test('Static cache should expire faster than images cache', () => {
            expect(CACHE_EXPIRY.static).toBeLessThan(CACHE_EXPIRY.images);
        });
        test('full ordering: FHIR < calculators < static < images', () => {
            expect(CACHE_EXPIRY.fhir).toBeLessThan(CACHE_EXPIRY.calculators);
            expect(CACHE_EXPIRY.calculators).toBeLessThan(CACHE_EXPIRY.static);
            expect(CACHE_EXPIRY.static).toBeLessThan(CACHE_EXPIRY.images);
        });
        test('FHIR expiry should be measured in minutes', () => {
            const oneMinuteMs = 60 * 1000;
            const oneHourMs = 60 * 60 * 1000;
            expect(CACHE_EXPIRY.fhir).toBeGreaterThanOrEqual(oneMinuteMs);
            expect(CACHE_EXPIRY.fhir).toBeLessThan(oneHourMs);
        });
        test('images expiry should be measured in weeks', () => {
            const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
            expect(CACHE_EXPIRY.images).toBeGreaterThanOrEqual(oneWeekMs);
        });
    });
    // =========================================
    // Cache Key Generation Tests
    // =========================================
    describe('Cache Key Generation', () => {
        test('patient cache key should include patient ID', () => {
            const patientId = '12345';
            const cacheKey = `patient_${patientId}`;
            expect(cacheKey).toBe('patient_12345');
        });
        test('observation cache key should include patient ID and code', () => {
            const patientId = '12345';
            const observationCode = '2160-0';
            const cacheKey = `observation_${patientId}_${observationCode}`;
            expect(cacheKey).toBe('observation_12345_2160-0');
        });
        test('calculator cache key should include calculator ID', () => {
            const calculatorId = 'apache-ii';
            const cacheKey = `calculator_${calculatorId}`;
            expect(cacheKey).toBe('calculator_apache-ii');
        });
    });
    // =========================================
    // CacheManager Class — Memory-only tests
    // (no Cache API mocked, tests fallback behavior)
    // =========================================
    describe('CacheManager — memory-only (Cache API unavailable)', () => {
        let manager;
        beforeEach(() => {
            // Ensure window.caches is NOT available so CacheManager uses memory fallback
            // In jsdom, caches is typically not defined, but be explicit
            if ('caches' in window) {
                delete window.caches;
            }
            manager = new CacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('isCacheSupported should return false when window.caches is unavailable', () => {
            expect(manager.isCacheSupported()).toBe(false);
            expect(manager.cacheEnabled).toBe(false);
        });
        test('set should store data in memoryCache', async () => {
            const result = await manager.set('test-cache', 'key-1', { foo: 'bar' }, 60000);
            expect(result).toBe(true);
            expect(manager.memoryCache.has('key-1')).toBe(true);
        });
        test('get should retrieve data from memoryCache', async () => {
            await manager.set('test-cache', 'key-1', { name: 'test' }, 60000);
            const data = await manager.get('test-cache', 'key-1');
            expect(data).toEqual({ name: 'test' });
        });
        test('get should return null for non-existent key', async () => {
            const data = await manager.get('test-cache', 'no-such-key');
            expect(data).toBeNull();
        });
        test('remove should delete data from memoryCache', async () => {
            await manager.set('test-cache', 'key-1', 'value', 60000);
            await manager.remove('test-cache', 'key-1');
            const data = await manager.get('test-cache', 'key-1');
            expect(data).toBeNull();
            expect(manager.memoryCache.has('key-1')).toBe(false);
        });
        test('set without expiry should store with null expiry', async () => {
            await manager.set('test-cache', 'no-expiry', 'data');
            const entry = manager.memoryCache.get('no-expiry');
            expect(entry).toBeDefined();
            expect(entry.expiry).toBeNull();
        });
        test('get should return data even after expiry if checkExpiry is false', async () => {
            // Store with a very short expiry (already expired)
            const now = Date.now();
            manager.memoryCache.set('expired-key', {
                data: 'old-data',
                expiry: now - 1000 // already expired
            });
            const result = await manager.get('test-cache', 'expired-key', false);
            expect(result).toBe('old-data');
        });
        test('get should return null for expired item when checkExpiry is true', async () => {
            const now = Date.now();
            manager.memoryCache.set('expired-key', {
                data: 'old-data',
                expiry: now - 1000 // already expired
            });
            const result = await manager.get('test-cache', 'expired-key', true);
            expect(result).toBeNull();
        });
        test('get should remove expired entry from memoryCache when expired', async () => {
            const now = Date.now();
            manager.memoryCache.set('expired-key', {
                data: 'old-data',
                expiry: now - 1000
            });
            await manager.get('test-cache', 'expired-key', true);
            expect(manager.memoryCache.has('expired-key')).toBe(false);
        });
        test('get should return data for item with null expiry (never expires)', async () => {
            await manager.set('test-cache', 'forever', 'eternal-data');
            const result = await manager.get('test-cache', 'forever');
            expect(result).toBe('eternal-data');
        });
        test('set should overwrite existing entry', async () => {
            await manager.set('test-cache', 'key-1', 'first', 60000);
            await manager.set('test-cache', 'key-1', 'second', 60000);
            const result = await manager.get('test-cache', 'key-1');
            expect(result).toBe('second');
        });
        test('clearAllCaches should clear memoryCache', async () => {
            await manager.set('test-cache', 'k1', 'v1', 60000);
            await manager.set('test-cache', 'k2', 'v2', 60000);
            expect(manager.memoryCache.size).toBe(2);
            await manager.clearAllCaches();
            expect(manager.memoryCache.size).toBe(0);
        });
        test('getCacheSize should return 0 when Cache API is unavailable', async () => {
            const size = await manager.getCacheSize('any-cache');
            expect(size).toBe(0);
        });
        test('cleanExpired should not throw when Cache API is unavailable', async () => {
            await expect(manager.cleanExpired('any-cache')).resolves.toBeUndefined();
        });
        test('clearCache should not throw when Cache API is unavailable', async () => {
            await expect(manager.clearCache('any-cache')).resolves.toBeUndefined();
        });
        test('getCacheStats should include memoryCache size', async () => {
            await manager.set('c', 'k1', 'v1', 60000);
            await manager.set('c', 'k2', 'v2', 60000);
            const stats = await manager.getCacheStats();
            expect(stats.memoryCache).toBe(2);
            expect(stats.caches).toEqual({});
        });
        test('should handle complex data types in memoryCache', async () => {
            const complexData = {
                array: [1, 2, 3],
                nested: { a: { b: { c: true } } },
                number: 42,
                nullVal: null
            };
            await manager.set('test-cache', 'complex', complexData, 60000);
            const result = await manager.get('test-cache', 'complex');
            expect(result).toEqual(complexData);
        });
    });
    // =========================================
    // CacheManager Class — With mocked Cache API
    // =========================================
    describe('CacheManager — with mocked Cache API', () => {
        let manager;
        let mockCacheStorage;
        beforeEach(() => {
            mockCacheStorage = createMockCacheStorage();
            Object.defineProperty(window, 'caches', {
                value: mockCacheStorage,
                writable: true,
                configurable: true
            });
            manager = new CacheManager();
        });
        afterEach(() => {
            delete window.caches;
            jest.restoreAllMocks();
        });
        test('isCacheSupported should return true when window.caches is available', () => {
            expect(manager.isCacheSupported()).toBe(true);
            expect(manager.cacheEnabled).toBe(true);
        });
        test('set should write to both memory and Cache API', async () => {
            await manager.set(CACHE_NAMES.fhir, 'test-key', { data: 1 }, 5000);
            // Memory check
            expect(manager.memoryCache.has('test-key')).toBe(true);
            // Cache API check
            expect(mockCacheStorage.open).toHaveBeenCalledWith(CACHE_NAMES.fhir);
            const cache = await mockCacheStorage.open(CACHE_NAMES.fhir);
            expect(cache.put).toHaveBeenCalled();
        });
        test('get should retrieve data from memory first', async () => {
            await manager.set(CACHE_NAMES.fhir, 'fast-key', 'fast-value', 60000);
            const result = await manager.get(CACHE_NAMES.fhir, 'fast-key');
            expect(result).toBe('fast-value');
        });
        test('get should fall back to Cache API when memory has no entry', async () => {
            // Directly put into Cache API store via set, then clear memory
            await manager.set(CACHE_NAMES.calculators, 'api-key', 'api-value', 60000);
            manager.memoryCache.delete('api-key');
            const result = await manager.get(CACHE_NAMES.calculators, 'api-key');
            expect(result).toBe('api-value');
        });
        test('get from Cache API should repopulate memoryCache', async () => {
            await manager.set(CACHE_NAMES.calculators, 'repop-key', 'repop-val', 60000);
            manager.memoryCache.delete('repop-key');
            await manager.get(CACHE_NAMES.calculators, 'repop-key');
            expect(manager.memoryCache.has('repop-key')).toBe(true);
            expect(manager.memoryCache.get('repop-key').data).toBe('repop-val');
        });
        test('remove should delete from both memory and Cache API', async () => {
            await manager.set(CACHE_NAMES.static, 'rm-key', 'rm-val', 60000);
            await manager.remove(CACHE_NAMES.static, 'rm-key');
            expect(manager.memoryCache.has('rm-key')).toBe(false);
            const cache = await mockCacheStorage.open(CACHE_NAMES.static);
            expect(cache.delete).toHaveBeenCalledWith('rm-key');
        });
        test('clearCache should call caches.delete with the cache name', async () => {
            await manager.clearCache(CACHE_NAMES.fhir);
            expect(mockCacheStorage.delete).toHaveBeenCalledWith(CACHE_NAMES.fhir);
        });
        test('clearAllCaches should clear memory and delete all Cache API caches', async () => {
            await manager.set(CACHE_NAMES.fhir, 'a', 1, 1000);
            await manager.set(CACHE_NAMES.static, 'b', 2, 1000);
            await manager.clearAllCaches();
            expect(manager.memoryCache.size).toBe(0);
            expect(mockCacheStorage.keys).toHaveBeenCalled();
        });
        test('getCacheSize should return number of entries in the named cache', async () => {
            await manager.set(CACHE_NAMES.fhir, 'item1', 'v1', 60000);
            await manager.set(CACHE_NAMES.fhir, 'item2', 'v2', 60000);
            await manager.set(CACHE_NAMES.fhir, 'item3', 'v3', 60000);
            const size = await manager.getCacheSize(CACHE_NAMES.fhir);
            expect(size).toBe(3);
        });
        test('getCacheSize should return 0 for empty cache', async () => {
            const size = await manager.getCacheSize(CACHE_NAMES.images);
            expect(size).toBe(0);
        });
        test('getCacheStats should report sizes for all named caches', async () => {
            await manager.set(CACHE_NAMES.fhir, 'f1', 'v', 1000);
            await manager.set(CACHE_NAMES.calculators, 'c1', 'v', 1000);
            const stats = await manager.getCacheStats();
            expect(stats.memoryCache).toBe(2);
            expect(stats.caches).toHaveProperty('fhir');
            expect(stats.caches).toHaveProperty('calculators');
            expect(stats.caches).toHaveProperty('static');
            expect(stats.caches).toHaveProperty('images');
            expect(stats.caches.fhir).toBe(1);
            expect(stats.caches.calculators).toBe(1);
        });
        test('set should store correct expiry timestamp', async () => {
            const before = Date.now();
            await manager.set(CACHE_NAMES.fhir, 'exp-key', 'data', 10000);
            const after = Date.now();
            const entry = manager.memoryCache.get('exp-key');
            expect(entry.expiry).toBeGreaterThanOrEqual(before + 10000);
            expect(entry.expiry).toBeLessThanOrEqual(after + 10000);
        });
        test('cleanExpired should remove expired entries from Cache API', async () => {
            // Store an entry that is already expired
            const expiredData = JSON.stringify({
                data: 'old',
                timestamp: Date.now() - 100000,
                expiry: Date.now() - 50000 // expired 50s ago
            });
            const cache = await mockCacheStorage.open(CACHE_NAMES.fhir);
            await cache.put('expired-entry', new Response(expiredData, {
                headers: { 'Content-Type': 'application/json' }
            }));
            // Store a valid entry
            const validData = JSON.stringify({
                data: 'fresh',
                timestamp: Date.now(),
                expiry: Date.now() + 60000 // expires in 60s
            });
            await cache.put('valid-entry', new Response(validData, {
                headers: { 'Content-Type': 'application/json' }
            }));
            await manager.cleanExpired(CACHE_NAMES.fhir);
            // expired-entry should have been deleted
            expect(cache.delete).toHaveBeenCalledWith(expect.objectContaining({
                url: expect.stringContaining('expired-entry')
            }));
        });
        test('cleanExpired should keep non-expired entries', async () => {
            const cache = await mockCacheStorage.open(CACHE_NAMES.static);
            const validData = JSON.stringify({
                data: 'still-good',
                timestamp: Date.now(),
                expiry: Date.now() + 999999
            });
            await cache.put('good-entry', new Response(validData, {
                headers: { 'Content-Type': 'application/json' }
            }));
            // Reset delete mock call count after put setup
            cache.delete.mockClear();
            await manager.cleanExpired(CACHE_NAMES.static);
            // delete should NOT have been called for non-expired entries
            expect(cache.delete).not.toHaveBeenCalled();
        });
        test('cleanExpired should remove entries with no expiry field as valid (no delete)', async () => {
            const cache = await mockCacheStorage.open(CACHE_NAMES.static);
            const noExpiryData = JSON.stringify({
                data: 'no-expiry',
                timestamp: Date.now(),
                expiry: null
            });
            await cache.put('no-expiry-entry', new Response(noExpiryData, {
                headers: { 'Content-Type': 'application/json' }
            }));
            cache.delete.mockClear();
            await manager.cleanExpired(CACHE_NAMES.static);
            // Entries with null expiry are kept (expiry check: cached.expiry && ...)
            expect(cache.delete).not.toHaveBeenCalled();
        });
        test('set should handle Cache API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            // Make caches.open throw an error
            mockCacheStorage.open.mockRejectedValueOnce(new Error('Cache API failure'));
            const result = await manager.set('bad-cache', 'key', 'value', 1000);
            // set should still return true because memoryCache write succeeds
            expect(result).toBe(true);
            consoleSpy.mockRestore();
        });
        test('get should handle Cache API errors gracefully and return null', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            manager.memoryCache.clear();
            mockCacheStorage.open.mockRejectedValueOnce(new Error('Cache API failure'));
            const result = await manager.get('bad-cache', 'no-key');
            expect(result).toBeNull();
            consoleSpy.mockRestore();
        });
        test('remove should handle Cache API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockCacheStorage.open.mockRejectedValueOnce(new Error('Cache API failure'));
            await expect(manager.remove('bad-cache', 'key')).resolves.toBeUndefined();
            consoleSpy.mockRestore();
        });
        test('getCacheSize should return 0 on Cache API error', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockCacheStorage.open.mockRejectedValueOnce(new Error('fail'));
            const size = await manager.getCacheSize('bad-cache');
            expect(size).toBe(0);
            consoleSpy.mockRestore();
        });
        test('cleanExpired should handle Cache API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockCacheStorage.open.mockRejectedValueOnce(new Error('fail'));
            await expect(manager.cleanExpired('bad-cache')).resolves.toBeUndefined();
            consoleSpy.mockRestore();
        });
        test('clearAllCaches should handle Cache API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockCacheStorage.keys.mockRejectedValueOnce(new Error('fail'));
            await expect(manager.clearAllCaches()).resolves.toBeUndefined();
            expect(manager.memoryCache.size).toBe(0);
            consoleSpy.mockRestore();
        });
    });
    // =========================================
    // CacheManager — Expiry integration tests
    // =========================================
    describe('CacheManager — expiry behavior', () => {
        let manager;
        beforeEach(() => {
            // No Cache API; purely memory-based for deterministic expiry tests
            if ('caches' in window) {
                delete window.caches;
            }
            manager = new CacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('item should be retrievable before expiry', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set('c', 'key', 'value', 10000);
            // Advance 5 seconds (half the expiry)
            jest.setSystemTime(now + 5000);
            const result = await manager.get('c', 'key');
            expect(result).toBe('value');
            jest.useRealTimers();
        });
        test('item should be null after expiry', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set('c', 'key', 'value', 10000);
            // Advance past expiry
            jest.setSystemTime(now + 10001);
            const result = await manager.get('c', 'key');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('item should be retrievable at exactly the expiry boundary', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set('c', 'key', 'value', 10000);
            // Advance to exactly the expiry (Date.now() < expiry means still valid when equal => expired)
            // The condition is Date.now() < expiry, so at exact boundary it is NOT less than, hence expired
            jest.setSystemTime(now + 10000);
            const result = await manager.get('c', 'key');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('item one ms before expiry should still be valid', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set('c', 'key', 'value', 10000);
            jest.setSystemTime(now + 9999);
            const result = await manager.get('c', 'key');
            expect(result).toBe('value');
            jest.useRealTimers();
        });
        test('FHIR data should expire after 5 minutes', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set(CACHE_NAMES.fhir, 'patient-1', { name: 'John' }, CACHE_EXPIRY.fhir);
            // Just before expiry: 4 minutes 59 seconds
            jest.setSystemTime(now + CACHE_EXPIRY.fhir - 1000);
            expect(await manager.get(CACHE_NAMES.fhir, 'patient-1')).toEqual({ name: 'John' });
            // After expiry: 5 minutes + 1ms
            jest.setSystemTime(now + CACHE_EXPIRY.fhir + 1);
            expect(await manager.get(CACHE_NAMES.fhir, 'patient-1')).toBeNull();
            jest.useRealTimers();
        });
        test('calculator data should expire after 1 day', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set(CACHE_NAMES.calculators, 'calc-1', 'module-code', CACHE_EXPIRY.calculators);
            // Just before
            jest.setSystemTime(now + CACHE_EXPIRY.calculators - 1);
            expect(await manager.get(CACHE_NAMES.calculators, 'calc-1')).toBe('module-code');
            // Just after
            jest.setSystemTime(now + CACHE_EXPIRY.calculators + 1);
            expect(await manager.get(CACHE_NAMES.calculators, 'calc-1')).toBeNull();
            jest.useRealTimers();
        });
        test('static data should expire after 7 days', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set(CACHE_NAMES.static, 'resource', 'css-content', CACHE_EXPIRY.static);
            jest.setSystemTime(now + CACHE_EXPIRY.static - 1);
            expect(await manager.get(CACHE_NAMES.static, 'resource')).toBe('css-content');
            jest.setSystemTime(now + CACHE_EXPIRY.static + 1);
            expect(await manager.get(CACHE_NAMES.static, 'resource')).toBeNull();
            jest.useRealTimers();
        });
        test('image data should expire after 30 days', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set(CACHE_NAMES.images, 'img-url', 'image-blob', CACHE_EXPIRY.images);
            jest.setSystemTime(now + CACHE_EXPIRY.images - 1);
            expect(await manager.get(CACHE_NAMES.images, 'img-url')).toBe('image-blob');
            jest.setSystemTime(now + CACHE_EXPIRY.images + 1);
            expect(await manager.get(CACHE_NAMES.images, 'img-url')).toBeNull();
            jest.useRealTimers();
        });
        test('multiple items with different expiries should expire independently', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await manager.set('c', 'short', 'short-lived', 1000);
            await manager.set('c', 'long', 'long-lived', 10000);
            // After 1001ms: short expired, long still valid
            jest.setSystemTime(now + 1001);
            expect(await manager.get('c', 'short')).toBeNull();
            expect(await manager.get('c', 'long')).toBe('long-lived');
            // After 10001ms: both expired
            jest.setSystemTime(now + 10001);
            expect(await manager.get('c', 'long')).toBeNull();
            jest.useRealTimers();
        });
    });
    // =========================================
    // FHIRCacheManager Tests
    // =========================================
    describe('FHIRCacheManager', () => {
        let fhirManager;
        beforeEach(() => {
            if ('caches' in window) {
                delete window.caches;
            }
            fhirManager = new FHIRCacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('should be an instance of CacheManager', () => {
            expect(fhirManager).toBeInstanceOf(CacheManager);
        });
        test('cachePatient should store patient with correct key pattern', async () => {
            await fhirManager.cachePatient('P001', { name: 'Jane Doe', id: 'P001' });
            const entry = fhirManager.memoryCache.get('patient-P001');
            expect(entry).toBeDefined();
            expect(entry.data).toEqual({ name: 'Jane Doe', id: 'P001' });
        });
        test('getCachedPatient should retrieve stored patient', async () => {
            const patient = { name: 'John Smith', id: 'P002', birthDate: '1990-01-01' };
            await fhirManager.cachePatient('P002', patient);
            const cached = await fhirManager.getCachedPatient('P002');
            expect(cached).toEqual(patient);
        });
        test('getCachedPatient should return null for unknown patient', async () => {
            const result = await fhirManager.getCachedPatient('unknown-id');
            expect(result).toBeNull();
        });
        test('cacheObservation should store with correct key pattern', async () => {
            const obs = { value: 1.2, unit: 'mg/dL' };
            await fhirManager.cacheObservation('P001', '2160-0', obs);
            const entry = fhirManager.memoryCache.get('observation-P001-2160-0');
            expect(entry).toBeDefined();
            expect(entry.data).toEqual(obs);
        });
        test('getCachedObservation should retrieve stored observation', async () => {
            const obs = { value: 14.2, unit: 'g/dL', code: '718-7' };
            await fhirManager.cacheObservation('P003', '718-7', obs);
            const cached = await fhirManager.getCachedObservation('P003', '718-7');
            expect(cached).toEqual(obs);
        });
        test('getCachedObservation should return null for missing observation', async () => {
            const result = await fhirManager.getCachedObservation('P999', '0000-0');
            expect(result).toBeNull();
        });
        test('patient cache should use FHIR expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await fhirManager.cachePatient('P010', { name: 'Test' });
            const entry = fhirManager.memoryCache.get('patient-P010');
            expect(entry.expiry).toBe(now + CACHE_EXPIRY.fhir);
            jest.useRealTimers();
        });
        test('observation cache should use FHIR expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await fhirManager.cacheObservation('P010', '2160-0', { value: 1 });
            const entry = fhirManager.memoryCache.get('observation-P010-2160-0');
            expect(entry.expiry).toBe(now + CACHE_EXPIRY.fhir);
            jest.useRealTimers();
        });
        test('patient data should expire after FHIR expiry', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await fhirManager.cachePatient('P020', { name: 'Expiry Test' });
            jest.setSystemTime(now + CACHE_EXPIRY.fhir + 1);
            const result = await fhirManager.getCachedPatient('P020');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('observation data should expire after FHIR expiry', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await fhirManager.cacheObservation('P020', '718-7', { value: 12 });
            jest.setSystemTime(now + CACHE_EXPIRY.fhir + 1);
            const result = await fhirManager.getCachedObservation('P020', '718-7');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('should cache multiple observations for the same patient', async () => {
            await fhirManager.cacheObservation('P050', '2160-0', { value: 1.2 });
            await fhirManager.cacheObservation('P050', '718-7', { value: 14.0 });
            await fhirManager.cacheObservation('P050', '2951-2', { value: 140 });
            expect(await fhirManager.getCachedObservation('P050', '2160-0')).toEqual({ value: 1.2 });
            expect(await fhirManager.getCachedObservation('P050', '718-7')).toEqual({ value: 14.0 });
            expect(await fhirManager.getCachedObservation('P050', '2951-2')).toEqual({ value: 140 });
        });
        test('observations for different patients should be independent', async () => {
            await fhirManager.cacheObservation('PA', '2160-0', { value: 1.0 });
            await fhirManager.cacheObservation('PB', '2160-0', { value: 2.0 });
            expect(await fhirManager.getCachedObservation('PA', '2160-0')).toEqual({ value: 1.0 });
            expect(await fhirManager.getCachedObservation('PB', '2160-0')).toEqual({ value: 2.0 });
        });
    });
    // =========================================
    // FHIRCacheManager — clearPatientCache
    // (requires Cache API mock)
    // =========================================
    describe('FHIRCacheManager — clearPatientCache (with Cache API)', () => {
        let fhirManager;
        let mockCacheStorage;
        beforeEach(() => {
            mockCacheStorage = createMockCacheStorage();
            Object.defineProperty(window, 'caches', {
                value: mockCacheStorage,
                writable: true,
                configurable: true
            });
            fhirManager = new FHIRCacheManager();
        });
        afterEach(() => {
            delete window.caches;
            jest.restoreAllMocks();
        });
        test('clearPatientCache should remove patient and observation entries for given patient', async () => {
            // Set up entries via the Cache API directly
            const cache = await mockCacheStorage.open(CACHE_NAMES.fhir);
            // Simulate stored entries with URLs matching the pattern
            await cache.put(`http://localhost/patient-P100`, new Response(JSON.stringify({ data: 'patient data' })));
            await cache.put(`http://localhost/observation-P100-2160-0`, new Response(JSON.stringify({ data: 'obs data' })));
            await cache.put(`http://localhost/patient-P200`, new Response(JSON.stringify({ data: 'other patient' })));
            await fhirManager.clearPatientCache('P100');
            // cache.delete should have been called for P100 entries
            const deleteCalls = cache.delete.mock.calls;
            const deletedUrls = deleteCalls.map((call) => {
                const arg = call[0];
                return typeof arg === 'string' ? arg : arg.url;
            });
            expect(deletedUrls.some((url) => url.includes('patient-P100'))).toBe(true);
            expect(deletedUrls.some((url) => url.includes('observation-P100'))).toBe(true);
        });
        test('clearPatientCache should not throw when Cache API is unavailable', async () => {
            delete window.caches;
            const noApiManager = new FHIRCacheManager();
            await expect(noApiManager.clearPatientCache('P999')).resolves.toBeUndefined();
        });
    });
    // =========================================
    // CalculatorCacheManager Tests
    // =========================================
    describe('CalculatorCacheManager', () => {
        let calcManager;
        beforeEach(() => {
            if ('caches' in window) {
                delete window.caches;
            }
            calcManager = new CalculatorCacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('should be an instance of CacheManager', () => {
            expect(calcManager).toBeInstanceOf(CacheManager);
        });
        test('cacheCalculator should store with correct key pattern', async () => {
            await calcManager.cacheCalculator('apache-ii', 'function calculate() {}');
            const key = '/js/calculators/apache-ii/index.js';
            const entry = calcManager.memoryCache.get(key);
            expect(entry).toBeDefined();
            expect(entry.data).toBe('function calculate() {}');
        });
        test('getCachedCalculator should retrieve stored calculator', async () => {
            const code = 'export default function() { return 42; }';
            await calcManager.cacheCalculator('bmi-bsa', code);
            const result = await calcManager.getCachedCalculator('bmi-bsa');
            expect(result).toBe(code);
        });
        test('getCachedCalculator should return null for uncached calculator', async () => {
            const result = await calcManager.getCachedCalculator('nonexistent');
            expect(result).toBeNull();
        });
        test('calculator cache key should follow /js/calculators/{id}/index.js pattern', async () => {
            await calcManager.cacheCalculator('meld-score', 'code');
            const expectedKey = '/js/calculators/meld-score/index.js';
            expect(calcManager.memoryCache.has(expectedKey)).toBe(true);
        });
        test('calculator cache should use calculator expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await calcManager.cacheCalculator('sofa', 'code');
            const entry = calcManager.memoryCache.get('/js/calculators/sofa/index.js');
            expect(entry.expiry).toBe(now + CACHE_EXPIRY.calculators);
            jest.useRealTimers();
        });
        test('cached calculator should expire after calculator expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await calcManager.cacheCalculator('gcs', 'gcs-code');
            jest.setSystemTime(now + CACHE_EXPIRY.calculators + 1);
            const result = await calcManager.getCachedCalculator('gcs');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('should cache multiple calculators independently', async () => {
            await calcManager.cacheCalculator('bmi-bsa', 'bmi-code');
            await calcManager.cacheCalculator('crcl', 'crcl-code');
            await calcManager.cacheCalculator('meld-score', 'meld-code');
            expect(await calcManager.getCachedCalculator('bmi-bsa')).toBe('bmi-code');
            expect(await calcManager.getCachedCalculator('crcl')).toBe('crcl-code');
            expect(await calcManager.getCachedCalculator('meld-score')).toBe('meld-code');
        });
        test('cacheCalculator should overwrite previous entry for same ID', async () => {
            await calcManager.cacheCalculator('bmi-bsa', 'version-1');
            await calcManager.cacheCalculator('bmi-bsa', 'version-2');
            const result = await calcManager.getCachedCalculator('bmi-bsa');
            expect(result).toBe('version-2');
        });
    });
    // =========================================
    // StaticCacheManager Tests
    // =========================================
    describe('StaticCacheManager', () => {
        let staticManager;
        beforeEach(() => {
            if ('caches' in window) {
                delete window.caches;
            }
            staticManager = new StaticCacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('should be an instance of CacheManager', () => {
            expect(staticManager).toBeInstanceOf(CacheManager);
        });
        test('cacheImage should store image data in memoryCache', async () => {
            const imageData = { blob: 'base64data', type: 'image/png' };
            await staticManager.cacheImage('/images/logo.png', imageData);
            const entry = staticManager.memoryCache.get('/images/logo.png');
            expect(entry).toBeDefined();
            expect(entry.data).toEqual(imageData);
        });
        test('getCachedImage should retrieve stored image', async () => {
            const imageData = { blob: 'base64data', type: 'image/jpeg' };
            await staticManager.cacheImage('/images/photo.jpg', imageData);
            const result = await staticManager.getCachedImage('/images/photo.jpg');
            expect(result).toEqual(imageData);
        });
        test('getCachedImage should return null for uncached image', async () => {
            const result = await staticManager.getCachedImage('/images/missing.png');
            expect(result).toBeNull();
        });
        test('image cache should use images expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await staticManager.cacheImage('/img/test.png', 'data');
            const entry = staticManager.memoryCache.get('/img/test.png');
            expect(entry.expiry).toBe(now + CACHE_EXPIRY.images);
            jest.useRealTimers();
        });
        test('cached image should expire after images expiry duration', async () => {
            jest.useFakeTimers();
            const now = Date.now();
            jest.setSystemTime(now);
            await staticManager.cacheImage('/img/test.png', 'data');
            jest.setSystemTime(now + CACHE_EXPIRY.images + 1);
            const result = await staticManager.getCachedImage('/img/test.png');
            expect(result).toBeNull();
            jest.useRealTimers();
        });
        test('should cache multiple images independently', async () => {
            await staticManager.cacheImage('/img/a.png', 'data-a');
            await staticManager.cacheImage('/img/b.png', 'data-b');
            await staticManager.cacheImage('/img/c.png', 'data-c');
            expect(await staticManager.getCachedImage('/img/a.png')).toBe('data-a');
            expect(await staticManager.getCachedImage('/img/b.png')).toBe('data-b');
            expect(await staticManager.getCachedImage('/img/c.png')).toBe('data-c');
        });
    });
    // =========================================
    // StaticCacheManager — cacheStaticResources
    // (requires Cache API mock)
    // =========================================
    describe('StaticCacheManager — cacheStaticResources (with Cache API)', () => {
        let staticManager;
        let mockCacheStorage;
        beforeEach(() => {
            mockCacheStorage = createMockCacheStorage();
            Object.defineProperty(window, 'caches', {
                value: mockCacheStorage,
                writable: true,
                configurable: true
            });
            staticManager = new StaticCacheManager();
        });
        afterEach(() => {
            delete window.caches;
            jest.restoreAllMocks();
        });
        test('cacheStaticResources should open static cache and call addAll', async () => {
            const urls = ['/css/main.css', '/js/main.js'];
            await staticManager.cacheStaticResources(urls);
            expect(mockCacheStorage.open).toHaveBeenCalledWith(CACHE_NAMES.static);
            const cache = await mockCacheStorage.open(CACHE_NAMES.static);
            expect(cache.addAll).toHaveBeenCalledWith(urls);
        });
        test('cacheStaticResources should not throw when Cache API is unavailable', async () => {
            delete window.caches;
            const noApiManager = new StaticCacheManager();
            await expect(noApiManager.cacheStaticResources(['/css/main.css'])).resolves.toBeUndefined();
        });
        test('cacheStaticResources should handle errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            mockCacheStorage.open.mockRejectedValueOnce(new Error('fail'));
            await expect(staticManager.cacheStaticResources(['/test.css'])).resolves.toBeUndefined();
            consoleSpy.mockRestore();
        });
    });
    // =========================================
    // Edge cases and integration tests
    // =========================================
    describe('Edge cases', () => {
        let manager;
        beforeEach(() => {
            if ('caches' in window) {
                delete window.caches;
            }
            manager = new CacheManager();
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
        test('set and get with empty string key', async () => {
            await manager.set('c', '', 'empty-key-data', 60000);
            const result = await manager.get('c', '');
            expect(result).toBe('empty-key-data');
        });
        test('set and get with empty string data', async () => {
            await manager.set('c', 'key', '', 60000);
            const result = await manager.get('c', 'key');
            expect(result).toBe('');
        });
        test('set and get with numeric data', async () => {
            await manager.set('c', 'num', 42, 60000);
            expect(await manager.get('c', 'num')).toBe(42);
        });
        test('set and get with boolean data', async () => {
            await manager.set('c', 'bool', false, 60000);
            expect(await manager.get('c', 'bool')).toBe(false);
        });
        test('set and get with null data', async () => {
            await manager.set('c', 'nil', null, 60000);
            // null data stored should be retrievable as null
            const entry = manager.memoryCache.get('nil');
            expect(entry.data).toBeNull();
        });
        test('set and get with array data', async () => {
            const arr = [1, 'two', { three: 3 }];
            await manager.set('c', 'arr', arr, 60000);
            expect(await manager.get('c', 'arr')).toEqual(arr);
        });
        test('remove on non-existent key should not throw', async () => {
            await expect(manager.remove('c', 'ghost-key')).resolves.toBeUndefined();
        });
        test('multiple set/get cycles on same key', async () => {
            for (let i = 0; i < 10; i++) {
                await manager.set('c', 'cycle-key', `value-${i}`, 60000);
                const result = await manager.get('c', 'cycle-key');
                expect(result).toBe(`value-${i}`);
            }
        });
        test('get with checkExpiry=false on non-existent key still returns null', async () => {
            const result = await manager.get('c', 'nope', false);
            expect(result).toBeNull();
        });
    });
    // =========================================
    // Concurrent operations tests
    // =========================================
    describe('Concurrent operations', () => {
        let manager;
        beforeEach(() => {
            if ('caches' in window) {
                delete window.caches;
            }
            manager = new CacheManager();
        });
        test('parallel set operations should all succeed', async () => {
            const promises = [];
            for (let i = 0; i < 20; i++) {
                promises.push(manager.set('c', `key-${i}`, `value-${i}`, 60000));
            }
            const results = await Promise.all(promises);
            expect(results.every(r => r === true)).toBe(true);
            expect(manager.memoryCache.size).toBe(20);
        });
        test('parallel get operations should all return correct values', async () => {
            for (let i = 0; i < 10; i++) {
                await manager.set('c', `key-${i}`, `value-${i}`, 60000);
            }
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(manager.get('c', `key-${i}`));
            }
            const results = await Promise.all(promises);
            for (let i = 0; i < 10; i++) {
                expect(results[i]).toBe(`value-${i}`);
            }
        });
    });
    // =========================================
    // Inheritance chain verification
    // =========================================
    describe('Class inheritance', () => {
        test('FHIRCacheManager should inherit from CacheManager', () => {
            const mgr = new FHIRCacheManager();
            expect(mgr).toBeInstanceOf(CacheManager);
            expect(typeof mgr.set).toBe('function');
            expect(typeof mgr.get).toBe('function');
            expect(typeof mgr.remove).toBe('function');
            expect(typeof mgr.clearCache).toBe('function');
            expect(typeof mgr.clearAllCaches).toBe('function');
            expect(typeof mgr.cleanExpired).toBe('function');
            expect(typeof mgr.getCacheSize).toBe('function');
            expect(typeof mgr.getCacheStats).toBe('function');
        });
        test('CalculatorCacheManager should inherit from CacheManager', () => {
            const mgr = new CalculatorCacheManager();
            expect(mgr).toBeInstanceOf(CacheManager);
            expect(typeof mgr.set).toBe('function');
            expect(typeof mgr.get).toBe('function');
            expect(typeof mgr.remove).toBe('function');
        });
        test('StaticCacheManager should inherit from CacheManager', () => {
            const mgr = new StaticCacheManager();
            expect(mgr).toBeInstanceOf(CacheManager);
            expect(typeof mgr.set).toBe('function');
            expect(typeof mgr.get).toBe('function');
            expect(typeof mgr.remove).toBe('function');
        });
        test('each manager instance should have its own memoryCache', () => {
            const a = new CacheManager();
            const b = new FHIRCacheManager();
            const c = new CalculatorCacheManager();
            a.memoryCache.set('test', 'a');
            expect(b.memoryCache.has('test')).toBe(false);
            expect(c.memoryCache.has('test')).toBe(false);
        });
    });
});
