/*
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
 * (Pre)load an item and it's assets.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import loggerFactory from 'core/logger';
import qtiItemRunner from 'taoQtiItem/runner/qtiItemRunner';
import getAssetManager from 'taoQtiTest/runner/config/assetManager';
import assetPreloaderFactory from 'taoQtiTest/runner/proxy/cache/assetPreloader';
import interactionPreloaderFactory from 'taoQtiTest/runner/proxy/cache/interactionPreloader';
import urlUtil from 'util/url';

/**
 * @type {logger}
 * @private
 */
const logger = loggerFactory('taoQtiTest/runner/proxy/cache/itemPreloader');

/**
 * Check if the given item object matches the expectations
 * @param {object} item
 * @param {string} item.itemIdentifier - the item identifier
 * @param {string} item.baseUrl - item baseUrl
 * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
 * @returns {boolean}
 * @private
 */
const isItemObjectValid = item => {
    return (
        _.isPlainObject(item) &&
        _.isString(item.baseUrl) &&
        _.isString(item.itemIdentifier) &&
        !_.isEmpty(item.itemIdentifier) &&
        _.isPlainObject(item.itemData)
    );
};

/**
 * Sets a flag onto an item
 * @param {object} item - The item to flag
 * @param {string} flag - The flag name to set
 */
const setItemFlag = (item, flag) => {
    item.flags = item.flags || {};
    item.flags[flag] = true;
};

/**
 * Extracts the list of interactions from the item
 * @param {object} itemData
 * @returns {object[]}
 */
const getItemInteractions = itemData => {
    const interactions = [];
    if (itemData.data && itemData.data.body && itemData.data.body.elements) {
        _.forEach(itemData.data.body.elements, elements => interactions.push(elements));
    }
    return interactions;
};

/**
 * Create an instance of an item preloader
 * @param {object} options
 * @param {string} options.testId - the unique identifier of the test instance, required to get the asset manager
 * @returns {itemPreloader}
 * @throws {TypeError} if the testId is not defined
 */
