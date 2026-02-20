/**
 * SOUP (Software of Unknown Provenance) List Generator
 * Reads package.json dependencies and generates a compliance document.
 * Also resolves Item 12 (SOUP version synchronization).
 *
 * Usage: npx ts-node scripts/generate-soup-list.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface PackageInfo {
    name: string;
    version: string;
    license: string;
    description: string;
    isDev: boolean;
    riskLevel: 'High' | 'Medium' | 'Low';
    riskJustification: string;
    usage: string;
}

// Risk classification map
const RISK_MAP: Record<string, { level: 'High' | 'Medium' | 'Low'; justification: string; usage: string }> = {
    // Production dependencies
    'fhirclient': {
        level: 'Medium',
        justification: 'Handles FHIR OAuth2 authentication and patient data retrieval. Incorrect behavior could lead to wrong patient data being displayed.',
        usage: 'SMART on FHIR client for EHR integration, OAuth2 launch flow, patient/observation data retrieval',
    },
    '@sentry/browser': {
        level: 'Low',
        justification: 'Error monitoring only. Does not affect calculation results or clinical decisions.',
        usage: 'Client-side error tracking and performance monitoring with PHI stripping',
    },
    'chart.js': {
        level: 'Low',
        justification: 'Visualization only. Does not affect calculation logic.',
        usage: 'Rendering growth charts and trend visualizations',
    },
    'fuse.js': {
        level: 'Low',
        justification: 'Search/filtering only. Does not affect clinical calculations.',
        usage: 'Fuzzy search for calculator list filtering on homepage',
    },
    'web-vitals': {
        level: 'Low',
        justification: 'Performance metrics collection only. No clinical impact.',
        usage: 'Core Web Vitals (LCP, FID, CLS) measurement for performance monitoring',
    },
};

// Default risk for dev dependencies
const DEV_DEFAULT = {
    level: 'Low' as const,
    justification: 'Development/build tool only. Not included in production bundle.',
};

// Dev dependency usage descriptions
const DEV_USAGE: Record<string, string> = {
    '@axe-core/playwright': 'Accessibility testing in E2E tests',
    '@cyclonedx/cyclonedx-npm': 'SBOM (Software Bill of Materials) generation',
    '@jest/globals': 'Jest test framework global type definitions',
    '@lhci/cli': 'Lighthouse CI performance auditing',
    '@playwright/test': 'End-to-end browser testing framework',
    '@testing-library/dom': 'DOM testing utilities for unit tests',
    '@types/jest': 'TypeScript type definitions for Jest',
    '@typescript-eslint/eslint-plugin': 'TypeScript-specific ESLint rules',
    '@typescript-eslint/parser': 'TypeScript parser for ESLint',
    'autoprefixer': 'PostCSS plugin for vendor prefix automation',
    'cssnano': 'CSS minification for production builds',
    'eslint': 'JavaScript/TypeScript static analysis and linting',
    'http-server': 'Local development HTTP server',
    'husky': 'Git hooks manager for pre-commit checks',
    'jest': 'JavaScript unit testing framework',
    'jest-axe': 'Accessibility assertions for Jest unit tests',
    'jest-environment-jsdom': 'JSDOM environment for Jest browser API simulation',
    'lint-staged': 'Run linters on staged git files only',
    'postcss': 'CSS transformation toolchain',
    'prettier': 'Code formatting tool',
    'rollup-plugin-visualizer': 'Bundle size analysis and visualization',
    'ts-jest': 'TypeScript preprocessor for Jest',
    'ts-node': 'TypeScript execution environment for Node.js scripts',
    'typescript': 'TypeScript compiler and language service',
    'vite': 'Build tool and development server',
};

function readPackageInfo(name: string, isDev: boolean, projectRoot: string): PackageInfo | null {
    const pkgPath = path.join(projectRoot, 'node_modules', name, 'package.json');

    try {
        const raw = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(raw);

        const riskInfo = RISK_MAP[name] || {
            level: DEV_DEFAULT.level,
            justification: isDev ? DEV_DEFAULT.justification : 'Production dependency. Risk assessment pending.',
            usage: isDev ? (DEV_USAGE[name] || 'Development tooling') : 'Production runtime dependency',
        };

        return {
            name,
            version: pkg.version || 'unknown',
            license: pkg.license || 'unknown',
            description: pkg.description || '',
            isDev,
            riskLevel: riskInfo.level,
            riskJustification: riskInfo.justification,
            usage: RISK_MAP[name]?.usage || DEV_USAGE[name] || riskInfo.usage,
        };
    } catch {
        return {
            name,
            version: 'not installed',
            license: 'unknown',
            description: '',
            isDev,
            riskLevel: 'Low',
            riskJustification: isDev ? DEV_DEFAULT.justification : 'Unable to read package info',
            usage: isDev ? (DEV_USAGE[name] || 'Development tooling') : 'Production dependency',
        };
    }
}

function generateMarkdown(packages: PackageInfo[]): string {
    const now = new Date().toISOString().split('T')[0];
    const prodPkgs = packages.filter(p => !p.isDev);
    const devPkgs = packages.filter(p => p.isDev);

    let md = `# SOUP List (Software of Unknown Provenance)

**Product:** MEDCALCEHR
**Version:** 1.0.0
**Generated:** ${now}
**Standard:** IEC 62304 Section 8 — Software of Unknown Provenance

> This document is auto-generated by \`scripts/generate-soup-list.ts\`.
> Run \`npm run generate:soup\` to regenerate.

---

## 1. Overview

MEDCALCEHR uses ${packages.length} third-party software packages (${prodPkgs.length} production, ${devPkgs.length} development).
All packages are managed via npm and locked to specific versions via \`package-lock.json\`.

**Risk Classification:**
- **High**: Directly affects clinical calculation results or patient safety
- **Medium**: Handles patient data or authentication; incorrect behavior could indirectly affect clinical workflow
- **Low**: Development tools, UI utilities, or monitoring; no direct clinical impact

---

## 2. Production Dependencies (Runtime)

These packages are included in the production bundle and execute in the user's browser.

| # | Package | Version | License | Risk | Usage |
|---|---------|---------|---------|------|-------|
`;

    prodPkgs.forEach((pkg, i) => {
        md += `| ${i + 1} | \`${pkg.name}\` | ${pkg.version} | ${pkg.license} | **${pkg.riskLevel}** | ${pkg.usage} |\n`;
    });

    md += `
### Production SOUP Risk Details

`;
    prodPkgs.forEach(pkg => {
        md += `#### \`${pkg.name}\` v${pkg.version} — Risk: ${pkg.riskLevel}
- **License:** ${pkg.license}
- **Usage:** ${pkg.usage}
- **Risk Justification:** ${pkg.riskJustification}
- **Mitigation:** ${pkg.riskLevel === 'Medium' ? 'Covered by integration tests, FHIR data validation pipeline, and golden dataset clinical validation.' : 'No additional mitigation required.'}

`;
    });

    md += `---

## 3. Development Dependencies (Build/Test Only)

These packages are used during development and CI/CD only. They are **not included** in the production bundle.

| # | Package | Version | License | Usage |
|---|---------|---------|---------|-------|
`;

    devPkgs.forEach((pkg, i) => {
        md += `| ${i + 1} | \`${pkg.name}\` | ${pkg.version} | ${pkg.license} | ${pkg.usage} |\n`;
    });

    md += `
---

## 4. SOUP Management Procedures

1. **Version Pinning**: All versions are locked via \`package-lock.json\` and committed to version control.
2. **Automated Updates**: \`npm audit\` runs in CI to detect known vulnerabilities.
3. **SBOM Generation**: CycloneDX SBOM is generated on each main branch push (see CI pipeline).
4. **Change Review**: Any dependency update requires PR review and passing CI (unit tests, E2E tests, golden dataset validation).
5. **Regeneration**: This document is regenerated via \`npm run generate:soup\` after any dependency change.

## 5. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Software Developer | | | |
| Quality Manager | | | |
| Clinical Reviewer | | | |
`;

    return md;
}

// Main
function main(): void {
    const projectRoot = path.resolve(__dirname, '..');
    const pkgJsonPath = path.join(projectRoot, 'package.json');
    const raw = fs.readFileSync(pkgJsonPath, 'utf-8');
    const pkgJson = JSON.parse(raw);

    const packages: PackageInfo[] = [];

    // Production dependencies
    for (const name of Object.keys(pkgJson.dependencies || {})) {
        const info = readPackageInfo(name, false, projectRoot);
        if (info) packages.push(info);
    }

    // Dev dependencies
    for (const name of Object.keys(pkgJson.devDependencies || {})) {
        const info = readPackageInfo(name, true, projectRoot);
        if (info) packages.push(info);
    }

    const markdown = generateMarkdown(packages);
    const outputPath = path.join(projectRoot, 'docs', 'compliance', 'SOUP_LIST.md');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdown, 'utf-8');

    console.log(`SOUP list generated: ${outputPath}`);
    console.log(`  Production: ${packages.filter(p => !p.isDev).length} packages`);
    console.log(`  Development: ${packages.filter(p => p.isDev).length} packages`);
    console.log(`  Total: ${packages.length} packages`);
}

main();
