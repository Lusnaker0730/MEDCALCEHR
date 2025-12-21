export interface StalenessInfo {
    isStale: boolean;
    date: Date;
    dateStr: string;
    ageInDays: number;
    ageFormatted: string;
}

export declare class DataStalenessTracker {
    constructor(options?: { thresholdMs?: number; warningContainerId?: string });
    setContainer(container: HTMLElement): void;
    checkStaleness(observation: any): StalenessInfo | null;
    trackObservation(fieldId: string, observation: any, code: string, customLabel?: string | null): StalenessInfo | null;
    clearField(fieldId: string): void;
    clearAll(): void;
    getStaleCount(): number;
    getStaleItems(): Array<{ fieldId: string } & StalenessInfo>;
}

export declare function getObservationDate(observation: any): Date | null;
export declare function isObservationStale(observation: any, thresholdMs?: number): boolean;
export declare function createStalenessTracker(options?: any): DataStalenessTracker;

declare const _default: {
    DataStalenessTracker: typeof DataStalenessTracker;
    createStalenessTracker: typeof createStalenessTracker;
    getObservationDate: typeof getObservationDate;
    isObservationStale: typeof isObservationStale;
};
export default _default;
