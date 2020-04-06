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
    setupClickableNavigator,
    setupItemsNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * The identifier the keyNavigator group
 * @type {String}
 */
const groupId = 'header-toolbar';

/**
 * Key navigator strategy applying onto the header bar.
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'header',

    /**
     * Builds the header navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        // we need a global selector as there is currently no way to access the delivery frame from the test runner
        const $headerBar = $('header');
        const $headerElements = $headerBar.find('a:visible');

        const registerHeaderNavigator = (id, group, $elements) => {
            const elements = navigableDomElement.createFromDoms($elements);
            if (elements.length) {
                const navigator = keyNavigator({
                    id,
                    group,
                    elements,
                    propagateTab: false
                });

                setupItemsNavigator(navigator, config);
                setupClickableNavigator(navigator);
                this.keyNavigators.push(navigator);
            }
        };

        this.keyNavigators = [];
        registerHeaderNavigator(groupId, $headerBar, $headerElements);

        return this;
    },

    /**
     * Gets the list of applied navigators
     * @returns {keyNavigator[]}
     */
    getNavigators() {
        return this.keyNavigators;
    },

    /**
     * Tears down the keyNavigator strategy
     * @returns {keyNavigationStrategy}
     */
    destroy() {
        this.keyNavigators.forEach(navigator => navigator.destroy());
        this.keyNavigators = [];

        return this;
    }
};