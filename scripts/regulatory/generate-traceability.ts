/**
 * 追溯矩陣生成器
 * Cross-references all four regulatory issue types (需求/設計/風險/驗證)
 * and merges with existing TRACEABILITY_MATRIX.md.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-traceability.ts
 * Output: regulatory_docs/追溯矩陣.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchIssuesByLabel, parseRequirement, parseDesign, parseRisk, parseVerification } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday } from './document-header';

function extractExistingTraceability(matrixPath: string): string {
    if (!fs.existsSync(matrixPath)) {
        console.warn(`  Warning: ${matrixPath} not found, skipping calculator traceability merge.`);
        return '';
    }
    const content = fs.readFileSync(matrixPath, 'utf-8');

    // Extract summary and calculator-level traceability
    const summaryMatch = content.match(/## 1\. Summary[\s\S]*?(?=\n## 2\.)/);
    const calcMatch = content.match(/## 3\. Calculator-Level Traceability[\s\S]*?(?=\n## 4\.)/);

    let md = '';
    if (summaryMatch) {
        md += `## 1. 計算器覆蓋率摘要（來源：docs/compliance/TRACEABILITY_MATRIX.md）\n\n`;
        // Extract just the table from summary
        const tableMatch = summaryMatch[0].match(/\| Metric[\s\S]*?\n\n/);
        if (tableMatch) {
            md += tableMatch[0];
        }
        md += '\n';
    }

    if (calcMatch) {
        md += `## 2. 計算器級追溯（來源：docs/compliance/TRACEABILITY_MATRIX.md）\n\n`;
        md += `> 詳細的計算器實作、單元測試、Golden Dataset 追溯請參閱英文版 TRACEABILITY_MATRIX.md。\n\n`;
        // Include a brief note instead of duplicating the full table
        const categoryCount = (calcMatch[0].match(/^### /gm) || []).length;
        md += `共涵蓋 ${categoryCount} 個計算器分類。\n\n`;
    }

    return md;
}

interface CrossRef {
    issueNumber: number;
    title: string;
    url: string;
    type: string;
    relatedIssues: string;
}

function parseRelatedIssueNumbers(text: string): number[] {
    const matches = text.match(/#(\d+)/g);
    if (!matches) return [];
    return matches.map(m => parseInt(m.replace('#', ''), 10));
}

export async function generateTraceability(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 追溯矩陣...');

    const projectRoot = path.resolve(__dirname, '..', '..');
    const matrixPath = path.join(projectRoot, 'docs', 'compliance', 'TRACEABILITY_MATRIX.md');

    // Fetch all four types
    const [reqIssues, desIssues, riskIssues, verIssues] = await Promise.all([
        fetchIssuesByLabel('IEC62304:需求', options),
        fetchIssuesByLabel('IEC62304:設計', options),
        fetchIssuesByLabel('ISO14971:風險', options),
        fetchIssuesByLabel('IEC62304:驗證', options)
    ]);

    const requirements = reqIssues.map(parseRequirement);
    const designs = desIssues.map(parseDesign);
    const risks = riskIssues.map(parseRisk);
    const verifications = verIssues.map(parseVerification);

    // Build cross-reference map
    const allItems: CrossRef[] = [
        ...requirements.map(r => ({
            issueNumber: r.issueNumber, title: r.title, url: r.url,
            type: '需求', relatedIssues: r.relatedRequirements
        })),
        ...designs.map(d => ({
            issueNumber: d.issueNumber, title: d.title, url: d.url,
            type: '設計', relatedIssues: d.relatedRequirements
        })),
        ...risks.map(r => ({
            issueNumber: r.issueNumber, title: r.title, url: r.url,
            type: '風險', relatedIssues: r.relatedIssues
        })),
        ...verifications.map(v => ({
            issueNumber: v.issueNumber, title: v.title, url: v.url,
            type: '驗證', relatedIssues: v.relatedRequirements
        }))
    ];

    const issueMap = new Map<number, CrossRef>();
    for (const item of allItems) {
        issueMap.set(item.issueNumber, item);
    }

    // Build document
    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-TRACE-001',
        standard: 'IEC 62304:2006+A1:2015 §5.7',
        title: '追溯矩陣 (Traceability Matrix)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const existing = extractExistingTraceability(matrixPath);

    // Cross-reference matrix
    let crossRef = `## 3. 需求-設計-風險-驗證 交叉追溯\n\n`;

    if (allItems.length === 0) {
        crossRef += '> 尚無法規 Issues，無法建立交叉追溯。\n\n';
    } else {
        crossRef += `### 統計\n\n`;
        crossRef += `| 類型 | 數量 |\n`;
        crossRef += `|------|------|\n`;
        crossRef += `| 需求 (IEC62304:需求) | ${requirements.length} |\n`;
        crossRef += `| 設計 (IEC62304:設計) | ${designs.length} |\n`;
        crossRef += `| 風險 (ISO14971:風險) | ${risks.length} |\n`;
        crossRef += `| 驗證 (IEC62304:驗證) | ${verifications.length} |\n`;
        crossRef += `| **合計** | **${allItems.length}** |\n\n`;

        // Build requirement-centric trace
        if (requirements.length > 0) {
            crossRef += `### 需求追溯鏈\n\n`;
            crossRef += `| 需求 | 設計 | 風險 | 驗證 |\n`;
            crossRef += `|------|------|------|------|\n`;

            for (const req of requirements) {
                const reqRef = `[#${req.issueNumber}](${req.url})`;

                // Find designs referencing this requirement
                const relDesigns = designs.filter(d => {
                    const refs = parseRelatedIssueNumbers(d.relatedRequirements);
                    return refs.includes(req.issueNumber);
                });

                // Find verifications referencing this requirement
                const relVers = verifications.filter(v => {
                    const refs = parseRelatedIssueNumbers(v.relatedRequirements);
                    return refs.includes(req.issueNumber);
                });

                // Find risks referencing this requirement
                const relRisks = risks.filter(r => {
                    const refs = parseRelatedIssueNumbers(r.relatedIssues);
                    return refs.includes(req.issueNumber);
                });

                const desLinks = relDesigns.length > 0
                    ? relDesigns.map(d => `[#${d.issueNumber}](${d.url})`).join(', ')
                    : '—';
                const riskLinks = relRisks.length > 0
                    ? relRisks.map(r => `[#${r.issueNumber}](${r.url})`).join(', ')
                    : '—';
                const verLinks = relVers.length > 0
                    ? relVers.map(v => `[#${v.issueNumber}](${v.url})`).join(', ')
                    : '—';

                crossRef += `| ${reqRef} ${req.title} | ${desLinks} | ${riskLinks} | ${verLinks} |\n`;
            }
            crossRef += '\n';
        }

        // Gap analysis
        crossRef += `### 缺口分析\n\n`;

        const reqsWithoutDesign = requirements.filter(req => {
            return !designs.some(d => {
                const refs = parseRelatedIssueNumbers(d.relatedRequirements);
                return refs.includes(req.issueNumber);
            });
        });

        const reqsWithoutVer = requirements.filter(req => {
            return !verifications.some(v => {
                const refs = parseRelatedIssueNumbers(v.relatedRequirements);
                return refs.includes(req.issueNumber);
            });
        });

        if (reqsWithoutDesign.length > 0) {
            crossRef += `**缺少設計對應的需求（${reqsWithoutDesign.length} 項）：**\n\n`;
            reqsWithoutDesign.forEach(r => {
                crossRef += `- [#${r.issueNumber}](${r.url}) ${r.title}\n`;
            });
            crossRef += '\n';
        }

        if (reqsWithoutVer.length > 0) {
            crossRef += `**缺少驗證對應的需求（${reqsWithoutVer.length} 項）：**\n\n`;
            reqsWithoutVer.forEach(r => {
                crossRef += `- [#${r.issueNumber}](${r.url}) ${r.title}\n`;
            });
            crossRef += '\n';
        }

        if (reqsWithoutDesign.length === 0 && reqsWithoutVer.length === 0) {
            crossRef += '所有需求均已對應設計與驗證項目。\n\n';
        }
    }

    // Traceability chain diagram
    crossRef += `## 4. 追溯鏈示意\n\n`;
    crossRef += '```\n';
    crossRef += '需求 (GitHub Issue: IEC62304:需求)\n';
    crossRef += '  → 設計 (GitHub Issue: IEC62304:設計)\n';
    crossRef += '    → 實作 (src/calculators/{id}/index.ts)\n';
    crossRef += '      → 單元測試 (src/__tests__/calculators/{id}.test.ts)\n';
    crossRef += '        → 臨床驗證 (golden-datasets/{id}.json)\n';
    crossRef += '          → 驗證記錄 (GitHub Issue: IEC62304:驗證)\n';
    crossRef += '  → 風險分析 (GitHub Issue: ISO14971:風險)\n';
    crossRef += '    → 風險控制措施\n';
    crossRef += '      → 驗證方法\n';
    crossRef += '```\n\n';

    const approval = generateApprovalTable();

    const document = header + revision + existing + crossRef + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '追溯矩陣.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    generateTraceability({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating traceability:', err.message);
        process.exit(1);
    });
}
