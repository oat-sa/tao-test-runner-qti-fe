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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Main timer plugin.
 * Since the test can have multiples timers (per context)
 * with different behaviors, this plugin takes care of :
 *  - loading the timeConstraints data from the testContext and create timers objects
 *  - save/load data from the browser store
 *  - delegates the rendering to the timerbox component. The timerbox handles the display of multiple countdowns.
 *  - apply strategies to the timers. Each strategy can install it's own behavior on a timer.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

import _ from 'lodash';
import pluginFactory from 'taoTests/runner/plugin';
import getStrategyHandler from 'taoQtiTest/runner/plugins/controls/timer/strategy/strategyHandler';
import timerboxFactory from 'taoQtiTest/runner/plugins/controls/timer/component/timerbox';
import timersFactory from 'taoQtiTest/runner/plugins/controls/timer/timers';
import mapHelper from 'taoQtiTest/runner/helpers/map';

/**
 * Creates the plugin
 */
export default pluginFactory({
    name: 'timer',

    /**
     * Install step, add behavior before the lifecycle
     */
    install() {
        const testRunner = this.getTestRunner();

        /**
         * Load the timers, from the given timeConstraints and reading the current value in the store
         * @param {store} timeStore - where the values are read
         * @param {Object} config - the current config, especially for the warnings
         * @returns {Promise<Object[]>} the list of timers for the current context
         */
        this.loadTimers = function loadTimers(timeStore, config) {
            const testContext = testRunner.getTestContext();
            const testPart = testRunner.getCurrentPart();
            const isLinear = testPart && testPart.isLinear;
            const timeConstraints = testContext.timeConstraints;
            const timers = timersFactory(timeConstraints, isLinear, config);

            return Promise.all(
                _.map(timers, function(timer) {
                    return timeStore.getItem(`consumed_${timer.id}`).then(function(savedConsumedTime) {
                        if (_.isNumber(savedConsumedTime) && savedConsumedTime >= 0 && config.restoreTimerFromClient) {
                            timer.remainingTime = timer.originalTime + timer.extraTime.total - savedConsumedTime;
                        }
                    });
                })
            ).then(function() {
                return timers;
            });
        };

        /**
         * Save consumed time values into the store
         * @param {store} timeStore - where the values are saved
         * @param {Object[]} timers - the timers to save
         * @returns {Promise} resolves once saved
         */
        this.saveTimers = function saveTimers(timeStore, timers) {
            return Promise.all(
                _.map(timers, function(timer) {
                    return timeStore.setItem(
                        `consumed_${timer.id}`,
                        timer.originalTime + timer.extraTime.total - timer.remainingTime
                    );
                })
            );
        };

        //define the "timer" store as "volatile" (removed on browser change).
        testRunner.getTestStore().setVolatile(this.getName());
    },

    /**
     * Initializes the plugin (called during runner's init)
     */
    init: function init() {
        const self = this;
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();

        /**
         * Plugin config,
         */
        const config = Object.assign({
            /**
             * An option to control is the warnings are contextual or global
             */
            contextualWarnings: false,

            /**
             * The list of configured warnings
             */
            warnings: (testRunnerOptions.timerWarning) || {},

            /**
             * The guided navigation option
             */
            guidedNavigation: testRunnerOptions.guidedNavigation,

            /**
             * Restore timer from client.
             */
            restoreTimerFromClient: testRunnerOptions.timer && testRunnerOptions.timer.restoreTimerFromClient
        }, this.getConfig());

        /**
         * Set up the strategy handler
         */
        var strategyHandler = getStrategyHandler(testRunner);

        /**
         * dispatch errors to the test runner
         * @param {Error} err - to dispatch
         */
        var handleError = function handleError(err) {
            testRunner.trigger('error', err);
        };

        /**
         * Tells if the review panel is enabled
         * @returns {Boolean}
         */
        var isReviewPanelEnabled = function isReviewPanelAllowed() {
            const reviewEnabled = mapHelper.hasItemCategory(
                testRunner.getTestMap(),
                testRunner.getTestContext().itemIdentifier,
                'reviewScreen',
                true
            );
            const itemReviewEnabled = testRunner.getOptions().review.enabled;
            return reviewEnabled && itemReviewEnabled;
        };

        return new Promise(function(resolve) {
            //load the plugin store
            return testRunner.getPluginStore(self.getName()).then(function(timeStore) {
                testRunner
                    .before('renderitem resumeitem', function() {
                        var testContext = testRunner.getTestContext();
                        //update the timers before each item
                        if (self.timerbox && testContext.timeConstraints) {
                            return self
                                .loadTimers(timeStore, config)
                                .then(function(timers) {
                                    return self.timerbox.update(timers);
                                })
                                .catch(handleError);
                        }
                    })
                    .on('enableitem', function() {
                        if (self.timerbox) {
                            self.timerbox.start();
                        }
                    })
                    .after('renderitem', function() {
                        if (self.timerbox) {
                            self.timerbox.getElement().attr('aria-hidden', isReviewPanelEnabled());
                            self.timerbox.start();
                        }
                    })
                    .on('disableitem move skip', function() {
                        if (self.timerbox) {
                            //this will "pause" the countdowns
                            self.timerbox.stop();
                        }
                    });

                timeStore
                    .getItem('zen-mode')
                    .then(function(startZen) {
                        //set up the timerbox
                        self.timerbox = timerboxFactory({
                            ariaHidden: isReviewPanelEnabled(),
                            zenMode: {
                                enabled: true,
                                startHidden: !!startZen
                            },
                            displayWarning: config.contextualWarnings
                        })
                            .on(
                                'change',
                                _.throttle(function() {
                                    //update the store with the current timer values
                                    self.saveTimers(timeStore, this.getTimers());
                                }, 1000)
                            )
                            .on('timeradd', function(timer) {
                                strategyHandler.setUp(timer).catch(handleError);
                            })
                            .on('timerremove', function(timer) {
                                strategyHandler.tearDown(timer).catch(handleError);
                            })
                            .on('timerstart', function(timer) {
                                strategyHandler.start(timer).catch(handleError);
                            })
                            .on('timerstop', function(timer) {
                                strategyHandler.stop(timer).catch(handleError);
                            })
                            .on('timerend', function(timer) {
                                strategyHandler.complete(timer).catch(handleError);
                            })
                            .on('timerchange', function(action, timer) {
                                //backward compatible events
                                self.trigger(`${action}timer`, timer.qtiClassName, timer);
                            })
                            .on('zenchange', function(isZen) {
                                timeStore.setItem('zen-mode', !!isZen);
                            })
                            .on('init', resolve)
                            .on('error', handleError);

                        if (!config.contextualWarnings) {
                            self.timerbox.on('warn', function(message, level) {
                                if (level && message) {
                                    testRunner.trigger(level, message);
                                }
                            });
                        }
                    })
                    .catch(handleError);
            });
        });
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        this.timerbox.render(this.getAreaBroker().getControlArea());
    },

    /**
     * Called during the runner's destroy phase
     */
    destroy: function destroy() {
        if (this.timerbox) {
            this.timerbox.stop().destroy();
        }
    },

    /**
     * Shows the timers
     */
    show: function show() {
        if (this.timerbox) {
            this.timerbox.show();
        }
    },

    /**
     * Hides the timers
     */
    hide: function hide() {
        if (this.timerbox) {
            this.timerbox.hide();
        }
    }
});
