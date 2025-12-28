// src/sw-register.ts
/**
 * Service Worker Registration
 * Registers and manages the Service Worker lifecycle
 */

interface MessagePayload {
    type: string;
    [key: string]: unknown;
}

interface CacheStatsResponse {
    stats: {
        [cacheName: string]: number;
    };
}

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return null;
    }

    try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/'
        });

        console.log('Service Worker registered successfully:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service Worker update found');

            newWorker?.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    showUpdateNotification(registration);
                }
            });
        });

        // Check for updates periodically (every hour)
        setInterval(
            () => {
                registration.update();
            },
            60 * 60 * 1000
        );

        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Show update notification to user
 */
function showUpdateNotification(registration: ServiceWorkerRegistration): void {
    // Create update notification
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
        <div class="sw-update-content">
            <span class="sw-update-icon">🔄</span>
            <span class="sw-update-text">新版本可用！</span>
            <button class="sw-update-button" id="sw-update-btn">更新</button>
            <button class="sw-dismiss-button" id="sw-dismiss-btn">稍後</button>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .sw-update-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        }

        .sw-update-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .sw-update-icon {
            font-size: 1.5em;
        }

        .sw-update-text {
            flex: 1;
            font-size: 0.9em;
            color: #333;
        }

        .sw-update-button,
        .sw-dismiss-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: 500;
            transition: all 0.2s;
        }

        .sw-update-button {
            background: #2196F3;
            color: white;
        }

        .sw-update-button:hover {
            background: #1976D2;
        }

        .sw-dismiss-button {
            background: #f5f5f5;
            color: #666;
        }

        .sw-dismiss-button:hover {
            background: #e0e0e0;
        }

        @keyframes slideIn {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Handle update button click
    document.getElementById('sw-update-btn')?.addEventListener('click', () => {
        // Tell service worker to skip waiting
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Reload page when new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });

        notification.remove();
    });

    // Handle dismiss button click
    document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * Unregister Service Worker (for debugging)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
        console.log('Service Worker unregistered');
        return true;
    } catch (error) {
        console.error('Failed to unregister Service Worker:', error);
        return false;
    }
}

interface ServiceWorkerStatus {
    supported: boolean;
    controller?: 'active' | 'none';
    ready?: Promise<ServiceWorkerRegistration>;
}

/**
 * Get Service Worker status
 */
export function getServiceWorkerStatus(): ServiceWorkerStatus {
    if (!('serviceWorker' in navigator)) {
        return { supported: false };
    }

    return {
        supported: true,
        controller: navigator.serviceWorker.controller ? 'active' : 'none',
        ready: navigator.serviceWorker.ready
    };
}

/**
 * Send message to Service Worker
 */
export async function sendMessageToSW(message: MessagePayload): Promise<unknown> {
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
        console.warn('No active service worker');
        return null;
    }

    return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event: MessageEvent) => {
            resolve(event.data);
        };

        // Use addEventListener for error handling on MessagePort
        messageChannel.port1.addEventListener('messageerror', (event: MessageEvent) => {
            reject(new Error('Message error: ' + event.data));
        });

        controller.postMessage(message, [messageChannel.port2]);

        // Timeout to prevent hanging
        setTimeout(() => {
            reject(new Error('Service worker message timeout'));
        }, 10000);
    });
}

/**
 * Clear Service Worker caches
 */
export async function clearServiceWorkerCaches(): Promise<unknown> {
    try {
        const result = await sendMessageToSW({ type: 'CLEAR_CACHE' });
        console.log('Service Worker caches cleared');
        return result;
    } catch (error) {
        console.error('Failed to clear Service Worker caches:', error);
        return null;
    }
}

/**
 * Get cache statistics from Service Worker
 */
export async function getCacheStats(): Promise<CacheStatsResponse['stats'] | null> {
    try {
        const result = (await sendMessageToSW({ type: 'GET_CACHE_STATS' })) as CacheStatsResponse;
        return result.stats;
    } catch (error) {
        console.error('Failed to get cache stats:', error);
        return null;
    }
}

/**
 * Initialize Service Worker on page load
 */
export function initializeServiceWorker(): void {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            registerServiceWorker();
        });
    } else {
        registerServiceWorker();
    }
}

export default {
    registerServiceWorker,
    unregisterServiceWorker,
    getServiceWorkerStatus,
    sendMessageToSW,
    clearServiceWorkerCaches,
    getCacheStats,
    initializeServiceWorker
};
