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

import preloaders from 'taoQtiTest/runner/proxy/cache/preloaders/assets/preloaders';
import preloaderManagerFactory from 'taoQtiTest/runner/proxy/cache/preloaderManager';

/**
 * @callback assetPreloaderManagerAction
 * @param {string} type - The type of asset to preload
 * @param {string} url - the url of the asset to load/unload
 * @param {string} [sourceUrl] - the unresolved URL (used to index)
 * @param {string} [itemIdentifier] - the id of the item the asset belongs to
 */

/**
 * @callback assetPreloaderAction
 * @param {string} url - the url of the asset to load/unload
 * @param {string} [sourceUrl] - the unresolved URL (used to index)
 * @param {string} [itemIdentifier] - the id of the item the asset belongs to
 */

/**
 * @typedef {object} assetPreloaderManager
 * @property {string} name - The name of the preloader
 * @property {assetPreloaderManagerAction} loaded - Tells whether an asset is loaded or not
 * @property {assetPreloaderManagerAction} load - Preload an asset
 * @property {assetPreloaderManagerAction} unload - Unload an asset
 */

/**
 * @typedef {object} assetPreloader
 * @property {string} name - The name of the preloader
 * @property {assetPreloaderAction} loaded - Tells whether an asset is loaded or not
 * @property {assetPreloaderAction} load - Preload an asset
 * @property {assetPreloaderAction} unload - Unload an asset
 */

/**
 * Manages the preloading of assets
 * @function assetPreloaderFactory
 * @param assetManager - A reference to the assetManager
 * @return {assetPreloaderManager}
 */
const assetPreloaderFactory = preloaderManagerFactory();
preloaders.forEach(preloader => assetPreloaderFactory.registerProvider(preloader.name, preloader));

export default assetPreloaderFactory;
