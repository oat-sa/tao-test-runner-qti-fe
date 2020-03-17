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
import scrollHelper from 'ui/scroller';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import {
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Key navigator strategy applying inside the item.
 * Navigable item content are interaction choices and body element with the special class "key-navigation-focusable".
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'item',

    /**
     * Builds the item navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        this.keyNavigators = [];

        const config = this.getConfig();
        const $content = this.getTestRunner().getAreaBroker().getContentArea();
        const $qtiIteractionsNodeList = $content
            .find('.key-navigation-focusable,.qti-interaction')
            .filter(function () {
                //filter out interaction as it will be managed separately
                return !$(this).parents('.qti-interaction').length;
            });

        // the item focusable body elements are considered scrollable
        $content.find('.key-navigation-focusable').addClass('key-navigation-scrollable');

        $qtiIteractionsNodeList
            .each((i, el) => {
                const $itemElement = $(el);
                if ($itemElement.hasClass('qti-interaction')) {
                    //add navigable elements from prompt
                    $itemElement.find('.key-navigation-focusable').each((i, el) => {
                        const $nav = $(el);
                        if (!$nav.closest('.qti-choice').length) {
                            this.keyNavigators.push(
                                keyNavigator({
                                    elements: navigableDomElement.createFromDoms($nav),
                                    group: $nav,
                                    propagateTab: false
                                })
                            );
                        }
                    });

                    //reset interaction custom key navigation to override the behaviour with the new one
                    $itemElement.off('.keyNavigation');

                    //search for inputs that represent the interaction focusable choices
                    const $inputs = $itemElement.is(':input') ? $itemElement : $itemElement.find(':input');
                    const interactionNavigables = navigableDomElement.createFromDoms($inputs);

                    if (interactionNavigables.length) {
                        const navigator = keyNavigator({
                            elements: interactionNavigables,
                            group: $itemElement,
                            loop: false
                        })
                            .on('focus', cursor => {
                                const $qtiChoice = cursor.navigable.getElement().closest('.qti-choice');
                                $qtiChoice.addClass('key-navigation-highlight');
                                return scrollHelper.scrollTo(
                                    $qtiChoice,
                                    this.getTestRunner().getAreaBroker().getContentArea().closest('.content-wrapper')
                                );
                            })
                            .on('blur', cursor => {
                                cursor.navigable
                                    .getElement()
                                    .closest('.qti-choice')
                                    .removeClass('key-navigation-highlight');
                            });

                        setupItemsNavigator(navigator, config);
                        setupClickableNavigator(navigator);
                        this.keyNavigators.push(navigator);
                    }
                } else {
                    this.keyNavigators.push(
                        keyNavigator({
                            elements: navigableDomElement.createFromDoms($itemElement),
                            group: $itemElement,
                            propagateTab: false
                        })
                    );
                }
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
