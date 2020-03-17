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
import navigableGroupElement from 'ui/keyNavigation/navigableGroupElement';
import {
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Key navigator strategy applying inside the item.
 * Navigable item content are interaction choices with the special class "key-navigation-focusable".
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'linearItem',

    /**
     * Builds the item navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const $content = this.getTestRunner().getAreaBroker().getContentArea();
        const $qtiIteractionsNodeList = $content
            .find('.key-navigation-focusable,.qti-interaction')
            .filter(function () {
                //filter out interaction as it will be managed separately
                return !$(this).parents('.qti-interaction').length;
            });

        const $qtiChoiceNodesList = $qtiIteractionsNodeList.find('.qti-choice');
        let $lastParent = null;
        let list = [];
        const setupListNavigator = () => {
            const navigator = keyNavigator({
                elements: navigableGroupElement.createFromNavigators(list),
                propagateTab: false
            });

            setupItemsNavigator(navigator, config);
            this.choicesNavigators.push(navigator);
        };

        // this strategy manages 2 navigators:
        // - keyNavigators lists all elements separately, allowing to navigate among them as identified groups
        // - choicesNavigators lists elements with the same parent, allowing to navigate "horizontally" among them
        this.keyNavigators = [];
        this.choicesNavigators = [];

        // the item focusable body elements are considered scrollable
        $content.find('.key-navigation-focusable').addClass('key-navigation-scrollable');

        $qtiChoiceNodesList.each((i, el) => {
            const $itemElement = $(el);
            const $parent = $itemElement.parent();
            const choiceNavigator = keyNavigator({
                elements: navigableDomElement.createFromDoms($itemElement),
                group: $itemElement,
                propagateTab: false
            });

            setupClickableNavigator(choiceNavigator);

            if ($lastParent && !$parent.is($lastParent)) {
                setupListNavigator();
                list = [];
            }

            this.keyNavigators.push(choiceNavigator);
            list.push(choiceNavigator);
            $lastParent = $parent;
        });

        if (list.length) {
            setupListNavigator();
            list = [];
        }

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
        this.choicesNavigators.forEach(navigator => navigator.destroy());
        this.choicesNavigators = [];
        this.keyNavigators = [];

        return this;
    }
};
