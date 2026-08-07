import loggerFactory from 'core/logger';

const logger = loggerFactory('taoQtiTest/runner/services/localStorageSignal');

export function emitStorageSignal(signalKey, payload) {
    try {
        window.localStorage.setItem(signalKey, `${payload}:${Date.now()}`);
    } catch (error) {
        logger.warn(`Unable to emit storage signal for key "${signalKey}".`, error);
    }
}

export function createStorageSignalWatcher(signalKey, onSignal, delayMs = 120) {
    const onStorageChanged = event => {
        if (event && event.key && event.key !== signalKey) {
            return;
        }

        onSignal();
        setTimeout(onSignal, delayMs);
    };

    window.addEventListener('storage', onStorageChanged);

    return () => {
        window.removeEventListener('storage', onStorageChanged);
    };
}
