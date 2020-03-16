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
 * Copyright (c) 2020 Open Assessment Technologies SA ;
 */

import $ from 'jquery';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import {
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * The identifier the keyNavigator group
 * @type {String}
 */
const groupId = 'header-toolbar';

/**
 * Key navigator strategy applying onto the header bar.
 */
export default {
    name: 'header',

    /**
     * Builds the header navigation strategy.
     *
     * @param {testRunner} testRunner - the test runner instance to control
     * @param {keyNavigationStrategyConfig} config - the config to apply
     * @returns {keyNavigationStrategy}
     */
    init(testRunner, config) {
        let keyNavigators = [];

        /**
         * @typedef {Object} keyNavigationStrategy
         */
        return {
            /**
             * Setup the keyNavigator strategy
             * @returns {keyNavigationStrategy}
             */
            init() {
                //need global selector as currently no way to access delivery frame from test runner
                const $headerBar = $('header');
                const $headerElements = $headerBar.find('a:visible');

                const registerHeaderbarNavigator = (id, group, $elements) => {
                    const elements = navigableDomElement.createFromDoms($elements);
                    if (elements.length) {
                        const navigator = keyNavigator({
                            id,
                            group,
                            elements,
                            replace: true
                        });

                        setupItemsNavigator(navigator, config);
                        setupClickableNavigator(navigator);
                        keyNavigators.push(navigator);
                    }
                };

                if (config.flatNavigation) {
                    $headerElements.each((index, el) => {
                        const $element = $(el);
                        registerHeaderbarNavigator(`${groupId}-${index}`, $element, $element);
                    });
                } else {
                    registerHeaderbarNavigator(groupId, $headerBar, $headerElements);
                }

                return this;
            },

            /**
             * Gets the list of applied navigators
             * @returns {keyNavigator[]}
             */
            getNavigators() {
                return keyNavigators;
            },

            /**
             * Tears down the keyNavigator strategy
             * @returns {keyNavigationStrategy}
             */
            destroy() {
                keyNavigators.forEach(navigator => navigator.destroy());
                keyNavigators = [];

                return this;
            }
        };
    }
};