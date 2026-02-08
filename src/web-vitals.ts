// src/web-vitals.ts — Core Web Vitals reporting

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { logger } from './logger.js';

function reportMetric(metric: Metric): void {
    logger.info(`[WebVitals] ${metric.name}`, {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigationType: metric.navigationType,
    });

    // Report to Sentry performance if available
    try {
        const sentry = (globalThis as any).__SENTRY_INSTANCE__;
        if (sentry?.addBreadcrumb) {
            sentry.addBreadcrumb({
                category: 'web-vitals',
                message: `${metric.name}: ${metric.value}`,
                level: metric.rating === 'poor' ? 'warning' : 'info',
                data: {
                    name: metric.name,
                    value: metric.value,
                    rating: metric.rating,
                },
            });
        }
    } catch {
        // Sentry not available
    }
}

export function initWebVitals(): void {
    onCLS(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
}
