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
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Key navigator strategy applying inside the item.
 * Navigable item content are interaction choices and body element with the special class "key-navigation-focusable".
 */
export default {
    name: 'item',

    /**
     * Builds the item navigation strategy.
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
             * @returns {keyNavigationStrategy}
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

                return this;
            },

            /**
             * Set key navigation on the interaction
             *
             * @param {jQuery} $interaction - the interaction container
             * @returns {keyNavigationStrategy}
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
                                return scrollHelper.scrollTo(
                                    $qtiChoice,
                                    testRunner.getAreaBroker().getContentArea().closest('.content-wrapper')
                                );
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
