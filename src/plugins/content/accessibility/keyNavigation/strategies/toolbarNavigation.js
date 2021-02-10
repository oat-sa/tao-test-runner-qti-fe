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
import {
    setupClickableNavigator,
    setupItemsNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * The identifier the keyNavigator group
 * @type {String}
 */
const groupId = 'bottom-toolbar';

/**
 * Key navigator strategy applying onto the tools bar
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'toolbar',

    /**
     * Builds the toolbar navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const $navigationBar = this.getTestRunner().getAreaBroker().getContainer().find('.bottom-action-bar');
        let $toolbarElements = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');

        if (config.reverseBottomToolbar) {
            $toolbarElements = $($toolbarElements.get().reverse());
        }

        const registerToolbarNavigator = (id, group, $elements) => {
            const elements = navigableDomElement.createFromDoms($elements);
            if (elements.length) {
                const navigator = keyNavigator({
                    id,
                    group,
                    elements,
                    propagateTab: false,
                    defaultPosition(navigableElements) {
                        let pos = 0;

                        // search for the position of the "Next" button if any,
                        // otherwise take the position of the last element
                        if (config.autoFocus) {
                            pos = navigableElements.length - 1;
                            _.forEach(navigableElements, (navigable, i) => {
                                const $element = navigable.getElement();
                                if ($element.data('control') === 'move-forward' || $element.data('control') === 'move-end') {
                                    pos = i;
                                }
                            });
                        }

                        return pos;
                    }
                });

                setupItemsNavigator(navigator, config);
                setupClickableNavigator(navigator);
                this.keyNavigators.push(navigator);
            }
        };

        this.keyNavigators = [];

        if (config.flatNavigation) {
            $toolbarElements.each((index, element) => registerToolbarNavigator(`${groupId}-${index}`, $navigationBar, $(element)));
        } else {
            registerToolbarNavigator(groupId, $navigationBar, $toolbarElements);
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
        this.keyNavigators = [];

        return this;
    }
};