function itemPreloaderFactory(options) {
    //we also have a specific instance of the asset manager to
    //resolve assets of a next item (we can't use the test asset manager).
    const preloadAssetManager = getAssetManager('item-preloader');

    /**
     * Resolves assets URLS using the assetManager
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {string} item.baseUrl - item baseUrl
     * @param {string} item.itemData.type - type of item
     * @param {object} item.itemData.data - item data
     * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
     * @returns {Promise<Object>} assets with URLs resolved
     * @private
     */
    const resolveAssets = item => {
        return new Promise(resolve => {
            const { assets } = item.itemData;
            preloadAssetManager.setData('baseUrl', item.baseUrl);
            preloadAssetManager.setData('assets', assets);

            return resolve(
                _.reduce(
                    assets,
                    (acc, assetList, type) => {
                        const resolved = {};
                        _.forEach(assetList, url => {
                            //filter base64 (also it seems sometimes we just have base64 data, without the protocol...)
                            if (!urlUtil.isBase64(url)) {
                                resolved[url] = preloadAssetManager.resolve(url);
                            }
                        });
                        if (_.size(resolved) > 0) {
                            acc[type] = resolved;
                        }
                        return acc;
                    },
                    {}
                )
            );
        });
    };

    if (!options || !options.testId) {
        throw new TypeError('The test identifier is mandatory to start the item preloader');
    }

    //this is the test asset manager, referenced under options.testId
    const testAssetManager = getAssetManager(options.testId);

    //mechanisms to preload assets and runtimes
    const assetPreloader = assetPreloaderFactory(testAssetManager);
    const interactionPreloader = interactionPreloaderFactory();

    /**
     * Preload the item runner
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {string} item.baseUrl - item baseUrl
     * @param {string} item.itemData.type - type of item
     * @param {object} item.itemData.data - item data
     * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
     * @returns {Promise}
     * @private
     */
    const itemLoad = item => {
        logger.debug(`Start preloading of item ${item.itemIdentifier}`);
        return new Promise((resolve, reject) => {
            qtiItemRunner(item.itemData.type, item.itemData.data, {
                assetManager: preloadAssetManager,
                preload: true
            })
                .on('init', () => {
                    logger.debug(`Preloading of item ${item.itemIdentifier} done`);
                    resolve(true);
                })
                .on('error', reject)
                .init();
        });
    };

    /**
     * Preload the interactions
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {object} item.itemData.data - item data
     * @returns {Promise}
     * @private
     */
    const interactionLoad = item => {
        return Promise.all(getItemInteractions(item.itemData).map(interaction => {
            if (interactionPreloader.has(interaction.qtiClass)) {
                logger.debug(`Loading interaction ${interaction.serial}(${interaction.qtiClass}) for item ${item.itemIdentifier}`);
                return interactionPreloader.load(interaction.qtiClass, interaction, item.itemData, item.itemIdentifier);
            }
            return Promise.resolve();
        }));
    };

    /**
     * Unload the interactions
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {object} item.itemData.data - item data
     * @returns {Promise}
     * @private
     */
    const interactionUnload = item => {
        return Promise.all(getItemInteractions(item.itemData).map(interaction => {
            if (interactionPreloader.has(interaction.qtiClass)) {
                logger.debug(`Unloading interaction ${interaction.serial}(${interaction.qtiClass}) for item ${item.itemIdentifier}`);
                return interactionPreloader.unload(interaction.qtiClass, interaction, item.itemData, item.itemIdentifier);
            }
            return Promise.resolve();
        }));
    };

    /**
     * Preload the item assets
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {string} item.baseUrl - item baseUrl
     * @param {string} item.itemData.type - type of item
     * @param {object} item.itemData.data - item data
     * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
     * @returns {Promise}
     * @private
     */
    const assetLoad = item => {
        return resolveAssets(item).then(resolved => {
            _.forEach(resolved, (assets, type) => {
                if (assetPreloader.has(type)) {
                    _.forEach(assets, (url, sourceUrl) => {
                        logger.debug(`Loading asset ${sourceUrl}(${type}) for item ${item.itemIdentifier}`);
                        assetPreloader.load(type, url, sourceUrl, item.itemIdentifier);
                    });
                } else {
                    setItemFlag(item, 'containsNonPreloadedAssets');
                }
            });
            return true;
        });
    };

    /**
     * Unload the item assets
     * @param {object} item
     * @param {string} item.itemIdentifier - the item identifier
     * @param {string} item.baseUrl - item baseUrl
     * @param {string} item.itemData.type - type of item
     * @param {object} item.itemData.data - item data
     * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
     * @returns {Promise}
     * @private
     */
    const assetUnload = item => {
        return resolveAssets(item).then(resolved => {
            _.forEach(resolved, (assets, type) => {
                if (assetPreloader.has(type)) {
                    _.forEach(assets, (url, sourceUrl) => {
                        logger.debug(`Unloading asset ${sourceUrl}(${type}) for item ${item.itemIdentifier}`);
                        assetPreloader.unload(type, url, sourceUrl, item.itemIdentifier);
                    });
                }
            });
            return true;
        });
    };

    /**
     * @typedef {object} itemPreloader
     */
    return {
        /**
         * Preload the given item (runtime and assets)
         *
         * @param {object} item
         * @param {string} item.itemIdentifier - the item identifier
         * @param {string} item.baseUrl - item baseUrl
         * @param {string} item.itemData.type - type of item
         * @param {object} item.itemData.data - item data
         * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
         * @returns {Promise<Boolean>} resolves with true if the item is loaded
         */
        preload(item) {
            const loading = [];

            if (isItemObjectValid(item)) {
                loading.push(itemLoad(item));
                loading.push(interactionLoad(item));

                if (_.size(item.itemData.data && item.itemData.data.feedbacks)) {
                    setItemFlag(item, 'hasFeedbacks');
                }

                if (_.size(item.portableElements && item.portableElements.pci)) {
                    setItemFlag(item, 'hasPci');
                }

                if (_.size(item.itemData.assets) > 0) {
                    loading.push(assetLoad(item));
                }
            }
            return Promise.all(loading).then(results => results.length > 0 && _.all(results, _.isTrue));
        },

        /**
         * Unload the assets for the given item
         *
         * @param {object} item
         * @param {string} item.itemIdentifier - the item identifier
         * @param {string} item.baseUrl - item baseUrl
         * @param {string} item.itemData.type - type of item
         * @param {object} item.itemData.data - item data
         * @param {object} item.itemData.assets - assets per types :  img : ['url1', 'url2' ]
         * @returns {Promise}
         */
        unload(item) {
            const loading = [];

            if (isItemObjectValid(item)) {
                loading.push(interactionUnload(item));

                if (_.size(item.itemData.assets) > 0) {
                    loading.push(assetUnload(item));
                }
            }

            return Promise.all(loading).then(results => results.length > 0 && _.all(results, _.isTrue));
        }
    };
}

export default itemPreloaderFactory;
