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

import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';

/**
 * Key navigator strategy applying onto the page.
 */
export default {
    name: 'page',

    /**
     * Builds the page navigation strategy.
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
                const $wrapper = testRunner.getAreaBroker().getContainer().find('.content-wrapper');
                const navigables = navigableDomElement.createFromDoms($wrapper);

                $wrapper.addClass('key-navigation-scrollable');
                if (navigables.length) {
                    const {id} = testRunner.getCurrentItem();
                    keyNavigators.push(
                        keyNavigator({
                            id: `item-content-wrapper_${id}`,
                            group: $wrapper,
                            elements: navigables,
                            propagateTab: false, // inner item navigators will send tab to this element
                            replace: true,
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