/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA.
 */

import loggerFactory from 'core/logger';
import module from 'module';
import {
    createSharedWorker,
    resolveWorkerUrl
} from 'taoQtiTest/runner/services/sharedWorker';
import {
    SHARED_WORKERS,
    WORKER_MESSAGE_TYPE
} from 'taoQtiTest/runner/config/sharedWorkerConfig';

const logger = loggerFactory('taoQtiTest/runner/services/preventConcurrencySharedWorker');
const EMPTY_CLIENT = {
    markActive() {},
    markPaused() {}
};

export function createSharedWorkerClient(onUnpause) {
    const workerUrl = resolveWorkerUrl(module, SHARED_WORKERS.PREVENT_CONCURRENCY);
    const sharedWorker = workerUrl ? createSharedWorker(workerUrl) : null;

    if (!sharedWorker) {
        logger.warn('SharedWorker is unavailable for preventConcurrency.');
        return EMPTY_CLIENT;
    }

    const tabId = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let isActiveTab = false;
    const workerPort = sharedWorker.port;
    const sendWorkerMessage = type => workerPort.postMessage({ type, tabId });

    const markFocused = () => sendWorkerMessage(WORKER_MESSAGE_TYPE.FOCUS);
    const markBlurred = () => sendWorkerMessage(WORKER_MESSAGE_TYPE.BLUR);
    const onClosing = () => {
        if (isActiveTab) {
            sendWorkerMessage(WORKER_MESSAGE_TYPE.CLOSING);
        }
    };
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            markFocused();
        } else if (document.visibilityState === 'hidden') {
            markBlurred();
        }
    };

    workerPort.start();
    workerPort.onmessage = ({ data }) => {
        if (data?.type === WORKER_MESSAGE_TYPE.UNPAUSE) {
            onUnpause?.();
        }
    };
    sendWorkerMessage(WORKER_MESSAGE_TYPE.REGISTER);

    window.addEventListener('focus', markFocused);
    window.addEventListener('blur', markBlurred);
    window.addEventListener('pagehide', onClosing);
    window.addEventListener('beforeunload', onClosing);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (document.hasFocus?.()) {
        markFocused();
    }

    return {
        markActive() {
            isActiveTab = true;
            sendWorkerMessage(WORKER_MESSAGE_TYPE.ACTIVE);
        },
        markPaused() {
            isActiveTab = false;
            sendWorkerMessage(WORKER_MESSAGE_TYPE.PAUSED);
        }
    };
}
