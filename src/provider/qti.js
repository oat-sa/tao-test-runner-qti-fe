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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * Test Runner provider for QTI Tests.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import cachedStore from 'core/cachedStore';
import areaBrokerFactory from 'taoTests/runner/areaBroker';
import proxyFactory from 'taoTests/runner/proxy';
import probeOverseerFactory from 'taoTests/runner/probeOverseer';
import testStoreFactory from 'taoTests/runner/testStore';
import dataUpdater from 'taoQtiTest/runner/provider/dataUpdater';
import toolStateBridgeFactory from 'taoQtiTest/runner/provider/toolStateBridge';
import currentItemHelper from 'taoQtiTest/runner/helpers/currentItem';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import toolboxFactory from 'taoQtiTest/runner/ui/toolbox/toolbox';
import qtiItemRunner from 'taoQtiItem/runner/qtiItemRunner';
import getAssetManager from 'taoQtiTest/runner/config/assetManager';
import layoutTpl from 'taoQtiTest/runner/provider/layout';
import states from 'taoQtiTest/runner/config/states';
import stopwatchFactory from 'taoQtiTest/runner/provider/stopwatch';

/**
 * A Test runner provider to be registered against the runner
 */
var qtiProvider = {
    //provider name
    name: 'qti',

    /**
     * Initialize and load the area broker with a correct mapping
     * @returns {areaBroker}
     */
    loadAreaBroker: function loadAreaBroker() {
        var $layout = $(layoutTpl());

        return areaBrokerFactory($layout, {
            content: $('#qti-content', $layout),
            toolbox: $('.tools-box', $layout),
            navigation: $('.navi-box-list', $layout),
            mainLandmark: $('#test-title-header', $layout),
            control: $('.top-action-bar .control-box', $layout),
            actionsBar: $('.bottom-action-bar .control-box', $layout),
            panel: $('.test-sidebar-left', $layout),
            header: $('.title-box', $layout)
        });
    },

    /**
     * Initialize and load the test runner proxy
     * @returns {proxy}
     */
    loadProxy: function loadProxy() {
        var config = this.getConfig();

        var proxyProvider = config.provider.proxy || 'qtiServiceProxy';
        var proxyConfig = _.pick(config, ['testDefinition', 'testCompilation', 'serviceCallId', 'bootstrap', 'options']);

        return proxyFactory(proxyProvider, proxyConfig);
    },

    /**
     * Initialize and load the probe overseer
     * @returns {probeOverseer}
     */
    loadProbeOverseer: function loadProbeOverseer() {
        //the test run needs to be identified uniquely
        return probeOverseerFactory(this);
    },

    /**
     * Initialize and load the test store
     * @returns {testStore}
     */
    loadTestStore: function loadTestStore() {
        var config = this.getConfig();

        //the test run needs to be identified uniquely
        var identifier = config.serviceCallId || `test-${Date.now()}`;
        return testStoreFactory(identifier);
    },

    /**
     * Loads the persistent states storage
     *
     * @returns {Promise}
     */
    loadPersistentStates: function loadPersistentStates() {
        var self = this;
        var config = this.getConfig();
        var persistencePromise = cachedStore(`test-states-${config.serviceCallId}`, 'states');

        persistencePromise.catch(function(err) {
            self.trigger('error', err);
        });

        return persistencePromise.then(function(storage) {
            self.stateStorage = storage;
        });
    },

    /**
     * Checks a runner persistent state
     *
     * @param {String} name - the state name
     * @returns {Boolean} if active, false if not set
     */
    getPersistentState: function getPersistentState(name) {
        if (this.stateStorage) {
            return this.stateStorage.getItem(name);
        }
    },

    /**
     * Defines a runner persistent state
     *
     * @param {String} name - the state name
     * @param {Boolean} active - is the state active
     * @returns {Promise} Returns a promise that:
     *                      - will be resolved once the state is fully stored
     *                      - will be rejected if any error occurs or if the state name is not a valid string
     */
    setPersistentState: function setPersistentState(name, active) {
        var self = this;
        var setPromise;

        if (this.stateStorage) {
            setPromise = this.stateStorage.setItem(name, active);

            setPromise.catch(function(err) {
                self.trigger('error', err);
            });

            return setPromise;
        }
    },

    /**
     * Install step : install new methods/behavior
     *
     * @this {runner} the runner context, not the provider
     */
    install() {
        /**
         * Delegates the update of testMap, testContext and testData
         * to a 3rd part component, the dataUpdater.
         */
        this.dataUpdater = dataUpdater(this.getDataHolder());

        /**
         * The tool state bridge manages the state of the tools (plugins)
         * it updated directly the store of the plugins when configured to resume their values
         */
        this.toolStateBridge = toolStateBridgeFactory(this.getTestStore(), _.keys(this.getPlugins()));

        /**
         * Convenience function to load the current item from the testMap
         * @returns {Object?} the current item if any or falsy
         */
        this.getCurrentItem = function getCurrentItem() {
            const testContext = this.getTestContext();
            const testMap     = this.getTestMap();
            if (testContext && testMap && testContext.itemIdentifier) {
                return mapHelper.getItem(testMap, testContext.itemIdentifier);
            }
        };

        /**
         * Convenience function to load the current section from the testMap
         * @returns {Object?} the current section if any or falsy
         */
        this.getCurrentSection = function getCurrentSection() {
            const testContext = this.getTestContext();
            const testMap     = this.getTestMap();
            if (testContext && testMap && testContext.sectionId) {
                return mapHelper.getSection(testMap, testContext.sectionId);
            }
        };

        /**
         * Convenience function to load the current part from the testMap
         * @returns {Object?} the current part if any or falsy
         */
        this.getCurrentPart = function getCurrentPart() {
            const testContext = this.getTestContext();
            const testMap     = this.getTestMap();
            if (testContext && testMap && testContext.testPartId) {
                return mapHelper.getPart(testMap, testContext.testPartId);
            }
        };
    },

    /**
     * Initialization of the provider, called during test runner init phase.
     *
     * We install behaviors during this phase (ie. even handlers)
     * and we call proxy.init.
     *
     * @this {runner} the runner context, not the provider
     * @returns {Promise} to chain proxy.init
     */
    init: function init() {
        const self = this;
        const config = this.getConfig();
        const areaBroker = this.getAreaBroker();

        /**
         * Retrieve the item results
         * @returns {Object} the results
         */
        function getItemResults() {
            var results = {};
            var context = self.getTestContext();
            if (context && self.itemRunner && context.itemSessionState <= states.itemSession.interacting) {
                results = {
                    itemResponse: self.itemRunner.getResponses(),
                    itemState: self.itemRunner.getState()
                };
            }
            return results;
        }

        /**
         * Compute the next item for the given action
         * @param {String} action - item action like move/next, skip, etc.
         * @param {Object} [params] - the item action additional params
         * @param {Promise} [loadPromise] - wait this Promise to resolve before loading the item.
         */
        function computeNext(action, params, loadPromise) {
            const context = self.getTestContext();
            const currentItem = self.getCurrentItem();

            //catch server errors
            var submitError = function submitError(err) {
                if (err && err.unrecoverable){
                    self.trigger(
                        'alert.error',
                        __(
                            'An unrecoverable error occurred. Your test session will be paused.'
                        )
                    );

                    self.trigger('pause', {message : err.message});
                } else if (err.code === 200) {
                    //some server errors are valid, so we don't fail (prevent empty responses)
                    self.trigger(
                        'alert.submitError',
                        err.message || __('An error occurred during results submission. Please retry.'),
                        load
                    );
                } else {
                    self.trigger('error', err);
                }
            };

            //if we have to display modal feedbacks, we submit the responses before the move
            const feedbackPromise = new Promise(resolve => {

                //@deprecated feedbacks from testContext
                if (currentItem.hasFeedbacks || context.hasFeedbacks) {
                    params = _.omit(params, ['itemState', 'itemResponse']);

                    self.getProxy()
                        .submitItem(
                            context.itemIdentifier,
                            self.itemRunner.getState(),
                            self.itemRunner.getResponses(),
                            params
                        )
                        .then( results => {
                            if (results.itemSession) {
                                currentItem.answered = results.itemSession.itemAnswered;

                                if (results.displayFeedbacks === true && results.feedbacks) {
                                    self.itemRunner.renderFeedbacks(results.feedbacks, results.itemSession, function(
                                        queue
                                    ) {
                                        self.trigger('modalFeedbacks', queue, resolve);
                                    });
                                    return;
                                }
                            }
                            return resolve();
                        })
                        .catch(submitError);
                } else {
                    if (action === 'skip') {
                        currentItem.answered = false;
                    } else {
                        // when the test part is linear, the item is always answered as we cannot come back to it
                        const testPart = self.getCurrentPart();
                        const isLinear = testPart && testPart.isLinear;
                        currentItem.answered = isLinear || currentItemHelper.isAnswered(self);
                    }
                    resolve();
                }
            });

            feedbackPromise
                .then(function() {
                    return self.toolStateBridge.getStates();
                })
                .then(function(toolStates) {
                    if (toolStates && _.size(toolStates) > 0) {
                        params.toolStates = toolStates;
                    }

                    // ensure the answered state of the current item is correctly set and the stats are aligned
                    self.setTestMap(self.dataUpdater.updateStats());

                    //to be sure load start after unload...
                    //we add an intermediate ns event on unload
                    self.on(`unloaditem.${action}`, function() {
                        self.off(`.${action}`);

                        self.getProxy()
                            .callItemAction(context.itemIdentifier, action, params)
                            .then(function(results) {
                                loadPromise = loadPromise || Promise.resolve();

                                return loadPromise.then(function() {
                                    return results;
                                });
                            })
                            .then(function(results) {
                                //update testData, testContext and build testMap
                                self.dataUpdater.update(results);

                                load();
                            })
                            .catch(submitError);
                    });

                    self.unloadItem(context.itemIdentifier);
                })
                .catch(submitError);
        }

        /**
         * Load the next action: load the current item or call finish based the test state
         */
        function load() {
            var context = self.getTestContext();
            if (context.state <= states.testSession.interacting) {
                self.loadItem(context.itemIdentifier);
            } else if (context.state === states.testSession.closed) {
                self.finish();
            }
        }

        areaBroker.setComponent('toolbox', toolboxFactory());
        areaBroker.getToolbox().init();

        const stopwatch = stopwatchFactory({});

        stopwatch.init();
        stopwatch.spread(this, 'tick');

        /*
         * Install behavior on events
         */
        this.on('ready', function() {
            //load the 1st item
            load();
        })
            .on('move', function(direction, scope, position) {
                // get the item results/state before disabling the tools
                // otherwise the state could be partially lost for tools that clean up when disabling
                var itemResults = getItemResults();

                this.trigger('disablenav disabletools');

                computeNext(
                    'move',
                    _.merge(itemResults, {
                        direction: direction,
                        scope: scope || 'item',
                        ref: position
                    })
                );
            })
            .on('skip', function(scope) {
                this.trigger('disablenav disabletools');

                computeNext('skip', {
                    scope: scope || 'item'
                });
            })
            .on('exit', function(reason) {
                var context = self.getTestContext();

                this.disableItem(context.itemIdentifier);

                this.getProxy()
                    .callTestAction(
                        'exitTest',
                        _.merge(getItemResults(), {
                            itemDefinition: context.itemIdentifier,
                            reason: reason
                        })
                    )
                    .then(function() {
                        return self.finish();
                    })
                    .catch(function(err) {
                        self.trigger('error', err);
                    });
            })
            .on('timeout', function(scope, ref, timer) {
                const context = self.getTestContext();
                const noAlertTimeout = mapHelper.hasItemCategory(
                    self.getTestMap(),
                    context.itemIdentifier,
                    'noAlertTimeout',
                    true
                );

                context.isTimeout = true;

                this.setTestContext(context);

                if (timer && timer.allowLateSubmission) {
                    self.trigger(
                        'alert.timeout',
                        __(
                            'Time limit reached, this part of the test has ended. However you are allowed to finish the current item.'
                        )
                    );
                    self.before('move.latetimeout', function() {
                        self.off('move.latetimeout');
                        computeNext(
                            'timeout',
                            _.merge(getItemResults(), {
                                scope: scope,
                                ref: ref,
                                late: true
                            })
                        );
                        return Promise.reject({ cancel: true });
                    });
                } else {
                    this.disableItem(context.itemIdentifier);

                    computeNext(
                        'timeout',
                        _.merge(getItemResults(), {
                            scope: scope,
                            ref: ref
                        }),
                        new Promise(function(resolve) {
                            if ( noAlertTimeout ) {
                                resolve();
                            } else {
                                self.trigger(
                                    'alert.timeout',
                                    __('The time limit has been reached for this part of the test.'),
                                    () => {
                                        self.trigger('timeoutAccepted');

                                        resolve();
                                    }
                                );
                            }
                        })
                    );
                }
            })
            .on('pause', function(data) {
                this.setState('closedOrSuspended', true);

                this.getProxy()
                    .callTestAction('pause', {
                        reason: {
                            reasons: data && data.reasons,
                            comment: data && (data.originalMessage || data.message)
                        }
                    })
                    .then(function() {
                        self.trigger('leave', {
                            code: states.testSession.suspended,
                            message: data && data.message
                        });
                    })
                    .catch(function(err) {
                        self.trigger('error', err);
                    });
            })
            .before('move skip exit timeout pause', function() {
                stopwatch.stop();
            })
            .on('loaditem', function() {
                var context = this.getTestContext();
                var warning = false;

                /**
                 * Get the label of the current item
                 * @returns {String} the label (fallback to the item identifier);
                 */
                var getItemLabel = function getItemLabel() {
                    const item = self.getCurrentItem();
                    return item && item.label ? item.label : context.itemIdentifier;
                };

                //The item is rendered but in a state that prevents us from interacting
                if (context.isTimeout) {
                    warning = __('Time limit reached for item "%s".', getItemLabel());
                } else if (context.itemSessionState > states.itemSession.interacting) {
                    if (context.remainingAttempts === 0) {
                        warning = __('No more attempts allowed for item "%s".', getItemLabel());
                    } else {
                        warning = __('Item "%s" is completed.', getItemLabel());
                    }
                }

                //we disable the item and warn the user
                if (warning) {
                    self.disableItem(context.itemIdentifier);
                    self.trigger('warning', warning);
                }
            })
            .on('renderitem', function() {
                var context = this.getTestContext();

                if (!this.getItemState(context.itemIdentifier, 'disabled')) {
                    this.trigger('enabletools');
                }
                this.trigger('enablenav');
            })
            .after('renderitem', function(){
                stopwatch.start();
            })
            .on('resumeitem', function() {
                this.trigger('enableitem enablenav');
            })
            .on('disableitem', function() {
                stopwatch.stop();

                this.trigger('disabletools');
            })
            .on('enableitem', function() {
                stopwatch.start();

                this.trigger('enabletools');
            })
            .on('error', function() {
                stopwatch.stop();

                this.trigger('disabletools enablenav');
            })
            .on('finish', function() {
                this.flush();
            })
            .on('leave', function() {
                this.trigger('endsession');
                this.flush();
            })
            .on('flush', function() {
                this.destroy();

                stopwatch.destroy();
            });

        //starts the event collection
        if (this.getProbeOverseer()) {
            this.getProbeOverseer().start();
        }

        //get the current store identifier to send it along with the init call
        return this.getTestStore()
            .getStorageIdentifier()
            .then(function(storeId) {
                //load data and current context in parallel at initialization
                return self
                    .getProxy()
                    .init({
                        storeId: storeId
                    })
                    .then(function(response) {

                        //handle backward compatibility with testData
                        if( response.testData ) {
                            Object.assign(config.options, response.testData.config);
                        }

                        //fill the dataHolder, build the jump table, etc.
                        self.dataUpdater.update(response);

                        //set the plugin config
                        self.dataUpdater.updatePluginsConfig(
                            self.getPlugins(),
                            self.getPluginsConfig()
                        );

                        //this checks the received storeId and clear the volatiles stores
                        return self
                            .getTestStore()
                            .clearVolatileIfStoreChange(response.lastStoreId)
                            .then(function() {
                                return response;
                            });
                    })
                    .then(function(response) {
                        var isNewStore = !response.lastStoreId || response.lastStoreId !== storeId;
                        if (response.toolStates && isNewStore) {
                            return self.toolStateBridge
                                .setTools(_.keys(response.toolStates))
                                .restoreStates(response.toolStates);
                        }
                    });
            });
    },

    /**
     * Rendering phase of the test runner
     *
     * Attach the test runner to the DOM
     *
     * @this {runner} the runner context, not the provider
     */
    render: function render() {
        var config = this.getConfig();
        var areaBroker = this.getAreaBroker();

        config.renderTo.append(areaBroker.getContainer());

        areaBroker.getToolbox().render(areaBroker.getToolboxArea());
    },

    /**
     * LoadItem phase of the test runner
     *
     * We call the proxy in order to get the item data
     *
     * @this {runner} the runner context, not the provider
     * @param {String} itemIdentifier - The identifier of the item to update
     * @returns {Promise} that calls in parallel the state and the item data
     */
    loadItem: function loadItem(itemIdentifier) {
        return this.getProxy()
            .getItem(itemIdentifier)
            .then(function(data) {
                //aggregate the results
                return {
                    content: data.itemData,
                    baseUrl: data.baseUrl,
                    state: data.itemState,
                    portableElements: data.portableElements
                };
            });
    },

    /**
     * RenderItem phase of the test runner
     *
     * Here we initialize the item runner and wrap it's call to the test runner
     *
     * @this {runner} the runner context, not the provider
     * @param {String} itemIdentifier - The identifier of the item to update
     * @param {Object} itemData - The definition data of the item
     * @returns {Promise} resolves when the item is ready
     */
    renderItem: function renderItem(itemIdentifier, itemData) {
        var self = this;

        var config = this.getConfig();

        var assetManager = getAssetManager(config.serviceCallId);

        var changeState = function changeState() {
            self.setItemState(itemIdentifier, 'changed', true);
        };

        return new Promise(function(resolve, reject) {
            assetManager.setData('baseUrl', itemData.baseUrl);
            assetManager.setData('itemIdentifier', itemIdentifier);
            assetManager.setData('assets', itemData.content.assets);

            itemData.content = itemData.content || {};

            self.itemRunner = qtiItemRunner(itemData.content.type, itemData.content.data, {
                assetManager: assetManager
            })
                .on('error', function(err) {
                    if(err && err.unrecoverable){
                        self.trigger('pause', {message : err.message});
                    } else {
                        self.trigger('enablenav');
                        reject(err);
                    }
                })
                .on('init', function() {
                    var itemContainer = self.getAreaBroker().getContentArea();
                    var itemRenderingOptions = _.pick(itemData, ['state', 'portableElements']);

                    this.render(itemContainer, itemRenderingOptions);
                })
                .on('render', function() {
                    this.on('responsechange', changeState);
                    this.on('statechange', changeState);

                    resolve();
                })
                .on('warning', function(err) {
                    self.trigger('warning', err);
                })
                .init();
        });
    },

    /**
     * UnloadItem phase of the test runner
     *
     * Item clean up
     *
     * @this {runner} the runner context, not the provider
     * @returns {Promise} resolves when the item is cleared
     */
    unloadItem: function unloadItem() {
        var self = this;

        self.trigger('beforeunloaditem disablenav disabletools');

        return new Promise(function(resolve) {
            if (self.itemRunner) {
                self.itemRunner.on('clear', resolve).clear();
                return;
            }
            resolve();
        });
    },

    /**
     * Finish phase of the test runner
     *
     * Calls proxy.finish to close the test
     *
     * @this {runner} the runner context, not the provider
     * @returns {Promise} proxy.finish
     */
    finish: function finish() {
        if (!this.getState('finish')) {
            this.trigger('disablenav disabletools');

            if (this.stateStorage) {
                return this.stateStorage.removeStore();
            }
        }
    },

    /**
     * Flushes the test variables before leaving the runner
     *
     * Clean up
     *
     * @this {runner} the runner context, not the provider
     * @returns {Promise}
     */
    flush: function flush() {
        var self = this;
        var probeOverseer = this.getProbeOverseer();
        var proxy = this.getProxy();
        var flushPromise;

        //if there is trace data collected by the probes
        if (probeOverseer && !this.getState('disconnected')) {
            flushPromise = probeOverseer
                .flush()
                .then(function(data) {
                    var traceData = {};

                    //we reformat the time set into a trace variables
                    if (data && data.length) {
                        _.forEach(data, function(entry) {
                            var id = `${entry.type}-${entry.id}`;

                            if (entry.marker) {
                                id = `${entry.marker}-${id}`;
                            }
                            traceData[id] = entry;
                        });
                        //and send them
                        return self.getProxy().sendVariables(traceData);
                    }
                })
                .then(function() {
                    probeOverseer.stop();
                })
                .catch(function() {
                    probeOverseer.stop();
                });
        } else {
            flushPromise = Promise.resolve();
        }

        return flushPromise.then(function() {
            // safely stop the communicator to prevent inconsistent communication while leaving
            if (proxy.hasCommunicator()) {
                proxy
                    .getCommunicator()
                    .then(function(communicator) {
                        return communicator.close();
                    })
                    // Silently catch the potential errors to avoid polluting the console.
                    // The code above is present to close an already open communicator in order to avoid later
                    // communication while the test is destroying. So if any error occurs here it is not very important,
                    // the most time it will be a missing communicator error, due to disabled config.
                    .catch(_.noop);
            }
        });
    },

    /**
     * Destroy phase of the test runner
     *
     * Clean up
     *
     * @this {runner} the runner context, not the provider
     * @returns void
     */
    destroy: function destroy() {
        var areaBroker = this.getAreaBroker();

        // prevent the item to be displayed while test runner is destroying
        if (this.itemRunner) {
            this.itemRunner.clear();
        }
        this.itemRunner = null;

        if (areaBroker) {
            areaBroker.getToolbox().destroy();
        }

        //we remove the store(s) only if the finish step was reached
        if (this.getState('finish')) {
            return this.getTestStore().remove();
        }
    }
};

export default qtiProvider;
