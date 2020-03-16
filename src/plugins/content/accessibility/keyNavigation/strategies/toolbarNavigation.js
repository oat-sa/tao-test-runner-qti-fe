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

import _ from "lodash";
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
const groupId = 'bottom-toolbar';

/**
 * Key navigator strategy applying onto the tools bar
 */
export default {
    name: 'toolbar',

    /**
     * Builds the toolbar navigation strategy.
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
                const $navigationBar = $('.bottom-action-bar');
                const $toolbarElements = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');

                const registerToolbarNavigator = (id, group, $elements) => {
                    const elements = navigableDomElement.createFromDoms($elements);
                    if (elements.length) {
                        const navigator = keyNavigator({
                            id,
                            group,
                            elements,
                            replace: true,
                            defaultPosition(navigables) {
                                let pos = 0;

                                // search for the position of the "Next" button if any,
                                // otherwise take the position of the last element
                                if (config.autoFocus) {
                                    pos = navigables.length - 1;
                                    _.forEach(navigables, (navigable, i) => {
                                        const $element = navigable.getElement();
                                        if ($element.data('control') === 'move-forward' || $element.data('control') === 'move-end') {
                                            pos = i;
                                        }
                                    });
                                }

                                return pos;
                            }
                        });

                        setupItemsNavigator(navigator, config);
                        setupClickableNavigator(navigator);
                        keyNavigators.push(navigator);
                    }
                };

                if (config.flatNavigation) {
                    $toolbarElements.each((index, el) => {
                        const $element = $(el);
                        registerToolbarNavigator(`${groupId}-${index}`, $element, $element);
                    });
                } else {
                    registerToolbarNavigator(groupId, $navigationBar, $toolbarElements);
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