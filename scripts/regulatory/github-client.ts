/**
 * GitHub Client for Regulatory Document Generation
 * Fetches Issues by label and merged PRs via Octokit, with caching support.
 *
 * Usage: import { fetchIssuesByLabel, fetchMergedPRs, parseIssueBody } from './github-client';
 */

import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { RegulatoryIssue, MergedPR } from './types';

// Re-export parsers from issue-parser (no Octokit dependency, safe for Jest)
export { parseIssueBody, parseRequirement, parseDesign, parseRisk, parseVerification } from './issue-parser';

const CACHE_DIR = path.resolve(__dirname, '..', '..', '.cache', 'regulatory');

function getOctokit(): Octokit {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is required for online mode.');
    }
    return new Octokit({ auth: token });
}

function getRepoInfo(): { owner: string; repo: string } {
    const pkgPath = path.resolve(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const repoUrl: string = pkg.repository?.url || '';
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
    if (!match) {
        throw new Error('Cannot parse repository owner/name from package.json');
    }
    return { owner: match[1], repo: match[2] };
}

function ensureCacheDir(): void {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachePath(key: string): string {
    return path.join(CACHE_DIR, `${key}.json`);
}

function readCache<T>(key: string): T | null {
    const cachePath = getCachePath(key);
    if (fs.existsSync(cachePath)) {
        try {
            return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        } catch {
            return null;
        }
    }
    return null;
}

function writeCache<T>(key: string, data: T): void {
    ensureCacheDir();
    fs.writeFileSync(getCachePath(key), JSON.stringify(data, null, 2), 'utf-8');
}

export async function fetchIssuesByLabel(
    label: string,
    options: { refresh?: boolean; offline?: boolean } = {}
): Promise<RegulatoryIssue[]> {
    const cacheKey = `issues-${label.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (options.offline || (!options.refresh && readCache(cacheKey))) {
        const cached = readCache<RegulatoryIssue[]>(cacheKey);
        if (cached) {
            console.log(`  Cache hit: ${label} (${cached.length} issues)`);
            return cached;
        }
        if (options.offline) {
            console.warn(`  Warning: No cache for label "${label}" in offline mode.`);
            return [];
        }
    }

    const octokit = getOctokit();
    const { owner, repo } = getRepoInfo();
    const issues: RegulatoryIssue[] = [];

    let page = 1;
    while (true) {
        const response = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            labels: label,
            state: 'all',
            per_page: 100,
            page
        });

        if (response.data.length === 0) break;

        for (const issue of response.data) {
            if (issue.pull_request) continue; // Skip PRs
            issues.push({
                number: issue.number,
                title: issue.title.replace(/^\[.*?\]\s*/, ''), // Strip prefix
                body: issue.body || '',
                labels: issue.labels.map((l: any) => (typeof l === 'string' ? l : l.name || '')),
                state: issue.state,
                createdAt: issue.created_at,
                updatedAt: issue.updated_at,
                closedAt: issue.closed_at,
                author: issue.user?.login || 'unknown',
                url: issue.html_url
            });
        }

        if (response.data.length < 100) break;
        page++;
    }

    writeCache(cacheKey, issues);
    console.log(`  Fetched: ${label} (${issues.length} issues)`);
    return issues;
}

export async function fetchMergedPRs(
    options: { refresh?: boolean; offline?: boolean } = {}
): Promise<MergedPR[]> {
    const cacheKey = 'merged-prs';

    if (options.offline || (!options.refresh && readCache(cacheKey))) {
        const cached = readCache<MergedPR[]>(cacheKey);
        if (cached) {
            console.log(`  Cache hit: merged PRs (${cached.length})`);
            return cached;
        }
        if (options.offline) {
            console.warn('  Warning: No cache for merged PRs in offline mode.');
            return [];
        }
    }

    const octokit = getOctokit();
    const { owner, repo } = getRepoInfo();
    const prs: MergedPR[] = [];

    let page = 1;
    while (true) {
        const response = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'closed',
            sort: 'updated',
            direction: 'desc',
            per_page: 100,
            page
        });

        if (response.data.length === 0) break;

        for (const pr of response.data) {
            if (!pr.merged_at) continue;
            prs.push({
                number: pr.number,
                title: pr.title,
                body: pr.body || '',
                mergedAt: pr.merged_at,
                author: pr.user?.login || 'unknown',
                labels: pr.labels.map((l: any) => l.name || ''),
                url: pr.html_url,
                baseRef: pr.base.ref,
                headRef: pr.head.ref
            });
        }

        if (response.data.length < 100) break;
        page++;
    }

    writeCache(cacheKey, prs);
    console.log(`  Fetched: merged PRs (${prs.length})`);
    return prs;
}

