// Health Check Page Script
const checks = [
    {
        name: 'Base File Existence',
        test: async () => {
            const files = [
                'index.html',
                'launch.html',
                'calculator.html',
                'css/main.css'
            ];
            const results = await Promise.all(
                files.map(async file => {
                    try {
                        const response = await fetch(file, { method: 'HEAD' });
                        return { file, ok: response.ok };
                    } catch {
                        return { file, ok: false };
                    }
                })
            );
            const failed = results.filter(r => !r.ok);
            return {
                success: failed.length === 0,
                detail:
                    failed.length === 0
                        ? 'All base files exist'
                        : `Missing files: ${failed.map(f => f.file).join(', ')}`
            };
        }
    },
    {
        name: 'JavaScript Modules Loading',
        test: async () => {
            const modules = [
                'js/main.js',
                'js/calculator-page.js',
                'js/utils.js',
                'js/calculators/index.js'
            ];
            const results = await Promise.all(
                modules.map(async module => {
                    try {
                        const response = await fetch(module, { method: 'HEAD' });
                        return { module, ok: response.ok };
                    } catch {
                        return { module, ok: false };
                    }
                })
            );
            const failed = results.filter(r => !r.ok);
            return {
                success: failed.length === 0,
                detail:
                    failed.length === 0
                        ? 'JavaScript modules are accessible'
                        : `Inaccessible modules: ${failed.map(f => f.module).join(', ')}`
            };
        }
    },
    {
        name: 'CSS Stylesheet Loading',
        test: async () => {
            try {
                const response = await fetch('css/main.css', { method: 'HEAD' });
                return {
                    success: response.ok,
                    detail: response.ok
                        ? 'CSS stylesheet accessible'
                        : 'CSS stylesheet inaccessible'
                };
            } catch {
                return { success: false, detail: 'CSS stylesheet failed to load' };
            }
        }
    },
    {
        name: 'FHIR Client Library',
        test: async () => {
            try {
                const response = await fetch(
                    'https://cdn.jsdelivr.net/npm/fhirclient@2.6.3/build/fhir-client.js',
                    { method: 'HEAD' }
                );
                return {
                    success: response.ok,
                    detail: response.ok
                        ? 'FHIR Client library accessible (v2.6.3)'
                        : 'FHIR Client library inaccessible'
                };
            } catch {
                return {
                    success: false,
                    detail: 'FHIR Client library failed to load (check network connection)'
                };
            }
        }
    },
    {
        name: 'SMART Launch Configuration',
        test: async () => {
            try {
                const response = await fetch('launch.html');
                if (!response.ok) {
                    return {
                        success: false,
                        detail: 'launch.html missing (Docker container rebuild needed)'
                    };
                }
                const text = await response.text();
                const hasOAuth = text.includes('FHIR.oauth2.authorize') || text.includes('fhir-launch.js');
                const hasClientId = text.includes('client_id');
                return {
                    success: hasOAuth && hasClientId,
                    detail:
                        hasOAuth && hasClientId
                            ? 'SMART launch configuration correct'
                            : 'Configuration incomplete (missing OAuth2 settings)'
                };
            } catch {
                return { success: false, detail: 'launch.html inaccessible' };
            }
        }
    },
    {
        name: 'Calculator Modules',
        test: async () => {
            try {
                const response = await fetch('js/calculators/index.js');
                if (!response.ok) {
                    return {
                        success: false,
                        detail: 'Calculator index file inaccessible'
                    };
                }
                const text = await response.text();
                const hasExport =
                    text.includes('export') && text.includes('calculatorModules');
                return {
                    success: hasExport,
                    detail: hasExport
                        ? 'Calculator modules loaded normally'
                        : 'Calculator module format error'
                };
            } catch {
                return { success: false, detail: 'Calculator modules failed to load' };
            }
        }
    }
];

async function runChecks() {
    const container = document.getElementById('checks');
    container.innerHTML =
        '<div class="check-item pending"><div class="icon">⏳</div><div class="check-content"><div class="check-title">Running checks...</div></div></div>';

    const results = [];

    for (const check of checks) {
        const result = await check.test();
        results.push({ ...check, ...result });

        // Update display
        container.innerHTML = results
            .map(r => {
                const className = r.success ? 'success' : 'error';
                const icon = r.success ? '✅' : '❌';
                return `
                <div class="check-item ${className}">
                    <div class="icon">${icon}</div>
                    <div class="check-content">
                        <div class="check-title">${r.name}</div>
                        <div class="check-detail">${r.detail}</div>
                    </div>
                </div>
            `;
            })
            .join('');
    }

    // Show summary
    const allSuccess = results.every(r => r.success);
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    const summaryClass = allSuccess
        ? 'success'
        : successCount > 0
          ? 'pending'
          : 'error';
    const summaryIcon = allSuccess ? '🎉' : successCount > 0 ? '⚠️' : '❌';
    const summaryText = allSuccess
        ? 'All checks passed! System is running normally.'
        : `${successCount}/${totalCount} checks passed. Please check failed items.`;

    container.innerHTML += `
    <div class="check-item ${summaryClass}" style="margin-top: 20px; font-weight: 600;">
        <div class="icon">${summaryIcon}</div>
        <div class="check-content">
            <div class="check-title">Check Summary</div>
            <div class="check-detail">${summaryText}</div>
        </div>
    </div>
`;

    // If failures exist, show suggestion
    if (!allSuccess) {
        container.innerHTML += `
        <div class="info-box" style="background: #fff3cd; border-color: #ffeaa7;">
            <h3>🔧 Suggested Actions</h3>
            <p>If launch.html is missing, please run:</p>
            <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">cd MEDCALCEHR
docker-compose down
docker-compose build --no-cache
docker-compose up -d</pre>
            <p>Or run: <code>rebuild-docker.ps1</code></p>
        </div>
    `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listener to re-run button
    const rerunBtn = document.getElementById('rerun-checks-btn');
    if (rerunBtn) {
        rerunBtn.addEventListener('click', runChecks);
    }

    // Run checks on page load
    runChecks();
});
