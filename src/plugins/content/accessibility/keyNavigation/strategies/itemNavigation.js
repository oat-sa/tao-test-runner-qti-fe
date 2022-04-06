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
 * Add aria-labelledby attribute to choice interaction
 *
 * @param {Navigator} cursor
 */
const addLabelledByAttribute = cursor => {
    const $element = cursor.navigable.getElement();
    const value = $element.attr('value');
    const name = $element.attr('name');

    if (name) {
        $element.attr(
            'aria-labelledby',
            `${name.replace('response-', 'choice-')}-${value}`
        );
    }

};

/**
 * Add aria-labelledby attribute from choice interaction
 *
 * @param {Navigator} cursor
 */
const removeLabelledByAttribute = cursor => {
    const $element = cursor.navigable.getElement();
    $element.removeAttr('aria-labelledby', '');
};

/**
 * Adds attributes on navigation focus and blur
 *
 * @param {Navigator} navigator
 */
const manageLabelledByAttribute = (navigator) => {
    if (navigator) {
        navigator.on('focus', addLabelledByAttribute);
        navigator.on('blur', removeLabelledByAttribute); // applies WCAG behavior for the radio buttons
    }
};

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

        /**
         * Gets the QTI choice element from the current position in the keyNavigation
         * @param {Object} cursor - The cursor definition supplied by the keyNavigator
         * @returns {jQuery} - The selected choice element
         */
        const getQtiChoice = function (cursor){
            return cursor && cursor.navigable.getElement().closest('.qti-choice');
        };

        /**
         * Creates and registers a keyNavigator for the supplied list of elements
         * @param {jQuery} $elements - The list of navigable elements
         * @param {jQuery} group - The group container
         * @param {Boolean} [loop=false] - Allow cycling the list when a boundary is reached
         * @param {Number|Function} [defaultPosition=0] - The default position the group should set the focus on
         * @returns {keyNavigator} - the created navigator, if the list of element is not empty
         */
        const addNavigator = ($elements, group, loop = false, defaultPosition = 0) => {
            const elements = navigableDomElement.createFromDoms($elements);
            if (elements.length) {
                const navigator = keyNavigator({
                    elements,
                    group,
                    loop,
                    defaultPosition,
                    propagateTab: false
                });
                this.keyNavigators.push(navigator);
                return navigator;
            }
        };

        /**
         * Creates and setups a keyNavigator for the interaction inputs.
         * @param {jQuery} $elements - The list of navigable elements
         * @param {jQuery} group - The group container
         * @param {Boolean} [loop=false] - Allow cycling the list when a boundary is reached
         * @param {Number|Function} [defaultPosition=0] - The default position the group should set the focus on
         * @returns {keyNavigator} - The supplied keyNavigator
         */
        const addInputsNavigator = ($elements, group, loop, defaultPosition = 0) => {
            const navigator = addNavigator($elements, group, loop, defaultPosition);
            if (navigator) {
                setupItemsNavigator(navigator, config);
                setupClickableNavigator(navigator);

                // each choice is represented by more than the input, the style must be spread to the actual element
                navigator
                    .on('focus', cursor => scrollHelper.scrollTo(
                        getQtiChoice(cursor).addClass('key-navigation-highlight'),
                        $content.closest('.content-wrapper')
                    ))
                    .on('blur', cursor => getQtiChoice(cursor).removeClass('key-navigation-highlight'));
            }
            return navigator;
        };

        // list the navigable areas inside the item. This could be either the interactions choices or the prompts
        const $qtiInteractions = $content
            .find('.key-navigation-focusable,.qti-interaction')
            //filter out interaction as it will be managed separately
            .filter((i, node) => !$(node).parents('.qti-interaction').length);

        // the item focusable body elements are considered scrollable
        $content
            .find('.key-navigation-focusable')
            .addClass('key-navigation-scrollable');

        // each navigable area will get its own keyNavigator
        $qtiInteractions
            .each((itemPos, itemElement) => {
                const $itemElement = $(itemElement);

                // detect the type of choices: checkbox or radio
                const $choiceInput = $itemElement.find('.qti-choice input');
                const choiceType = $choiceInput.attr('type');

                if ($itemElement.hasClass('qti-interaction')) {
                    //add navigable elements from prompt
                    $itemElement
                        .find('.key-navigation-focusable')
                        .each((navPos, nav) => {
                            const $nav = $(nav);
                            if (!$nav.closest('.qti-choice').length) {
                                addNavigator($nav, $nav);
                            }
                        });

                    //reset interaction custom key navigation to override the behaviour with the new one
                    $itemElement.off('.keyNavigation');

                    //search for inputs that represent the interaction focusable choices
                    const $inputs = $itemElement.is(':input') ? $itemElement : $itemElement.find(':input');
                    if (config.flatNavigation && (config.flatRadioNavigation || choiceType !== 'radio')) {
                        $inputs.each((i, input) => {
                            const navigator = addInputsNavigator($(input), $itemElement);

                            manageLabelledByAttribute(navigator);
                        });
                    } else {
                        const navigator = addInputsNavigator($inputs, $itemElement, true, () => {
                            // keep default positioning for now
                            let position = -1;

                            // autofocus the selected radio button if any
                            $inputs.each((index, input) => {
                                if (input.checked) {
                                    position = index;
                                }
                            });

                            return position;
                        });

                        manageLabelledByAttribute(navigator);

                        // applies WCAG behavior for the radio buttons
                        if (navigator && config.wcagBehavior) {
                            navigator.on('focus', cursor => {
                                const $element = cursor.navigable.getElement();
                                if (!$element.is(':checked')) {
                                    $element.click();
                                }
                            });
                        }
                    }
                } else {
                    addNavigator($itemElement, $itemElement);
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
