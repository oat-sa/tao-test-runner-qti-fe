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

import preloaders from 'taoQtiTest/runner/proxy/cache/preloaders/assets/preloaders';

/**
 * @callback assetPreloaderAction
 * @param {string} url - the url of the asset to load/unload
 * @param {string} [sourceUrl] - the unresolved URL (used to index)
 * @param {string} [itemIdentifier] - the id of the item the asset belongs to
 */

/**
 * @typedef {object} assetPreloader
 * @property {string} name - The name of the preloader
 * @property {assetPreloaderAction} load - Preload an asset
 * @property {assetPreloaderAction} unload - Unload an asset
 */

/**
 * Manages the preloading of assets
 * @param assetManager - A reference to the assetManager
 * @return {assetPreloaderManager}
 */
export default function assetPreloaderFactory(assetManager) {
    const assetPreloaders = preloaders.reduce((map, factory) => {
        const preloader = factory(assetManager);
        map[preloader.name] = preloader;
        return map;
    }, {});

    /**
     * @typedef assetPreloaderManager
     */
    return {
        /**
         * Checks whether or not an asset preloader exists for a particular type
         * @param {string} type
         * @returns {boolean}
         */
        has(type) {
            return !!assetPreloaders[type];
        },

        /**
         * Preloads an asset with respect to it type
         * @param {string} type - The type of asset to preload
         * @param {string} url - the url of the asset to preload
         * @param {string} sourceUrl - the unresolved URL (used to index)
         * @param {string} itemIdentifier - the id of the item the asset belongs to
         * @returns {Promise}
         */
        load(type, url, sourceUrl, itemIdentifier) {
            const preloader = assetPreloaders[type];
            if (preloader) {
                return preloader.load(url, sourceUrl, itemIdentifier);
            }
            return Promise.resolve();
        },

        /**
         * Unloads an asset with respect to it type
         * @param {string} type - The type of asset to unload
         * @param {string} url - the url of the asset to unload
         * @param {string} sourceUrl - the unresolved URL
         * @param {string} itemIdentifier - the id of the item the asset belongs to
         * @returns {Promise}
         */
        unload(type, url, sourceUrl, itemIdentifier) {
            const preloader = assetPreloaders[type];
            if (preloader) {
                return preloader.unload(url, sourceUrl, itemIdentifier);
            }
            return Promise.resolve();
        }
    };
}
