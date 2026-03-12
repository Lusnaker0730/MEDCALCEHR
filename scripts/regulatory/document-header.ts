/**
 * TFDA Regulatory Document Header Generator
 * Produces standardized document headers compliant with IEC 62304, ISO 14971, ISO 13485.
 *
 * Usage: import { generateDocumentHeader, generateApprovalTable } from './document-header';
 */

import { DocumentMeta } from './types';

export function generateDocumentHeader(meta: DocumentMeta): string {
    return `# ${meta.title}

**產品名稱：** ${meta.product}
**文件編號：** ${meta.documentId}
**版本：** ${meta.version}
**產出日期：** ${meta.generatedDate}
**適用標準：** ${meta.standard}

> 本文件由 \`scripts/regulatory/\` 自動產出。
> 執行 \`npm run generate:regulatory\` 重新生成。

---
`;
}

export function generateApprovalTable(): string {
    return `
---

## 簽核表

| 角色 | 姓名 | 日期 | 簽名 |
|------|------|------|------|
| 軟體開發工程師 | | | |
| 品質管理代表 | | | |
| 臨床審查員 | | | |
| 法規事務專員 | | | |
`;
}

export function generateRevisionHistory(entries?: Array<{ version: string; date: string; description: string; author: string }>): string {
    let md = `## 修訂紀錄

| 版本 | 日期 | 說明 | 作者 |
|------|------|------|------|
`;
    if (entries && entries.length > 0) {
        for (const entry of entries) {
            md += `| ${entry.version} | ${entry.date} | ${entry.description} | ${entry.author} |\n`;
        }
    } else {
        md += `| 1.0 | ${new Date().toISOString().split('T')[0]} | 初始版本（自動產出） | System |\n`;
    }
    md += '\n';
    return md;
}

export function getRiskCategory(score: number): string {
    if (score <= 4) return '可接受 (Acceptable)';
    if (score <= 9) return '合理可行最低 (ALARP)';
    return '不可接受 (Unacceptable)';
}

export function getRiskColor(score: number): string {
    if (score <= 4) return '🟢';
    if (score <= 9) return '🟡';
    return '🔴';
}

export function getToday(): string {
    return new Date().toISOString().split('T')[0];
}
