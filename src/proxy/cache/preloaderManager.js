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
 * Copyright (c) 2021 Open Assessment Technologies SA
 */

import providerRegistry from 'core/providerRegistry';

/**
 * @typedef {object} preloaderManager
 * @property {Function} has - Tells whether an asset is loaded or not
 * @property {preloaderManagerAction} loaded - Tells whether an asset is loaded or not
 * @property {preloaderManagerAction} load - Preload an asset
 * @property {preloaderManagerAction} unload - Unload an asset
 */

/**
 * @callback preloaderManagerAction
 * @param {string} name - The type of asset to preload
 * @param {...any} args - The list of args related to the preloader.
 * @returns {any}
 */

/**
 * Creates a preloader manager.
 * @return {Function}
 */
export default function preloaderManagerFactory() {
    /**
     * Manages the preloading of assets
     * @param assetManager - A reference to the assetManager
     * @return {preloaderManager}
     */
    function preloaderFactory(assetManager) {
        const preloaders = {};
        preloaderFactory.getAvailableProviders().forEach(name => {
            preloaders[name] = preloaderFactory.getProvider(name).init(assetManager);
        });

        /**
         * @typedef preloaderManager
         */
        return {
            /**
             * Checks whether or not an asset preloader exists for a particular type
             * @param {string} name
             * @returns {boolean}
             */
            has(name) {
                return !!preloaders[name];
            },

            /**
             * Tells whether an asset was preloaded or not
             * @param {string} name - The type of asset to preload
             * @param {...any} args - The list of args related to the preloader.
             * @returns {boolean}
             */
            loaded(name, ...args) {
                const preloader = preloaders[name];
                if (preloader && 'function' === typeof preloader.loaded) {
                    return !!preloader.loaded(...args);
                }
                return false;
            },

            /**
             * Preloads an asset with respect to it type
             * @param {string} name - The type of asset to preload
             * @param {...any} args - The list of args related to the preloader.
             * @returns {Promise}
             */
            load(name, ...args) {
                const preloader = preloaders[name];
                if (preloader && 'function' === typeof preloader.load) {
                    return Promise.resolve(preloader.load(...args));
                }
                return Promise.resolve();
            },

            /**
             * Unloads an asset with respect to it type
             * @param {string} name - The type of asset to unload
             * @param {...any} args - The list of args related to the preloader.
             * @returns {Promise}
             */
            unload(name, ...args) {
                const preloader = preloaders[name];
                if (preloader && 'function' === typeof preloader.unload) {
                    return Promise.resolve(preloader.unload(...args));
                }
                return Promise.resolve();
            }
        };
    }

    return providerRegistry(preloaderFactory);
}
