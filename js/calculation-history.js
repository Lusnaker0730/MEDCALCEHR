import { logger } from './logger.js';
import { secureLocalStore, secureLocalRetrieve } from './security.js';
const BASE_KEY = 'medcalc-phi-calculation-history';
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
        // Migrate any entries saved without practitioner scope to the scoped key
        if (id) {
            this.migrateUnscopedEntries();
        }
    }
    /**
     * Move entries from the unscoped key into the
     * practitioner-scoped key so that previously orphaned records become visible.
     * Also checks the legacy unencrypted key ("calculation-history").
     */
    async migrateUnscopedEntries() {
        try {
            // Check legacy unencrypted key first
            const legacyData = localStorage.getItem('calculation-history');
            if (legacyData) {
                localStorage.removeItem('calculation-history');
            }
            const unscopedEntries = await secureLocalRetrieve(BASE_KEY) || [];
            const legacyEntries = legacyData ? JSON.parse(legacyData) : [];
            const allUnscopedEntries = [...unscopedEntries, ...legacyEntries];
            if (allUnscopedEntries.length === 0)
                return;
            // Merge: existing scoped entries first, then unscoped (older)
            const scopedEntries = await this.getEntries();
            const merged = [...scopedEntries, ...allUnscopedEntries]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, MAX_ENTRIES);
            await this.save(merged);
            localStorage.removeItem(BASE_KEY);
            logger.info('Migrated unscoped calculation history entries', { count: allUnscopedEntries.length });
        }
        catch {
            logger.warn('Failed to migrate unscoped calculation history');
        }
    }
    async addEntry(entry) {
        const entries = await this.getEntries();
        entries.unshift({
            ...entry,
            timestamp: new Date().toISOString()
        });
        if (entries.length > MAX_ENTRIES) {
            entries.length = MAX_ENTRIES;
        }
        await this.save(entries);
    }
    async getEntries(limit) {
        try {
            const all = await secureLocalRetrieve(this.storageKey) || [];
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
    async getEntryCount() {
        return (await this.getEntries()).length;
    }
    async save(entries) {
        try {
            await secureLocalStore(this.storageKey, entries);
        }
        catch {
            logger.error('Failed to save calculation history');
        }
    }
}
export const calculationHistory = new CalculationHistory();
