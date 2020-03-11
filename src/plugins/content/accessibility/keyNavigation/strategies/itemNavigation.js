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
    showElementsContent,
    allowedToNavigateFrom
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Builds a key navigator strategy applying inside the item.
 * Navigable item content are interaction choices and body element with the special class "key-navigation-focusable".
 * Depending on the mode it can be reduced to interaction choices only.
 *
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.keyNextItem - the keyboard shortcut to move to the next item (inside the scope)
 * @param {String} config.keyPreviousItem - the keyboard shortcut to move to the previous item (inside the scope)
 * @param {String} config.keyNextGroup - the keyboard shortcut to move to the next group (outside the scope)
 * @param {String} config.keyPreviousGroup - the keyboard shortcut to move to the previous group (outside the scope)
 * @returns {keyNavigatorStrategy}
 */
export default function itemNavigationStrategyFactory(testRunner, config) {
    let keyNavigators = [];
    let choicesNavigators = [];

    /**
     * @typedef {Object} keyNavigatorStrategy
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

            if (config.contentNavigatorType === 'linear') {
                const $qtiChoiceNodesList = $qtiIteractionsNodeList.find('.qti-choice');
                let $lastParent = null;
                let list = [];
                const setupListNavigator = () => {
                    choicesNavigators.push(
                        keyNavigator({
                            elements: navigableGroupElement.createFromNavigators(list),
                            propagateTab: false
                        })
                            .on(config.keyNextInGroup, function(elem) {
                                if (allowedToNavigateFrom(elem)) {
                                    this.next();
                                }
                            })
                            .on(config.keyPrevInGroup, function(elem) {
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
            } else {
                $qtiIteractionsNodeList
                    .each((i, el) => {
                        const $itemElement = $(el);
                        if ($itemElement.hasClass('qti-interaction')) {
                            this.addInteraction($itemElement);
                        } else {
                            keyNavigators.push(
                                keyNavigator({
                                    elements: navigableDomElement.createFromDoms($itemElement),
                                    group: $itemElement,
                                    propagateTab: false
                                })
                            );
                        }
                    });
            }

            return this.getNavigators();
        },

        /**
         * Set key navigation on the interaction
         *
         * @param {jQuery} $interaction - the interaction container
         * @returns {keyNavigatorStrategy}
         */
        addInteraction($interaction) {
            //add navigable elements from prompt
            $interaction.find('.key-navigation-focusable').each(function () {
                const $nav = $(this);
                if (!$nav.closest('.qti-choice').length) {
                    keyNavigators.push(
                        keyNavigator({
                            elements: navigableDomElement.createFromDoms($nav),
                            group: $nav,
                            propagateTab: false
                        })
                    );
                }
            });

            //reset interaction custom key navigation to override the behaviour with the new one
            $interaction.off('.keyNavigation');

            //search for inputs that represent the interaction focusable choices
            const $inputs = $interaction.is(':input') ? $interaction : $interaction.find(':input');
            const interactionNavigables = navigableDomElement.createFromDoms($inputs);

            if (interactionNavigables.length) {
                keyNavigators.push(
                    keyNavigator({
                        elements: interactionNavigables,
                        group: $interaction,
                        loop: false
                    })
                        .on(config.keyNextInGroup, function (elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.next();
                            }
                        })
                        .on(config.keyPrevInGroup, function (elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.previous();
                            }
                        })
                        .on('activate', function (cursor) {
                            const $elt = cursor.navigable.getElement();

                            //jQuery <= 1.9.0 the checkbox values are set
                            //after the click event if triggerred with jQuery
                            if ($elt.is(':checkbox')) {
                                $elt.each(function () {
                                    this.click();
                                });
                            } else {
                                $elt.click();
                            }
                        })
                        .on('focus', function (cursor) {
                            const $qtiChoice = cursor.navigable.getElement().closest('.qti-choice');
                            $qtiChoice.addClass('key-navigation-highlight');
                            showElementsContent($qtiChoice, testRunner.getAreaBroker().getContentArea());
                        })
                        .on('blur', function (cursor) {
                            cursor.navigable
                                .getElement()
                                .closest('.qti-choice')
                                .removeClass('key-navigation-highlight');
                        })
                );
            }

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
            choicesNavigators.forEach(navigator => navigator.destroy());
            choicesNavigators = [];
            keyNavigators = [];

            return this;
        }
    };
}
