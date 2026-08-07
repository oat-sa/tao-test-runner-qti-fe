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
import { createStorageSignalWatcher, emitStorageSignal } from 'taoQtiTest/runner/services/localStorageSignal';
import { getSequenceNumber, getSequenceStore } from 'taoQtiTest/runner/services/sequenceStore';
import pluginFactory from 'taoTests/runner/plugin';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const FEATURE_FLAG = 'FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS';
const CONCURRENCY_RESUME_SIGNAL_KEY = 'taoQtiTest.concurrency.resumeSignal';
const DIALOG_MESSAGE_SELECTOR = '.preview-modal-feedback.modal .message';

function setCurrentDialogMessage(text) {
    document.querySelectorAll(DIALOG_MESSAGE_SELECTOR).forEach(element => {
        if (element && element.textContent !== text) {
            element.textContent = text;
        }
    });
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

        return Promise.all([getSequenceNumber(testRunner), getSequenceStore()]).then(
            ([sequenceNumber, sequenceStore]) =>
                sequenceStore.setSequenceNumber(sequenceNumber).then(() => {
                    // Notify other tabs that the latest owner sequence has changed.
                    emitStorageSignal(CONCURRENCY_RESUME_SIGNAL_KEY, sequenceNumber);

                    const releaseOwnershipOnClose = () =>
                        sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                            if (lastSequenceNumber === sequenceNumber) {
                                emitStorageSignal(CONCURRENCY_RESUME_SIGNAL_KEY, sequenceNumber);
                                return sequenceStore.clearSequenceNumber();
                            }
                        });

                    window.addEventListener('pagehide', releaseOwnershipOnClose);

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
                            const resumeMessage = __(
                                'This delivery was paused because it was opened in another tab. The other tab is now closed. Click OK to continue here.'
                            );
                            let canResumeHere = false;
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

                            const checkIfCanResume = () =>
                                sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                                    if (!lastSequenceNumber || lastSequenceNumber === sequenceNumber) {
                                        canResumeHere = true;
                                        setCurrentDialogMessage(resumeMessage);
                                        return;
                                    }

                                    canResumeHere = false;
                                    setCurrentDialogMessage(message);
                                });

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

                                    if (canResumeHere) {
                                        sequenceStore.setSequenceNumber(sequenceNumber);
                                        window.location.reload();
                                        return;
                                    }

                                    checkIfCanResume().then(() => {
                                        if (canResumeHere) {
                                            sequenceStore.setSequenceNumber(sequenceNumber);
                                            window.location.reload();
                                            return;
                                        }

                                        testRunner.trigger('leave', {
                                            code: states.testSession.suspended,
                                            message,
                                            skipExitMessage: true
                                        });
                                    });
                                });

                            unregisterResumeWatchers = createStorageSignalWatcher(
                                CONCURRENCY_RESUME_SIGNAL_KEY,
                                checkIfCanResume
                            );
                        });
                })
        );
    }
});
