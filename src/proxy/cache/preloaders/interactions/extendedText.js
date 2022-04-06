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

import ckEditor from 'ckeditor';
import ckConfigurator from 'taoQtiItem/qtiCommonRenderer/helpers/ckConfigurator';

/**
 * Preloads CKEditor runtimes for a particular language
 * @param {string} language
 * @returns {Promise}
 */
function preloadCKEditor(language) {
    return new Promise(resolve => {
        const placeholder = document.createElement('div');
        const ckOptions = {
            resize_enabled: true,
            secure: location.protocol === 'https:',
            forceCustomDomain: true,
            language
        };
        const editor = ckEditor.inline(placeholder, ckOptions);
        editor.on('instanceReady', () => {
            resolve(editor);
        });
        editor.on('configLoaded', () => {
            editor.config = ckConfigurator.getConfig(editor, 'extendedText', ckOptions);
        });
        if (editor.status === 'ready' || editor.status === 'loaded') {
            resolve(editor);
        }
    }).then(editor => {
        editor.destroy();
    });
}

/**
 *  The default item language
 * @type {string}
 * @private
 */
const defaultLang = 'en';

/**
 * Gets the item's language
 * @param {object} itemData - The item data
 * @returns {string}
 * @private
 */
const getItemLanguage = itemData => {
    let lang = itemData && itemData.data && itemData.data.attributes && itemData.data.attributes['xml:lang'];
    if (!lang) {
        lang = window.document.documentElement.getAttribute('lang');
    }
    return (lang && lang.split('-')[0]) || defaultLang;
};

/**
 * Preloads the runtimes for an extendedText interaction
 */
export default {
    /**
     * The name of the preloader
     * @type {string}
     */
    name: 'extendedTextInteraction',

    /**
     * Manages the preloading of the extendedText interaction runtimes
     * @returns {interactionPreloader}
     */
    init() {
        const preloadedLanguages = {};

        return {
            /**
             * Tells whether the runtimes has been preloaded or not
             * @param {object} interaction - The interaction
             * @param {object} itemData - The item data
             * @param {string} itemIdentifier - the id of the item the interaction belongs to
             * @returns {boolean}
             */
            // eslint-disable-next-line no-unused-vars
            loaded(interaction, itemData, itemIdentifier) {
                if (interaction.attributes && interaction.attributes.format === 'xhtml') {
                    const lang = getItemLanguage(itemData);
                    return preloadedLanguages[lang];
                }
                return true;
            },

            /**
             * Preloads runtimes for an extendedText interaction
             * @param {object} interaction - The interaction
             * @param {object} itemData - The item data
             * @param {string} itemIdentifier - the id of the item the interaction belongs to
             * @returns {Promise}
             */
            // eslint-disable-next-line no-unused-vars
            load(interaction, itemData, itemIdentifier) {
                if (interaction.attributes && interaction.attributes.format === 'xhtml') {
                    const lang = getItemLanguage(itemData);
                    if (!preloadedLanguages[lang]) {
                        preloadedLanguages[lang] = true;
                        return preloadCKEditor(lang);
                    }
                }
                return Promise.resolve();
            },

            /**
             * Unloads runtimes for an extendedText interaction
             * @param {object} interaction - The interaction
             * @param {object} itemData - The item data
             * @param {string} itemIdentifier - the id of the item the interaction belongs to
             * @returns {Promise}
             */
            // eslint-disable-next-line no-unused-vars
            unload(interaction, itemData, itemIdentifier) {
                // nothing to do actually
                return Promise.resolve();
            }
        };
    }
};
