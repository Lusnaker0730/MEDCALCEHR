/**
 * Issue Body Parser
 * Pure parsing functions for GitHub YAML form issue bodies.
 * No external dependencies — safe to import in Jest tests.
 *
 * Usage: import { parseIssueBody, parseRequirement, ... } from './issue-parser';
 */

import { RegulatoryIssue, ParsedRequirement, ParsedDesign, ParsedRisk, ParsedVerification } from './types';

/**
 * Parse a GitHub YAML form issue body by splitting on ### headings.
 * Returns a map of heading -> content.
 */
export function parseIssueBody(body: string): Map<string, string> {
    const sections = new Map<string, string>();
    const parts = body.split(/^### /m);

    for (const part of parts) {
        if (!part.trim()) continue;
        const newlineIdx = part.indexOf('\n');
        if (newlineIdx === -1) {
            sections.set(part.trim(), '');
        } else {
            const heading = part.substring(0, newlineIdx).trim();
            const content = part.substring(newlineIdx + 1).trim();
            // Remove "_No response_" placeholder
            sections.set(heading, content === '_No response_' ? '' : content);
        }
    }

    return sections;
}

export function parseRequirement(issue: RegulatoryIssue): ParsedRequirement {
    const fields = parseIssueBody(issue.body);
    return {
        issueNumber: issue.number,
        title: issue.title,
        description: fields.get('需求描述') || '',
        clinicalScenario: fields.get('臨床情境') || '',
        acceptanceCriteria: fields.get('驗收條件') || '',
        riskLevel: fields.get('風險等級') || '',
        priority: fields.get('優先級') || '',
        relatedRequirements: fields.get('關聯需求') || '',
        url: issue.url,
        createdAt: issue.createdAt
    };
}

export function parseDesign(issue: RegulatoryIssue): ParsedDesign {
    const fields = parseIssueBody(issue.body);
    return {
        issueNumber: issue.number,
        title: issue.title,
        designDescription: fields.get('設計方案') || '',
        architectureImpact: fields.get('架構影響') || '',
        relatedRequirements: fields.get('關聯需求') || '',
        safetyConsiderations: fields.get('安全考量') || '',
        testStrategy: fields.get('測試策略') || '',
        url: issue.url,
        createdAt: issue.createdAt
    };
}

export function parseRisk(issue: RegulatoryIssue): ParsedRisk {
    const fields = parseIssueBody(issue.body);

    const severityStr = fields.get('嚴重度 (Severity)') || '1';
    const probabilityStr = fields.get('發生機率 (Probability)') || '1';

    const severity = parseInt(severityStr.charAt(0), 10) || 1;
    const probability = parseInt(probabilityStr.charAt(0), 10) || 1;
    const riskScore = severity * probability;

    let riskLevel: string;
    if (riskScore <= 4) riskLevel = 'acceptable';
    else if (riskScore <= 9) riskLevel = 'alarp';
    else riskLevel = 'unacceptable';

    return {
        issueNumber: issue.number,
        title: issue.title,
        hazardScenario: fields.get('危害情境') || '',
        severity,
        severityLabel: severityStr,
        probability,
        probabilityLabel: probabilityStr,
        riskScore,
        riskLevel,
        riskControl: fields.get('風險控制措施') || '',
        residualRisk: fields.get('殘餘風險') || '',
        verificationMethod: fields.get('驗證方法') || '',
        relatedIssues: fields.get('關聯 Issues') || '',
        url: issue.url,
        createdAt: issue.createdAt
    };
}

export function parseVerification(issue: RegulatoryIssue): ParsedVerification {
    const fields = parseIssueBody(issue.body);
    return {
        issueNumber: issue.number,
        title: issue.title,
        testPurpose: fields.get('測試目的') || '',
        testSteps: fields.get('測試步驟') || '',
        expectedResult: fields.get('預期結果') || '',
        relatedRequirements: fields.get('關聯需求') || '',
        result: fields.get('測試結果') || '',
        actualResult: fields.get('實際結果') || '',
        evidence: fields.get('測試證據') || '',
        url: issue.url,
        createdAt: issue.createdAt
    };
}
