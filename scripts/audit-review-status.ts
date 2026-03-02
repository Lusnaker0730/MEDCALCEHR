/**
 * Clinical Review Status Audit
 * Validates consistency between calculator-review-status.json and:
 * - Calculator registry (src/calculators/index.ts)
 * - Review document files (docs/compliance/reviews/{id}.md)
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/audit-review-status.ts
 * Exit code 1 on errors (for CI).
 */

import * as fs from 'fs';
import * as path from 'path';

interface ReviewEntry {
    status: 'approved' | 'conditional' | 'pending' | 'rejected';
    reviewDate: string | null;
    reviewer: string | null;
    reviewDocId: string | null;
    notes: string;
}

interface ReviewData {
    version: string;
    lastUpdated: string;
    calculators: Record<string, ReviewEntry>;
}

interface AuditIssue {
    severity: 'error' | 'warning';
    calculatorId: string;
    message: string;
}

function main(): void {
    const projectRoot = path.resolve(__dirname, '..');
    const reviewJsonPath = path.join(projectRoot, 'src', 'calculator-review-status.json');
    const reviewsDir = path.join(projectRoot, 'docs', 'compliance', 'reviews');
    const calcIndexPath = path.join(projectRoot, 'src', 'calculators', 'index.ts');
    const reportPath = path.join(projectRoot, 'docs', 'compliance', 'REVIEW_STATUS_AUDIT.md');

    // Load review status JSON
    if (!fs.existsSync(reviewJsonPath)) {
        console.error('ERROR: calculator-review-status.json not found');
        process.exit(1);
    }
    const reviewData: ReviewData = JSON.parse(fs.readFileSync(reviewJsonPath, 'utf-8'));

    // Extract calculator IDs from index.ts
    const indexContent = fs.readFileSync(calcIndexPath, 'utf-8');
    const idRegex = /id:\s*'([^']+)'/g;
    const registryIds: string[] = [];
    let match;
    while ((match = idRegex.exec(indexContent)) !== null) {
        registryIds.push(match[1]);
    }

    const issues: AuditIssue[] = [];
    const jsonIds = Object.keys(reviewData.calculators);

    // Check: every registry ID has a JSON entry
    for (const id of registryIds) {
        if (!reviewData.calculators[id]) {
            issues.push({
                severity: 'error',
                calculatorId: id,
                message: 'Calculator exists in registry but missing from review-status JSON',
            });
        }
    }

    // Check: every JSON entry corresponds to a registry ID
    for (const id of jsonIds) {
        if (!registryIds.includes(id)) {
            issues.push({
                severity: 'warning',
                calculatorId: id,
                message: 'Entry in review-status JSON but not found in calculator registry',
            });
        }
    }

    // Check: approved calculators must have a review document
    for (const [id, entry] of Object.entries(reviewData.calculators)) {
        if (entry.status === 'approved') {
            const docPath = path.join(reviewsDir, `${id}.md`);
            if (!fs.existsSync(docPath)) {
                issues.push({
                    severity: 'error',
                    calculatorId: id,
                    message: `Status is "approved" but review document not found: docs/compliance/reviews/${id}.md`,
                });
            }
            if (!entry.reviewDate) {
                issues.push({
                    severity: 'warning',
                    calculatorId: id,
                    message: 'Status is "approved" but reviewDate is null',
                });
            }
            if (!entry.reviewer) {
                issues.push({
                    severity: 'warning',
                    calculatorId: id,
                    message: 'Status is "approved" but reviewer is null',
                });
            }
        }
    }

    // Summary
    const statusCounts: Record<string, number> = { approved: 0, conditional: 0, pending: 0, rejected: 0 };
    for (const entry of Object.values(reviewData.calculators)) {
        statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    }

    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');

    // Generate report
    const lines: string[] = [
        '# Clinical Review Status Audit Report',
        '',
        `Generated: ${new Date().toISOString()}`,
        `Review JSON version: ${reviewData.version}`,
        `Last updated: ${reviewData.lastUpdated}`,
        '',
        '## Summary',
        '',
        `| Status | Count |`,
        `|--------|-------|`,
        `| Approved | ${statusCounts.approved} |`,
        `| Conditional | ${statusCounts.conditional} |`,
        `| Pending | ${statusCounts.pending} |`,
        `| Rejected | ${statusCounts.rejected} |`,
        `| **Total in JSON** | **${jsonIds.length}** |`,
        `| **Total in Registry** | **${registryIds.length}** |`,
        '',
        `## Audit Result: ${errors.length === 0 ? 'PASS' : 'FAIL'}`,
        '',
        `- Errors: ${errors.length}`,
        `- Warnings: ${warnings.length}`,
        '',
    ];

    if (issues.length > 0) {
        lines.push('## Issues', '');
        lines.push('| Severity | Calculator | Message |');
        lines.push('|----------|-----------|---------|');
        for (const issue of issues) {
            lines.push(`| ${issue.severity.toUpperCase()} | ${issue.calculatorId} | ${issue.message} |`);
        }
        lines.push('');
    }

    // Calculator status table
    lines.push('## Calculator Status Detail', '');
    lines.push('| Calculator ID | Status | Reviewer | Review Date | Has Doc |');
    lines.push('|--------------|--------|----------|-------------|---------|');
    for (const id of registryIds.sort()) {
        const entry = reviewData.calculators[id];
        if (entry) {
            const hasDoc = fs.existsSync(path.join(reviewsDir, `${id}.md`)) ? 'Yes' : 'No';
            lines.push(`| ${id} | ${entry.status} | ${entry.reviewer || '-'} | ${entry.reviewDate || '-'} | ${hasDoc} |`);
        } else {
            lines.push(`| ${id} | **MISSING** | - | - | - |`);
        }
    }

    const report = lines.join('\n');

    // Write report
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, report, 'utf-8');

    // Console output
    console.log(`\nClinical Review Status Audit`);
    console.log(`============================`);
    console.log(`Approved: ${statusCounts.approved} | Conditional: ${statusCounts.conditional} | Pending: ${statusCounts.pending} | Rejected: ${statusCounts.rejected}`);
    console.log(`Registry: ${registryIds.length} | JSON: ${jsonIds.length}`);
    console.log(`Errors: ${errors.length} | Warnings: ${warnings.length}`);
    console.log(`Report: ${reportPath}\n`);

    if (errors.length > 0) {
        console.error('ERRORS:');
        for (const e of errors) {
            console.error(`  [${e.calculatorId}] ${e.message}`);
        }
        process.exit(1);
    }

    if (warnings.length > 0) {
        console.warn('WARNINGS:');
        for (const w of warnings) {
            console.warn(`  [${w.calculatorId}] ${w.message}`);
        }
    }

    console.log('Audit PASSED.');
}

main();
