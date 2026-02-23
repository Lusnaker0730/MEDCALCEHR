import { logger } from './logger.js';
const BASE_KEY = 'calculation-history';
const MAX_ENTRIES = 100;
export class CalculationHistory {
    constructor() {
        this.practitionerId = null;
    }
    get storageKey() {
        return this.practitionerId
            ? `${BASE_KEY}-${this.practitionerId}`
            : BASE_KEY;
    }
    setPractitionerId(id) {
        this.practitionerId = id;
    }
    addEntry(entry) {
        const entries = this.getEntries();
        entries.unshift({
            ...entry,
            timestamp: new Date().toISOString()
        });
        if (entries.length > MAX_ENTRIES) {
            entries.length = MAX_ENTRIES;
        }
        this.save(entries);
    }
    getEntries(limit) {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const all = stored ? JSON.parse(stored) : [];
            return limit ? all.slice(0, limit) : all;
        }
        catch {
            logger.error('Failed to load calculation history');
            return [];
        }
    }
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        }
        catch {
            logger.error('Failed to clear history');
        }
    }
    getEntryCount() {
        return this.getEntries().length;
    }
    save(entries) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(entries));
        }
        catch {
            logger.error('Failed to save calculation history');
        }
    }
}
export const calculationHistory = new CalculationHistory();
