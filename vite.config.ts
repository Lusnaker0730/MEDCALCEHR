import { defineConfig } from 'vite';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
    root: '.',
    publicDir: 'public',

    build: {
        outDir: 'dist',
        sourcemap: true,
        target: 'es2020',
        chunkSizeWarningLimit: 250,
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                calculator: resolve(__dirname, 'calculator.html'),
                launch: resolve(__dirname, 'launch.html'),
                'health-check': resolve(__dirname, 'health-check.html'),
            },
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/fhirclient')) {
                        return 'vendor-fhir';
                    }
                    if (id.includes('node_modules/chart.js')) {
                        return 'vendor-chart';
                    }
                    if (id.includes('node_modules/@sentry')) {
                        return 'vendor-sentry';
                    }
                    if (id.includes('node_modules/web-vitals')) {
                        return 'vendor-web-vitals';
                    }
                    if (id.includes('node_modules/fuse.js')) {
                        return 'vendor-fuse';
                    }
                    if (id.includes('src/ui-builder') || id.includes('src/validator') || id.includes('src/utils')) {
                        return 'ui';
                    }
                    if (id.includes('src/twcore')) {
                        return 'core';
                    }
                    if (id.includes('src/errorHandler') || id.includes('src/logger') || id.includes('src/sentry')) {
                        return 'core';
                    }
                },
            },
        },
    },

    plugins: [
        mode === 'analyze' && visualizer({
            open: true,
            gzipSize: true,
            filename: 'bundle-analysis.html',
        }),
    ].filter(Boolean),

    css: {
        postcss: './postcss.config.js',
    },

    server: {
        port: 8000,
    },

    preview: {
        port: 8000,
    },
}));
