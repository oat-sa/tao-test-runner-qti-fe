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

import preloaders from 'taoQtiTest/runner/proxy/cache/preloaders/interactions/preloaders';

/**
 * @callback interactionPreloaderAction
 * @param {object} interaction - The interaction
 * @param {object} itemData - The item data
 * @param {string} itemIdentifier - the id of the item the interaction belongs to
 */

/**
 * @typedef {object} interactionPreloader
 * @property {string} name - The name of the preloader
 * @property {interactionPreloaderAction} load - Preload an interaction
 * @property {interactionPreloaderAction} unload - Unload an interaction
 */


/**
 * Manages the preloading of interaction runtimes
 * @return {interactionPreloaderManager}
 */
export default function interactionPreloaderFactory() {
    const interactionPreloaders = preloaders.reduce((map, factory) => {
        const preloader = factory();
        map[preloader.name] = preloader;
        return map;
    }, {});

    /**
     * @typedef interactionPreloaderManager
     */
    return {
        /**
         * Checks whether or not an interaction preloader exists for a particular type
         * @param {string} type
         * @returns {boolean}
         */
        has(type) {
            return !!interactionPreloaders[type];
        },

        /**
         * Preloads an interaction with respect to it type
         * @param {string} type - The type of interaction to preload
         * @param {object} interaction - The interaction
         * @param {object} itemData - The item data
         * @param {string} itemIdentifier - the id of the item the interaction belongs to
         * @returns {Promise}
         */
        load(type, interaction, itemData, itemIdentifier) {
            const preloader = interactionPreloaders[type];
            if (preloader) {
                return preloader.load(interaction, itemData, itemIdentifier);
            }
            return Promise.resolve();
        },

        /**
         * Unloads an interaction with respect to it type
         * @param {string} type - The type of interaction to unload
         * @param {object} interaction - The interaction
         * @param {object} itemData - The item data
         * @param {string} itemIdentifier - the id of the item the interaction belongs to
         * @returns {Promise}
         */
        unload(type, interaction, itemData, itemIdentifier) {
            const preloader = interactionPreloaders[type];
            if (preloader) {
                return preloader.unload(interaction, itemData, itemIdentifier);
            }
            return Promise.resolve();
        }
    };
}
