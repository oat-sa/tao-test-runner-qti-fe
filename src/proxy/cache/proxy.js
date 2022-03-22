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
 * Copyright (c) 2017-2021 Open Assessment Technologies SA
 */

/**
 * This proxy provider cache the next item
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import testNavigatorFactory from 'taoQtiTest/runner/navigator/navigator';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import dataUpdater from 'taoQtiTest/runner/provider/dataUpdater';
import qtiServiceProxy from 'taoQtiTest/runner/proxy/qtiServiceProxy';
import itemStoreFactory from 'taoQtiTest/runner/proxy/cache/itemStore';
import actionStoreFactory from 'taoQtiTest/runner/proxy/cache/actionStore';
import offlineErrorHelper from 'taoQtiTest/runner/helpers/offlineErrorHelper';

/**
 * The number of items to keep in the cache
 * @type {number}
 * @private
 */
const cacheSize = 20;

/**
 * The number of ms to wait after an item is loaded
 * to start loading the next.
 * This value is more or less the time needed to render an item.
 * @type {number}
 * @private
 */
const loadNextDelay = 450;

/**
 * The default TimeToLive for assets resolving, in seconds.
 * Each item comes with a baseUrl that may have a TTL bound to it.
 * Once this TTL is expired, the assets won't be reachable.
 * For this reason, we need to remove from the cache items having an expired TTL.
 * @type {number}
 * @private
 */
const defaultItemTTL = 15 * 60;

/**
 * Overrides the qtiServiceProxy with the precaching behavior
 * @extends taoQtiTest/runner/proxy/qtiServiceProxy
 */
