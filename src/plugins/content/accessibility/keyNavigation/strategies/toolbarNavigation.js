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
             * @returns {keyNavigator[]}
             */
            init() {
                const $navigationBar = $('.bottom-action-bar');
                const $focusables = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');
                const elements = navigableDomElement.createFromDoms($focusables);
                const isNativeNavigation = config.mode === 'native';

                if (elements.length) {
                    keyNavigators.push(
                        keyNavigator({
                            id: 'bottom-toolbar',
                            replace: true,
                            group: $navigationBar,
                            elements: elements,
                            defaultPosition(navigables) {
                                if (isNativeNavigation) {
                                    return 0;
                                }
                                let pos = navigables.length - 1;
                                // start from the button "Next" or the button "End test"
                                _.forEach(navigables, (navigable, i) => {
                                    const $element = navigable.getElement();
                                    // find button "Next"
                                    if ($element.data('control') &&
                                        ($element.data('control') === 'move-forward' ||
                                            $element.data('control') === 'move-end')) {
                                        pos = i;
                                    }
                                });
                                // else the last button
                                return pos;
                            }
                        })
                            .on(config.keyNextItem, function (elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else {
                                    this.next();
                                }
                            })
                            .on(config.keyPrevItem, function (elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else {
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

                return this.getNavigators();
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