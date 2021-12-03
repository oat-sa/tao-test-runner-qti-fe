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
 * @param {number} [options.maxSize = 10] - the store limit
 * @param {boolean} [options.preload] - do we preload items when storing them
 * @param {string} [options.testId] - the unique identifier of the test instance, required if preload is true
 *
 * @returns {itemStore}
 */
export default function itemStoreFactory(options) {
    const config = _.defaults(options || {}, defaultConfig);

    //in memory storage
    const getStore = () => store('item-cache', store.backends.memory);

    //maintain an index to resolve existence synchronously:
    // - the array allows to manage the cache in order, it is useful to remove the first entries
    // - the map allows to quickly check each cache entry, and store some internal metadata like the timestamp
    let list = [];
    const index = new Map();

    // check if a key has expired
    const isExpired = key => {
        const meta = index.get(key);
        if (meta) {
            return config.itemTTL && Date.now() - meta.timestamp >= config.itemTTL;
        }
        return false;
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
                            list.push(key);
                            index.set(key, {
                                timestamp: Date.now()
                            });
                        }

                        if (config.preload) {
                            _.defer(() => itemPreloader.preload(item));
                        }
                    }

                    //do we reach the limit ? then remove one
                    if (list.length > 1 && list.length > config.maxSize) {
                        return this.remove(list[0]).then(removed => updated && removed);
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
                    list = _.without(list, key);
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
            const expired = list.filter(isExpired);
            return Promise.all(expired.map(key => this.remove(key)));
        },

        /**
         * Clear the store
         * @returns {Promise}
         */
        clear() {
            return getStore().then(itemStorage => {
                list = [];
                index.clear();
                return itemStorage.clear();
            });
        }
    };
}
