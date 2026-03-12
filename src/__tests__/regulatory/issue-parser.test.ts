/**
 * Issue Body Parser Tests
 * Tests the parseIssueBody function and type-specific parsers.
 */

import { parseIssueBody, parseRequirement, parseDesign, parseRisk, parseVerification } from '../../../scripts/regulatory/issue-parser';
import { RegulatoryIssue } from '../../../scripts/regulatory/types';

function makeIssue(body: string, overrides: Partial<RegulatoryIssue> = {}): RegulatoryIssue {
    return {
        number: 1,
        title: 'Test Issue',
        body,
        labels: [],
        state: 'open',
        createdAt: '2026-03-12T00:00:00Z',
        updatedAt: '2026-03-12T00:00:00Z',
        closedAt: null,
        author: 'testuser',
        url: 'https://github.com/test/repo/issues/1',
        ...overrides
    };
}

describe('parseIssueBody', () => {
    it('should parse sections from YAML form issue body', () => {
        const body = `### 需求描述\n\n系統應支援 92 個計算器\n\n### 臨床情境\n\n當醫師需要計算 eGFR 時\n\n### 驗收條件\n\n- [x] 完成`;
        const result = parseIssueBody(body);
        expect(result.get('需求描述')).toBe('系統應支援 92 個計算器');
        expect(result.get('臨床情境')).toBe('當醫師需要計算 eGFR 時');
        expect(result.get('驗收條件')).toBe('- [x] 完成');
    });

    it('should handle empty body', () => {
        const result = parseIssueBody('');
        expect(result.size).toBe(0);
    });

    it('should handle _No response_ placeholder', () => {
        const body = `### 需求描述\n\n_No response_`;
        const result = parseIssueBody(body);
        expect(result.get('需求描述')).toBe('');
    });

    it('should handle section with no content', () => {
        const body = `### 需求描述\n\n### 臨床情境\n\n內容`;
        const result = parseIssueBody(body);
        expect(result.get('需求描述')).toBe('');
        expect(result.get('臨床情境')).toBe('內容');
    });

    it('should handle multiline content', () => {
        const body = `### 測試步驟\n\n1. 步驟一\n2. 步驟二\n3. 步驟三`;
        const result = parseIssueBody(body);
        expect(result.get('測試步驟')).toContain('步驟一');
        expect(result.get('測試步驟')).toContain('步驟三');
    });
});

describe('parseRequirement', () => {
    it('should parse requirement fields', () => {
        const body = `### 需求描述\n\n系統需支援 eGFR 計算\n\n### 臨床情境\n\n腎功能評估\n\n### 驗收條件\n\n- [x] 完成\n\n### 風險等級\n\nB — 非嚴重傷害\n\n### 優先級\n\nMust — 必要\n\n### 關聯需求\n\n#12, #15`;
        const issue = makeIssue(body, { number: 42, title: 'eGFR 計算器' });
        const req = parseRequirement(issue);

        expect(req.issueNumber).toBe(42);
        expect(req.title).toBe('eGFR 計算器');
        expect(req.description).toBe('系統需支援 eGFR 計算');
        expect(req.clinicalScenario).toBe('腎功能評估');
        expect(req.riskLevel).toBe('B — 非嚴重傷害');
        expect(req.priority).toBe('Must — 必要');
        expect(req.relatedRequirements).toBe('#12, #15');
    });

    it('should handle missing fields gracefully', () => {
        const issue = makeIssue('', { number: 1, title: 'Empty' });
        const req = parseRequirement(issue);
        expect(req.description).toBe('');
        expect(req.clinicalScenario).toBe('');
        expect(req.riskLevel).toBe('');
    });
});

describe('parseDesign', () => {
    it('should parse design fields', () => {
        const body = `### 設計方案\n\n使用 Factory Pattern\n\n### 架構影響\n\n影響模組：calculators\n\n### 關聯需求\n\n#42\n\n### 安全考量\n\n需要 XSS 防護\n\n### 測試策略\n\n單元測試 + E2E`;
        const issue = makeIssue(body, { number: 5, title: '計算器工廠模式' });
        const des = parseDesign(issue);

        expect(des.issueNumber).toBe(5);
        expect(des.designDescription).toBe('使用 Factory Pattern');
        expect(des.architectureImpact).toContain('calculators');
        expect(des.relatedRequirements).toBe('#42');
        expect(des.safetyConsiderations).toBe('需要 XSS 防護');
        expect(des.testStrategy).toBe('單元測試 + E2E');
    });
});

