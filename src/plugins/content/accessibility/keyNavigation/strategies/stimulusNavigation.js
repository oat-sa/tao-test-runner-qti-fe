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
import __ from 'i18n';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import {
    setupItemsNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
* The identifier the keyNavigator group
* @type {String}
*/
const groupId = 'stimulus-element-navigation-group';

/**
 * Key navigator strategy applying on stimulus items with scrollbar.
 * Navigable item content are body elements with the special class "stimulus-container".
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'stimulus',

    /**
     * Builds the item navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const $content = this.getTestRunner().getAreaBroker().getContentArea();

        this.keyNavigators = [];

        // decorate isEnabled navigableDomElement method to check for dom node height
        const isEnabledDecorator = element => {
            const originalIsEnabled = element.isEnabled;

            element.isEnabled = function isEnabled() {
                if (originalIsEnabled.call(this)) {
                    const node = this.getElement().get(0);

                    return node.scrollHeight > node.clientHeight;
                }

                return false;
            };

            return element;
        };

        $content
            .find('.stimulus-container')
            .addClass('key-navigation-scrollable')
            .each((i, el) => {
                const $element = $(el);
                const elements = navigableDomElement.createFromDoms($element)
                    .map(isEnabledDecorator);

                // assign aria attributes
                $element.attr('aria-label', __('Passage'));

                const navigator = keyNavigator({
                    id: `${groupId}-${i}`,
                    elements,
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
