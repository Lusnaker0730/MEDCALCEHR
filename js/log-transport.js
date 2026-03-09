// src/log-transport.ts — Log transport system for centralized log shipping
import { LogLevel } from './logger.js';
/**
 * BeaconTransport: Ships log entries to a remote endpoint using navigator.sendBeacon
 * with a fetch fallback. Buffers entries and flushes periodically or when buffer is full.
 *
 * PHI is already stripped by Logger.createEntry() before entries reach the transport.
 */
export class BeaconTransport {
    constructor(endpoint, minLevel = LogLevel.ERROR, bufferSize) {
        this.name = 'beacon';
        this.buffer = [];
        this.flushTimer = null;
        this.destroyed = false;
        this.endpoint = endpoint;
        this.minLevel = minLevel;
        this.bufferSize = bufferSize ?? BeaconTransport.DEFAULT_BUFFER_SIZE;
        this.flushTimer = setInterval(() => this.flush(), BeaconTransport.FLUSH_INTERVAL_MS);
    }
    send(entry) {
        if (this.destroyed)
            return;
        this.buffer.push(entry);
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    }
    flush() {
        if (this.destroyed || this.buffer.length === 0)
            return;
        const entries = this.buffer.splice(0);
        const payload = JSON.stringify(entries);
        // Prefer sendBeacon (works during page unload), fall back to fetch
        const sent = typeof navigator !== 'undefined' &&
            typeof navigator.sendBeacon === 'function' &&
            navigator.sendBeacon(this.endpoint, payload);
        if (!sent) {
            try {
                fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true,
                }).catch(() => {
                    // Silent: remote endpoint unavailable
                });
            }
            catch {
                // Silent: fetch not available or blocked
            }
        }
    }
    destroy() {
        if (this.destroyed)
            return;
        this.flush(); // Final flush before marking destroyed
        this.destroyed = true;
        if (this.flushTimer !== null) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.buffer.length = 0;
    }
}
BeaconTransport.DEFAULT_BUFFER_SIZE = 5;
BeaconTransport.FLUSH_INTERVAL_MS = 10000;
