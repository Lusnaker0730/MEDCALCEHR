/**
 * 軟體需求規格書 (SRS) 生成器
 * Merges system-level requirements from docs/compliance/SRS.md
 * with GitHub Issues labeled IEC62304:需求.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-srs.ts
 * Output: regulatory_docs/軟體需求規格書_SRS.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchIssuesByLabel, parseRequirement } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday } from './document-header';
import { ParsedRequirement } from './types';

function extractSystemRequirements(srsPath: string): string {
    if (!fs.existsSync(srsPath)) {
        console.warn(`  Warning: ${srsPath} not found, skipping system requirements merge.`);
        return '';
    }
    const content = fs.readFileSync(srsPath, 'utf-8');

    // Extract sections 1.1 through 1.4 (functional, performance, security, interface)
    const sections: string[] = [];
    const sectionRegex = /### (1\.\d .+?)(?=\n### |\n---|\n## |$)/gs;
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
        sections.push(match[0].trim());
    }

    if (sections.length === 0) return '';

    let md = `## 1. 系統級需求（來源：docs/compliance/SRS.md）\n\n`;
    md += `> 以下需求自現有英文 SRS 文件彙整，保留原始需求編號。\n\n`;

    for (const section of sections) {
        md += section + '\n\n';
    }

    return md;
}

function generateRequirementsFromIssues(requirements: ParsedRequirement[]): string {
    if (requirements.length === 0) {
        return `## 2. GitHub Issues 需求\n\n> 尚無標記 \`IEC62304:需求\` 的 Issues。\n\n`;
    }

    let md = `## 2. GitHub Issues 需求（共 ${requirements.length} 項）\n\n`;

    // Summary table
    md += `| 編號 | Issue | 需求標題 | 風險等級 | 優先級 | 狀態 |\n`;
    md += `|------|-------|----------|----------|--------|------|\n`;

    requirements.forEach((req, i) => {
        const id = `REQ-GH-${String(i + 1).padStart(3, '0')}`;
        md += `| ${id} | [#${req.issueNumber}](${req.url}) | ${req.title} | ${req.riskLevel} | ${req.priority} | — |\n`;
    });

    md += '\n---\n\n';

    // Detailed entries
    for (let i = 0; i < requirements.length; i++) {
        const req = requirements[i];
        const id = `REQ-GH-${String(i + 1).padStart(3, '0')}`;
        md += `### ${id}: ${req.title}\n\n`;
        md += `**Issue:** [#${req.issueNumber}](${req.url})  \n`;
        md += `**建立日期：** ${req.createdAt.split('T')[0]}  \n`;
        md += `**風險等級：** ${req.riskLevel}  \n`;
        md += `**優先級：** ${req.priority}  \n`;
        if (req.relatedRequirements) {
            md += `**關聯需求：** ${req.relatedRequirements}  \n`;
        }
        md += '\n';

        md += `#### 需求描述\n\n${req.description || '（未填寫）'}\n\n`;
        md += `#### 臨床情境\n\n${req.clinicalScenario || '（未填寫）'}\n\n`;
        md += `#### 驗收條件\n\n${req.acceptanceCriteria || '（未填寫）'}\n\n`;
        md += '---\n\n';
    }

    return md;
}

export async function generateSRS(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 軟體需求規格書 (SRS)...');

    const projectRoot = path.resolve(__dirname, '..', '..');
    const srsPath = path.join(projectRoot, 'docs', 'compliance', 'SRS.md');

    // Fetch Issues
    const issues = await fetchIssuesByLabel('IEC62304:需求', options);
    const requirements = issues.map(parseRequirement);

    // Build document
    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-SRS-001',
        standard: 'IEC 62304:2006+A1:2015',
        title: '軟體需求規格書 (Software Requirements Specification)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const systemReqs = extractSystemRequirements(srsPath);
    const issueReqs = generateRequirementsFromIssues(requirements);
    const approval = generateApprovalTable();

    const document = header + revision + systemReqs + issueReqs + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '軟體需求規格書_SRS.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

// Direct execution
if (require.main === module) {
    const args = process.argv.slice(2);
    generateSRS({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating SRS:', err.message);
        process.exit(1);
    });
}
