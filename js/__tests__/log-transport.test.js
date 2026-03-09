/**
 * @jest-environment jsdom
 */
import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
// Pre-declare mock variables for logger
const mockConsoleDebug = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();
// Suppress console output in tests
beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(mockConsoleDebug);
    jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    jest.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
    jest.spyOn(console, 'error').mockImplementation(mockConsoleError);
});
afterEach(() => {
    jest.restoreAllMocks();
});
import { BeaconTransport } from '../log-transport';
import { logger, LogLevel } from '../logger';
function createEntry(level = 'ERROR', message = 'test') {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        url: 'http://localhost/test',
    };
}
describe('BeaconTransport', () => {
    let transport;
    beforeEach(() => {
        jest.useFakeTimers();
        // Mock sendBeacon
        Object.defineProperty(navigator, 'sendBeacon', {
            value: jest.fn(() => true),
            writable: true,
            configurable: true,
        });
    });
    afterEach(() => {
        if (transport)
            transport.destroy();
        jest.useRealTimers();
    });
    test('implements LogTransport interface', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR);
        expect(transport.name).toBe('beacon');
        expect(transport.minLevel).toBe(LogLevel.ERROR);
        expect(typeof transport.send).toBe('function');
        expect(typeof transport.flush).toBe('function');
        expect(typeof transport.destroy).toBe('function');
    });
    test('buffers entries until buffer size is reached', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 3);
        transport.send(createEntry());
        transport.send(createEntry());
        expect(navigator.sendBeacon).not.toHaveBeenCalled();
        transport.send(createEntry()); // Reaches buffer size
        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    });
    test('flushes via sendBeacon with correct endpoint and payload', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 2);
        const entry1 = createEntry('ERROR', 'msg1');
        const entry2 = createEntry('ERROR', 'msg2');
        transport.send(entry1);
        transport.send(entry2);
        expect(navigator.sendBeacon).toHaveBeenCalledWith('/api/logs', JSON.stringify([entry1, entry2]));
    });
    test('flushes on timer interval', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 100);
        transport.send(createEntry());
        expect(navigator.sendBeacon).not.toHaveBeenCalled();
        jest.advanceTimersByTime(10000);
        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    });
    test('does not flush when buffer is empty', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR);
        transport.flush();
        expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });
    test('falls back to fetch when sendBeacon returns false', () => {
        navigator.sendBeacon.mockReturnValue(false);
        const mockFetch = jest.fn(() => Promise.resolve(new Response(null, { status: 204 })));
        global.fetch = mockFetch;
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 1);
        transport.send(createEntry());
        expect(mockFetch).toHaveBeenCalledWith('/api/logs', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }));
        delete global.fetch;
    });
    test('destroy flushes remaining entries and stops timer', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 100);
        transport.send(createEntry());
        transport.destroy();
        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
        // After destroy, send should be a no-op
        transport.send(createEntry());
        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    });
    test('does not send after destroy', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR, 100);
        transport.destroy();
        transport.send(createEntry());
        transport.flush();
        // sendBeacon called once during destroy's flush (empty buffer = 0 calls)
        expect(navigator.sendBeacon).not.toHaveBeenCalled();
    });
    test('uses default buffer size of 5', () => {
        transport = new BeaconTransport('/api/logs', LogLevel.ERROR);
        for (let i = 0; i < 4; i++) {
            transport.send(createEntry());
        }
        expect(navigator.sendBeacon).not.toHaveBeenCalled();
        transport.send(createEntry()); // 5th entry triggers flush
        expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    });
});
describe('Logger transport integration', () => {
    let mockTransport;
    beforeEach(() => {
        mockTransport = {
            name: 'test-transport',
            minLevel: LogLevel.WARN,
            send: jest.fn(),
            flush: jest.fn(),
            destroy: jest.fn(),
        };
    });
    afterEach(() => {
        logger.removeTransport('test-transport');
    });
    test('addTransport registers a transport', () => {
        logger.addTransport(mockTransport);
        logger.error('test error');
        expect(mockTransport.send).toHaveBeenCalledTimes(1);
    });
    test('transport receives LogEntry objects', () => {
        logger.addTransport(mockTransport);
        logger.warn('warning message', { key: 'value' });
        expect(mockTransport.send).toHaveBeenCalledWith(expect.objectContaining({
            level: 'WARN',
            message: 'warning message',
            context: expect.objectContaining({ key: 'value' }),
        }));
    });
    test('transport respects minLevel', () => {
        mockTransport.minLevel = LogLevel.ERROR;
        logger.addTransport(mockTransport);
        logger.info('info message');
        logger.warn('warn message');
        expect(mockTransport.send).not.toHaveBeenCalled();
        logger.error('error message');
        expect(mockTransport.send).toHaveBeenCalledTimes(1);
    });
    test('removeTransport stops dispatching and calls destroy', () => {
        logger.addTransport(mockTransport);
        logger.removeTransport('test-transport');
        expect(mockTransport.destroy).toHaveBeenCalled();
        logger.error('should not reach transport');
        expect(mockTransport.send).not.toHaveBeenCalled();
    });
    test('removeTransport is safe for non-existent names', () => {
        expect(() => logger.removeTransport('non-existent')).not.toThrow();
    });
    test('transport errors are silently caught', () => {
        const failingTransport = {
            name: 'failing',
            minLevel: LogLevel.INFO,
            send: jest.fn(() => { throw new Error('transport failed'); }),
            flush: jest.fn(),
            destroy: jest.fn(),
        };
        logger.addTransport(failingTransport);
        // Should not throw
        expect(() => logger.error('test')).not.toThrow();
        logger.removeTransport('failing');
    });
});
