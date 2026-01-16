// Test Calculators Page Script
import { calculatorModules } from '/js/calculators/index.js';

// Initialize global state
window.calculatorModules = calculatorModules;
window.testResults = [];
window.isTestingRunning = false;
window.currentFilter = 'all';

console.log(`Loaded ${calculatorModules.length} calculator modules`);

// Sanitize text to prevent XSS when using innerHTML
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function startTests() {
    if (window.isTestingRunning) return;

    window.isTestingRunning = true;
    window.testResults = [];
    window.currentFilter = 'all';

    const startBtn = document.getElementById('startTestBtn');
    const stopBtn = document.getElementById('stopTestBtn');
    const progressContainer = document.getElementById('progressContainer');
    const filterButtons = document.getElementById('filterButtons');

    startBtn.disabled = true;
    stopBtn.disabled = false;
    progressContainer.style.display = 'block';
    filterButtons.style.display = 'flex';

    const calculators = window.calculatorModules;
    const total = calculators.length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = total;
    document.getElementById('successCount').textContent = '0';
    document.getElementById('errorCount').textContent = '0';

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    for (let i = 0; i < calculators.length; i++) {
        if (!window.isTestingRunning) break;

        const calc = calculators[i];
        await testCalculator(calc, i + 1, total);

        // Update progress
        const progress = Math.round(((i + 1) / total) * 100);
        document.getElementById('progressBar').style.width = progress + '%';
        document.getElementById('progressBar').textContent = progress + '%';
    }

    // Testing complete
    window.isTestingRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;

    showSummary();
}

async function testCalculator(calc, index, total) {
    const resultItem = createResultItem(calc, 'testing');
    document.getElementById('resultsContainer').appendChild(resultItem);

    // Scroll to current item
    resultItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const result = {
        id: calc.id,
        title: calc.title,
        success: false,
        errors: [],
        warnings: [],
        details: {}
    };

    try {
        // Test 1: Check if module file exists
        const moduleUrl = `/js/calculators/${calc.id}/index.js?v=${Date.now()}`;
        const moduleResponse = await fetch(moduleUrl, { method: 'HEAD' });

        if (!moduleResponse.ok) {
            throw new Error(
                `Module file not found or inaccessible (HTTP ${moduleResponse.status})`
            );
        }
        result.details.fileExists = true;

        // Test 2: Try loading module
        let module;
        try {
            module = await import(moduleUrl);
            result.details.moduleLoaded = true;
        } catch (importError) {
            throw new Error(`Module load failed: ${importError.message}`);
        }

        // Test 3: Check module structure
        const calculator = Object.values(module)[0];
        if (!calculator) {
            throw new Error('Module does not export calculator object');
        }
        result.details.hasExport = true;

        // Test 4: Check required methods
        if (typeof calculator.generateHTML !== 'function') {
            throw new Error('Missing generateHTML method');
        }
        result.details.hasGenerateHTML = true;

        // Test 5: Try generating HTML
        try {
            const html = calculator.generateHTML();
            if (!html || typeof html !== 'string') {
                result.warnings.push('generateHTML return value may be incorrect');
            } else {
                result.details.htmlLength = html.length;
            }
        } catch (htmlError) {
            result.warnings.push(`generateHTML execution error: ${htmlError.message}`);
        }

        // Test 6: Check optional methods
        if (typeof calculator.initialize === 'function') {
            result.details.hasInitialize = true;
        }

        if (typeof calculator.calculate === 'function') {
            result.details.hasCalculate = true;
        }

        // All tests passed
        result.success = true;
        updateResultItem(resultItem, calc, 'success', result);
    } catch (error) {
        result.success = false;
        result.errors.push(error.message);
        updateResultItem(resultItem, calc, 'error', result);
    }

    window.testResults.push(result);
    updateStats();
}

function createResultItem(calc, status) {
    const item = document.createElement('div');
    item.className = `test-item ${status}`;
    item.id = `test-${sanitizeText(calc.id)}`;
    item.dataset.calcId = calc.id;
    item.dataset.status = status;

    const icon =
        status === 'testing'
            ? '⏳'
            : status === 'success'
              ? '✅'
              : status === 'error'
                ? '❌'
                : '⏳';

    item.innerHTML = `
    <div class="test-icon">${icon}</div>
    <div class="test-content">
        <div class="test-title">${sanitizeText(calc.title)}</div>
        <div class="test-id">ID: ${sanitizeText(calc.id)}</div>
        <div class="test-detail">Testing...</div>
    </div>
`;

    return item;
}

