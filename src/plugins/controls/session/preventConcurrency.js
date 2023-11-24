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
import store from 'core/store';
import __ from 'i18n';
import states from 'taoQtiTest/runner/config/states';
import pluginFactory from 'taoTests/runner/plugin';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/session/preventConcurrency');

const STORE_ID = 'current';
const SEQUENCE_NUMBER = 'sequence';
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
        if (!context.featureFlags[FEATURE_FLAG]) {
            return;
        }

        const testRunner = this.getTestRunner();
        const options = testRunner.getOptions();
        const skipPausedAssessmentDialog = !!options.skipPausedAssessmentDialog;

        return testRunner
            .getTestStore()
            .getStorageIdentifier()
            .then(storeId => {
                const sequenceNumber = `${storeId}-${Date.now()}`;

                function detectConcurrency(lastSequenceNumber) {
                    if (lastSequenceNumber !== sequenceNumber) {
                        logger.warn(
                            `The sequence number has changed. Was another delivery opened in the same browser?`
                        );
                        testRunner.off('tick');
                        testRunner.trigger('concurrency');
                        return Promise.reject();
                    }
                }

                function stopOnConcurrency() {
                    testRunner.trigger('leave', {
                        code: states.testSession.suspended,
                        message: __(
                            'A concurrent delivery has been detected. Please use the last open session. The present window can be closed.'
                        ),
                        skipExitMessage: skipPausedAssessmentDialog
                    });
                }

                return store(STORE_ID).then(deliveryStore =>
                    deliveryStore.setItem(SEQUENCE_NUMBER, sequenceNumber).then(() => {
                        testRunner
                            .on('tick', () => deliveryStore.getItem(SEQUENCE_NUMBER).then(detectConcurrency))
                            .on('concurrency', stopOnConcurrency);
                    })
                );
            });
    }
});
