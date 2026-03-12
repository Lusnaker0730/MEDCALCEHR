/**
 * 風險管理報告生成器
 * Merges risk methodology from docs/compliance/RISK_MANAGEMENT.md
 * with GitHub Issues labeled ISO14971:風險.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-risk-report.ts
 * Output: regulatory_docs/風險管理報告.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchIssuesByLabel, parseRisk } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday, getRiskCategory, getRiskColor } from './document-header';
import { ParsedRisk } from './types';

function generateRiskMethodology(): string {
    return `## 1. 風險分析方法

本報告採用 **失效模式與效應分析 (FMEA)** 方法，依 ISO 14971 標準進行系統性風險識別、評估與控制。

### 嚴重度等級 (Severity)

| 等級 | 分類 | 說明 |
|------|------|------|
| 1 | 可忽略 (Negligible) | 不便或暫時性不適 |
| 2 | 輕微 (Minor) | 暫時性傷害，不需專業醫療介入 |
| 3 | 嚴重 (Serious) | 需要專業醫療介入的傷害 |
| 4 | 危急 (Critical) | 永久性損傷或危及生命 |
| 5 | 災難性 (Catastrophic) | 導致病患死亡 |

### 發生機率等級 (Probability)

| 等級 | 分類 | 範圍 |
|------|------|------|
| 1 | 極不可能 (Improbable) | < 10⁻⁶ |
| 2 | 罕見 (Remote) | 10⁻⁶ ~ 10⁻⁴ |
| 3 | 偶發 (Occasional) | 10⁻⁴ ~ 10⁻² |
| 4 | 可能 (Probable) | 10⁻² ~ 10⁻¹ |
| 5 | 頻繁 (Frequent) | > 10⁻¹ |

### 風險評估矩陣

風險分數 = 嚴重度 × 發生機率

| 分數範圍 | 風險等級 | 處置方式 |
|----------|----------|----------|
| 1-4 | 🟢 可接受 (Acceptable) | 接受，持續監控 |
| 5-9 | 🟡 合理可行最低 (ALARP) | 需實施風險控制措施 |
| 10+ | 🔴 不可接受 (Unacceptable) | 必須降低風險 |

---

`;
}

function extractExistingRisks(riskPath: string): string {
    if (!fs.existsSync(riskPath)) {
        console.warn(`  Warning: ${riskPath} not found, skipping existing risks merge.`);
        return '';
    }
    const content = fs.readFileSync(riskPath, 'utf-8');

    // Extract FMEA section
    const fmeaMatch = content.match(/## 2\. Failure Mode.*?(?=\n---|\n## [^2]|$)/s);
    if (!fmeaMatch) return '';

    let md = `## 2. 既有風險項目（來源：docs/compliance/RISK_MANAGEMENT.md）\n\n`;
    md += `> 以下為現有英文風險管理文件中的 FMEA 項目，保留原始風險編號。\n\n`;
    md += fmeaMatch[0].replace(/^## 2\. Failure Mode.*?\n/, '') + '\n\n';

    return md;
}

function generateRiskFromIssues(risks: ParsedRisk[]): string {
    if (risks.length === 0) {
        return `## 3. GitHub Issues 風險項目\n\n> 尚無標記 \`ISO14971:風險\` 的 Issues。\n\n`;
    }

    // Statistics
    const acceptable = risks.filter(r => r.riskLevel === 'acceptable').length;
    const alarp = risks.filter(r => r.riskLevel === 'alarp').length;
    const unacceptable = risks.filter(r => r.riskLevel === 'unacceptable').length;

    let md = `## 3. GitHub Issues 風險項目（共 ${risks.length} 項）\n\n`;

    md += `### 風險統計\n\n`;
    md += `| 風險等級 | 數量 |\n`;
    md += `|----------|------|\n`;
    md += `| 🟢 可接受 | ${acceptable} |\n`;
    md += `| 🟡 ALARP | ${alarp} |\n`;
    md += `| 🔴 不可接受 | ${unacceptable} |\n\n`;

    // Summary table
    md += `### 風險清單\n\n`;
    md += `| 編號 | Issue | 危害情境 | S | P | 分數 | 等級 |\n`;
    md += `|------|-------|----------|---|---|------|------|\n`;

    risks.forEach((risk, i) => {
        const id = `RISK-GH-${String(i + 1).padStart(3, '0')}`;
        const color = getRiskColor(risk.riskScore);
        md += `| ${id} | [#${risk.issueNumber}](${risk.url}) | ${risk.title} | ${risk.severity} | ${risk.probability} | ${risk.riskScore} | ${color} ${getRiskCategory(risk.riskScore)} |\n`;
    });

    md += '\n---\n\n';

    // Detail section
    md += `### 風險詳細分析\n\n`;

    for (let i = 0; i < risks.length; i++) {
        const risk = risks[i];
        const id = `RISK-GH-${String(i + 1).padStart(3, '0')}`;
        const color = getRiskColor(risk.riskScore);
        md += `#### ${id}: ${risk.title} ${color}\n\n`;
        md += `**Issue:** [#${risk.issueNumber}](${risk.url})  \n`;
        md += `**嚴重度：** ${risk.severityLabel}  \n`;
        md += `**發生機率：** ${risk.probabilityLabel}  \n`;
        md += `**風險分數：** ${risk.riskScore} — ${getRiskCategory(risk.riskScore)}  \n`;
        if (risk.relatedIssues) {
            md += `**關聯 Issues：** ${risk.relatedIssues}  \n`;
        }
        md += '\n';

        md += `**危害情境：**\n\n${risk.hazardScenario || '（未填寫）'}\n\n`;
        md += `**風險控制措施：**\n\n${risk.riskControl || '（未填寫）'}\n\n`;
        md += `**殘餘風險：**\n\n${risk.residualRisk || '（未填寫）'}\n\n`;
        md += `**驗證方法：**\n\n${risk.verificationMethod || '（未填寫）'}\n\n`;
        md += '---\n\n';
    }

    return md;
}

export async function generateRiskReport(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 風險管理報告...');

    const projectRoot = path.resolve(__dirname, '..', '..');
    const riskPath = path.join(projectRoot, 'docs', 'compliance', 'RISK_MANAGEMENT.md');

    const issues = await fetchIssuesByLabel('ISO14971:風險', options);
    const risks = issues.map(parseRisk);

    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-RISK-001',
        standard: 'ISO 14971:2019',
        title: '風險管理報告 (Risk Management Report)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const methodology = generateRiskMethodology();
    const existingRisks = extractExistingRisks(riskPath);
    const issueRisks = generateRiskFromIssues(risks);
    const approval = generateApprovalTable();

    const document = header + revision + methodology + existingRisks + issueRisks + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '風險管理報告.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    generateRiskReport({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating risk report:', err.message);
        process.exit(1);
    });
}
