import { logger } from './logger.js';

export interface HistoryEntry {
    calculatorId: string;
    calculatorTitle: string;
    timestamp: string;
    resultSummary: string;
}

const BASE_KEY = 'calculation-history';
const MAX_ENTRIES = 100;

export class CalculationHistory {
    private practitionerId: string | null = null;

    private get storageKey(): string {
        return this.practitionerId
            ? `${BASE_KEY}-${this.practitionerId}`
            : BASE_KEY;
    }

    setPractitionerId(id: string | null): void {
        this.practitionerId = id;
        // Migrate any entries saved without practitioner scope to the scoped key
        if (id) {
            this.migrateUnscopedEntries();
        }
    }

    /**
     * Move entries from the unscoped key ("calculation-history") into the
     * practitioner-scoped key so that previously orphaned records become visible.
     */
    private migrateUnscopedEntries(): void {
        try {
            const unscopedData = localStorage.getItem(BASE_KEY);
            if (!unscopedData) return;

            const unscopedEntries: HistoryEntry[] = JSON.parse(unscopedData);
            if (unscopedEntries.length === 0) return;

            // Merge: existing scoped entries first, then unscoped (older)
            const scopedEntries = this.getEntries();
            const merged = [...scopedEntries, ...unscopedEntries]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, MAX_ENTRIES);

            this.save(merged);
            localStorage.removeItem(BASE_KEY);
            logger.info('Migrated unscoped calculation history entries', { count: unscopedEntries.length });
        } catch {
            logger.warn('Failed to migrate unscoped calculation history');
        }
    }

    addEntry(entry: Omit<HistoryEntry, 'timestamp'>): void {
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

    getEntries(limit?: number): HistoryEntry[] {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const all: HistoryEntry[] = stored ? JSON.parse(stored) : [];
            return limit ? all.slice(0, limit) : all;
        } catch {
            logger.error('Failed to load calculation history');
            return [];
        }
    }

    clearHistory(): void {
        try {
            localStorage.removeItem(this.storageKey);
        } catch {
            logger.error('Failed to clear history');
        }
    }

    getEntryCount(): number {
        return this.getEntries().length;
    }

    private save(entries: HistoryEntry[]): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(entries));
        } catch {
            logger.error('Failed to save calculation history');
        }
    }
}

export const calculationHistory = new CalculationHistory();
