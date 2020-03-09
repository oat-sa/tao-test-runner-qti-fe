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
 * Builds a key navigator strategy applying onto the tools bar
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.keyNextItem - the keyboard shortcut to move to the next item (inside the scope)
 * @param {String} config.keyPreviousItem - the keyboard shortcut to move to the previous item (inside the scope)
 * @param {String} config.keyNextGroup - the keyboard shortcut to move to the next group (outside the scope)
 * @param {String} config.keyPreviousGroup - the keyboard shortcut to move to the previous group (outside the scope)
 * @returns {keyNavigatorStrategy}
 */
export default function toolbarNavigationStrategyFactory(testRunner, config) {
    let keyNavigators = [];

    /**
     * @typedef {Object} keyNavigatorStrategy
     */
    return {
        /**
         * Setup the keyNavigator strategy
         * @returns {keyNavigatorStrategy}
         */
        init() {
            const $navigationBar = $('.bottom-action-bar');
            const $focusables = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');
            const elements = navigableDomElement.createFromDoms($focusables);
            const isNativeNavigation = config.contentNavigatorType === 'native';

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
                        .on(config.keyNextInGroup, function (elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.next();
                            }
                        })
                        .on(config.keyPrevInGroup, function (elem) {
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
         * @returns {keyNavigatorStrategy}
         */
        destroy() {
            keyNavigators.forEach(navigator => navigator.destroy());
            keyNavigators = [];

            return this;
        }
    };
}