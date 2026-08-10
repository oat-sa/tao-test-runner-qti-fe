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
 * Copyright (c) 2023-2026 (original work) Open Assessment Technologies SA.
 */

import context from 'context';
import loggerFactory from 'core/logger';
import __ from 'i18n';
import states from 'taoQtiTest/runner/config/states';
import { getSequenceNumber, getSequenceStore } from 'taoQtiTest/runner/services/sequenceStore';
import pluginFactory from 'taoTests/runner/plugin';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const FEATURE_FLAG = 'FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS';
const CONCURRENCY_SIGNAL_KEY = 'taoQtiTest.concurrency.signal';
const CONCURRENCY_BROADCAST_CHANNEL = 'taoQtiTest.concurrency.channel';

function emitConcurrencySignal(sequenceNumber) {
    try {
        window.localStorage.setItem(CONCURRENCY_SIGNAL_KEY, `${sequenceNumber}:${Date.now()}`);
    } catch (error) {
        logger.warn('Unable to emit concurrency signal to localStorage.', error);
    }
}

function createConcurrencyBroadcastChannel() {
    if (typeof window.BroadcastChannel !== 'function') {
        return null;
    }

    try {
        return new window.BroadcastChannel(CONCURRENCY_BROADCAST_CHANNEL);
    } catch (error) {
        logger.warn('Unable to open BroadcastChannel for concurrency signals.', error);
        return null;
    }
}

function emitConcurrencyBroadcastSignal(channel, sequenceNumber) {
    if (!channel) {
        return;
    }

    try {
        channel.postMessage({
            sequenceNumber,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.warn('Unable to emit concurrency signal to BroadcastChannel.', error);
    }
}

function bindResumeWatchers({ onStorageChanged, onBroadcastSignal, onFocus, onVisibilityChanged, broadcastChannel }) {
    window.addEventListener('storage', onStorageChanged);
    if (broadcastChannel) {
        broadcastChannel.addEventListener('message', onBroadcastSignal);
    }
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChanged);

    return () => {
        window.removeEventListener('storage', onStorageChanged);
        if (broadcastChannel) {
            broadcastChannel.removeEventListener('message', onBroadcastSignal);
        }
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('pageshow', onFocus);
        document.removeEventListener('visibilitychange', onVisibilityChanged);
    };
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
        let broadcastChannel = null;

        return Promise.all([getSequenceNumber(testRunner), getSequenceStore()]).then(
            ([sequenceNumber, sequenceStore]) =>
                sequenceStore.setSequenceNumber(sequenceNumber).then(() => {
                    let isResumeReloadInProgress = false;
                    broadcastChannel = createConcurrencyBroadcastChannel();

                    emitConcurrencySignal(sequenceNumber);
                    emitConcurrencyBroadcastSignal(broadcastChannel, sequenceNumber);

                    const releaseOwnershipOnClose = () => {
                        if (isResumeReloadInProgress) {
                            return Promise.resolve();
                        }

                        return sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                            if (lastSequenceNumber === sequenceNumber) {
                                emitConcurrencySignal(sequenceNumber);
                                emitConcurrencyBroadcastSignal(broadcastChannel, sequenceNumber);
                                return sequenceStore.clearSequenceNumber().then(() => {
                                    emitConcurrencySignal(sequenceNumber);
                                    emitConcurrencyBroadcastSignal(broadcastChannel, sequenceNumber);
                                });
                            }
                        });
                    };

                    window.addEventListener('pagehide', releaseOwnershipOnClose);
                    window.addEventListener('beforeunload', releaseOwnershipOnClose);
                    window.addEventListener('unload', releaseOwnershipOnClose);

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
                            const message = __(
                                'A concurrent delivery has been detected. Please use the last open session. The present window can be closed.'
                            );
                            let isResuming = false;
                            let unregisterResumeWatchers = null;

                            logger.warn(
                                `The sequence number has changed. Was another delivery opened in the same browser?`
                            );

                            const stopWatcher = () => {
                                if (unregisterResumeWatchers) {
                                    unregisterResumeWatchers();
                                    unregisterResumeWatchers = null;
                                }
                            };

                            const tryResumeHere = () => {
                                if (isResuming) {
                                    return Promise.resolve(false);
                                }

                                isResuming = true;

                                return sequenceStore
                                    .getSequenceNumber()
                                    .then(lastSequenceNumber => {
                                        if (lastSequenceNumber && lastSequenceNumber !== sequenceNumber) {
                                            return false;
                                        }

                                        return sequenceStore
                                            .setSequenceNumber(sequenceNumber)
                                            .then(() => sequenceStore.getSequenceNumber())
                                            .then(currentSequenceNumber => {
                                                if (currentSequenceNumber !== sequenceNumber) {
                                                    return false;
                                                }

                                                stopWatcher();
                                                isResumeReloadInProgress = true;
                                                window.location.reload();
                                                return true;
                                            });
                                    })
                                    .finally(() => {
                                        isResuming = false;
                                    });
                            };

                            const startWatcher = () => {
                                const canAutoResumeFromSignal = () => document.visibilityState === 'visible';

                                const onFocus = () => {
                                    tryResumeHere();
                                };

                                const onStorageChanged = event => {
                                    if (event && event.key && event.key !== CONCURRENCY_SIGNAL_KEY) {
                                        return;
                                    }

                                    // Only the active tab auto-resumes on cross-tab close/change signals.
                                    // Background tabs wait until they receive focus.
                                    if (canAutoResumeFromSignal()) {
                                        tryResumeHere();
                                    }
                                };

                                const onBroadcastSignal = () => {
                                    if (canAutoResumeFromSignal()) {
                                        tryResumeHere();
                                    }
                                };

                                const onVisibilityChanged = () => {
                                    if (document.visibilityState === 'visible') {
                                        tryResumeHere();
                                    }
                                };

                                return bindResumeWatchers({
                                    onStorageChanged,
                                    onBroadcastSignal,
                                    onFocus,
                                    onVisibilityChanged,
                                    broadcastChannel
                                });
                            };

                            if (skipPausedAssessmentDialog) {
                                testRunner.trigger('leave', {
                                    code: states.testSession.suspended,
                                    message,
                                    skipExitMessage: true
                                });
                                return;
                            }

                            testRunner
                                .trigger('disablefeedbackalerts')
                                .trigger('alert.leave', message, () => {
                                    stopWatcher();
                                    testRunner.trigger('enablefeedbackalerts');

                                    tryResumeHere().then(isResumed => {
                                        if (isResumed) {
                                            return;
                                        }

                                        testRunner.trigger('leave', {
                                            code: states.testSession.suspended,
                                            message,
                                            skipExitMessage: true
                                        });
                                    });
                                });

                            unregisterResumeWatchers = startWatcher();
                        });
                })
                .finally(() => {
                    if (broadcastChannel) {
                        broadcastChannel.close();
                    }
                })
        );
    }
});
