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
 * @author Andrey Shaveko <andrey.shaveko@taotesting.com>
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
 * qtiServiceProxy backend adaptation
 * @extends taoQtiTest/runner/proxy/qtiServiceProxy
 */
export default _.defaults(
    {
        name: 'nextgen',

        /**
         * Installs the proxy
         * @param {object} config
         */
        install: function install(config) {
            var self = this;

            console.log(`${this.name} proxy install call`)
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

            console.log(`${this.name} proxy init call`)

            return this.request(this.configStorage.getTestActionUrl('init'), params);
            // // run the init
            // var InitCallPromise = qtiServiceProxy.init.call(this, config, params);

            // if (!this.getDataHolder()) {
            //     throw new Error('Unable to retrieve test runners data holder');
            // }

            // // those needs to be in each request params.
            // this.requestConfig = _.pick(config, ['testDefinition', 'testCompilation', 'serviceCallId']);

            // // set up the action store for the current service call
            // this.actionStore = actionStoreFactory(config.serviceCallId);

            // // stop error event propagation if sync is in progress
            // this.before('error', (e, error) => {
            //     if (self.isConnectivityError(error) && self.syncInProgress) {
            //         return false;
            //     }

            //     return true;
            // });

            // return InitCallPromise.then(function (response) {
            //     var promises = [];

            //     if (!response.items) {
            //         response.items = {};
            //     }

            //     self.itemStore.setCacheSize(_.size(response.items));

            //     _.forEach(response.items, function (item, itemIdentifier) {
            //         promises.push(self.itemStore.set(itemIdentifier, item));
            //     });

            //     return Promise.all(promises)
            //             .then(() => {
            //             return self.offlineNavigator
            //                 .setTestContext(response.testContext)
            //                 .setTestMap(response.testMap)
            //                 .init();
            //         })
            //         .then(() => response);
            // });
        },

        /**
         * Uninstalls the proxy
         *
         * @returns {Promise} - Returns a promise. The proxy will be fully uninstalled on resolve.
         *                      Any error will be provided if rejected.
         */
        destroy: function destroy() {
            var self = this;


            console.log(`${this.name} proxy destroy call`)
            
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

            return this.itemStore.update(itemIdentifier, 'itemState', state).then(function () {
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
                .then(function () {
                    return self.offlineAction(action, actionParams);
                })
                .catch(function (err) {
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
                .then(function () {
                    return self.offlineAction(action, params);
                })
                .catch(function (err) {
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
                .then(function () {
                    params = _.assign({ itemDefinition: itemIdentifier }, params);

                    return self
                        .scheduleAction(action, params)
                        .then(function () {
                            return self.offlineAction(action, params);
                        })
                        .catch(function (err) {
                            return Promise.reject(err);
                        });
                })
                .catch(function (err) {
                    return Promise.reject(err);
                });
        }
    },
    qtiServiceProxy
);

