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
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

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
                const $focusables = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');
                const elements = navigableDomElement.createFromDoms($focusables);
                if (elements.length) {
                    keyNavigators.push(
                        keyNavigator({
                            id: 'bottom-toolbar',
                            replace: true,
                            group: $navigationBar,
                            elements: elements,
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
                        })
                            .on(config.keyNextItem, function (elem) {
                                if (allowedToNavigateFrom(elem)) {
                                    this.next();
                                }
                            })
                            .on(config.keyPrevItem, function (elem) {
                                if (allowedToNavigateFrom(elem)) {
                                    this.previous();
                                }
                            })
                            .on('activate', function (cursor) {
                                cursor.navigable
                                    .getElement()
                                    .click()
                                    .mousedown();
                            })
                    );
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