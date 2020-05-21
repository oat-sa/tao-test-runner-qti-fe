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
import promiseQueue from 'core/promiseQueue';

/**
 * Creates the timer plugin
 */
export default pluginFactory({
    name: 'duration',

    /**
     * Install step, add behavior before the lifecycle.
     */
    install: function install() {
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
    init: function init() {
        const testRunner = this.getTestRunner();

        /**
         * A promise queue to ensure requests run sequentially
         */
        const queue = promiseQueue();
        let currentUpdatePromise = Promise.resolve();

        //where the duration of attempts are stored
        return testRunner.getPluginStore(this.getName()).then((durationStore) => {
            /**
             * Gets the duration of a particular item from the store
             *
             * @param {String} attemptId - the attempt id to get the duration for
             * @returns {Promise}
             */
            const getItemDuration = (attemptId) => {
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
            const updateDuration = (elapsed) => {
                const context = testRunner.getTestContext();

                //store by attempt
                const itemAttemptId = `${context.itemIdentifier}#${context.attempt}`;

                currentUpdatePromise = queue.serie(() => durationStore.getItem(itemAttemptId)
                    .then(function (duration) {
                        duration = _.isNumber(duration) ? duration : 0;
                        elapsed = _.isNumber(elapsed) && elapsed > 0 ? elapsed / 1000 : 0;

                        //store the last duration
                        return durationStore.setItem(itemAttemptId, duration + elapsed);
                    })
                );

                return currentUpdatePromise;
            };

            const addDuractionToCallActionParams = () => {
                const context = testRunner.getTestContext();
                const itemAttemptId = `${context.itemIdentifier}#${context.attempt}`;

                return getItemDuration(itemAttemptId)
                    .then((duration) => {
                        const params = {
                            itemDuration: 0,
                        };

                        if (_.isNumber(duration) && duration > 0) {
                            params.itemDuration = duration;
                        }

                        // the duration will be sent to the server with the next request,
                        // usually submitItem() or callItemAction()
                        testRunner.getProxy().addCallActionParams(params);
                    })
                    .catch(_.noop);
            };

            //change plugin state
            testRunner
                .on('tick', (elapsed) => {
                    updateDuration(elapsed);
                })
                .after('move skip exit timeout pause', () => currentUpdatePromise
                    .then(addDuractionToCallActionParams)
                    .catch(addDuractionToCallActionParams)
                )
                /**
                 * @event duration.get
                 * @param {String} attemptId - the attempt id to get the duration for
                 * @param {getDuration} getDuration - a receiver callback
                 */
                .on('plugin-get.duration', (e, attemptId, getDuration) => {
                    if (_.isFunction(getDuration)) {
                        getDuration(getItemDuration(attemptId));
                    }
                });
        });
    }
});
