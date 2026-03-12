/**
 * GitHub Labels Setup Script
 * Creates regulatory compliance labels for IEC 62304 / ISO 14971 workflow.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/setup-github-labels.ts
 * Requires: GITHUB_TOKEN environment variable
 */

import { Octokit } from '@octokit/rest';

interface LabelConfig {
    name: string;
    color: string;
    description: string;
}

const LABELS: LabelConfig[] = [
    {
        name: 'IEC62304:需求',
        color: '0075ca',
        description: '軟體需求 (Software Requirement) — IEC 62304 §5.2'
    },
    {
        name: 'IEC62304:設計',
        color: '5319e7',
        description: '軟體設計 (Software Design) — IEC 62304 §5.3'
    },
    {
        name: 'IEC62304:驗證',
        color: '0e8a16',
        description: '軟體驗證 (Software Verification) — IEC 62304 §5.7'
    },
    {
        name: 'ISO14971:風險',
        color: 'd93f0b',
        description: '風險分析 (Risk Analysis) — ISO 14971'
    },
    {
        name: '變更管制',
        color: 'fbca04',
        description: '變更管制 (Change Control) — ISO 13485 §7.3.9'
    },
    {
        name: '安全性等級-A',
        color: 'c5def5',
        description: '軟體安全性分類 A — 無傷害可能 (No injury possible)'
    },
    {
        name: '安全性等級-B',
        color: 'f9d0c4',
        description: '軟體安全性分類 B — 非嚴重傷害 (Non-serious injury)'
    },
    {
        name: '安全性等級-C',
        color: 'e11d48',
        description: '軟體安全性分類 C — 死亡或嚴重傷害 (Death or serious injury)'
    }
];

async function main(): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('Error: GITHUB_TOKEN environment variable is required.');
        console.error('Usage: GITHUB_TOKEN=ghp_xxx npx ts-node --project scripts/tsconfig.json scripts/setup-github-labels.ts');
        process.exit(1);
    }

    const octokit = new Octokit({ auth: token });

    // Parse repo from package.json
    const pkg = require('../package.json');
    const repoUrl: string = pkg.repository?.url || '';
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) {
        console.error('Error: Cannot parse repository owner/name from package.json');
        process.exit(1);
    }
    const [, owner, repo] = match;
    console.log(`Setting up labels for ${owner}/${repo}...\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const label of LABELS) {
        try {
            // Try to get existing label
            try {
                const existing = await octokit.rest.issues.getLabel({
                    owner,
                    repo,
                    name: label.name
                });
                // Label exists — update if different
                if (existing.data.color !== label.color || existing.data.description !== label.description) {
                    await octokit.rest.issues.updateLabel({
                        owner,
                        repo,
                        name: label.name,
                        color: label.color,
                        description: label.description
                    });
                    console.log(`  Updated: ${label.name}`);
                    updated++;
                } else {
                    console.log(`  Skipped (unchanged): ${label.name}`);
                    skipped++;
                }
            } catch {
                // Label doesn't exist — create it
                await octokit.rest.issues.createLabel({
                    owner,
                    repo,
                    name: label.name,
                    color: label.color,
                    description: label.description
                });
                console.log(`  Created: ${label.name}`);
                created++;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`  Error on ${label.name}: ${message}`);
        }
    }

    console.log(`\nDone: ${created} created, ${updated} updated, ${skipped} unchanged.`);
}

main();