function updateResultItem(item, calc, status, result) {
    item.className = `test-item ${status}`;
    item.dataset.status = status;

    const icon = status === 'success' ? '✅' : '❌';

    let detailsHtml = '';
    if (status === 'success') {
        const details = [];
        if (result.details.hasInitialize) details.push('✓ Has initialize');
        if (result.details.hasCalculate) details.push('✓ Has calculate');
        if (result.details.htmlLength)
            details.push(`✓ HTML (${result.details.htmlLength} chars)`);

        detailsHtml = `<div class="test-detail">✓ All tests passed ${details.length > 0 ? '• ' + details.join(' • ') : ''}</div>`;

        if (result.warnings.length > 0) {
            detailsHtml += `<div class="test-detail" style="color: #856404;">⚠️ Warnings: ${sanitizeText(result.warnings.join(', '))}</div>`;
        }
    } else {
        detailsHtml = `<div class="test-detail">✗ Test Failed</div>`;
        if (result.errors.length > 0) {
            detailsHtml += `<div class="test-error">${sanitizeText(result.errors.join('\n'))}</div>`;
        }
    }

    const sanitizedId = sanitizeText(calc.id);
    const actionsHtml = `
    <div class="test-actions">
        <button data-action="retest" data-calc-id="${sanitizedId}">Retest</button>
        <button data-action="open" data-calc-id="${sanitizedId}">Open Calculator</button>
    </div>
`;

    item.innerHTML = `
    <div class="test-icon">${icon}</div>
    <div class="test-content">
        <div class="test-title">${sanitizeText(calc.title)}</div>
        <div class="test-id">ID: ${sanitizedId}</div>
        ${detailsHtml}
        ${actionsHtml}
    </div>
`;

    // Apply current filter
    applyCurrentFilter();
}

function updateStats() {
    const results = window.testResults;
    const total = window.calculatorModules.length;
    const tested = results.length;
    const success = results.filter(r => r.success).length;
    const error = results.filter(r => !r.success).length;
    const pending = total - tested;

    document.getElementById('successCount').textContent = success;
    document.getElementById('errorCount').textContent = error;
    document.getElementById('pendingCount').textContent = pending;

    document.getElementById('filterAll').textContent = tested;
    document.getElementById('filterSuccess').textContent = success;
    document.getElementById('filterError').textContent = error;
}

function showSummary() {
    const results = window.testResults;
    const total = results.length;
    const success = results.filter(r => r.success).length;
    const error = results.filter(r => !r.success).length;
    const successRate = Math.round((success / total) * 100);

    const summaryCard = document.createElement('div');
    summaryCard.className = 'summary-card';
    summaryCard.innerHTML = `
    <h3>🎉 Testing Complete!</h3>
    <div class="summary-stats">
        <div class="summary-stat">
            <div class="summary-stat-value">${total}</div>
            <div class="summary-stat-label">Total Calculators</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${success}</div>
            <div class="summary-stat-label">Passed</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${error}</div>
            <div class="summary-stat-label">Failed</div>
        </div>
        <div class="summary-stat">
            <div class="summary-stat-value">${successRate}%</div>
            <div class="summary-stat-label">Success Rate</div>
        </div>
    </div>
`;

    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.insertBefore(summaryCard, resultsContainer.firstChild);
}

function stopTests() {
    window.isTestingRunning = false;
    document.getElementById('startTestBtn').disabled = false;
    document.getElementById('stopTestBtn').disabled = true;
}

function clearResults() {
    window.testResults = [];
    document.getElementById('resultsContainer').innerHTML = `
    <div class="empty-state">
        <div class="empty-state-icon">🧮</div>
        <h3>Ready to Start Testing</h3>
        <p>Click "Start Tests" button to test all calculators</p>
    </div>
`;
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('filterButtons').style.display = 'none';
}

function filterResults(filter) {
    window.currentFilter = filter;

    // Update button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    applyCurrentFilter();
}

function applyCurrentFilter() {
    const filter = window.currentFilter;
    const items = document.querySelectorAll('.test-item');

    items.forEach(item => {
        if (filter === 'all') {
            item.style.display = 'flex';
        } else {
            item.style.display = item.dataset.status === filter ? 'flex' : 'none';
        }
    });
}

async function retestCalculator(calcId) {
    const calc = window.calculatorModules.find(c => c.id === calcId);
    if (!calc) return;

    // Remove old result
    window.testResults = window.testResults.filter(r => r.id !== calcId);

    const item = document.getElementById(`test-${calcId}`);
    if (item) {
        item.remove();
    }

    await testCalculator(calc, 0, 0);
    updateStats();
}

function openCalculator(calcId) {
    window.open(`calculator.html?name=${encodeURIComponent(calcId)}`, '_blank');
}

function exportResults() {
    const results = window.testResults;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `calculator-test-report-${timestamp}.json`;

    const report = {
        timestamp: new Date().toISOString(),
        total: results.length,
        success: results.filter(r => r.success).length,
        error: results.filter(r => !r.success).length,
        results: results
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Control buttons
    document.getElementById('startTestBtn').addEventListener('click', startTests);
    document.getElementById('stopTestBtn').addEventListener('click', stopTests);
    document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
    document.getElementById('exportResultsBtn').addEventListener('click', exportResults);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterResults(this.dataset.filter);
        });
    });

    // Delegated event listener for dynamic test action buttons
    document.getElementById('resultsContainer').addEventListener('click', function(e) {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const calcId = button.dataset.calcId;

        if (action === 'retest') {
            retestCalculator(calcId);
        } else if (action === 'open') {
            openCalculator(calcId);
        }
    });
});

// Expose functions globally for compatibility
window.startTests = startTests;
window.stopTests = stopTests;
window.clearResults = clearResults;
window.filterResults = filterResults;
window.retestCalculator = retestCalculator;
window.openCalculator = openCalculator;
window.exportResults = exportResults;