describe('parseRisk', () => {
    it('should parse risk fields and calculate score', () => {
        const body = `### 危害情境\n\n輸入值超出範圍\n\n### 嚴重度 (Severity)\n\n3 — 嚴重 (Serious)\n\n### 發生機率 (Probability)\n\n3 — 偶發 (Occasional)\n\n### 風險控制措施\n\n輸入驗證\n\n### 殘餘風險\n\n可接受\n\n### 驗證方法\n\n單元測試\n\n### 關聯 Issues\n\n#42`;
        const issue = makeIssue(body, { number: 10, title: '輸入驗證風險' });
        const risk = parseRisk(issue);

        expect(risk.severity).toBe(3);
        expect(risk.probability).toBe(3);
        expect(risk.riskScore).toBe(9);
        expect(risk.riskLevel).toBe('alarp');
        expect(risk.hazardScenario).toBe('輸入值超出範圍');
        expect(risk.riskControl).toBe('輸入驗證');
    });

    it('should handle catastrophic risk (score >= 10)', () => {
        const body = `### 危害情境\n\n嚴重錯誤\n\n### 嚴重度 (Severity)\n\n5 — 災難性 (Catastrophic)\n\n### 發生機率 (Probability)\n\n3 — 偶發 (Occasional)\n\n### 風險控制措施\n\n多重防護\n\n### 殘餘風險\n\n需持續監控\n\n### 驗證方法\n\n全面測試`;
        const risk = parseRisk(makeIssue(body));

        expect(risk.severity).toBe(5);
        expect(risk.probability).toBe(3);
        expect(risk.riskScore).toBe(15);
        expect(risk.riskLevel).toBe('unacceptable');
    });

    it('should handle low risk (score <= 4)', () => {
        const body = `### 危害情境\n\n輕微問題\n\n### 嚴重度 (Severity)\n\n1 — 可忽略 (Negligible)\n\n### 發生機率 (Probability)\n\n2 — 罕見 (Remote)\n\n### 風險控制措施\n\n基本防護\n\n### 殘餘風險\n\n可接受\n\n### 驗證方法\n\n程式碼審查`;
        const risk = parseRisk(makeIssue(body));

        expect(risk.riskScore).toBe(2);
        expect(risk.riskLevel).toBe('acceptable');
    });

    it('should default to severity 1 and probability 1 on missing fields', () => {
        const risk = parseRisk(makeIssue(''));
        expect(risk.severity).toBe(1);
        expect(risk.probability).toBe(1);
        expect(risk.riskScore).toBe(1);
        expect(risk.riskLevel).toBe('acceptable');
    });
});

describe('parseVerification', () => {
    it('should parse verification fields', () => {
        const body = `### 測試目的\n\n驗證 eGFR 計算正確性\n\n### 測試步驟\n\n1. 輸入資料\n2. 計算\n\n### 預期結果\n\neGFR = 90\n\n### 關聯需求\n\n#42\n\n### 測試結果\n\n通過 (PASS)\n\n### 實際結果\n\neGFR = 90.2\n\n### 測試證據\n\n截圖附上`;
        const issue = makeIssue(body, { number: 20, title: 'eGFR 計算驗證' });
        const ver = parseVerification(issue);

        expect(ver.testPurpose).toBe('驗證 eGFR 計算正確性');
        expect(ver.testSteps).toContain('輸入資料');
        expect(ver.expectedResult).toBe('eGFR = 90');
        expect(ver.relatedRequirements).toBe('#42');
        expect(ver.result).toBe('通過 (PASS)');
        expect(ver.actualResult).toBe('eGFR = 90.2');
        expect(ver.evidence).toBe('截圖附上');
    });
});
