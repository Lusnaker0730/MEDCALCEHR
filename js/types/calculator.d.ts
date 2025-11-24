import { FHIRClient, Patient } from './fhir';

export interface UnitConversion {
    type: string;
    units: string[];
    default?: string;
}

export interface CalculatorMetadata {
    id: string;
    title: string;
    category?: string;
    description?: string;
    keywords?: string[];
}

export interface Calculator {
    id: string;
    title: string;
    description: string;
    generateHTML(): string;
    initialize(client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void;
}

export interface PointFunction {
    (value: number, ...args: any[]): number;
}

export interface ScoringSystem {
    [key: string]: PointFunction;
}
