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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Péter Halász <peter@taotesting.com>
 */
import _ from 'lodash';
import offlineNavigatorFactory from 'taoQtiTest/runner/navigator/offlineNavigator';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import dataUpdater from 'taoQtiTest/runner/provider/dataUpdater';
import qtiServiceProxy from 'taoQtiTest/runner/proxy/qtiServiceProxy';
import itemStoreFactory from 'taoQtiTest/runner/proxy/cache/itemStore';
import actionStoreFactory from 'taoQtiTest/runner/proxy/cache/actionStore';
import offlineErrorHelper from 'taoQtiTest/runner/helpers/offlineErrorHelper';
import offlineSyncModal from 'taoQtiTest/runner/helpers/offlineSyncModal';
import responseStoreFactory from 'taoQtiTest/runner/services/responseStore';
import download from 'util/download';
import states from 'taoQtiTest/runner/config/states';

/**
 * Overrides the qtiServiceProxy with the offline behavior
 * @extends taoQtiTest/runner/proxy/qtiServiceProxy
 */
export default _.defaults(
    {
        name: 'offline',

        /**
         * Installs the proxy
         * @param {object} config
         */
        install: function install(config) {
            var self = this;
            const maxSyncAttempts = 3;

            // install the parent proxy
            qtiServiceProxy.install.call(this);

            // we keep items here
            this.itemStore = itemStoreFactory({
                preload: true,
                testId: config.serviceCallId
            });

            this.responseStore = responseStoreFactory();

            this.offlineNavigator = offlineNavigatorFactory(this.itemStore, this.responseStore);

            // where we keep actions
            this.actionStore = null;

            // configuration params, that comes on every request/params
            this.requestConfig = {};

            // scheduled action promises which supposed to be resolved after action synchronization.
            this.actionPromises = {};

            this.syncInProgress = false; // is data synchronization in progress

            // let's you update test data (testContext and testMap)
            this.dataUpdater = dataUpdater(this.getDataHolder());

            /**
             * Check whether we have the item in the store
             *
             * @param {String} itemIdentifier - the item identifier
             * @returns {Boolean}
             */
            this.hasItem = function hasItem(itemIdentifier) {
                return itemIdentifier && self.itemStore.has(itemIdentifier);
            };

            /**
             * Check whether we have the next item in the store
             *
             * @param {String} itemIdentifier - the CURRENT item identifier
             * @returns {Boolean}
             */
            this.hasNextItem = function hasNextItem(itemIdentifier) {
                var sibling = navigationHelper.getNextItem(this.getDataHolder().get('testMap'), itemIdentifier);

                return sibling && self.hasItem(sibling.id);
            };

            /**
             * Check whether we have the previous item in the store
             *
             * @param {String} itemIdentifier - the CURRENT item identifier
             * @returns {Boolean}
             */
            this.hasPreviousItem = function hasPreviousItem(itemIdentifier) {
                var sibling = navigationHelper.getPreviousItem(this.getDataHolder().get('testMap'), itemIdentifier);

                return sibling && self.hasItem(sibling.id);
            };

            /**
             * Offline navigation
             *
             * @param {String} action - the action name (ie. move, skip, timeout)
             * @param {Object} actionParams - the parameters sent along the action
             * @returns {Object} action result
             */
            this.offlineAction = function offlineAction(action, actionParams) {
                return new Promise(function(resolve, reject) {
                    var result = { success: true };
                    var blockingActions = ['exitTest', 'timeout', 'pause'];
                    var dataHolder = self.getDataHolder();
                    var testContext = dataHolder.get('testContext');
                    var testMap = dataHolder.get('testMap');
                    var isLast =
                        testContext && testMap ? navigationHelper.isLast(testMap, testContext.itemIdentifier) : false;
                    var isOffline = self.isOffline();
                    var isBlocked = _.contains(blockingActions, action);
                    var isNavigationAction = actionParams.direction === 'next' || action === 'skip';
                    var isDirectionDefined;
                    var isMeaningfullScope = !!actionParams.scope;

                    /***
                     * performs navigation trough items of given test parameters according to action parameters
                     * doesent need active internet connection
                     * @param navigator - navigator helper used with this proxy
                     * @param {Object} options - options to manage the navigation
                     * @param {Object} options.testContext - current test testContext dataset
                     * @param {Object} results - navigtion result output object
                     */
                    var navigate = function(navigator, options, results) {
                        var newTestContext;

                        navigator
                            .setTestContext(options.testContext)
                            .setTestMap(options.testMap)
                            .navigate(actionParams.direction, actionParams.scope, actionParams.ref, actionParams)
                            .then(function(res) {
                                newTestContext = res;

                                if (
                                    !newTestContext ||
                                    !newTestContext.itemIdentifier ||
                                    !self.hasItem(newTestContext.itemIdentifier)
                                ) {
                                    throw offlineErrorHelper.buildErrorFromContext(
                                        offlineErrorHelper.getOfflineNavError()
                                    );
                                }

                                results.testContext = newTestContext;
                                resolve(results);
                            })
                            .catch(function(err) {
                                reject(err);
                            });
                    };

                    if (action === 'skip') {
                        actionParams.direction = action;
                    }

                    isDirectionDefined = !!actionParams.direction;

                    if (isBlocked || (isNavigationAction && isLast)) {
                        // the last item of the test
                        result.testContext = {
                            state: states.testSession.closed
                        };
                        const offlineSync = function() {
                            offlineSyncModal(self)
                                .on('proceed', function() {
                                    self.syncData()
                                        .then(function() {
                                            // if is online resolve promise
                                            if (self.isOnline()) {
                                                return resolve(result);
                                            }
                                        })
                                        .catch(function() {
                                            return resolve({ success: false });
                                        });
                                })
                                .on('secondaryaction', function() {
                                    self.initiateDownload().catch(function() {
                                        return resolve({ success: false });
                                    });
                                });
                        };
                        if (isOffline) {
                            return offlineSync();
                        } else {
                            return self
                                .syncData()
                                .then(function() {
                                    if (self.isOffline()) {
                                        // in case last request was failed and connection lost
                                        // show offlineWaitingDialog
                                        return offlineSync();
                                    }
                                    return resolve(result);
                                })
                                .catch(function() {
                                    return resolve({ success: false });
                                });
                        }
                    } else if (isDirectionDefined && isMeaningfullScope) {
                        //navigation actions
                        if (isOffline) {
                            navigate(
                                self.offlineNavigator,
                                {
                                    testContext: testContext,
                                    testMap: testMap
                                },
                                result
                            );
                        } else {
                            return self
                                .syncData()
                                .then(function() {
                                    navigate(
                                        self.offlineNavigator,
                                        {
                                            testContext: testContext,
                                            testMap: testMap
                                        },
                                        result
                                    );
                                })
                                .catch(function() {
                                    return resolve({ success: false });
                                });
                        }
                    } else {
                        //common behaviour
                        resolve(result);
                    }
                });
            };

            /**
             * Schedule an action do be done with next call
             *
             * @param {String} action - the action name (ie. move, skip, timeout)
             * @param {Object} actionParams - the parameters sent along the action
             * @returns {Promise} resolves with the action data
             */
            this.scheduleAction = function scheduleAction(action, actionParams) {
                actionParams = _.assign(actionParams, {
                    actionId: `${action}_${new Date().getTime()}`,
                    offline: true
                });

                return self.actionStore
                    .push(action, self.prepareParams(_.defaults(actionParams || {}, self.requestConfig)))
                    .then(function() {
                        return {
                            action: action,
                            params: actionParams
                        };
                    });
            };

            /**
             * Try to sync data until reached max attempts
             *
             * @param {Object} data - sync payload
             * @param {Number} attempt - current attempt
             * @returns {Promise} resolves with the action result
             */
            this.sendSyncData = function sendSyncData(data, attempt = 1) {
                return new Promise((resolve, reject) => self.send('sync', data)
                    .then(resolve)
                    .catch((err) => {
                        if (self.isConnectivityError(err) && attempt < maxSyncAttempts) {
                            return self.sendSyncData(data, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }

                        return reject(err);
                    })
                );
            };


            /**
             * Flush and synchronize actions collected while offline
             *
             * @returns {Promise} resolves with the action result
             */
            this.syncData = function syncData() {
                var actions;

                this.syncInProgress = true;

                return this.queue.serie(function() {
                    return self.actionStore
                        .flush()
                        .then(function(data) {
                            actions = data;
                            if (data && data.length) {
                                return self.sendSyncData(data);
                            }
                        })
                        .catch(function(err) {
                            if (self.isConnectivityError(err)) {
                                self.setOffline('communicator');
                                _.forEach(actions, function(action) {
                                    self.actionStore.push(action.action, action.parameters, action.timestamp);
                                });
                                return;
                            }

                            self.syncInProgress = false;
                            self.trigger('error', err);

                            throw err;
                        }).then(data => {
                            self.syncInProgress = false;
                            return data;
                        });
                });
            };

            this.prepareDownload = function prepareDownload(actions) {
                const timestamp = Date.now();
                const dateTime = new Date(timestamp).toISOString();

                //@deprecated
                const testData = self.getDataHolder().get('testData');
                const testMap = self.getDataHolder().get('testMap');
                const niceFilename = `Download of ${testMap.title} at ${dateTime}.json`;
                const isExitTest = actions.some(elem => elem.action === 'exitTest');

                return {
                    filename: niceFilename,
                    content: JSON.stringify({
                        isExitTest: isExitTest,
                        timestamp: timestamp,
                        testData: testData,
                        actionQueue: actions,
                        testConfig: self.requestConfig
                    })
                };
            };

            this.initiateDownload = function initiateDownload() {
                return this.queue.serie(function() {
                    return self.actionStore
                        .flush()
                        .then(function(actions) {
                            _.forEach(actions, function(action) {
                                self.actionStore.push(action.action, action.parameters, action.timestamp);
                            });

                            return actions;
                        })
                        .then(self.prepareDownload)
                        .then(function(data) {
                            return download(data.filename, data.content);
                        });
                });
            };
        },

        /**
         * Initializes the proxy
         *
         * @param {Object} config - The config provided to the proxy factory
         * @param {String} config.testDefinition - The URI of the test
         * @param {String} config.testCompilation - The URI of the compiled delivery
         * @param {String} config.serviceCallId - The URI of the service call
         * @param {Object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The proxy will be fully initialized on resolve.
         *                      Any error will be provided if rejected.
         */
        init: function init(config, params) {
            var self = this;

            // run the init
            var InitCallPromise = qtiServiceProxy.init.call(this, config, params);

            if (!this.getDataHolder()) {
                throw new Error('Unable to retrieve test runners data holder');
            }

            // those needs to be in each request params.
            this.requestConfig = _.pick(config, ['testDefinition', 'testCompilation', 'serviceCallId']);

            // set up the action store for the current service call
            this.actionStore = actionStoreFactory(config.serviceCallId);

            // stop error event propagation if sync is in progress
            this.before('error', (e, error) => {
                if (self.isConnectivityError(error) && self.syncInProgress) {
                    return false;
                }

                return true;
            });

            return InitCallPromise.then(function(response) {
                var promises = [];

                if (!response.items) {
                    response.items = {};
                }

                self.itemStore.setCacheSize(_.size(response.items));

                _.forEach(response.items, function(item, itemIdentifier) {
                    promises.push(self.itemStore.set(itemIdentifier, item));
                });

                return Promise.all(promises)
                    .then(() => {
                        return self.offlineNavigator
                            .setTestContext(response.testContext)
                            .setTestMap(response.testMap)
                            .init();
                    })
                    .then(() => response);
            });
        },

        /**
         * Uninstalls the proxy
         *
         * @returns {Promise} - Returns a promise. The proxy will be fully uninstalled on resolve.
         *                      Any error will be provided if rejected.
         */
        destroy: function destroy() {
            var self = this;

            return this.itemStore.clear().then(function() {
                return qtiServiceProxy.destroy.call(self);
            });
        },

        /**
         * Gets an item definition by its identifier, also gets its current state
         *
         * @param {String} itemIdentifier
         * @returns {Promise} - Returns a promise. The item data will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        getItem: function getItem(itemIdentifier) {
            return this.itemStore.get(itemIdentifier);
        },

        /**
         * Submits the state and the response of a particular item
         *
         * @param {String} itemIdentifier - The identifier of the item to update
         * @param {Object} state - The state to submit
         * @param {Object} response - The response object to submit
         * @param {Object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        submitItem: function submitItem(itemIdentifier, state, response, params) {
            var self = this;

            return this.itemStore.update(itemIdentifier, 'itemState', state).then(function() {
                return qtiServiceProxy.submitItem.call(self, itemIdentifier, state, response, params);
            });
        },

        /**
         * Sends the test variables
         *
         * @param {Object} variables
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         * @fires sendVariables
         */
        sendVariables: function sendVariables(variables) {
            var self = this,
                action = 'storeTraceData',
                actionParams = { traceData: JSON.stringify(variables) };

            return self
                .scheduleAction(action, actionParams)
                .then(function() {
                    return self.offlineAction(action, actionParams);
                })
                .catch(function(err) {
                    return Promise.reject(err);
                });
        },

        /**
         * Calls an action related to the test
         *
         * @param {String} action - The name of the action to call
         * @param {Object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        callTestAction: function callTestAction(action, params) {
            var self = this;

            return self
                .scheduleAction(action, params)
                .then(function() {
                    return self.offlineAction(action, params);
                })
                .catch(function(err) {
                    return Promise.reject(err);
                });
        },

        /**
         * Calls an action related to a particular item
         *
         * @param {String} itemIdentifier - The identifier of the item for which call the action
         * @param {String} action - The name of the action to call
         * @param {Object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        callItemAction: function callItemAction(itemIdentifier, action, params) {
            var self = this,
                updateStatePromise = Promise.resolve();

            //update the item state
            if (params.itemState) {
                updateStatePromise = this.itemStore.update(itemIdentifier, 'itemState', params.itemState);
            }

            // If item action is move to another item ensure the next request will start the timer
            if (
                navigationHelper.isMovingToNextItem(action, params) ||
                navigationHelper.isMovingToPreviousItem(action, params) ||
                navigationHelper.isJumpingToItem(action, params)
            ) {
                params.start = true;
            }

            return updateStatePromise
                .then(function() {
                    params = _.assign({ itemDefinition: itemIdentifier }, params);

                    return self
                        .scheduleAction(action, params)
                        .then(function() {
                            return self.offlineAction(action, params);
                        })
                        .catch(function(err) {
                            return Promise.reject(err);
                        });
                })
                .catch(function(err) {
                    return Promise.reject(err);
                });
        }
    },
    qtiServiceProxy
);
