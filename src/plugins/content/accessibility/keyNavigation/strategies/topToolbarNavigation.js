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
import {
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';
import isReviewPanelEnabled from 'taoQtiTest/runner/helpers/isReviewPanelEnabled';

/**
 * The identifier the keyNavigator group
 * @type {String}
 */
const groupId = 'top-toolbar';

/**
 * Key navigator strategy applying onto the top toolbar' bar.
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'top-toolbar',

    /**
     * Builds the top toolbar navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const $topToolbar = this.getTestRunner().getAreaBroker().getContainer().find('.top-action-bar');
        const $elements = $topToolbar.find('a:visible');

        const registerTopToolbarNavigator = (id, group, $elements) => {
            const elements = navigableDomElement.createFromDoms($elements);
            if (elements.length) {
                const navigator = keyNavigator({
                    id,
                    group,
                    elements,
                    replace: true
                });

                setupItemsNavigator(navigator, config);
                setupClickableNavigator(navigator);
                this.keyNavigators.push(navigator);
            }
        };

        this.keyNavigators = [];
        registerTopToolbarNavigator(groupId, $topToolbar, $elements);

        return this;
    },

    /**
     * Gets the list of applied navigators
     * @returns {keyNavigator[]}
     */
    getNavigators() {
        if (isReviewPanelEnabled(this.getTestRunner())) {
            return [];
        }
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