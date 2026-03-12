/**
 * 軟體驗證報告生成器
 * Combines GitHub Issues labeled IEC62304:驗證 with Jest coverage data
 * and golden dataset results.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-verification-report.ts
 * Output: regulatory_docs/軟體驗證報告.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchIssuesByLabel, parseVerification } from './github-client';
import { generateDocumentHeader, generateApprovalTable, generateRevisionHistory, getToday } from './document-header';
import { ParsedVerification } from './types';

interface CoverageSummary {
    total: {
        statements: { total: number; covered: number; pct: number };
        branches: { total: number; covered: number; pct: number };
        functions: { total: number; covered: number; pct: number };
        lines: { total: number; covered: number; pct: number };
    };
}

function loadCoverageSummary(projectRoot: string): CoverageSummary | null {
    const coveragePath = path.join(projectRoot, 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
        console.warn('  Warning: coverage-summary.json not found. Run `npm run test:coverage` first.');
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    } catch {
        console.warn('  Warning: Failed to parse coverage-summary.json.');
        return null;
    }
}

function generateCoverageSection(coverage: CoverageSummary | null): string {
    let md = `## 1. 測試覆蓋率報告\n\n`;

    if (!coverage) {
        md += `> 無法取得覆蓋率資料。請先執行 \`npm run test:coverage\` 產生 coverage-summary.json。\n\n`;
        return md;
    }

    const t = coverage.total;
    md += `| 指標 | 總數 | 覆蓋數 | 覆蓋率 | 門檻 | 狀態 |\n`;
    md += `|------|------|--------|--------|------|------|\n`;
    md += `| 陳述式 (Statements) | ${t.statements.total} | ${t.statements.covered} | ${t.statements.pct}% | 50% | ${t.statements.pct >= 50 ? '✅ 通過' : '❌ 未達'} |\n`;
    md += `| 分支 (Branches) | ${t.branches.total} | ${t.branches.covered} | ${t.branches.pct}% | 47% | ${t.branches.pct >= 47 ? '✅ 通過' : '❌ 未達'} |\n`;
    md += `| 函式 (Functions) | ${t.functions.total} | ${t.functions.covered} | ${t.functions.pct}% | 50% | ${t.functions.pct >= 50 ? '✅ 通過' : '❌ 未達'} |\n`;
    md += `| 行數 (Lines) | ${t.lines.total} | ${t.lines.covered} | ${t.lines.pct}% | 50% | ${t.lines.pct >= 50 ? '✅ 通過' : '❌ 未達'} |\n`;
    md += '\n';

    return md;
}

function generateGoldenDatasetSection(projectRoot: string): string {
    const goldenDir = path.join(projectRoot, 'src', '__tests__', 'golden-datasets');
    let md = `## 2. 臨床驗證資料集 (Golden Dataset)\n\n`;

    if (!fs.existsSync(goldenDir)) {
        md += '> 未找到 golden-datasets 目錄。\n\n';
        return md;
    }

    const files = fs.readdirSync(goldenDir).filter(f => f.endsWith('.json'));
    let totalCases = 0;
    const datasets: Array<{ id: string; name: string; type: string; cases: number }> = [];

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(goldenDir, file), 'utf-8');
            const data = JSON.parse(raw);
            const cases = data.cases?.length || 0;
            totalCases += cases;
            datasets.push({
                id: data.calculatorId || file.replace('.json', ''),
                name: data.calculatorName || data.calculatorId || '',
                type: data.calculatorType || 'unknown',
                cases
            });
        } catch {
            // Skip malformed
        }
    }

    md += `**資料集數量：** ${datasets.length}  \n`;
    md += `**總測試案例：** ${totalCases}  \n\n`;

    md += `| # | 計算器 ID | 名稱 | 類型 | 案例數 |\n`;
    md += `|---|-----------|------|------|--------|\n`;
    datasets.forEach((ds, i) => {
        md += `| ${i + 1} | \`${ds.id}\` | ${ds.name} | ${ds.type} | ${ds.cases} |\n`;
    });
    md += '\n';

    return md;
}

function generateVerificationEntries(verifications: ParsedVerification[]): string {
    if (verifications.length === 0) {
        return `## 3. GitHub Issues 驗證記錄\n\n> 尚無標記 \`IEC62304:驗證\` 的 Issues。\n\n`;
    }

    const pass = verifications.filter(v => v.result.includes('通過') || v.result.includes('PASS')).length;
    const fail = verifications.filter(v => v.result.includes('失敗') || v.result.includes('FAIL')).length;
    const pending = verifications.length - pass - fail;

    let md = `## 3. GitHub Issues 驗證記錄（共 ${verifications.length} 項）\n\n`;

    md += `### 驗證統計\n\n`;
    md += `| 結果 | 數量 |\n`;
    md += `|------|------|\n`;
    md += `| ✅ 通過 | ${pass} |\n`;
    md += `| ❌ 失敗 | ${fail} |\n`;
    md += `| ⏳ 待執行 | ${pending} |\n\n`;

    // Summary table
    md += `| 編號 | Issue | 驗證標題 | 關聯需求 | 結果 |\n`;
    md += `|------|-------|----------|----------|------|\n`;
    verifications.forEach((v, i) => {
        const id = `VER-GH-${String(i + 1).padStart(3, '0')}`;
        const resultIcon = v.result.includes('通過') || v.result.includes('PASS') ? '✅' :
                          v.result.includes('失敗') || v.result.includes('FAIL') ? '❌' : '⏳';
        md += `| ${id} | [#${v.issueNumber}](${v.url}) | ${v.title} | ${v.relatedRequirements || '—'} | ${resultIcon} ${v.result} |\n`;
    });
    md += '\n---\n\n';

    // Detailed entries
    for (let i = 0; i < verifications.length; i++) {
        const v = verifications[i];
        const id = `VER-GH-${String(i + 1).padStart(3, '0')}`;
        md += `### ${id}: ${v.title}\n\n`;
        md += `**Issue:** [#${v.issueNumber}](${v.url})  \n`;
        md += `**關聯需求：** ${v.relatedRequirements || '—'}  \n`;
        md += `**結果：** ${v.result}  \n\n`;

        md += `#### 測試目的\n\n${v.testPurpose || '（未填寫）'}\n\n`;
        md += `#### 測試步驟\n\n${v.testSteps || '（未填寫）'}\n\n`;
        md += `#### 預期結果\n\n${v.expectedResult || '（未填寫）'}\n\n`;

        if (v.actualResult) {
            md += `#### 實際結果\n\n${v.actualResult}\n\n`;
        }
        if (v.evidence) {
            md += `#### 測試證據\n\n${v.evidence}\n\n`;
        }

        md += '---\n\n';
    }

    return md;
}

export async function generateVerificationReport(options: { offline?: boolean; refresh?: boolean; dryRun?: boolean } = {}): Promise<string> {
    console.log('Generating 軟體驗證報告...');

    const projectRoot = path.resolve(__dirname, '..', '..');

    const issues = await fetchIssuesByLabel('IEC62304:驗證', options);
    const verifications = issues.map(parseVerification);

    const coverage = loadCoverageSummary(projectRoot);

    const header = generateDocumentHeader({
        product: 'MEDCALCEHR',
        version: '1.0.0',
        documentId: 'REG-VER-001',
        standard: 'IEC 62304:2006+A1:2015',
        title: '軟體驗證報告 (Software Verification Report)',
        generatedDate: getToday()
    });

    const revision = generateRevisionHistory();
    const coverageSection = generateCoverageSection(coverage);
    const goldenSection = generateGoldenDatasetSection(projectRoot);
    const verificationEntries = generateVerificationEntries(verifications);
    const approval = generateApprovalTable();

    const document = header + revision + coverageSection + goldenSection + verificationEntries + approval;

    if (!options.dryRun) {
        const outputDir = path.join(projectRoot, 'regulatory_docs');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, '軟體驗證報告.md');
        fs.writeFileSync(outputPath, document, 'utf-8');
        console.log(`  Output: ${outputPath}`);
    }

    return document;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    generateVerificationReport({
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    }).catch(err => {
        console.error('Error generating verification report:', err.message);
        process.exit(1);
    });
}
