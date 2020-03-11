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
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Key navigator strategy applying inside the item.
 * Navigable item content are interaction choices with the special class "key-navigation-focusable".
 */
export default {
    name: 'linearItem',

    /**
     * Builds the item navigation strategy.
     *
     * @param {testRunner} testRunner - the test runner instance to control
     * @param {keyNavigationStrategyConfig} config - the config to apply
     * @returns {keyNavigationStrategy}
     */
    init(testRunner, config) {
        let keyNavigators = [];
        let choicesNavigators = [];

        /**
         * @typedef {Object} keyNavigationStrategy
         */
        return {
            /**
             * Setup the keyNavigator strategy
             * @returns {keyNavigator[]}
             */
            init() {
                const $content = testRunner.getAreaBroker().getContentArea();
                const $qtiIteractionsNodeList = $content
                    .find('.key-navigation-focusable,.qti-interaction')
                    .filter(function () {
                        //filter out interaction as it will be managed separately
                        return !$(this).parents('.qti-interaction').length;
                    });

                // the item focusable body elements are considered scrollable
                $content.find('.key-navigation-focusable').addClass('key-navigation-scrollable');

                const $qtiChoiceNodesList = $qtiIteractionsNodeList.find('.qti-choice');
                let $lastParent = null;
                let list = [];
                const setupListNavigator = () => {
                    choicesNavigators.push(
                        keyNavigator({
                            elements: navigableGroupElement.createFromNavigators(list),
                            propagateTab: false
                        })
                            .on(config.keyNextItem, function (elem) {
                                if (allowedToNavigateFrom(elem)) {
                                    this.next();
                                }
                            })
                            .on(config.keyPrevItem, function (elem) {
                                if (allowedToNavigateFrom(elem)) {
                                    this.previous();
                                }
                            })
                    );
                };

                $qtiChoiceNodesList.each(function () {
                    const $itemElement = $(this);
                    const $parent = $itemElement.parent();
                    const choiceNavigator = keyNavigator({
                        elements: navigableDomElement.createFromDoms($itemElement),
                        group: $itemElement,
                        propagateTab: false
                    })
                        .on('activate', function (cursor) {
                            const $elt = cursor.navigable.getElement();
                            // jQuery <= 1.9.0
                            // the checkbox values are set after the click event if triggered with jQuery
                            if ($elt.is(':checkbox')) {
                                $elt.each(function () {
                                    this.click();
                                });
                            } else {
                                $elt.click();
                            }
                        });

                    if ($lastParent && !$parent.is($lastParent)) {
                        setupListNavigator();
                        list = [];
                    }

                    keyNavigators.push(choiceNavigator);
                    list.push(choiceNavigator);
                    $lastParent = $parent;
                });

                if (list.length) {
                    setupListNavigator();
                    list = [];
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
                choicesNavigators.forEach(navigator => navigator.destroy());
                choicesNavigators = [];
                keyNavigators = [];

                return this;
            }
        };
    }
};
