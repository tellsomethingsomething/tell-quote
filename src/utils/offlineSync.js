import logger from './logger';

/**
 * Offline Sync Queue
 * Manages pending changes when offline and syncs when back online
 */

const QUEUE_KEY = 'offline-sync-queue';
const MAX_RETRIES = 3;

// Get the current queue from localStorage
export function getQueue() {
    try {
        const queue = localStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch {
        return [];
    }
}

// Save queue to localStorage
function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
        logger.error('Failed to save sync queue:', error);
    }
}

// Add an action to the queue
export function queueAction(action) {
    const queue = getQueue();
    const queueItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
    };
    queue.push(queueItem);
    saveQueue(queue);
    logger.debug('Action queued for sync:', action.type);
    return queueItem.id;
}

// Remove an action from the queue
export function removeFromQueue(actionId) {
    const queue = getQueue().filter(item => item.id !== actionId);
    saveQueue(queue);
}

// Mark action as failed
export function markFailed(actionId, error) {
    const queue = getQueue();
    const item = queue.find(i => i.id === actionId);
    if (item) {
        item.retries += 1;
        item.status = item.retries >= MAX_RETRIES ? 'failed' : 'pending';
        item.lastError = error?.message || 'Unknown error';
        saveQueue(queue);
    }
}

// Clear all failed actions
export function clearFailed() {
    const queue = getQueue().filter(item => item.status !== 'failed');
    saveQueue(queue);
}

// Get queue stats
export function getQueueStats() {
    const queue = getQueue();
    return {
        total: queue.length,
        pending: queue.filter(i => i.status === 'pending').length,
        failed: queue.filter(i => i.status === 'failed').length,
        oldest: queue.length > 0 ? queue[0].timestamp : null,
    };
}

// Process the sync queue
export async function processQueue(syncHandlers) {
    if (!navigator.onLine) {
        logger.debug('Offline - skipping queue processing');
        return { processed: 0, failed: 0 };
    }

    const queue = getQueue();
    if (queue.length === 0) {
        return { processed: 0, failed: 0 };
    }

    logger.debug(`Processing ${queue.length} queued actions`);

    let processed = 0;
    let failed = 0;

    for (const item of queue) {
        if (item.status === 'failed') continue;

        const handler = syncHandlers[item.action.type];
        if (!handler) {
            logger.warn(`No handler for action type: ${item.action.type}`);
            markFailed(item.id, new Error('No handler'));
            failed++;
            continue;
        }

        try {
            await handler(item.action.payload);
            removeFromQueue(item.id);
            processed++;
        } catch (error) {
            logger.error(`Failed to sync action ${item.action.type}:`, error);
            markFailed(item.id, error);
            if (item.retries + 1 >= MAX_RETRIES) {
                failed++;
            }
        }
    }

    logger.debug(`Queue processed: ${processed} succeeded, ${failed} failed`);
    return { processed, failed };
}

// Hook to manage offline sync
export function useOfflineSync(syncHandlers) {
    // Set up online listener
    if (typeof window !== 'undefined') {
        const handleOnline = async () => {
            logger.debug('Back online - processing sync queue');
            const result = await processQueue(syncHandlers);
            if (result.processed > 0) {
                window.dispatchEvent(new CustomEvent('sync-completed', { detail: result }));
            }
        };

        window.addEventListener('online', handleOnline);

        // Also try to process queue on initial load if online
        if (navigator.onLine) {
            setTimeout(() => processQueue(syncHandlers), 2000);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }
}

// Cache strategies for different data types
export const CACHE_STRATEGIES = {
    // Always fetch from network, fallback to cache
    NETWORK_FIRST: 'network-first',
    // Always use cache, update in background
    CACHE_FIRST: 'cache-first',
    // Only use network
    NETWORK_ONLY: 'network-only',
    // Only use cache
    CACHE_ONLY: 'cache-only',
    // Race network and cache
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

// Helper to determine if we should use cached data
export function shouldUseCache(strategy, isOnline) {
    switch (strategy) {
        case CACHE_STRATEGIES.NETWORK_ONLY:
            return false;
        case CACHE_STRATEGIES.CACHE_ONLY:
            return true;
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return !isOnline;
        case CACHE_STRATEGIES.CACHE_FIRST:
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return true;
        default:
            return !isOnline;
    }
}

export default {
    queueAction,
    removeFromQueue,
    getQueue,
    getQueueStats,
    processQueue,
    clearFailed,
    useOfflineSync,
    CACHE_STRATEGIES,
    shouldUseCache,
};
