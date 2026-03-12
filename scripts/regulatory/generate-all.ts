/**
 * 法規文件統一生成腳本
 * Runs all regulatory document generators in sequence.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/regulatory/generate-all.ts [--offline] [--refresh] [--dry-run]
 * Output: regulatory_docs/ directory with all regulatory documents
 */

import { generateSRS } from './generate-srs';
import { generateSDS } from './generate-sds';
import { generateRiskReport } from './generate-risk-report';
import { generateVerificationReport } from './generate-verification-report';
import { generateTraceability } from './generate-traceability';
import { generateChangeControl } from './generate-change-control';

interface GenerateOptions {
    offline: boolean;
    refresh: boolean;
    dryRun: boolean;
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const options: GenerateOptions = {
        offline: args.includes('--offline'),
        refresh: args.includes('--refresh'),
        dryRun: args.includes('--dry-run')
    };

    console.log('=== TFDA 法規文件自動化產出 ===\n');
    console.log(`模式: ${options.offline ? '離線' : '線上'}${options.refresh ? ' (強制刷新)' : ''}${options.dryRun ? ' (試執行)' : ''}`);
    console.log('');

    const generators = [
        { name: '軟體需求規格書 (SRS)', fn: generateSRS },
        { name: '軟體設計規格書 (SDS)', fn: generateSDS },
        { name: '風險管理報告', fn: generateRiskReport },
        { name: '軟體驗證報告', fn: generateVerificationReport },
        { name: '追溯矩陣', fn: generateTraceability },
        { name: '變更管制紀錄', fn: generateChangeControl }
    ];

    let succeeded = 0;
    let failed = 0;
    const errors: Array<{ name: string; error: string }> = [];

    for (const gen of generators) {
        try {
            await gen.fn(options);
            succeeded++;
        } catch (err: unknown) {
            failed++;
            const message = err instanceof Error ? err.message : String(err);
            errors.push({ name: gen.name, error: message });
            console.error(`  ERROR: ${gen.name} — ${message}\n`);
        }
    }

    console.log('\n=== 產出結果 ===');
    console.log(`成功: ${succeeded} / ${generators.length}`);
    if (failed > 0) {
        console.log(`失敗: ${failed}`);
        for (const { name, error } of errors) {
            console.log(`  - ${name}: ${error}`);
        }
    }

    if (options.dryRun) {
        console.log('\n(試執行模式 — 未寫入檔案)');
    } else if (!options.offline && failed === 0) {
        console.log('\n輸出目錄: regulatory_docs/');
    }

    if (failed > 0) {
        process.exit(1);
    }
}

main();
