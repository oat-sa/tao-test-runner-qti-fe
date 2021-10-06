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
 * (Pre)load audio content.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

/**
 * (Pre)load an item and it's assets.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';

/**
 * Manages the preloading of audio files
 * @param assetManager - A reference to the assetManager
 * @returns {assetPreloader}
 */
export default function audioPreloaderFactory(assetManager) {
    //keep references to preloaded audio blobs
    const audioBlobs = {};

    //prepend a strategy to resolves cached assets
    assetManager.prependStrategy({
        name: 'precaching-audio',
        handle(url, data) {
            const sourceUrl = url.toString();

            //resolves precached audio files
            if (
                data.itemIdentifier &&
                audioBlobs[data.itemIdentifier] &&
                'undefined' !== typeof audioBlobs[data.itemIdentifier][sourceUrl]
            ) {
                //creates an internal URL to link the audio blob
                return URL.createObjectURL(audioBlobs[data.itemIdentifier][sourceUrl]);
            }
        }
    });

    return {
        /**
         * The name of the preloader
         * @type {string}
         */
        name: 'audio',

        /**
         * Preloads audio files : save the blobs for later use in the asset manager
         * @param {string} url - the url of the audio file to preload
         * @param {string} sourceUrl - the unresolved URL (used to index)
         * @param {string} itemIdentifier - the id of the item the asset belongs to
         * @returns {Promise}
         */
        load(url, sourceUrl, itemIdentifier) {
            return new Promise(resolve => {
                audioBlobs[itemIdentifier] = audioBlobs[itemIdentifier] || {};
                if ('undefined' === typeof audioBlobs[itemIdentifier][sourceUrl]) {
                    //direct XHR to benefit from the "blob" response type
                    const request = new XMLHttpRequest();
                    request.open('GET', url, true);
                    request.responseType = 'blob';
                    request.onerror = resolve;
                    request.onabort = resolve;
                    request.onload = () => {
                        if (request.status === 200) {
                            //save the blob, directly
                            audioBlobs[itemIdentifier][sourceUrl] = request.response;
                        }
                        resolve();
                    };
                    //ignore failed requests, best effort only
                    request.send();
                } else {
                    resolve();
                }
            });
        },

        /**
         * Removes loaded audio files
         * @param {string} url - the url of the audio file to unload
         * @param {string} sourceUrl - the unresolved URL
         * @param {string} itemIdentifier - the id of the item the asset belongs to
         * @returns {Promise}
         */
        unload(url, sourceUrl, itemIdentifier) {
            if (audioBlobs[itemIdentifier]) {
                audioBlobs[itemIdentifier] = _.omit(audioBlobs[itemIdentifier], sourceUrl);
            }
            return Promise.resolve();
        }
    };
}
