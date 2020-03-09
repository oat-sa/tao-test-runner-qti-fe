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

/**
 * Builds a key navigator strategy applying onto the rubric blocks
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.keyNextItem - the keyboard shortcut to move to the next item (inside the scope)
 * @param {String} config.keyPreviousItem - the keyboard shortcut to move to the previous item (inside the scope)
 * @param {String} config.keyNextGroup - the keyboard shortcut to move to the next group (outside the scope)
 * @param {String} config.keyPreviousGroup - the keyboard shortcut to move to the previous group (outside the scope)
 * @returns {keyNavigatorStrategy}
 */
export default function rubricsNavigationStrategyFactory(testRunner, config) {
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
            const $rubricArea = $('#qti-rubrics');
            const $itemElements = $rubricArea.find('.qti-rubricBlock');

            $itemElements.each(function () {
                const $itemElement = $(this);
                const id = `rubric_element_navigation_group_${keyNavigators.length}`;

                keyNavigators.push(
                    keyNavigator({
                        id: id,
                        elements: navigableDomElement.createFromDoms($itemElement),
                        group: $itemElement,
                        replace: true
                    })
                );
            });

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