export default _.defaults(
    {
        name: 'precaching',

        /**
         * Installs the proxy
         * @param {object} config
         */
        install(config) {
            //install the parent proxy
            qtiServiceProxy.install.call(this);

            /**
             * Gets the value of an item caching option. All values are numeric only.
             * @param {string} name
             * @param {number} defaultValue
             * @returns {number}
             */
            const getItemCachingOption = (name, defaultValue) => {
                if (config && config.options && config.options.itemCaching) {
                    return parseInt(config.options.itemCaching[name], 10) || defaultValue;
                }
                return defaultValue;
            };

            //we keep items here
            this.itemStore = itemStoreFactory({
                itemTTL: defaultItemTTL * 1000,
                maxSize: cacheSize,
                preload: true,
                testId: config.serviceCallId
            });

            //where we keep actions
            this.actiontStore = null;

            //can we load the next item from the cache/store ?
            this.getItemFromStore = false;

            //configuration params, that comes on every request/params
            this.requestConfig = {};

            //scheduled action promises which supposed to be resolved after action synchronization.
            this.actionPromises = {};

            //scheduled action reject promises which supposed to be rejected in case of failed synchronization.
            this.actionRejectPromises = {};

            //let's you update test data (testContext and testMap)
            this.dataUpdater = dataUpdater(this.getDataHolder());

            /**
             * Get the item cache size from the test data
             * @returns {number} the cache size
             */
            this.getCacheAmount = () => getItemCachingOption('amount', 1);

            /**
             * Get the item store TimeToLive
             * @returns {number} the item store TTL
             */
            this.getItemTTL = () => getItemCachingOption('itemStoreTTL', defaultItemTTL) * 1000;

            /**
             * Check whether we have the item in the store
             * @param {string} itemIdentifier - the item identifier
             * @returns {boolean}
             */
            this.hasItem = itemIdentifier => itemIdentifier && this.itemStore.has(itemIdentifier);

            /**
             * Check whether we have the next item in the store
             * @param {string} itemIdentifier - the CURRENT item identifier
             * @returns {boolean}
             */
            this.hasNextItem = itemIdentifier => {
                const sibling = navigationHelper.getNextItem(this.getDataHolder().get('testMap'), itemIdentifier);
                return sibling && this.hasItem(sibling.id);
            };

            /**
             * Check whether we have the previous item in the store
             * @param {string} itemIdentifier - the CURRENT item identifier
             * @returns {boolean}
             */
            this.hasPreviousItem = itemIdentifier => {
                const sibling = navigationHelper.getPreviousItem(this.getDataHolder().get('testMap'), itemIdentifier);
                return sibling && this.hasItem(sibling.id);
            };

            /**
             * Offline ? We try to navigate offline, or just say 'ok'
             *
             * @param {string} action - the action name (ie. move, skip, timeout)
             * @param {object} actionParams - the parameters sent along the action
             * @returns {object} action result
             */
            this.offlineAction = (action, actionParams) => {
                const result = { success: true };

                const blockingActions = ['exitTest', 'timeout'];

                const testContext = this.getDataHolder().get('testContext');
                const testMap = this.getDataHolder().get('testMap');

                if (action === 'pause') {
                    throw offlineErrorHelper.buildErrorFromContext(offlineErrorHelper.getOfflinePauseError(), {
                        reason: actionParams.reason
                    });
                }

                //we just block those actions and the end of the test
                if (
                    _.contains(blockingActions, action) ||
                    (actionParams.direction === 'next' && navigationHelper.isLast(testMap, testContext.itemIdentifier))
                ) {
                    throw offlineErrorHelper.buildErrorFromContext(offlineErrorHelper.getOfflineExitError());
                }

                // try the navigation if the actionParams context meaningful data
                if (actionParams.direction && actionParams.scope) {
                    const testNavigator = testNavigatorFactory(testContext, testMap);
                    const newTestContext = testNavigator.navigate(
                        actionParams.direction,
                        actionParams.scope,
                        actionParams.ref
                    );

                    //we are really not able to navigate
                    if (
                        !newTestContext ||
                        !newTestContext.itemIdentifier ||
                        !this.hasItem(newTestContext.itemIdentifier)
                    ) {
                        throw offlineErrorHelper.buildErrorFromContext(offlineErrorHelper.getOfflineNavError());
                    }

                    result.testContext = newTestContext;
                }

                this.markActionAsOffline(actionParams);

                return result;
            };

            /**
             * Process action which should be sent using message channel.
             *
             * @param {string} action
             * @param {object} actionParams
             * @param {boolean} deferred
             *
             * @returns {Promise} resolves with the action result
             */
            this.processSyncAction = (action, actionParams, deferred) => {
                return new Promise((resolve, reject) => {
                    this.scheduleAction(action, actionParams)
                        .then(actionData => {
                            this.actionPromises[actionData.params.actionId] = resolve;
                            this.actionRejectPromises[actionData.params.actionId] = reject;
                            if (!deferred) {
                                this.syncData()
                                    .then(result => {
                                        if (this.isOnline()) {
                                            _.forEach(result, actionResult => {
                                                const actionId =
                                                    actionResult.requestParameters &&
                                                    actionResult.requestParameters.actionId
                                                        ? actionResult.requestParameters.actionId
                                                        : null;

                                                if (!actionResult.success && this.actionRejectPromises[actionId]) {
                                                    const error = new Error(actionResult.message);
                                                    error.unrecoverable = true;
                                                    return reject(error);
                                                }

                                                if (actionId && this.actionPromises[actionId]) {
                                                    this.actionPromises[actionId](actionResult);
                                                }
                                            });
                                        }
                                    })
                                    .catch(reject);
                            }
                        })
                        .catch(reject);
                });
            };

            /**
             * Schedule an action do be done with next call
             *
             * @param {string} action - the action name (ie. move, skip, timeout)
             * @param {object} params - the parameters sent along the action
             * @returns {Promise} resolves with the action data
             */
            this.scheduleAction = (action, params) => {
                params.actionId = `${action}_${new Date().getTime()}`;
                return this.actiontStore
                    .push(action, this.prepareParams(_.defaults(params || {}, this.requestConfig)))
                    .then(() => ({ action, params }));
            };

            /**
             * Request/Offline strategy :
             *
             * ├─ Online
             * │  └─ run the request
             * │    ├─ request ok
             * │    └─ request fails
             * │       └─ run the offline action
             * └── Offline
             *    └─ send a telemetry request (connection could be back)
             *      ├─ request ok
             *      │  └─ sync data
             *      │     └─  run the request (back to the tree root)
             *      └─ request fails
             *         └─ run the offline action
             *
             * @param {string} url
             * @param {string} action - the action name (ie. move, skip, timeout)
             * @param {object} actionParams - the parameters sent along the action
             * @param {boolean} deferred whether action can be scheduled (put into queue) to be sent in a bunch of actions later.
             * @param {boolean} noToken whether the request should be sent with a CSRF token or not
             *
             * @returns {Promise} resolves with the action result
             */
            this.requestNetworkThenOffline = (url, action, actionParams, deferred, noToken) => {
                const testContext = this.getDataHolder().get('testContext');
                const communicationConfig = this.configStorage.getCommunicationConfig();

                //perform the request, but fallback on offline if the request itself fails
                const runRequestThenOffline = () => {
                    let request;
                    if (communicationConfig.syncActions && communicationConfig.syncActions.indexOf(action) >= 0) {
                        request = this.processSyncAction(action, actionParams, deferred);
                    } else {
                        //action is not synchronizable
                        //fallback to direct request
                        request = this.request(url, actionParams, void 0, noToken || false);
                        request.then(result => {
                            if (this.isOffline()) {
                                return this.scheduleAction(action, actionParams);
                            }
                            return result;
                        });
                    }

                    return request
                        .then(result => {
                            if (this.isOffline()) {
                                return this.offlineAction(action, actionParams);
                            }
                            return result;
                        })
                        .catch(error => {
                            if (this.isConnectivityError(error) && this.isOffline()) {
                                return this.offlineAction(action, actionParams);
                            }
                            throw error;
                        });
                };

                if (this.isOffline()) {
                    //try the telemetry action, just in case
                    return this.telemetry(testContext.itemIdentifier, 'up')
                        .then(() => {
                            //if the up request succeed, we run the request
                            if (this.isOnline()) {
                                return runRequestThenOffline();
                            }
                            return this.scheduleAction(action, actionParams).then(() => {
                                return this.offlineAction(action, actionParams);
                            });
                        })
                        .catch(err => {
                            if (this.isConnectivityError(err)) {
                                return this.scheduleAction(action, actionParams).then(() => {
                                    return this.offlineAction(action, actionParams);
                                });
                            }
                            throw err;
                        });
                }

                //by default we try to run the request first
                return runRequestThenOffline();
            };

            /**
             * Flush and synchronize actions collected while offline
             * @returns {Promise} resolves with the action result
             */
            this.syncData = () => {
                let actions;
                return this.queue.serie(() => {
                    return this.actiontStore
                        .flush()
                        .then(data => {
                            actions = data;
                            if (data && data.length) {
                                return this.send('sync', data);
                            }
                        })
                        .catch(err => {
                            if (this.isConnectivityError(err)) {
                                this.setOffline('communicator');
                                _.forEach(actions, action => {
                                    this.actiontStore.push(action.action, action.parameters);
                                });
                            }
                            throw err;
                        });
                });
            };

            /**
             * Flush the offline actions from the actionStore before reinserting them.
             * The exported copy can be used for file download.
             * The retained copy can still be synced as the test progresses.
             *
             * @returns {Promise} resolves with the store contents
             */
            this.exportActions = () => {
                return this.queue.serie(() => {
                    return this.actiontStore.flush().then(data => {
                        _.forEach(data, action => {
                            this.actiontStore.push(action.action, action.parameters);
                        });
                        return data;
                    });
                });
            };

            /**
             * Mark action as performed in offline mode
             * Action to mark as offline will be defined by actionParams.actionId parameter value.
             *
             * @param {object} actionParams - the action parameters
             * @returns {Promise}
             */
            this.markActionAsOffline = actionParams => {
                actionParams.offline = true;
                return this.queue.serie(() => {
                    return this.actiontStore.update(
                        this.prepareParams(_.defaults(actionParams || {}, this.requestConfig))
                    );
                });
            };
        },

        /**
         * Initializes the proxy
         * @param {object} config - The config provided to the proxy factory
         * @param {string} config.testDefinition - The URI of the test
         * @param {string} config.testCompilation - The URI of the compiled delivery
         * @param {string} config.serviceCallId - The URI of the service call
         * @param {object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The proxy will be fully initialized on resolve.
         *                      Any error will be provided if rejected.
         */
        init(config, params) {
            if (!this.getDataHolder()) {
                throw new Error('Unable to retrieve test runners data holder');
            }

            //those needs to be in each request params.
            this.requestConfig = _.pick(config, ['testDefinition', 'testCompilation', 'serviceCallId']);

            //set up the action store for the current service call
            this.actiontStore = actionStoreFactory(config.serviceCallId);

            //we resynchronise as soon as the connection is back
            this.on('reconnect', function () {
                return this.syncData()
                    .then(responses => {
                        this.dataUpdater.update(responses);
                    })
                    .catch(err => {
                        this.trigger('error', err);
                    });
            });

            //if some actions remains not synchronized
            this.syncData();

            //run the init
            return qtiServiceProxy.init.call(this, config, params);
        },

        /**
         * Uninstalls the proxy
         * @returns {Promise} - Returns a promise. The proxy will be fully uninstalled on resolve.
         *                      Any error will be provided if rejected.
         */
        destroy() {
            this.itemStore.clear();

            this.getItemFromStore = false;

            return qtiServiceProxy.destroy.call(this);
        },

        /**
         * Gets an item definition by its identifier, also gets its current state
         * @param {string} itemIdentifier - The identifier of the item to get
         * @param {object} [params] - additional parameters
         * @returns {Promise} - Returns a promise. The item data will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        getItem(itemIdentifier, params) {
            // remove the expired entries from the cache
            // prune anyway, if an issue occurs it should not prevent the remaining process to happen
            const pruneStore = () => this.itemStore.prune().catch(_.noop);

            /**
             * try to load the next items
             */
            const loadNextItem = () => {
                const testMap = this.getDataHolder().get('testMap');

                const siblings = navigationHelper.getSiblingItems(
                    testMap,
                    itemIdentifier,
                    'both',
                    this.getCacheAmount()
                );
                const missing = _.reduce(
                    siblings,
                    (list, sibling) => {
                        if (!this.hasItem(sibling.id)) {
                            list.push(sibling.id);
                        }
                        return list;
                    },
                    []
                );

                //don't run a request if not needed
                if (this.isOnline() && missing.length) {
                    _.delay(() => {
                        this.requestNetworkThenOffline(
                            this.configStorage.getTestActionUrl('getNextItemData'),
                            'getNextItemData',
                            { itemDefinition: missing },
                            false,
                            true
                        )
                            .then(response => {
                                if (response && response.items) {
                                    return pruneStore().then(() => {
                                        _.forEach(response.items, item => {
                                            if (item && item.itemIdentifier) {
                                                //store the response and start caching assets
                                                this.itemStore.set(item.itemIdentifier, item);
                                            }
                                        });
                                    });
                                }
                            })
                            .catch(_.noop);
                    }, loadNextDelay);
                }
            };

            // the additional proxy options are supplied after the 'init' phase as a result of the `init` action,
            // we need to apply them later
            this.itemStore.setItemTTL(this.getItemTTL());

            //resolve from the store
            if (this.getItemFromStore && this.itemStore.has(itemIdentifier)) {
                loadNextItem();

                return this.itemStore.get(itemIdentifier);
            }

            return this.request(
                this.configStorage.getItemActionUrl(itemIdentifier, 'getItem'),
                params,
                void 0,
                true
            ).then(response => {
                if (response && response.success) {
                    pruneStore().then(() => this.itemStore.set(itemIdentifier, response));
                }

                loadNextItem();

                return response;
            });
        },

        /**
         * Submits the state and the response of a particular item
         * @param {string} itemIdentifier - The identifier of the item to update
         * @param {object} state - The state to submit
         * @param {object} response - The response object to submit
         * @param {object} [params] - Some optional parameters to join to the call
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        submitItem(itemIdentifier, state, response, params) {
            return this.itemStore.update(itemIdentifier, 'itemState', state).then(() => {
                return qtiServiceProxy.submitItem.call(this, itemIdentifier, state, response, params);
            });
        },

        /**
         * Sends the test variables
         * @param {object} variables
         * @param {boolean} deferred whether action can be scheduled (put into queue) to be sent in a bunch of actions later.
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         * @fires sendVariables
         */
        sendVariables(variables, deferred) {
            const action = 'storeTraceData';
            const actionParams = {
                traceData: JSON.stringify(variables)
            };

            return this.requestNetworkThenOffline(
                this.configStorage.getTestActionUrl(action),
                action,
                actionParams,
                deferred
            );
        },

        /**
         * Calls an action related to the test
         * @param {string} action - The name of the action to call
         * @param {object} [params] - Some optional parameters to join to the call
         * @param {boolean} deferred whether action can be scheduled (put into queue) to be sent in a bunch of actions later.
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        callTestAction(action, params, deferred) {
            return this.requestNetworkThenOffline(
                this.configStorage.getTestActionUrl(action),
                action,
                params,
                deferred
            );
        },

        /**
         * Calls an action related to a particular item
         * @param {string} itemIdentifier - The identifier of the item for which call the action
         * @param {string} action - The name of the action to call
         * @param {object} [params] - Some optional parameters to join to the call
         * @param {boolean} deferred whether action can be scheduled (put into queue) to be sent in a bunch of actions later.
         * @returns {Promise} - Returns a promise. The result of the request will be provided on resolve.
         *                      Any error will be provided if rejected.
         */
        callItemAction(itemIdentifier, action, params, deferred) {
            let updateStatePromise = Promise.resolve();
            const testMap = this.getDataHolder().get('testMap');

            //update the item state
            if (params.itemState) {
                updateStatePromise = this.itemStore.update(itemIdentifier, 'itemState', params.itemState);
            }

            //check if we have already the item for the action we are going to perform
            this.getItemFromStore =
                (navigationHelper.isMovingToNextItem(action, params) && this.hasNextItem(itemIdentifier)) ||
                (navigationHelper.isMovingToPreviousItem(action, params) && this.hasPreviousItem(itemIdentifier)) ||
                (navigationHelper.isJumpingToItem(action, params) &&
                    this.hasItem(mapHelper.getItemIdentifier(testMap, params.ref)));

            //If item action is move to another item ensure the next request will start the timer
            if (
                navigationHelper.isMovingToNextItem(action, params) ||
                navigationHelper.isMovingToPreviousItem(action, params) ||
                navigationHelper.isJumpingToItem(action, params)
            ) {
                params.start = true;
            }

            return updateStatePromise.then(() => {
                return this.requestNetworkThenOffline(
                    this.configStorage.getItemActionUrl(itemIdentifier, action),
                    action,
                    _.merge({ itemDefinition: itemIdentifier }, params),
                    deferred
                );
            });
        }
    },
    qtiServiceProxy
);
