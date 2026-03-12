/**
 * Shared Types for Regulatory Document Generation
 * Type definitions for parsed GitHub Issues and regulatory documents.
 */

export interface RegulatoryIssue {
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: string;
    createdAt: string;
    updatedAt: string;
    closedAt: string | null;
    author: string;
    url: string;
}

export interface ParsedRequirement {
    issueNumber: number;
    title: string;
    description: string;
    clinicalScenario: string;
    acceptanceCriteria: string;
    riskLevel: string;
    priority: string;
    relatedRequirements: string;
    url: string;
    createdAt: string;
}

export interface ParsedDesign {
    issueNumber: number;
    title: string;
    designDescription: string;
    architectureImpact: string;
    relatedRequirements: string;
    safetyConsiderations: string;
    testStrategy: string;
    url: string;
    createdAt: string;
}

export interface ParsedRisk {
    issueNumber: number;
    title: string;
    hazardScenario: string;
    severity: number;
    severityLabel: string;
    probability: number;
    probabilityLabel: string;
    riskScore: number;
    riskLevel: string;
    riskControl: string;
    residualRisk: string;
    verificationMethod: string;
    relatedIssues: string;
    url: string;
    createdAt: string;
}

export interface ParsedVerification {
    issueNumber: number;
    title: string;
    testPurpose: string;
    testSteps: string;
    expectedResult: string;
    relatedRequirements: string;
    result: string;
    actualResult: string;
    evidence: string;
    url: string;
    createdAt: string;
}

export interface MergedPR {
    number: number;
    title: string;
    body: string;
    mergedAt: string;
    author: string;
    labels: string[];
    url: string;
    baseRef: string;
    headRef: string;
}

export interface DocumentMeta {
    product: string;
    version: string;
    documentId: string;
    standard: string;
    title: string;
    generatedDate: string;
}

export type RiskCategory = 'acceptable' | 'alarp' | 'unacceptable';
