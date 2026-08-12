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
import uuid from 'lib/uuid';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const FEATURE_FLAG = 'FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS';
const TAB_SYNC_CHANNEL_NAME = 'tao_qti_runner_prevent_concurrency_channel';
const TAB_SYNC_EVENTS = Object.freeze({
    becameActive: 'TAO_QTI_RUNNER_CONCURRENCY_TAB_BECAME_ACTIVE',
    activeTabClosed: 'TAO_QTI_RUNNER_CONCURRENCY_ACTIVE_TAB_CLOSED',
    pausedTabClosed: 'TAO_QTI_RUNNER_CONCURRENCY_PAUSED_TAB_CLOSED'
});

function createTabSynchronization(testRunner, concurrencyState) {
    const channel = new window.BroadcastChannel(TAB_SYNC_CHANNEL_NAME);
    const tabId = uuid(8);
    let isClaimingActiveTab = false;
    let reloadOnFocusListener = null;
    let reloadOnVisibleListener = null;

    const postMessage = type => channel.postMessage({ type, tabId });
    const isTabForeground = () => document.visibilityState === 'visible' || document.hasFocus();

    const claimActiveAndReload = () => {
        isClaimingActiveTab = true;
        postMessage(TAB_SYNC_EVENTS.becameActive);
        window.location.reload();
    };

    const clearReloadOnFocusListener = () => {
        if (reloadOnFocusListener) {
            window.removeEventListener('focus', reloadOnFocusListener);
            reloadOnFocusListener = null;
        }
        if (reloadOnVisibleListener) {
            document.removeEventListener('visibilitychange', reloadOnVisibleListener);
            reloadOnVisibleListener = null;
        }
    };

    const scheduleReloadOnFocus = () => {
        if (reloadOnFocusListener || reloadOnVisibleListener) {
            return;
        }

        const reloadAndClear = () => {
            clearReloadOnFocusListener();
            claimActiveAndReload();
        };

        reloadOnFocusListener = reloadAndClear;
        reloadOnVisibleListener = () => {
            if (document.visibilityState === 'visible') {
                reloadAndClear();
            }
        };

        window.addEventListener('focus', reloadOnFocusListener, { once: true });
        document.addEventListener('visibilitychange', reloadOnVisibleListener);
    };

    const onMessage = ({ data }) => {
        if (!data || data.tabId === tabId) {
            return;
        }

        if (data.type === TAB_SYNC_EVENTS.becameActive) {
            clearReloadOnFocusListener();
            testRunner.trigger('concurrency');
            return;
        }

        if (data.type === TAB_SYNC_EVENTS.activeTabClosed) {
            if (isTabForeground()) {
                claimActiveAndReload();
                return;
            }
            scheduleReloadOnFocus();
        }
    };

    const onFocus = () => {
        if (!concurrencyState.triggered) {
            postMessage(TAB_SYNC_EVENTS.becameActive);
        }
    };

    const notifyTabClosed = () => {
        if (isClaimingActiveTab) {
            return;
        }
        postMessage(
            concurrencyState.triggered ? TAB_SYNC_EVENTS.pausedTabClosed : TAB_SYNC_EVENTS.activeTabClosed
        );
    };

    channel.addEventListener('message', onMessage);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', notifyTabClosed);
    window.addEventListener('pagehide', notifyTabClosed);

    if (isTabForeground()) {
        postMessage(TAB_SYNC_EVENTS.becameActive);
    }

    return () => {
        clearReloadOnFocusListener();
        channel.removeEventListener('message', onMessage);
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('beforeunload', notifyTabClosed);
        window.removeEventListener('pagehide', notifyTabClosed);
        channel.close();
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
        const concurrencyState = {
            triggered: false
        };

        return Promise.all([getSequenceNumber(testRunner), getSequenceStore()]).then(
            ([sequenceNumber, sequenceStore]) =>
                sequenceStore.setSequenceNumber(sequenceNumber).then(() => {
                    if (context.featureFlags[FEATURE_FLAG]) {
                        this.destroyTabSynchronization = createTabSynchronization(testRunner, concurrencyState);
                    }

                    testRunner
                        .on('tick', () => {
                            if (context.featureFlags[FEATURE_FLAG]) {
                                return sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                                    if (lastSequenceNumber !== sequenceNumber) {
                                        testRunner.trigger('concurrency');
                                        return Promise.reject();
                                    }
                                });
                            }
                        })
                        .on('concurrency', () => {
                            if (concurrencyState.triggered) {
                                return;
                            }
                            concurrencyState.triggered = true;
                            testRunner.off('tick');
                            testRunner.trigger('disabletools');
                            testRunner.trigger('disablenav');
                            testRunner.trigger('disableitem');
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
    },

    destroy() {
        if (typeof this.destroyTabSynchronization === 'function') {
            this.destroyTabSynchronization();
            this.destroyTabSynchronization = null;
        }
    }
});
