/**
 * Document Header Generator Tests
 */

import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getRiskCategory, getRiskColor, getToday } from '../../../scripts/regulatory/document-header';
import { DocumentMeta } from '../../../scripts/regulatory/types';

describe('generateDocumentHeader', () => {
    it('should generate a header with all meta fields', () => {
        const meta: DocumentMeta = {
            product: 'MEDCALCEHR',
            version: '1.0.0',
            documentId: 'REG-SRS-001',
            standard: 'IEC 62304:2006+A1:2015',
            title: '軟體需求規格書',
            generatedDate: '2026-03-12'
        };

        const header = generateDocumentHeader(meta);

        expect(header).toContain('# 軟體需求規格書');
        expect(header).toContain('MEDCALCEHR');
        expect(header).toContain('REG-SRS-001');
        expect(header).toContain('1.0.0');
        expect(header).toContain('2026-03-12');
        expect(header).toContain('IEC 62304');
    });

    it('should contain auto-generation notice', () => {
        const meta: DocumentMeta = {
            product: 'Test', version: '1.0', documentId: 'X',
            standard: 'Y', title: 'Z', generatedDate: '2026-01-01'
        };
        const header = generateDocumentHeader(meta);
        expect(header).toContain('自動產出');
        expect(header).toContain('npm run generate:regulatory');
    });
});

describe('generateApprovalTable', () => {
    it('should contain approval roles', () => {
        const table = generateApprovalTable();
        expect(table).toContain('軟體開發工程師');
        expect(table).toContain('品質管理代表');
        expect(table).toContain('臨床審查員');
        expect(table).toContain('法規事務專員');
    });

    it('should have table format', () => {
        const table = generateApprovalTable();
        expect(table).toContain('| 角色 | 姓名 | 日期 | 簽名 |');
    });
});

describe('generateRevisionHistory', () => {
    it('should generate default entry when no entries provided', () => {
        const history = generateRevisionHistory();
        expect(history).toContain('1.0');
        expect(history).toContain('初始版本');
    });

    it('should include provided entries', () => {
        const entries = [
            { version: '1.0', date: '2026-03-01', description: '初版', author: 'Alice' },
            { version: '1.1', date: '2026-03-12', description: '修訂', author: 'Bob' }
        ];
        const history = generateRevisionHistory(entries);
        expect(history).toContain('Alice');
        expect(history).toContain('Bob');
        expect(history).toContain('初版');
        expect(history).toContain('修訂');
    });
});

describe('getToday', () => {
    it('should return date in YYYY-MM-DD format', () => {
        const today = getToday();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('getRiskCategory', () => {
    it('should return acceptable for score 1-4', () => {
        expect(getRiskCategory(1)).toContain('可接受');
        expect(getRiskCategory(4)).toContain('可接受');
    });

    it('should return ALARP for score 5-9', () => {
        expect(getRiskCategory(5)).toContain('ALARP');
        expect(getRiskCategory(9)).toContain('ALARP');
    });

    it('should return unacceptable for score 10+', () => {
        expect(getRiskCategory(10)).toContain('不可接受');
        expect(getRiskCategory(25)).toContain('不可接受');
    });
});

describe('getRiskColor', () => {
    it('should return green for acceptable', () => {
        expect(getRiskColor(4)).toBe('🟢');
    });

    it('should return yellow for ALARP', () => {
        expect(getRiskColor(5)).toBe('🟡');
    });

    it('should return red for unacceptable', () => {
        expect(getRiskColor(10)).toBe('🔴');
    });
});
