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
import states from 'taoQtiTest/runner/config/states';
import { getSequenceNumber, getSequenceStore } from 'taoQtiTest/runner/services/sequenceStore';
import pluginFactory from 'taoTests/runner/plugin';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const FEATURE_FLAG = 'FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS';

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
                    const releaseOwnershipOnClose = () =>
                        sequenceStore.getSequenceNumber().then(lastSequenceNumber => {
                            if (lastSequenceNumber === sequenceNumber) {
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

                            logger.warn(
                                `The sequence number has changed. Was another delivery opened in the same browser?`
                            );

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
                                    testRunner.trigger('enablefeedbackalerts');

                                    sequenceStore
                                        .getSequenceNumber()
                                        .then(lastSequenceNumber => {
                                            if (!lastSequenceNumber || lastSequenceNumber === sequenceNumber) {
                                                sequenceStore.setSequenceNumber(sequenceNumber);
                                                window.location.reload();
                                                return;
                                            }

                                            testRunner.trigger('leave', {
                                                code: states.testSession.suspended,
                                                message,
                                                skipExitMessage: true
                                            });
                                        })
                                        .catch(() => {
                                            testRunner.trigger('leave', {
                                                code: states.testSession.suspended,
                                                message,
                                                skipExitMessage: true
                                            });
                                        });
                                });
                        });
                })
        );
    }
});
