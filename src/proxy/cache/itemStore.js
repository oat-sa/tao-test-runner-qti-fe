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
 * Cache/store for items on memory as a FIFO list
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import store from 'core/store';
import itemPreloaderFactory from 'taoQtiTest/runner/proxy/cache/itemPreloader';

/**
 * The default number of items to store
 */
const defaultConfig = {
    itemTTL: 0,
    maxSize: 10,
    preload: false
};

/**
 * Create an item store
 * @param {object} [options]
 * @param {number} [options.itemTTL = 0] - The TTL for each item in the store, in milliseconds. 0 means no TTL.
 * @param {number} [options.maxSize = 10] - the store limit
 * @param {boolean} [options.preload] - do we preload items when storing them
 * @param {string} [options.testId] - the unique identifier of the test instance, required if preload is true
 *
 * @returns {itemStore}
 */
export default function itemStoreFactory(options) {
    const config = _.defaults(options || {}, defaultConfig);

    // in memory storage
    const getStore = () => store('item-cache', store.backends.memory);

    // maintain an index to resolve existence synchronously
    const index = new Map();
    let lastIndexedPosition = 0;

    // check if a key has expired
    const isExpired = key => {
        const meta = index.get(key);
        if (meta) {
            return config.itemTTL && Date.now() - meta.timestamp >= config.itemTTL;
        }
        return false;
    };

    // retrieve the first item by position from the index
    const findFirstIndexedItem = () => {
        let first = null;
        let lowest = Number.POSITIVE_INFINITY;
        index.forEach((item, key) => {
            if (item.position < lowest) {
                lowest = item.position;
                first = key;
            }
        });
        return first;
    };

    // retrieve all expired items from the index
    const findExpiredItems = () => {
        const expired = [];
        index.forEach((item, key) => {
            if (isExpired(key)) {
                expired.push(key);
            }
        });
        return expired;
    };

    let itemPreloader;
    if (config.preload) {
        itemPreloader = itemPreloaderFactory(_.pick(config, ['testId']));
    }

    /**
     * @typedef itemStore
     */
    return {
        /**
         * Setter to override the cache size
         *
         * @param {number} cacheSize
         */
        setCacheSize(cacheSize) {
            config.maxSize = cacheSize;
        },

        /**
         * Sets the item store TTL.
         * @param {number} ttl
         */
        setItemTTL(ttl) {
            config.itemTTL = ttl;
        },

        /**
         * Get the item form the given key/id/uri
         * @param {string} key - something identifier
         * @returns {Promise<Object>} the item
         */
        get(key) {
            if (!this.has(key)) {
                return Promise.resolve();
            }
            return getStore().then(itemStorage => itemStorage.getItem(key));
        },

        /**
         * Check whether the given item is in the store
         * @param {string} key - something identifier
         * @returns {boolean}
         */
        has(key) {
            return index.has(key) && !isExpired(key);
        },

        /**
         * Add/Set an item into the store, under the given key
         * @param {string} key - something identifier
         * @param {object} item - the item
         * @returns {Promise<boolean>} chains
         */
        set(key, item) {
            return getStore().then(itemStorage => {
                return itemStorage.setItem(key, item).then(updated => {
                    if (updated) {
                        if (!index.has(key)) {
                            index.set(key, {
                                position: lastIndexedPosition++,
                                timestamp: Date.now()
                            });
                        }

                        if (config.preload) {
                            _.defer(() => itemPreloader.preload(item));
                        }
                    }

                    //do we reach the limit ? then remove one
                    if (index.size > 1 && index.size > config.maxSize) {
                        return this.remove(findFirstIndexedItem()).then(removed => updated && removed);
                    }
                    return updated;
                });
            });
        },

        /**
         * Update some data of a store item
         * @param {string} key - something identifier
         * @param {string} updateKey - key to update
         * @param {*} updateValue - new data for the updateKey
         * @returns {Promise<boolean>} resolves with the update status
         */
        update(key, updateKey, updateValue) {
            if (index.has(key) && _.isString(updateKey)) {
                return getStore().then(itemStorage => {
                    return itemStorage.getItem(key).then(itemData => {
                        if (_.isPlainObject(itemData)) {
                            itemData[updateKey] = updateValue;
                            return itemStorage.setItem(key, itemData);
                        }
                    });
                });
            }
            return Promise.resolve(false);
        },

        /**
         * Remove the item from the store
         * @param {string} key - something identifier
         * @returns {Promise<boolean>} resolves once removed
         */
        remove(key) {
            if (index.has(key)) {
                return getStore().then(itemStorage => {
                    index.delete(key);

                    return itemStorage
                        .getItem(key)
                        .then(item => {
                            if (config.preload) {
                                _.defer(() => itemPreloader.unload(item));
                            }
                        })
                        .then(() => itemStorage.removeItem(key));
                });
            }
            return Promise.resolve(false);
        },

        /**
         * Prune the store from expired content.
         * @returns {Promise}
         */
        prune() {
            return Promise.all(findExpiredItems().map(this.remove));
        },

        /**
         * Clear the store
         * @returns {Promise}
         */
        clear() {
            return getStore().then(itemStorage => {
                index.clear();
                return itemStorage.clear();
            });
        }
    };
}
