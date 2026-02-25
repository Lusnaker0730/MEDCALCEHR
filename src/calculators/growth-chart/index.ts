import { taiwanData, type TaiwanPercentileDataPoint, type BmiThresholdPoint } from './taiwan-data.js';
import {
    calculateZScore,
    estimatePercentile,
    calculateBmiData,
    calculateVelocity,
    formatAge,
    type GrowthDataPoint,
    type GrowthData
} from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
import type { CalculatorModule } from '../../types/index.js';
import { logger } from '../../logger.js';
import { Chart, LineController, LineElement, PointElement, LinearScale, Legend, Tooltip, Filler } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Legend, Tooltip, Filler);

export const growthChart: CalculatorModule = {
    id: 'growth-chart',
    title: '兒童生長曲線圖',
    description:
        '依據衛生福利部國民健康署台灣兒童生長標準，繪製身高、體重、BMI 生長曲線。',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="manual-input-section" style="margin-bottom: 1.5rem;">
                <h4>手動輸入當次測量</h4>
                <div class="input-row" style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                    ${uiBuilder.createInput({
                        id: 'manual-height',
                        label: '身高',
                        type: 'number',
                        placeholder: '例：120.5',
                        unit: 'cm',
                        min: 30,
                        max: 200,
                        step: 0.1
                    })}
                    ${uiBuilder.createInput({
                        id: 'manual-weight',
                        label: '體重',
                        type: 'number',
                        placeholder: '例：25.0',
                        unit: 'kg',
                        min: 1,
                        max: 150,
                        step: 0.1
                    })}
                    <div class="input-group" style="padding-bottom: 0.25rem;">
                        <button type="button" id="btn-add-manual" class="btn btn-primary">加入圖表</button>
                    </div>
                </div>
                <div id="manual-input-message" style="margin-top: 0.5rem;"></div>
            </div>

            <div class="growth-chart-stack">
                <div class="growth-chart-row">
                    <div class="chart-wrapper">
                        <div class="chart-header">
                            <h4>身高別年齡 (Height for Age)</h4>
                            <div class="chart-status" id="height-status">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="growthChartCanvasHeight"></canvas>
                        </div>
                        <div class="chart-summary" id="height-summary"></div>
                    </div>

                    <div class="chart-wrapper">
                        <div class="chart-header">
                            <h4>體重別年齡 (Weight for Age)</h4>
                            <div class="chart-status" id="weight-status">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="growthChartCanvasWeight"></canvas>
                        </div>
                        <div class="chart-summary" id="weight-summary"></div>
                    </div>
                </div>

                <div class="chart-wrapper chart-wrapper--full">
                    <div class="chart-header">
                        <h4>BMI 別年齡 (BMI for Age)</h4>
                        <div class="chart-status" id="bmi-status">Loading...</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="growthChartCanvasBMI"></canvas>
                    </div>
                    <div class="chart-summary" id="bmi-summary"></div>
                    ${uiBuilder.createAlert({
                        type: 'info',
                        message:
                            '<strong>說明：</strong>BMI 圖表顯示過輕、過重及肥胖門檻線。嬰幼兒 BMI 通常在 8-12 個月達高峰，之後下降至 5-6 歲（脂肪反彈期）。'
                    })}
                </div>
            </div>

            ${uiBuilder.createSection({
                title: '圖表資訊',
                content: `
                    <ul>
                        <li><strong>參考標準：</strong>衛生福利部國民健康署台灣兒童生長標準</li>
                        <li><strong>年齡範圍：</strong>出生至 17 歲</li>
                        <li><strong>百分位：</strong>P3, P15, P25, P50, P75, P85, P97</li>
                        <li><strong>P50（中位數）：</strong>50% 的兒童在此線以上/以下</li>
                        <li><strong>正常範圍：</strong>P3 至 P97 之間（綠色區域）</li>
                    </ul>
                `
            })}

            ${uiBuilder.createSection({
                title: '臨床判讀指引',
                content: `
                    <div class="interpretation-grid">
                        <div class="interpretation-item">
                            <strong>正常生長：</strong>
                            <p>兒童持續沿著既定的百分位曲線生長。單次測量低於 P3 或高於 P97 可能是個別兒童的正常值。</p>
                        </div>
                        <div class="interpretation-item">
                            <strong>生長疑慮：</strong>
                            <p>跨越兩條以上百分位線（上升或下降）、持續低於 P3 或高於 P97，可能需要進一步評估。</p>
                        </div>
                        <div class="interpretation-item">
                            <strong>BMI 判讀：</strong>
                            <p>兒童 BMI 判讀與成人不同。使用台灣兒童 BMI 門檻值（過輕/過重/肥胖），並考量生長速率及家族史。</p>
                        </div>
                        <div class="interpretation-item">
                            <strong>後續處置：</strong>
                            <p>準確記錄測量值、定期繪製曲線、考慮營養評估，並於觀察到生長遲緩時評估潛在疾病。</p>
                        </div>
                    </div>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize fhirDataService with the client and patient
        fhirDataService.initialize(client, patient, container);

        const heightCanvas = container.querySelector(
            '#growthChartCanvasHeight'
        ) as HTMLCanvasElement;
        const weightCanvas = container.querySelector(
            '#growthChartCanvasWeight'
        ) as HTMLCanvasElement;
        const bmiCanvas = container.querySelector('#growthChartCanvasBMI') as HTMLCanvasElement;

        // Function to update chart status and summary
        function updateChartStatus(
            type: string,
            dataCount: number,
            latestValue: number | null,
            latestAge: number | null,
            referenceData: TaiwanPercentileDataPoint[]
        ) {
            const statusEl = container.querySelector(`#${type}-status`);
            const summaryEl = container.querySelector(`#${type}-summary`);

            if (!statusEl || !summaryEl) {
                return;
            }

            if (dataCount === 0) {
                statusEl.innerHTML = '<span class="status-warning">⚠️ 無資料</span>';
                summaryEl.innerHTML =
                    '<p class="no-data">此病人無此項測量紀錄。</p>';
                return;
            }

            statusEl.innerHTML = `<span class="status-success">✅ ${dataCount} 筆測量</span>`;

            if (
                latestValue !== null &&
                latestAge !== undefined &&
                latestAge !== null &&
                referenceData &&
                referenceData.length > 0
            ) {
                const zscore = calculateZScore(latestAge, latestValue, referenceData);
                const percentileEstimate = estimatePercentile(zscore);

                let interpretation = '';
                if (zscore !== null) {
                    if (zscore < -2) {
                        interpretation = '低於正常範圍';
                    } else if (zscore > 2) {
                        interpretation = '高於正常範圍';
                    } else {
                        interpretation = '正常範圍內';
                    }
                }

                const ageStr = formatAge(latestAge);

                summaryEl.innerHTML = `
                    <div class="latest-measurement">
                        <strong>最新測量：</strong> ${latestValue.toFixed(1)} at ${ageStr}
                        ${zscore !== null ? `<br><strong>Z-score：</strong> ${zscore.toFixed(2)}（≈P${percentileEstimate}）` : ''}
                        ${interpretation ? `<br><strong>狀態：</strong> <span class="status-${zscore! < -2 || zscore! > 2 ? 'warning' : 'normal'}">${interpretation}</span>` : ''}
                    </div>
                `;
            }
        }

        // Function to update BMI chart status with threshold interpretation
        function updateBmiStatus(
            dataCount: number,
            latestValue: number | null,
            latestAge: number | null,
            bmiThresholds: BmiThresholdPoint[]
        ) {
            const statusEl = container.querySelector('#bmi-status');
            const summaryEl = container.querySelector('#bmi-summary');

            if (!statusEl || !summaryEl) return;

            if (dataCount === 0) {
                statusEl.innerHTML = '<span class="status-warning">⚠️ 無資料</span>';
                summaryEl.innerHTML = '<p class="no-data">此病人無 BMI 資料（需同時有身高和體重測量）。</p>';
                return;
            }

            statusEl.innerHTML = `<span class="status-success">✅ ${dataCount} 筆測量</span>`;

            if (latestValue !== null && latestAge !== null && bmiThresholds.length > 0) {
                // Find closest threshold data point
                const closest = bmiThresholds.reduce((prev, curr) =>
                    Math.abs(curr.Agemos - latestAge) < Math.abs(prev.Agemos - latestAge) ? curr : prev
                );

                let category = '';
                let statusClass = 'normal';
                if (latestValue < closest.underweight) {
                    category = '過輕';
                    statusClass = 'warning';
                } else if (latestValue >= closest.obese) {
                    category = '肥胖';
                    statusClass = 'warning';
                } else if (latestValue >= closest.overweight) {
                    category = '過重';
                    statusClass = 'warning';
                } else {
                    category = '正常';
                }

                const ageStr = formatAge(latestAge);

                summaryEl.innerHTML = `
                    <div class="latest-measurement">
                        <strong>最新 BMI：</strong> ${latestValue.toFixed(1)} kg/m² at ${ageStr}
                        <br><strong>分類：</strong> <span class="status-${statusClass}">${category}</span>
                        <br><small class="text-muted">過輕 &lt;${closest.underweight} / 過重 ≥${closest.overweight} / 肥胖 ≥${closest.obese}</small>
                    </div>
                `;
            }
        }

        async function getGrowthData(): Promise<GrowthData | null> {
            const patientData = fhirDataService.getPatient();

            if (!fhirDataService.isReady() || !patientData?.birthDate) {
                return { height: [], weight: [] };
            }

            try {
                const [heightObs, weightObs] = await Promise.all([
                    fhirDataService.getAllObservations(LOINC_CODES.HEIGHT, { sortOrder: 'asc' }),
                    fhirDataService.getAllObservations(LOINC_CODES.WEIGHT, { sortOrder: 'asc' })
                ]);

                const birthDate = new Date(patientData.birthDate);

                const processObservations = (observations: any[]): GrowthDataPoint[] => {
                    return observations
                        .filter(
                            obs => obs.valueQuantity?.value !== undefined && obs.effectiveDateTime
                        )
                        .map(obs => ({
                            ageMonths:
                                (new Date(obs.effectiveDateTime).getTime() - birthDate.getTime()) /
                                (1000 * 60 * 60 * 24 * 30.4375),
                            value: obs.valueQuantity.value,
                            unit: obs.valueQuantity.unit
                        }))
                        .filter(item => item.ageMonths >= 0);
                };

                return {
                    height: processObservations(heightObs),
                    weight: processObservations(weightObs)
                };
            } catch (error) {
                logger.error('Error fetching growth data', { error: String(error) });
                const errorBox = document.createElement('div');
                errorBox.className = 'error-box';
                errorBox.textContent = '取得生長資料時發生錯誤。';
                container.appendChild(errorBox);
                return null;
            }
        }

        function createChart(
            canvas: any,
            title: string,
            patientData: GrowthDataPoint[],
            referenceData: TaiwanPercentileDataPoint[],
            yAxisLabel: string,
            patientDataLabel: string
        ) {
            if (!referenceData || referenceData.length === 0) {
                // Handle case where there is no reference data
                const patientDataset = {
                    label: patientDataLabel,
                    data: patientData.map(d => ({ x: d.ageMonths, y: d.value })),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                };

                if (canvas.chart) {
                    canvas.chart.destroy();
                }

                canvas.chart = new Chart(canvas.getContext('2d'), {
                    type: 'line',
                    data: { datasets: [patientDataset] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            title: {
                                display: true,
                                text: title,
                                font: { size: 16, weight: 'bold' },
                                color: '#1f2937'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 20
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#2563eb',
                                borderWidth: 1,
                                callbacks: {
                                    title: function (context: any) {
                                        const ageMonths = context[0].parsed.x;
                                        return `年齡: ${formatAge(ageMonths)}`;
                                    },
                                    label: function (context: any) {
                                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} ${yAxisLabel.match(/\(([^)]+)\)/)?.[1] || ''}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'bottom',
                                title: {
                                    display: true,
                                    text: '年齡',
                                    font: { size: 14, weight: 'bold' }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    callback: function (value: string | number) {
                                        return formatAge(Number(value));
                                    }
                                }
                            },
                            y: {
                                type: 'linear',
                                position: 'left',
                                title: {
                                    display: true,
                                    text: yAxisLabel,
                                    font: { size: 14, weight: 'bold' }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            }
                        }
                    }
                });
                return;
            }

            // Taiwan percentile color scheme
            const percentileConfig: Record<string, { color: string; alpha: number; width: number; dash: number[] }> = {
                P3: { color: '#dc2626', alpha: 0.7, width: 1.5, dash: [5, 5] },
                P15: { color: '#ea580c', alpha: 0.8, width: 1, dash: [] },
                P25: { color: '#ca8a04', alpha: 0.8, width: 1, dash: [] },
                P50: { color: '#0f172a', alpha: 1.0, width: 2.5, dash: [] },
                P75: { color: '#ca8a04', alpha: 0.8, width: 1, dash: [] },
                P85: { color: '#ea580c', alpha: 0.8, width: 1, dash: [] },
                P97: { color: '#dc2626', alpha: 0.7, width: 1.5, dash: [5, 5] }
            };

            const referenceDatasets: any[] = [];
            const percentiles = ['P3', 'P15', 'P25', 'P50', 'P75', 'P85', 'P97'] as const;

            // Create datasets for all percentiles
            percentiles.forEach(percentile => {
                if (referenceData[0] && referenceData[0][percentile] !== undefined) {
                    const config = percentileConfig[percentile];
                    referenceDatasets.push({
                        label: percentile,
                        data: referenceData.map(row => ({ x: row.Agemos, y: row[percentile] })),
                        borderColor: config.color,
                        backgroundColor: `${config.color}${Math.round(config.alpha * 255)
                            .toString(16)
                            .padStart(2, '0')}`,
                        borderWidth: config.width,
                        borderDash: config.dash,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.3
                    });
                }
            });

            // Add normal range fill between P3 and P97
            const p3Index = referenceDatasets.findIndex(ds => ds.label === 'P3');
            const p97Index = referenceDatasets.findIndex(ds => ds.label === 'P97');
            if (p3Index !== -1 && p97Index !== -1) {
                referenceDatasets[p97Index].fill = {
                    target: p3Index,
                    above: 'rgba(34, 197, 94, 0.08)'
                };
            }

            // Patient data visualization
            const patientDataset = {
                label: patientDataLabel,
                data: patientData.map(d => ({ x: d.ageMonths, y: d.value })),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.2,
                order: 0
            };

            if (canvas.chart) {
                canvas.chart.destroy();
            }

            canvas.chart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { datasets: [patientDataset, ...referenceDatasets] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: title,
                            font: { size: 16, weight: 'bold' },
                            color: '#1f2937',
                            padding: 20
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                filter: function (legendItem: any) {
                                    // Show patient data and key percentiles in legend
                                    return (
                                        legendItem.text.includes('Patient') ||
                                        legendItem.text.includes('病人') ||
                                        legendItem.text === 'P3' ||
                                        legendItem.text === 'P50' ||
                                        legendItem.text === 'P97'
                                    );
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#2563eb',
                            borderWidth: 1,
                            callbacks: {
                                title: function (context: any) {
                                    const ageMonths = context[0].parsed.x;
                                    return `年齡: ${formatAge(ageMonths)}（${ageMonths.toFixed(1)} 月齡）`;
                                },
                                label: function (context: any) {
                                    const unit = yAxisLabel.match(/\(([^)]+)\)/)?.[1] || '';
                                    const value = context.parsed.y.toFixed(1);
                                    let label = `${context.dataset.label}: ${value} ${unit}`;

                                    // Add Z-score for patient data
                                    if (context.dataset.label.includes('Patient') || context.dataset.label.includes('病人')) {
                                        const zscore = calculateZScore(
                                            context.parsed.x,
                                            context.parsed.y,
                                            referenceData
                                        );
                                        if (zscore !== null) {
                                            label += `（Z-score: ${zscore.toFixed(2)}）`;
                                        }
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: '年齡',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawTicks: true
                            },
                            ticks: {
                                callback: function (value: string | number) {
                                    return formatAge(Number(value));
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: yAxisLabel,
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        /**
         * Create BMI chart with Taiwan threshold lines (underweight/overweight/obese)
         */
        function createBmiChart(
            canvas: any,
            patientData: GrowthDataPoint[],
            bmiThresholds: BmiThresholdPoint[]
        ) {
            const thresholdDatasets: any[] = [];

            if (bmiThresholds.length > 0) {
                // Underweight line
                thresholdDatasets.push({
                    label: '過輕',
                    data: bmiThresholds.map(t => ({ x: t.Agemos, y: t.underweight })),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.3
                });

                // Overweight line
                thresholdDatasets.push({
                    label: '過重',
                    data: bmiThresholds.map(t => ({ x: t.Agemos, y: t.overweight })),
                    borderColor: '#ea580c',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: {
                        target: 0, // Fill between underweight and overweight (normal zone)
                        above: 'rgba(34, 197, 94, 0.08)'
                    },
                    tension: 0.3
                });

                // Obese line
                thresholdDatasets.push({
                    label: '肥胖',
                    data: bmiThresholds.map(t => ({ x: t.Agemos, y: t.obese })),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.3
                });
            }

            // Patient BMI data
            const patientDataset = {
                label: '病人 BMI',
                data: patientData.map(d => ({ x: d.ageMonths, y: d.value })),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#2563eb',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.2,
                order: 0
            };

            if (canvas.chart) {
                canvas.chart.destroy();
            }

            canvas.chart = new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { datasets: [patientDataset, ...thresholdDatasets] },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'BMI 別年齡',
                            font: { size: 16, weight: 'bold' },
                            color: '#1f2937',
                            padding: 20
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#2563eb',
                            borderWidth: 1,
                            callbacks: {
                                title: function (context: any) {
                                    const ageMonths = context[0].parsed.x;
                                    return `年齡: ${formatAge(ageMonths)}`;
                                },
                                label: function (context: any) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg/m²`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: '年齡',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawTicks: true
                            },
                            ticks: {
                                callback: function (value: string | number) {
                                    return formatAge(Number(value));
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'BMI (kg/m²)',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        }

        // Function to add growth velocity analysis
        function addGrowthVelocityAnalysis(
            container: HTMLElement,
            data: GrowthData,
            bmiData: GrowthDataPoint[]
        ) {
            const velocitySection = document.createElement('div');
            velocitySection.className = 'growth-velocity-section mt-20';
            velocitySection.innerHTML = uiBuilder.createSection({
                title: '📈 生長速率分析',
                content: `
                    <div class="velocity-grid">
                        ${calculateVelocity('身高', data.height, 'cm/month')}
                        ${calculateVelocity('體重', data.weight, 'g/month', 1000)}
                        ${bmiData.length >= 2 ? calculateVelocity('BMI', bmiData, 'kg/m²/month') : ''}
                    </div>
                `
            });
            container.appendChild(velocitySection);
        }

        // Render (or re-render) all charts from the given growth data
        function renderCharts(data: GrowthData) {
            // Taiwan data covers birth to 17 years (204 months)
            const MAX_AGE_MONTHS = 216;
            const filteredHeight = data.height.filter(d => d.ageMonths <= MAX_AGE_MONTHS);
            const filteredWeight = data.weight.filter(d => d.ageMonths <= MAX_AGE_MONTHS);

            const bmiData = calculateBmiData(filteredHeight, filteredWeight);

            const gender = fhirDataService.getPatientGender() || 'female';

            // Get latest measurements
            const latestHeight =
                filteredHeight.length > 0 ? filteredHeight[filteredHeight.length - 1] : null;
            const latestWeight =
                filteredWeight.length > 0 ? filteredWeight[filteredWeight.length - 1] : null;
            const latestBMI =
                bmiData.length > 0 ? bmiData[bmiData.length - 1] : null;

            // Get Taiwan reference data by gender
            const heightRefData = gender === 'female'
                ? taiwanData.height.female
                : taiwanData.height.male;
            const weightRefData = gender === 'female'
                ? taiwanData.weight.female
                : taiwanData.weight.male;
            const bmiThresholds = gender === 'female'
                ? taiwanData.bmi.female
                : taiwanData.bmi.male;

            // Create Height Chart
            if (heightCanvas) {
                createChart(
                    heightCanvas,
                    '身高別年齡',
                    filteredHeight,
                    heightRefData,
                    '身高 (cm)',
                    '病人身高'
                );
                updateChartStatus(
                    'height',
                    filteredHeight.length,
                    latestHeight ? latestHeight.value : null,
                    latestHeight ? latestHeight.ageMonths : null,
                    heightRefData
                );
            }

            // Create Weight Chart
            if (weightCanvas) {
                createChart(
                    weightCanvas,
                    '體重別年齡',
                    filteredWeight,
                    weightRefData,
                    '體重 (kg)',
                    '病人體重'
                );
                updateChartStatus(
                    'weight',
                    filteredWeight.length,
                    latestWeight ? latestWeight.value : null,
                    latestWeight ? latestWeight.ageMonths : null,
                    weightRefData
                );
            }

            // Create BMI Chart with threshold lines
            if (bmiCanvas) {
                createBmiChart(bmiCanvas, bmiData, bmiThresholds);
                updateBmiStatus(
                    bmiData.length,
                    latestBMI ? latestBMI.value : null,
                    latestBMI ? latestBMI.ageMonths : null,
                    bmiThresholds
                );
            }

            // Remove previous velocity section if re-rendering
            const oldVelocity = container.querySelector('.growth-velocity-section');
            if (oldVelocity) oldVelocity.remove();

            // Add growth velocity analysis
            if (data.height.length >= 2 || data.weight.length >= 2) {
                addGrowthVelocityAnalysis(container, data, bmiData);
            }
        }

        // Mutable growth data — FHIR data + manual entries
        let currentData: GrowthData | null = null;

        // Calculate current age in months from patient birthDate
        function getCurrentAgeMonths(): number | null {
            const patientData = fhirDataService.getPatient();
            if (!patientData?.birthDate) return null;
            const birthDate = new Date(patientData.birthDate);
            return (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
        }

        // Wire up manual input button
        const addBtn = container.querySelector('#btn-add-manual') as HTMLButtonElement | null;
        const msgEl = container.querySelector('#manual-input-message');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const heightInput = container.querySelector('#manual-height') as HTMLInputElement | null;
                const weightInput = container.querySelector('#manual-weight') as HTMLInputElement | null;

                const heightVal = heightInput ? parseFloat(heightInput.value) : NaN;
                const weightVal = weightInput ? parseFloat(weightInput.value) : NaN;

                if (isNaN(heightVal) && isNaN(weightVal)) {
                    if (msgEl) msgEl.innerHTML = '<span class="status-warning">請至少輸入身高或體重其中一項。</span>';
                    return;
                }

                const ageMonths = getCurrentAgeMonths();
                if (ageMonths === null || ageMonths < 0) {
                    if (msgEl) msgEl.innerHTML = '<span class="status-warning">無法取得病人出生日期，無法計算月齡。</span>';
                    return;
                }

                if (!currentData) {
                    currentData = { height: [], weight: [] };
                }

                // Upsert: overwrite if a point on the same day already exists
                const DAY_IN_MONTHS = 1 / 30.4375;
                function upsert(arr: GrowthDataPoint[], point: GrowthDataPoint) {
                    const idx = arr.findIndex(d => Math.abs(d.ageMonths - point.ageMonths) < DAY_IN_MONTHS);
                    if (idx !== -1) {
                        arr[idx] = point;
                    } else {
                        arr.push(point);
                    }
                }

                if (!isNaN(heightVal)) {
                    upsert(currentData.height, { ageMonths, value: heightVal, unit: 'cm' });
                }
                if (!isNaN(weightVal)) {
                    upsert(currentData.weight, { ageMonths, value: weightVal, unit: 'kg' });
                }

                renderCharts(currentData);

                if (msgEl) {
                    const parts: string[] = [];
                    if (!isNaN(heightVal)) parts.push(`身高 ${heightVal} cm`);
                    if (!isNaN(weightVal)) parts.push(`體重 ${weightVal} kg`);
                    msgEl.innerHTML = `<span class="status-success">✅ 已加入：${parts.join('、')}</span>`;
                }

                // Clear inputs
                if (heightInput) heightInput.value = '';
                if (weightInput) weightInput.value = '';
            });
        }

        getGrowthData().then(data => {
            if (data) {
                currentData = data;

                if (data.height.length === 0 && data.weight.length === 0) {
                    return;
                }

                renderCharts(data);
            }
        });
    }
};
