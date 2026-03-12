/**
 * 軟體設計規格書 (SDS) 生成器
 * Generates from GitHub Issues labeled IEC62304:設計.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-sds.ts
 * Output: regulatory_docs/軟體設計規格書_SDS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchIssuesByLabel, parseDesign } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday } from './document-header';
import { ParsedDesign } from './types';

function generateDesignEntries(designs: ParsedDesign[]): string {
    if (designs.length === 0) {
        return `## 1. 設計規格項目\n\n> 尚無標記 \`IEC62304:設計\` 的 Issues。\n\n`;
    }

    let md = `## 1. 設計規格總覽（共 ${designs.length} 項）\n\n`;

    md += `| 編號 | Issue | 設計標題 | 關聯需求 |\n`;
    md += `|------|-------|----------|----------|\n`;

    designs.forEach((d, i) => {
        const id = `DES-GH-${String(i + 1).padStart(3, '0')}`;
        md += `| ${id} | [#${d.issueNumber}](${d.url}) | ${d.title} | ${d.relatedRequirements || '—'} |\n`;
    });

    md += '\n---\n\n';

    md += `## 2. 詳細設計規格\n\n`;

    for (let i = 0; i < designs.length; i++) {
        const d = designs[i];
        const id = `DES-GH-${String(i + 1).padStart(3, '0')}`;
        md += `### ${id}: ${d.title}\n\n`;
        md += `**Issue:** [#${d.issueNumber}](${d.url})  \n`;
        md += `**建立日期：** ${d.createdAt.split('T')[0]}  \n`;
        md += `**關聯需求：** ${d.relatedRequirements || '—'}  \n`;
        md += '\n';

        md += `#### 設計方案\n\n${d.designDescription || '（未填寫）'}\n\n`;
        md += `#### 架構影響\n\n${d.architectureImpact || '（未填寫）'}\n\n`;
        md += `#### 安全考量\n\n${d.safetyConsiderations || '（未填寫）'}\n\n`;

        if (d.testStrategy) {
            md += `#### 測試策略\n\n${d.testStrategy}\n\n`;
        }

        md += '---\n\n';
    }

    return md;
}

function generateArchitectureOverview(): string {
    return `## 3. 系統架構概述

本系統採用下列技術架構：

- **前端框架：** TypeScript + Vanilla DOM（無框架）
- **建構工具：** Vite（production build → dist/）
- **FHIR 整合：** fhirclient v2.6.3（SMART on FHIR OAuth2）
- **部署方式：** Docker + Nginx（port 8080）
- **計算器模式：** Factory Pattern（scoring / formula / dynamic-list / conversion）

### 模組結構

| 模組 | 路徑 | 用途 |
|------|------|------|
| 計算器引擎 | \`src/calculators/\` | 92 個臨床計算器實作 |
| FHIR 資料服務 | \`src/fhir-data-service.ts\` | 自動填入 EHR 資料 |
| 安全模組 | \`src/security.ts\` | HTML 跳脫、AES-GCM 加密、PHI 剝除 |
| 驗證器 | \`src/validator.ts\` | 雙區間輸入驗證 |
| UI 建構器 | \`src/ui-builder.ts\` | 單例 HTML 元件工廠 |
| 日誌系統 | \`src/logger.ts\` | 結構化 JSON 日誌 + PHI 過濾 |
| TW Core | \`src/twcore/\` | 台灣 FHIR Core IG 整合 |

`;
}

export async function generateSDS(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 軟體設計規格書 (SDS)...');

    const projectRoot = path.resolve(__dirname, '..', '..');

    const issues = await fetchIssuesByLabel('IEC62304:設計', options);
    const designs = issues.map(parseDesign);

    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-SDS-001',
        standard: 'IEC 62304:2006+A1:2015',
        title: '軟體設計規格書 (Software Design Specification)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const archOverview = generateArchitectureOverview();
    const designEntries = generateDesignEntries(designs);
    const approval = generateApprovalTable();

    const document = header + revision + archOverview + designEntries + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '軟體設計規格書_SDS.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    generateSDS({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating SDS:', err.message);
        process.exit(1);
    });
}
