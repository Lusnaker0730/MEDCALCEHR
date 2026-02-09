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
