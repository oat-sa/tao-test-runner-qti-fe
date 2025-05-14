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
import { setupItemsNavigator } from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';
import { getIsItemWritingModeVerticalRl } from 'taoQtiTest/runner/helpers/verticalWriting';

/**
 * The identifier the keyNavigator group
 * @type {String}
 */
const groupId = 'item-content-wrapper';

/**
 * Key navigator strategy applying onto the page.
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'page',

    /**
     * Builds the page navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const isVerticalWritingMode = getIsItemWritingModeVerticalRl();
        this.keyNavigators = [];

        this.getTestRunner()
            .getAreaBroker()
            .getContainer()
            .find(isVerticalWritingMode ? '.qti-itemBody' : '.content-wrapper')
            .addClass('key-navigation-scrollable')
            .each((i, el) => {
                const $element = $(el);
                const navigator = keyNavigator({
                    id: `${groupId}-${this.keyNavigators.length}`,
                    elements: navigableDomElement.createFromDoms($element),
                    group: $element,
                    propagateTab: false
                });

                setupItemsNavigator(navigator, config);
                this.keyNavigators.push(navigator);
            });

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
