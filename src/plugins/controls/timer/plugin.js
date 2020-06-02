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

import $ from 'jquery';
import _ from 'lodash';
import pluginFactory from 'taoTests/runner/plugin';
import getStrategyHandler from 'taoQtiTest/runner/plugins/controls/timer/strategy/strategyHandler';
import timerboxFactory from 'taoQtiTest/runner/plugins/controls/timer/component/timerbox';
import timersFactory from 'taoQtiTest/runner/plugins/controls/timer/timers';
import isReviewPanelEnabled from 'taoQtiTest/runner/helpers/isReviewPanelEnabled';
import statsHelper from 'taoQtiTest/runner/helpers/stats';
import screenreaderNotificationTpl from 'taoQtiTest/runner/plugins/controls/timer/component/tpl/screenreaderNotification.tpl';

// timeout after which screenreader notifcation should be cleaned up
const screenreaderNotificationTimeout = 20000;

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
     *
     * @returns {Promise}
     */
    init: function init() {
        const self = this;
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        let screenreaderNotifcationTimeoutId;

        const stats = {};
        ['test', 'testPart', 'section', 'item']
            .forEach((scope) => Object.assign(
                stats,
                {[scope]: statsHelper.getInstantStats(scope, testRunner)})
            );

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
             * The list of configured warnings for screenreaders
             */
            warningsForScreenreader: (testRunnerOptions.timerWarningForScreenreader) || {},

            /**
             * The guided navigation option
             */
            guidedNavigation: testRunnerOptions.guidedNavigation,

            /**
             * Restore timer from client.
             */
            restoreTimerFromClient: testRunnerOptions.timer && testRunnerOptions.timer.restoreTimerFromClient,

            /**
             * Questions stats
             */
            questionsStats: stats
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
                    .on('tick', function(elapsed) {
                        if (self.timerbox) {
                            const timers = self.timerbox.getTimers();

                            const updatedTimers = Object.keys(timers).reduce((acc, timerName) => {
                                acc[timerName] = Object.assign(
                                    {},
                                    timers[timerName],
                                    {
                                        remainingTime: timers[timerName].remainingTime - elapsed,
                                    }
                                );

                                return acc;
                            }, {});

                            self.timerbox
                                .update(updatedTimers)
                                .catch(handleError);
                        }
                    })
                    .after('renderitem', function() {
                        if (self.timerbox) {
                            $(self.timerbox.getElement()).find('.timer-wrapper')
                                .attr('aria-hidden', isReviewPanelEnabled(testRunner));
                            self.timerbox.start();
                        }

                        self.$screenreaderWarningContainer.text('');
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
                            ariaHidden: isReviewPanelEnabled(testRunner),
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

                        // share this timer values to use in other components
                        self.timerbox.spread(testRunner, 'timertick');

                        if (!config.contextualWarnings) {
                            self.timerbox.on('warn', function(message, level) {
                                if (level && message) {
                                    testRunner.trigger(level, message);
                                }
                            });

                            // debounce used to prevent multiple invoking at the same time
                            self.timerbox.on('warnscreenreader', _.debounce(
                                (message, remainingTime, scope) => {
                                    const stats = statsHelper.getInstantStats(scope, testRunner);
                                    const unansweredQuestions = stats && (stats.questions - stats.answered);

                                    if (screenreaderNotifcationTimeoutId) {
                                        clearTimeout(screenreaderNotifcationTimeoutId);
                                    }

                                    self.$screenreaderWarningContainer.text(
                                        message(remainingTime, unansweredQuestions)
                                    );

                                    screenreaderNotifcationTimeoutId = setTimeout(
                                        () => self.$screenreaderWarningContainer.text(''),
                                        screenreaderNotificationTimeout
                                    );
                                },
                                1000,
                                {
                                    'leading': true,
                                    'trailing': false
                                }
                            ));
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
        const $container = this.getAreaBroker().getControlArea();

        this.$screenreaderWarningContainer = $(screenreaderNotificationTpl());
        this.timerbox.render($container);
        $container.append(this.$screenreaderWarningContainer);
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
