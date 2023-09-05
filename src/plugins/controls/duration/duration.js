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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Runner Control Plugin : Duration (record exact spent time duration)
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import pluginFactory from 'taoTests/runner/plugin';
import loggerFactory from 'core/logger';

const logger = loggerFactory('taoQtiTest/runner/plugins/controls/duration/duration');

/**
 * Creates the timer plugin
 */
export default pluginFactory({
    name: 'duration',

    /**
     * Install step, add behavior before the lifecycle.
     */
    install() {
        // define the "duration" store as "volatile" (removed on browser change).
        this.getTestRunner()
            .getTestStore()
            .setVolatile(this.getName());
    },

    /**
     * Initializes the plugin (called during runner's init)
     *
     * @returns {Promise}
     */
    init() {
        const testRunner = this.getTestRunner();
        let currentUpdatePromise = Promise.resolve();

        const getItemAttempt = () => {
            const context = testRunner.getTestContext();
            return `${context.itemIdentifier}#${context.attempt}`;
        };
        const getPositiveNumber = value => {
            if (!_.isNumber(value) || value < 0) {
                return 0;
            }
            return value;
        };

        //where the duration of attempts are stored
        return testRunner.getPluginStore(this.getName()).then(durationStore => {
            /**
             * Gets the duration of a particular item from the store
             *
             * @param {String} attemptId - the attempt id to get the duration for
             * @returns {Promise}
             */
            const getItemDuration = attemptId => {
                if (!/^(.*)+#+\d+$/.test(attemptId)) {
                    return Promise.reject(new Error('Is it really an attempt id, like "itemid#attempt"'));
                }

                return durationStore.getItem(attemptId);
            };

            /**
             * Updates the duration of a particular item
             *
             * @param {Number} elapsed - time elapsed since previous tick
             * @returns {Promise}
             */
            const updateDuration = elapsed => {
                const itemAttemptId = getItemAttempt();

                currentUpdatePromise = currentUpdatePromise
                    .then(() => getItemDuration(itemAttemptId))
                    .then(duration => durationStore.setItem(
                        itemAttemptId,
                        getPositiveNumber(duration) + getPositiveNumber(elapsed) / 1000
                    ))
                    .catch(err => {
                        logger.warn(`Error updating item duration! ${err && err.message}`);
                    });

                return currentUpdatePromise;
            };

            /**
             * Adds the current duration to the next action request.
             * The duration will be sent to the server with the next request,
             * usually submitItem() or callItemAction()
             *
             * @returns {Promise}
             */
            const addDurationToCallActionParams = () => {
                const itemAttemptId = getItemAttempt();

                return currentUpdatePromise
                    .then(() => getItemDuration(itemAttemptId))
                    .then(duration => testRunner.getProxy().addCallActionParams({ itemDuration: getPositiveNumber(duration) }))
                    .catch(err => {
                        logger.warn(`Error retrieving item duration! ${err && err.message}`);
                    });
            };

            //change plugin state
            testRunner
                .on('tick', updateDuration)
                .before('move skip exit timeout pause', addDurationToCallActionParams)
                /**
                 * @event duration.get
                 * @param {String} attemptId - the attempt id to get the duration for
                 * @param {getDuration} getDuration - a receiver callback
                 */
                .on('plugin-get.duration', (attemptId, getDuration) => {
                    if (_.isFunction(getDuration)) {
                        getDuration(getItemDuration(attemptId));
                    }
                });
        });
    }
});
