import { cdcData } from './cdc-data.js';

export const growthChart = {
    id: 'growth-chart',
    title: 'Pediatric Growth Chart',
    description:
        "Plots patient's growth data (height, weight, BMI) against standard growth curves.",
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            
            <div class="growth-chart-stack">
                <div class="growth-chart-row">
                    <div class="chart-wrapper">
                        <div class="chart-header">
                            <h4>Height for Age</h4>
                            <div class="chart-status" id="height-status">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="growthChartCanvasHeight"></canvas>
                        </div>
                        <div class="chart-summary" id="height-summary"></div>
                    </div>
                    
                    <div class="chart-wrapper">
                        <div class="chart-header">
                            <h4>Weight for Age</h4>
                            <div class="chart-status" id="weight-status">Loading...</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="growthChartCanvasWeight"></canvas>
                        </div>
                        <div class="chart-summary" id="weight-summary"></div>
                    </div>
                </div>
                
                <div class="chart-wrapper">
                    <div class="chart-header">
                        <h4>BMI for Age</h4>
                        <div class="chart-status" id="bmi-status">Loading...</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="growthChartCanvasBMI"></canvas>
                    </div>
                    <div class="chart-summary" id="bmi-summary"></div>
                    <div class="bmi-note">
                        <small><strong>Note:</strong> BMI patterns in infants are normal - BMI typically peaks around 8-12 months, then decreases until age 5-6 years (adiposity rebound).</small>
                    </div>
                </div>
            </div>

            <div class="growth-chart-info">
                <div class="info-card">
                    <h4>📊 Chart Information</h4>
                    <ul>
                        <li><strong>Reference:</strong> CDC Growth Charts (2000)</li>
                        <li><strong>Age Range:</strong> Birth to 36 months</li>
                        <li><strong>Percentiles:</strong> P3, P5, P10, P25, P50, P75, P90, P95, P97</li>
                    </ul>
                </div>
                <div class="info-card">
                    <h4>🔍 How to Interpret</h4>
                    <ul>
                        <li><strong>P50 (Median):</strong> 50% of children are above/below this line</li>
                        <li><strong>Normal Range:</strong> Between P5 and P95 (green shaded area)</li>
                        <li><strong>Z-score:</strong> Standard deviations from the mean</li>
                        <li><strong>Growth Pattern:</strong> More important than single measurements</li>
                    </ul>
                </div>
            </div>

            <div class="clinical-interpretation">
                <h4>🩺 Clinical Interpretation Guidelines</h4>
                <div class="interpretation-grid">
                    <div class="interpretation-item">
                        <strong>Normal Growth:</strong>
                        <p>Child follows their established percentile curve consistently over time. Single measurements below P5 or above P95 may be normal for that child.</p>
                    </div>
                    <div class="interpretation-item">
                        <strong>Growth Concerns:</strong>
                        <p>Crossing two or more percentile lines (upward or downward), falling below P3, or above P97 consistently may warrant further evaluation.</p>
                    </div>
                    <div class="interpretation-item">
                        <strong>BMI Considerations:</strong>
                        <p>BMI interpretation differs in children. Use BMI-for-age percentiles, not adult BMI categories. Consider growth velocity and family history.</p>
                    </div>
                    <div class="interpretation-item">
                        <strong>Next Steps:</strong>
                        <p>Document measurements accurately, plot regularly, consider nutritional assessment, and evaluate for underlying conditions if growth faltering is observed.</p>
                    </div>
                </div>
            </div>

            <div class="percentile-reference">
                <h4>📋 Percentile Reference</h4>
                <div class="percentile-table">
                    <div class="percentile-row">
                        <span class="percentile-label p97">P97</span>
                        <span class="percentile-desc">97th percentile - Only 3% of children are taller/heavier</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p95">P95</span>
                        <span class="percentile-desc">95th percentile - Upper limit of normal range</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p90">P90</span>
                        <span class="percentile-desc">90th percentile</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p75">P75</span>
                        <span class="percentile-desc">75th percentile</span>
                    </div>
                    <div class="percentile-row normal-range">
                        <span class="percentile-label p50">P50</span>
                        <span class="percentile-desc">50th percentile (Median) - Average</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p25">P25</span>
                        <span class="percentile-desc">25th percentile</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p10">P10</span>
                        <span class="percentile-desc">10th percentile</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p5">P5</span>
                        <span class="percentile-desc">5th percentile - Lower limit of normal range</span>
                    </div>
                    <div class="percentile-row">
                        <span class="percentile-label p3">P3</span>
                        <span class="percentile-desc">3rd percentile - Only 3% of children are shorter/lighter</span>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const heightCanvas = container.querySelector('#growthChartCanvasHeight');
        const weightCanvas = container.querySelector('#growthChartCanvasWeight');
        const bmiCanvas = container.querySelector('#growthChartCanvasBMI');

        async function getGrowthData(client) {
            const loincCodes = {
                height: '8302-2',
                weight: '29463-7',
                head: '8287-5'
            };
            const requests = Object.entries(loincCodes).map(([key, code]) =>
                client.patient
                    .request(`Observation?code=${code}&_sort=date`)
                    .then(response => ({ key, response }))
            );
            try {
                const results = await Promise.all(requests);
                const data = { height: [], weight: [], head: [] };
                results.forEach(({ key, response }) => {
                    if (response.entry) {
                        data[key] = response.entry
                            .map(item => ({
                                ageMonths:
                                    new Date(item.resource.effectiveDateTime).getTime() /
                                        (1000 * 60 * 60 * 24 * 30.4375) -
                                    new Date(patient.birthDate).getTime() /
                                        (1000 * 60 * 60 * 24 * 30.4375),
                                value: item.resource.valueQuantity.value,
                                unit: item.resource.valueQuantity.unit
                            }))
                            .filter(item => item.ageMonths >= 0);
                    }
                });
                return data;
            } catch (error) {
                console.error('Error fetching growth data:', error);
                container.innerHTML =
                    '<div class="error-box">An error occurred while fetching growth data.</div>';
                return null;
            }
        }

        function calculateBmiData(heightData, weightData) {
            if (heightData.length === 0 || weightData.length === 0) {
                return [];
            }
            const bmiData = [];
            weightData.forEach(w => {
                const closestHeight = heightData.reduce((prev, curr) =>
                    Math.abs(curr.ageMonths - w.ageMonths) < Math.abs(prev.ageMonths - w.ageMonths)
                        ? curr
                        : prev
                );
                if (Math.abs(closestHeight.ageMonths - w.ageMonths) < 0.5) {
                    const heightInMeters = closestHeight.value / 100;
                    if (heightInMeters > 0) {
                        const bmi = w.value / (heightInMeters * heightInMeters);
                        bmiData.push({ ageMonths: w.ageMonths, value: bmi });
                    }
                }
            });
            return bmiData;
        }

        function createChart(
            canvas,
            title,
            patientData,
            cdcPercentileData,
            yAxisLabel,
            patientDataLabel
        ) {
            if (!cdcPercentileData || cdcPercentileData.length === 0) {
                // Handle case where there is no CDC data
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

                new Chart(canvas.getContext('2d'), {
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
                                    title: function (context) {
                                        const ageMonths = context[0].parsed.x;
                                        const years = Math.floor(ageMonths / 12);
                                        const months = Math.round(ageMonths % 12);
                                        return `Age: ${years}y ${months}m`;
                                    },
                                    label: function (context) {
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
                                    text: 'Age (Months)',
                                    font: { size: 14, weight: 'bold' }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
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

            // Enhanced color scheme for percentiles
            const percentileConfig = {
                P3: { color: '#dc2626', alpha: 0.7, width: 1, dash: [5, 5] },
                P5: { color: '#ea580c', alpha: 0.8, width: 1.5, dash: [] },
                P10: { color: '#ca8a04', alpha: 0.8, width: 1, dash: [] },
                P25: { color: '#16a34a', alpha: 0.8, width: 1, dash: [] },
                P50: { color: '#0f172a', alpha: 1.0, width: 2.5, dash: [] },
                P75: { color: '#16a34a', alpha: 0.8, width: 1, dash: [] },
                P90: { color: '#ca8a04', alpha: 0.8, width: 1, dash: [] },
                P95: { color: '#ea580c', alpha: 0.8, width: 1.5, dash: [] },
                P97: { color: '#dc2626', alpha: 0.7, width: 1, dash: [5, 5] }
            };

            const cdcDatasets = [];
            const percentiles = ['P3', 'P5', 'P10', 'P25', 'P50', 'P75', 'P90', 'P95', 'P97'];

            // Create datasets for all available percentiles
            percentiles.forEach((percentile, index) => {
                if (cdcPercentileData[0] && cdcPercentileData[0][percentile] !== undefined) {
                    const config = percentileConfig[percentile];
                    cdcDatasets.push({
                        label: `CDC ${percentile}`,
                        data: cdcPercentileData.map(row => ({ x: row.Agemos, y: row[percentile] })),
                        borderColor: config.color,
                        backgroundColor: `${config.color}${Math.round(config.alpha * 255)
                            .toString(16)
                            .padStart(2, '0')}`,
                        borderWidth: config.width,
                        borderDash: config.dash,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.1
                    });
                }
            });

            // Add normal range fill between P5 and P95
            if (cdcPercentileData[0] && cdcPercentileData[0]['P5'] && cdcPercentileData[0]['P95']) {
                const p5Index = cdcDatasets.findIndex(ds => ds.label === 'CDC P5');
                const p95Index = cdcDatasets.findIndex(ds => ds.label === 'CDC P95');
                if (p5Index !== -1 && p95Index !== -1) {
                    cdcDatasets[p95Index].fill = {
                        target: p5Index,
                        above: 'rgba(34, 197, 94, 0.08)'
                    };
                }
            }

            // Enhanced patient data visualization
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
                order: 0 // Ensure patient data is rendered on top
            };

            new Chart(canvas.getContext('2d'), {
                type: 'line',
                data: { datasets: [patientDataset, ...cdcDatasets] },
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
                                filter: function (legendItem, chartData) {
                                    // Only show patient data and key percentiles in legend
                                    return (
                                        legendItem.text.includes('Patient') ||
                                        legendItem.text.includes('P5') ||
                                        legendItem.text.includes('P50') ||
                                        legendItem.text.includes('P95')
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
                                title: function (context) {
                                    const ageMonths = context[0].parsed.x;
                                    const years = Math.floor(ageMonths / 12);
                                    const months = Math.round(ageMonths % 12);
                                    return `Age: ${years}y ${months}m (${ageMonths.toFixed(1)} months)`;
                                },
                                label: function (context) {
                                    const unit = yAxisLabel.match(/\(([^)]+)\)/)?.[1] || '';
                                    const value = context.parsed.y.toFixed(1);
                                    let label = `${context.dataset.label}: ${value} ${unit}`;

                                    // Add Z-score calculation for patient data
                                    if (context.dataset.label.includes('Patient')) {
                                        const zscore = calculateZScore(
                                            context.parsed.x,
                                            context.parsed.y,
                                            cdcPercentileData
                                        );
                                        if (zscore !== null) {
                                            label += ` (Z-score: ${zscore.toFixed(2)})`;
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
                                text: 'Age (Months)',
                                font: { size: 14, weight: 'bold' }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                drawTicks: true
                            },
                            ticks: {
                                callback: function (value) {
                                    const years = Math.floor(value / 12);
                                    const months = Math.round(value % 12);
                                    return years > 0
                                        ? `${years}y${months > 0 ? ` ${months}m` : ''}`
                                        : `${months}m`;
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

        // Z-score calculation function
        function calculateZScore(ageMonths, value, cdcData) {
            if (!cdcData || cdcData.length === 0) {
                return null;
            }

            // Find closest age point in CDC data
            const closestPoint = cdcData.reduce((prev, curr) =>
                Math.abs(curr.Agemos - ageMonths) < Math.abs(prev.Agemos - ageMonths) ? curr : prev
            );

            if (Math.abs(closestPoint.Agemos - ageMonths) > 1) {
                return null;
            } // Too far from reference point

            // Approximate Z-score using P50 and standard deviation estimation
            const p50 = closestPoint.P50;
            const p5 = closestPoint.P5;
            const p95 = closestPoint.P95;

            // Rough estimate: assume normal distribution where P5 ≈ -1.645 SD, P95 ≈ +1.645 SD
            const sdEstimate = (p95 - p5) / (2 * 1.645);

            return (value - p50) / sdEstimate;
        }

        // Function to update chart status and summary
        function updateChartStatus(type, dataCount, latestValue, latestAge, cdcData) {
            const statusEl = container.querySelector(`#${type}-status`);
            const summaryEl = container.querySelector(`#${type}-summary`);

            if (dataCount === 0) {
                statusEl.innerHTML = '<span class="status-warning">⚠️ No data available</span>';
                summaryEl.innerHTML =
                    '<p class="no-data">No measurements recorded for this patient.</p>';
                return;
            }

            statusEl.innerHTML = `<span class="status-success">✅ ${dataCount} measurement${dataCount > 1 ? 's' : ''}</span>`;

            if (latestValue && latestAge !== undefined && cdcData && cdcData.length > 0) {
                const zscore = calculateZScore(latestAge, latestValue, cdcData);
                const percentileEstimate = estimatePercentile(zscore);

                let interpretation = '';
                if (zscore !== null) {
                    if (zscore < -2) {
                        interpretation = 'Below normal range';
                    } else if (zscore > 2) {
                        interpretation = 'Above normal range';
                    } else {
                        interpretation = 'Within normal range';
                    }
                }

                const years = Math.floor(latestAge / 12);
                const months = Math.round(latestAge % 12);
                const ageStr = years > 0 ? `${years}y ${months}m` : `${months}m`;

                summaryEl.innerHTML = `
                    <div class="latest-measurement">
                        <strong>Latest:</strong> ${latestValue.toFixed(1)} at ${ageStr}
                        ${zscore !== null ? `<br><strong>Z-score:</strong> ${zscore.toFixed(2)} (≈P${percentileEstimate})` : ''}
                        ${interpretation ? `<br><strong>Status:</strong> <span class="status-${zscore < -2 || zscore > 2 ? 'warning' : 'normal'}">${interpretation}</span>` : ''}
                    </div>
                `;
            }
        }

        // Function to estimate percentile from Z-score
        function estimatePercentile(zscore) {
            if (zscore === null) {
                return '';
            }

            // Rough approximation
            if (zscore <= -2.33) {
                return '3';
            }
            if (zscore <= -1.645) {
                return '5';
            }
            if (zscore <= -1.28) {
                return '10';
            }
            if (zscore <= -0.674) {
                return '25';
            }
            if (zscore <= 0) {
                return '50';
            }
            if (zscore <= 0.674) {
                return '75';
            }
            if (zscore <= 1.28) {
                return '90';
            }
            if (zscore <= 1.645) {
                return '95';
            }
            if (zscore <= 2.33) {
                return '97';
            }
            return '>97';
        }

        getGrowthData(client).then(data => {
            if (data) {
                if (data.height.length === 0 && data.weight.length === 0) {
                    container.innerHTML =
                        '<div class="no-growth-data"><h4>📊 No Growth Data Available</h4><p>No height or weight measurements found for this patient. Please ensure growth data has been recorded in the patient\'s medical record.</p></div>';
                    return;
                }

                const bmiData = calculateBmiData(data.height, data.weight);
                const gender = patient.gender || 'female';

                // Get latest measurements for summaries
                const latestHeight =
                    data.height.length > 0 ? data.height[data.height.length - 1] : null;
                const latestWeight =
                    data.weight.length > 0 ? data.weight[data.weight.length - 1] : null;
                const latestBMI = bmiData.length > 0 ? bmiData[bmiData.length - 1] : null;

                // Create Height Chart
                const cdcHeightDataSet =
                    gender === 'female' ? cdcData.lenageinf_g : cdcData.lenageinf_b;
                const cdcHeightData = cdcHeightDataSet ? cdcHeightDataSet.data : [];
                if (heightCanvas) {
                    createChart(
                        heightCanvas,
                        'Height for Age',
                        data.height,
                        cdcHeightData,
                        'Height (cm)',
                        'Patient Height'
                    );
                    updateChartStatus(
                        'height',
                        data.height.length,
                        latestHeight ? latestHeight.value : null,
                        latestHeight ? latestHeight.ageMonths : null,
                        cdcHeightData
                    );
                }

                // Create Weight Chart
                const cdcWeightDataSet =
                    gender === 'female' ? cdcData.wtageinf_g : cdcData.wtageinf_b;
                const cdcWeightData = cdcWeightDataSet ? cdcWeightDataSet.data : [];
                if (weightCanvas) {
                    createChart(
                        weightCanvas,
                        'Weight for Age',
                        data.weight,
                        cdcWeightData,
                        'Weight (kg)',
                        'Patient Weight'
                    );
                    updateChartStatus(
                        'weight',
                        data.weight.length,
                        latestWeight ? latestWeight.value : null,
                        latestWeight ? latestWeight.ageMonths : null,
                        cdcWeightData
                    );
                }

                // Create BMI Chart
                const cdcBmiDataSet =
                    gender === 'female' ? cdcData.bmiagerev_g : cdcData.bmiagerev_b;
                const cdcBmiData = cdcBmiDataSet ? cdcBmiDataSet.data : [];
                if (bmiCanvas) {
                    createChart(
                        bmiCanvas,
                        'BMI for Age',
                        bmiData,
                        cdcBmiData,
                        'BMI (kg/m²)',
                        'Patient BMI'
                    );
                    updateChartStatus(
                        'bmi',
                        bmiData.length,
                        latestBMI ? latestBMI.value : null,
                        latestBMI ? latestBMI.ageMonths : null,
                        cdcBmiData
                    );
                }

                // Add growth velocity analysis
                if (data.height.length >= 2 || data.weight.length >= 2) {
                    addGrowthVelocityAnalysis(container, data, bmiData);
                }
            }
        });

        // Function to add growth velocity analysis
        function addGrowthVelocityAnalysis(container, data, bmiData) {
            const velocitySection = document.createElement('div');
            velocitySection.className = 'growth-velocity-section';
            velocitySection.innerHTML = `
                <h4>📈 Growth Velocity Analysis</h4>
                <div class="velocity-grid">
                    ${calculateVelocity('Height', data.height, 'cm/month')}
                    ${calculateVelocity('Weight', data.weight, 'g/month', 1000)}
                    ${bmiData.length >= 2 ? calculateVelocity('BMI', bmiData, 'kg/m²/month') : ''}
                </div>
            `;
            container.appendChild(velocitySection);
        }

        // Function to calculate growth velocity
        function calculateVelocity(type, measurements, unit, multiplier = 1) {
            if (measurements.length < 2) {
                return '';
            }

            const recent = measurements.slice(-2);
            const timeDiff = recent[1].ageMonths - recent[0].ageMonths;
            const valueDiff = (recent[1].value - recent[0].value) * multiplier;

            if (timeDiff <= 0) {
                return '';
            }

            const velocity = valueDiff / timeDiff;
            const timeStr =
                timeDiff < 2 ? `${timeDiff.toFixed(1)} month` : `${timeDiff.toFixed(1)} months`;

            return `
                <div class="velocity-item">
                    <strong>${type} Velocity:</strong>
                    <span class="velocity-value">${velocity > 0 ? '+' : ''}${velocity.toFixed(1)} ${unit}</span>
                    <small>over last ${timeStr}</small>
                </div>
            `;
        }
    }
};
