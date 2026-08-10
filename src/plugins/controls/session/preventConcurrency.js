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
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA ;
 */
import context from 'context';
import loggerFactory from 'core/logger';
import __ from 'i18n';
import module from 'module';
import states from 'taoQtiTest/runner/config/states';
import { getSequenceNumber, getSequenceStore } from 'taoQtiTest/runner/services/sequenceStore';
import pluginFactory from 'taoTests/runner/plugin';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const FEATURE_FLAG = 'FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS';
const WORKER_FILENAME = 'preventConcurrency.worker.js';
const WORKER_MESSAGE_TYPE = {
    REGISTER: 'REGISTER',
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    FOCUS: 'FOCUS',
    BLUR: 'BLUR',
    CLOSING: 'CLOSING',
    UNPAUSE: 'UNPAUSE'
};

/**
 * Creates a tiny SharedWorker that coordinates active/paused tabs for one browser session.
 * The worker grants unpause to a focused paused tab when active tab closes.
 * @returns {SharedWorker|null}
 */
function createSharedWorker() {
    if (typeof window === 'undefined' || typeof SharedWorker === 'undefined') {
        return null;
    }

    const requireToUrl =
        typeof require === 'function' && require.toUrl
            ? require.toUrl.bind(require)
            : window.require && window.require.toUrl
              ? window.require.toUrl.bind(window.require)
              : null;

    const workerUrl =
        module && module.uri
            ? module.uri.replace(/[^/]+$/, WORKER_FILENAME)
            : requireToUrl
              ? requireToUrl(`taoQtiTest/runner/plugins/controls/session/${WORKER_FILENAME}`)
              : null;

    if (!workerUrl) {
        logger.warn('Cannot resolve SharedWorker url, SharedWorker is disabled.');
        return null;
    }

    try {
        return new SharedWorker(workerUrl);
    } catch (err) {
        logger.warn(`Failed to connect SharedWorker url "${workerUrl}"`, err);
        return null;
    }
}

/**
 * Test Runner Control Plugin : detect concurrent deliveries launched from the same user session.
 */
export default pluginFactory({
    name: 'preventConcurrency',

    /**
     * Initializes the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const options = testRunner.getOptions();
        const skipPausedAssessmentDialog = !!options.skipPausedAssessmentDialog;
        const tabId = `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let isActiveTab = false;
        let isPaused = false;
        let refreshTriggered = false;
        let workerPort = null;

        const sendWorkerMessage = type => {
            if (workerPort) {
                workerPort.postMessage({ type, tabId });
            }
        };

        const onFocus = () => sendWorkerMessage(WORKER_MESSAGE_TYPE.FOCUS);
        const onBlur = () => sendWorkerMessage(WORKER_MESSAGE_TYPE.BLUR);
        const onVisibilityChange = () => {
            if (typeof document === 'undefined') {
                return;
            }
            if (document.visibilityState === 'visible') {
                onFocus();
            } else if (document.visibilityState === 'hidden') {
                onBlur();
            }
        };
        const onClosing = () => {
            if (isActiveTab) {
                sendWorkerMessage(WORKER_MESSAGE_TYPE.CLOSING);
            }
        };

        const sharedWorker = createSharedWorker();
        if (sharedWorker) {
            workerPort = sharedWorker.port;
            workerPort.start();
            workerPort.onmessage = ({ data }) => {
                if (
                    data &&
                    data.type === WORKER_MESSAGE_TYPE.UNPAUSE &&
                    isPaused &&
                    !refreshTriggered &&
                    typeof window !== 'undefined'
                ) {
                    refreshTriggered = true;
                    window.location.reload();
                }
            };
            sendWorkerMessage(WORKER_MESSAGE_TYPE.REGISTER);

            if (typeof window !== 'undefined') {
                window.addEventListener('focus', onFocus);
                window.addEventListener('blur', onBlur);
                window.addEventListener('pagehide', onClosing);
                window.addEventListener('beforeunload', onClosing);
                if (typeof document !== 'undefined') {
                    document.addEventListener('visibilitychange', onVisibilityChange);
                }
                if (typeof document !== 'undefined' && document.hasFocus && document.hasFocus()) {
                    onFocus();
                }
            }
        }

        return Promise.all([getSequenceNumber(testRunner), getSequenceStore()]).then(
            ([sequenceNumber, sequenceStore]) =>
                sequenceStore.setSequenceNumber(sequenceNumber).then(() => {
                    isActiveTab = true;
                    sendWorkerMessage(WORKER_MESSAGE_TYPE.ACTIVE);
                    testRunner
                        .on('tick', () => {
                            if (context.featureFlags[FEATURE_FLAG]) {
                                return sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                                    if (lastSequenceNumber !== sequenceNumber) {
                                        testRunner.off('tick');
                                        testRunner.trigger('disabletools');
                                        testRunner.trigger('disablenav');
                                        testRunner.trigger('disableitem');
                                        testRunner.trigger('concurrency');
                                        return Promise.reject();
                                    }
                                });
                            }
                        })
                        .on('concurrency', () => {
                            isPaused = true;
                            isActiveTab = false;
                            sendWorkerMessage(WORKER_MESSAGE_TYPE.PAUSED);
                            logger.warn(
                                `The sequence number has changed. Was another delivery opened in the same browser?`
                            );
                            testRunner.trigger('leave', {
                                code: states.testSession.suspended,
                                message: __(
                                    'A concurrent delivery has been detected. Please use the last open session. The present window can be closed.'
                                ),
                                skipExitMessage: skipPausedAssessmentDialog
                            });
                        });
                })
        );
    }
});
