/**
 * 變更管制紀錄生成器
 * Generates change control records from merged PRs and git tags.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-change-control.ts
 * Output: regulatory_docs/變更管制紀錄.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fetchMergedPRs } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday } from './document-header';
import { MergedPR } from './types';

interface GitTag {
    name: string;
    date: string;
    message: string;
}

function getGitTags(projectRoot: string): GitTag[] {
    try {
        const output = execSync(
            'git tag -l --sort=-creatordate --format="%(refname:short)|%(creatordate:short)|%(subject)"',
            { cwd: projectRoot, encoding: 'utf-8' }
        );
        return output
            .trim()
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [name, date, message] = line.split('|');
                return { name: name || '', date: date || '', message: message || '' };
            });
    } catch {
        console.warn('  Warning: Failed to read git tags.');
        return [];
    }
}

function generateTagSection(tags: GitTag[]): string {
    let md = `## 1. 版本發佈紀錄 (Git Tags)\n\n`;

    if (tags.length === 0) {
        md += '> 尚無 Git tags。\n\n';
        return md;
    }

    md += `| 版本 | 日期 | 說明 |\n`;
    md += `|------|------|------|\n`;
    for (const tag of tags) {
        md += `| \`${tag.name}\` | ${tag.date} | ${tag.message || '—'} |\n`;
    }
    md += '\n';

    return md;
}

function generatePRSection(prs: MergedPR[]): string {
    let md = `## 2. 合併請求 (Merged Pull Requests)（共 ${prs.length} 筆）\n\n`;

    if (prs.length === 0) {
        md += '> 尚無已合併的 Pull Requests。\n\n';
        return md;
    }

    // Group by month
    const byMonth = new Map<string, MergedPR[]>();
    for (const pr of prs) {
        const month = pr.mergedAt.substring(0, 7); // YYYY-MM
        if (!byMonth.has(month)) byMonth.set(month, []);
        byMonth.get(month)!.push(pr);
    }

    const sortedMonths = Array.from(byMonth.keys()).sort().reverse();

    for (const month of sortedMonths) {
        const monthPRs = byMonth.get(month)!;
        md += `### ${month}（${monthPRs.length} 筆）\n\n`;
        md += `| PR | 標題 | 作者 | 合併日期 | 標籤 |\n`;
        md += `|----|------|------|----------|------|\n`;

        for (const pr of monthPRs) {
            const labels = pr.labels.length > 0 ? pr.labels.map(l => `\`${l}\``).join(' ') : '—';
            const date = pr.mergedAt.split('T')[0];
            md += `| [#${pr.number}](${pr.url}) | ${pr.title} | ${pr.author} | ${date} | ${labels} |\n`;
        }
        md += '\n';
    }

    return md;
}

function generateChangeImpactSummary(prs: MergedPR[]): string {
    let md = `## 3. 變更影響分析\n\n`;

    // Categorize by labels
    const regulatory = prs.filter(pr =>
        pr.labels.some(l => l.startsWith('IEC62304:') || l.startsWith('ISO14971:'))
    );
    const safety = prs.filter(pr =>
        pr.labels.some(l => l.startsWith('安全性等級'))
    );
    const changeControl = prs.filter(pr =>
        pr.labels.some(l => l === '變更管制')
    );

    md += `| 分類 | 數量 | 說明 |\n`;
    md += `|------|------|------|\n`;
    md += `| 法規相關變更 | ${regulatory.length} | 包含 IEC 62304 / ISO 14971 標籤 |\n`;
    md += `| 安全性分類變更 | ${safety.length} | 影響軟體安全性等級 |\n`;
    md += `| 變更管制項目 | ${changeControl.length} | 標記為變更管制 |\n`;
    md += `| 一般變更 | ${prs.length - regulatory.length} | 其他程式碼變更 |\n\n`;

    return md;
}

export async function generateChangeControl(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 變更管制紀錄...');

    const projectRoot = path.resolve(__dirname, '..', '..');

    const tags = getGitTags(projectRoot);
    const prs = await fetchMergedPRs(options);

    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-CHG-001',
        standard: 'ISO 13485:2016 §7.3.9',
        title: '變更管制紀錄 (Change Control Record)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const tagSection = generateTagSection(tags);
    const prSection = generatePRSection(prs);
    const impactSection = generateChangeImpactSummary(prs);
    const approval = generateApprovalTable();

    const document = header + revision + tagSection + prSection + impactSection + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '變更管制紀錄.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    generateChangeControl({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating change control:', err.message);
        process.exit(1);
    });
}
