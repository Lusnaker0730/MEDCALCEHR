/**
 * Jest 中文測試報告產出器
 * Custom Jest reporter that generates a Chinese-language test report
 * for TFDA regulatory compliance.
 *
 * Activation: REGULATORY_REPORT=1 jest
 * Output: regulatory_docs/測試報告_detailed.html
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
    testFilePath: string;
    testResults: Array<{
        ancestorTitles: string[];
        title: string;
        status: 'passed' | 'failed' | 'pending' | 'skipped';
        duration: number | null;
        failureMessages: string[];
    }>;
    numPassingTests: number;
    numFailingTests: number;
    numPendingTests: number;
}

interface AggregatedResult {
    testResults: TestResult[];
    numTotalTests: number;
    numPassedTests: number;
    numFailedTests: number;
    numPendingTests: number;
    numTotalTestSuites: number;
    numPassedTestSuites: number;
    numFailedTestSuites: number;
    startTime: number;
    success: boolean;
}

class ChineseReporter {
    private outputDir: string;

    constructor() {
        this.outputDir = path.resolve(process.cwd(), 'regulatory_docs');
    }

    onRunComplete(_contexts: Set<unknown>, results: AggregatedResult): void {
        if (!process.env.REGULATORY_REPORT) return;

        fs.mkdirSync(this.outputDir, { recursive: true });
        const outputPath = path.join(this.outputDir, '測試報告_detailed.html');

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const duration = ((Date.now() - results.startTime) / 1000).toFixed(1);

        const passRate = results.numTotalTests > 0
            ? ((results.numPassedTests / results.numTotalTests) * 100).toFixed(1)
            : '0.0';

        // Build test suite details
        let suiteDetails = '';
        for (const suite of results.testResults) {
            const relativePath = path.relative(process.cwd(), suite.testFilePath).replace(/\\/g, '/');
            const statusClass = suite.numFailingTests > 0 ? 'fail' : 'pass';

            suiteDetails += `<div class="suite ${statusClass}">`;
            suiteDetails += `<h3>${escapeHtml(relativePath)}</h3>`;
            suiteDetails += `<div class="suite-summary">通過: ${suite.numPassingTests} | 失敗: ${suite.numFailingTests} | 待執行: ${suite.numPendingTests}</div>`;
            suiteDetails += '<table><thead><tr><th>測試案例</th><th>狀態</th><th>耗時</th></tr></thead><tbody>';

            for (const test of suite.testResults) {
                const fullTitle = [...test.ancestorTitles, test.title].join(' › ');
                const statusLabel = test.status === 'passed' ? '✅ 通過' :
                                   test.status === 'failed' ? '❌ 失敗' :
                                   test.status === 'pending' ? '⏳ 待執行' : '⏭ 略過';
                const durationStr = test.duration != null ? `${test.duration}ms` : '—';

                suiteDetails += `<tr class="${test.status}">`;
                suiteDetails += `<td>${escapeHtml(fullTitle)}</td>`;
                suiteDetails += `<td>${statusLabel}</td>`;
                suiteDetails += `<td>${durationStr}</td>`;
                suiteDetails += '</tr>';

                if (test.failureMessages.length > 0) {
                    suiteDetails += `<tr class="failure-detail"><td colspan="3"><pre>${escapeHtml(test.failureMessages.join('\n'))}</pre></td></tr>`;
                }
            }

            suiteDetails += '</tbody></table></div>';
        }

        const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>軟體測試報告 — MEDCALCEHR</title>
<style>
  body { font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
  .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { border-bottom: 3px solid #1a56db; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #1a56db; margin: 0 0 10px; }
  .meta-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  .meta-table td { padding: 8px 12px; border: 1px solid #ddd; }
  .meta-table td:first-child { background: #f0f4ff; font-weight: bold; width: 150px; }
  .summary { display: flex; gap: 20px; margin: 20px 0; }
  .summary-card { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
  .summary-card.total { background: #e8f0fe; color: #1a56db; }
  .summary-card.pass { background: #e6f4ea; color: #137333; }
  .summary-card.fail { background: #fce8e6; color: #c5221f; }
  .summary-card.pending { background: #fef7e0; color: #ea8600; }
  .summary-card .number { font-size: 2em; font-weight: bold; }
  .summary-card .label { font-size: 0.9em; margin-top: 5px; }
  .suite { margin: 20px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
  .suite.pass { border-left: 4px solid #137333; }
  .suite.fail { border-left: 4px solid #c5221f; }
  .suite h3 { margin: 0; padding: 12px 16px; background: #f8f9fa; font-size: 0.95em; }
  .suite-summary { padding: 8px 16px; font-size: 0.85em; color: #666; border-bottom: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f0f4ff; padding: 8px 12px; text-align: left; font-size: 0.85em; }
  td { padding: 8px 12px; border-top: 1px solid #eee; font-size: 0.85em; }
  tr.passed td:first-child { border-left: 3px solid #137333; }
  tr.failed td:first-child { border-left: 3px solid #c5221f; }
  tr.pending td:first-child { border-left: 3px solid #ea8600; }
  tr.failure-detail pre { background: #fce8e6; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.8em; white-space: pre-wrap; }
  .approval { margin-top: 40px; }
  .approval table { border-collapse: collapse; }
  .approval td, .approval th { border: 1px solid #ddd; padding: 10px 15px; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 0.8em; color: #999; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>軟體測試報告</h1>
    <table class="meta-table">
      <tr><td>產品名稱</td><td>MEDCALCEHR</td></tr>
      <tr><td>文件編號</td><td>REG-TEST-001</td></tr>
      <tr><td>版本</td><td>1.0.0</td></tr>
      <tr><td>測試日期</td><td>${dateStr} ${timeStr}</td></tr>
      <tr><td>測試環境</td><td>Jest ${require('jest/package.json').version} + ts-jest (jsdom)</td></tr>
      <tr><td>適用標準</td><td>IEC 62304:2006+A1:2015 §5.7</td></tr>
    </table>
  </div>

  <h2>測試摘要</h2>
  <div class="summary">
    <div class="summary-card total">
      <div class="number">${results.numTotalTests}</div>
      <div class="label">總測試數</div>
    </div>
    <div class="summary-card pass">
      <div class="number">${results.numPassedTests}</div>
      <div class="label">通過</div>
    </div>
    <div class="summary-card fail">
      <div class="number">${results.numFailedTests}</div>
      <div class="label">失敗</div>
    </div>
    <div class="summary-card pending">
      <div class="number">${results.numPendingTests}</div>
      <div class="label">待執行</div>
    </div>
  </div>

  <table class="meta-table">
    <tr><td>測試套件</td><td>${results.numPassedTestSuites} / ${results.numTotalTestSuites} 通過</td></tr>
    <tr><td>通過率</td><td>${passRate}%</td></tr>
    <tr><td>執行時間</td><td>${duration} 秒</td></tr>
    <tr><td>整體結果</td><td>${results.success ? '✅ 通過' : '❌ 失敗'}</td></tr>
  </table>

  <h2>測試套件詳細結果</h2>
  ${suiteDetails}

  <div class="approval">
    <h2>簽核表</h2>
    <table>
      <thead><tr><th>角色</th><th>姓名</th><th>日期</th><th>簽名</th></tr></thead>
      <tbody>
        <tr><td>測試執行者</td><td></td><td></td><td></td></tr>
        <tr><td>品質管理代表</td><td></td><td></td><td></td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    本報告由 jest-chinese-reporter 自動產出。執行 <code>REGULATORY_REPORT=1 npm test</code> 重新生成。
  </div>
</div>
</body>
</html>`;

        fs.writeFileSync(outputPath, html, 'utf-8');
        console.log(`\n中文測試報告已產出: ${outputPath}`);
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

module.exports = ChineseReporter;
