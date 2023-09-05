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

import _ from 'lodash';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import {
    allowedToNavigateFrom,
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * List of CSS selectors for the navigables
 * @type {Object}
 */
const selectors = {
    filters: '.qti-navigator-filters .qti-navigator-filter',
    enabledItems: '.qti-navigator-tree .qti-navigator-item:not(.disabled) .qti-navigator-label'
};

/**
 * For 'fizzy' navigator layout, builds the navigator navigation strategy.
 *
 * @returns {keyNavigationStrategy}
 */
function initFizzy(config, $panel, $navigator, keyNavigators, managedNavigators) {
    let itemsNavigator;

    const $navigatorTree = $panel.find('.qti-navigator-tree');
    const $enabledItems = $navigator.find('.qti-navigator-tree .buttonlist-item:not(.disabled) .buttonlist-btn');
    const navigableItems = navigableDomElement.createFromDoms($enabledItems);

    /**
     * Get item wrapper from navigable button
     * (`navigable`: '.buttonlist-btn'; `parent()`: '.buttonlist-item')
     * @returns {jQuery}
     */
    const getItemFromNavigable = navigable => {
        return navigable.getElement().parent();
    };

    if (navigableItems.length) {
        itemsNavigator = keyNavigator({
            id: 'navigator-items',
            elements: navigableItems,
            group: $navigatorTree,
            loop: true,
            defaultPosition(navigableElements) {
                let pos = _.findIndex(navigableElements, navigable => {
                    const $parent = getItemFromNavigable(navigable);
                    if ($parent.hasClass('buttonlist-item-active') && $parent.is(':visible')) {
                        return true;
                    }
                });
                return pos >= 0 ? pos : 0;
            }
        })
            .on('focus', cursor => {
                getItemFromNavigable(cursor.navigable).addClass('key-navigation-highlight');
            })
            .on('blur', cursor => {
                getItemFromNavigable(cursor.navigable).removeClass('key-navigation-highlight');
            });

        setupItemsNavigator(itemsNavigator, {
            keyNextItem: config.keyNextItem,
            keyPrevItem: config.keyPrevItem
        });
        setupClickableNavigator(itemsNavigator);

        keyNavigators.push(itemsNavigator);
        managedNavigators.push(itemsNavigator);
    }
}

/**
 * Key navigator strategy applying onto the navigation panel.
 * @type {Object} keyNavigationStrategy
 */
export default {
    name: 'navigator',

    /**
     * Builds the navigator navigation strategy.
     *
     * @returns {keyNavigationStrategy}
     */
    init() {
        const config = this.getConfig();
        const $panel = this.getTestRunner().getAreaBroker().getPanelArea();
        const $navigator = $panel.find('.qti-navigator');
        const isFizzyLayout = $navigator.hasClass('qti-navigator-fizzy');

        this.managedNavigators = [];
        this.keyNavigators = [];

        if ($navigator.length && !$navigator.hasClass('disabled')) {
            if (isFizzyLayout) {
                initFizzy(config, $panel, $navigator, this.keyNavigators, this.managedNavigators);
            } else {
                const $testStatusHeader = $navigator.find('.qti-navigator-info.collapsible > .qti-navigator-label');
                const navigableTestStatus = navigableDomElement.createFromDoms($testStatusHeader);

                $testStatusHeader.addClass('key-navigation-actionable');

                if (navigableTestStatus.length) {
                    const testStatusNavigation = keyNavigator({
                        keepState: config.keepState,
                        id: 'navigator-test-status',
                        propagateTab: false,
                        elements: navigableTestStatus,
                        group: $testStatusHeader,
                    });

                    setupItemsNavigator(testStatusNavigation, {
                        keyNextItem: config.keyNextTab || config.keyNextItem,
                        keyPrevItem: config.keyPrevTab || config.keyPrevItem
                    });

                    this.keyNavigators.push(testStatusNavigation);
                    this.managedNavigators.push(testStatusNavigation);
                }

                let filtersNavigator;
                let itemsNavigator;
                //the tag to identify if the item listing has been browsed, to only "smart jump" to active item only on the first visit
                let itemListingVisited = false;
                //the position of the filter in memory, to only "smart jump" to active item only on the first visit
                let currentFilter;

                const $filters = $navigator.find(selectors.filters);
                const navigableFilters = navigableDomElement.createFromDoms($filters);

                if (navigableFilters.length) {
                    filtersNavigator = keyNavigator({
                        keepState: config.keepState,
                        id: 'navigator-filters',
                        propagateTab: false,
                        elements: navigableFilters,
                        group: $navigator.find('.qti-navigator-filters')
                    });

                    setupItemsNavigator(filtersNavigator, {
                        keyNextItem: config.keyNextTab || config.keyNextItem,
                        keyPrevItem: config.keyPrevTab || config.keyPrevItem
                    });
                    setupClickableNavigator(filtersNavigator);

                    if (config.keepState) {
                        filtersNavigator.on('focus', cursor => {
                            if (config.keepState) {
                                const $element = cursor.navigable.getElement();
                                const filter = $element.data('mode');
                                $element.click();

                                if (currentFilter !== filter) {
                                    itemListingVisited = false;
                                }

                                currentFilter = filter;
                            }
                        });
                    }

                    if (config.keyNextContent) {
                        filtersNavigator.on(config.keyNextContent, elem => {
                            if (allowedToNavigateFrom(elem) && itemsNavigator) {
                                _.defer(() => {
                                    if (itemListingVisited) {
                                        itemsNavigator.first();
                                    } else {
                                        itemsNavigator.focus();
                                    }
                                });
                            }
                        });
                    }
                    if (config.keyPrevContent) {
                        filtersNavigator.on(config.keyPrevContent, elem => {
                            if (allowedToNavigateFrom(elem) && itemsNavigator) {
                                _.defer(() => {
                                    itemsNavigator.last();
                                });
                            }
                        });
                    }

                    this.keyNavigators.push(filtersNavigator);
                    this.managedNavigators.push(filtersNavigator);
                }

                const $navigatorTree = $panel.find('.qti-navigator-tree');
                const $trees = $navigator.find(selectors.enabledItems);
                const navigableTrees = navigableDomElement.createFromDoms($trees);

                $trees.first().addClass('key-navigation-scrollable-up');
                $trees.last().addClass('key-navigation-scrollable-down');

                if (navigableTrees.length) {
                    //instantiate a key navigator but do not add it to the returned list of navigators as this is not supposed to be reached with tab key
                    itemsNavigator = keyNavigator({
                        id: 'navigator-items',
                        elements: navigableTrees,
                        group: $navigatorTree,
                        defaultPosition(navigableElements) {
                            let pos = 0;
                            if (config.flatNavigation || currentFilter !== 'flagged') {
                                pos = _.findIndex(navigableElements, navigable => {
                                    const $parent = navigable.getElement().parent('.qti-navigator-item');
                                    if ($parent.hasClass('active') && $parent.is(':visible')) {
                                        return true;
                                    }
                                });
                            }
                            return pos;
                        }
                    })
                        .on('focus', cursor => {
                            itemListingVisited = true;
                            cursor.navigable
                                .getElement()
                                .parent()
                                .addClass('key-navigation-highlight');
                        })
                        .on('blur', cursor => {
                            cursor.navigable
                                .getElement()
                                .parent()
                                .removeClass('key-navigation-highlight');
                        });

                    setupItemsNavigator(itemsNavigator, {
                        keyNextItem: config.keyNextContent || config.keyNextItem,
                        keyPrevItem: config.keyPrevContent || config.keyPrevItem
                    });
                    setupClickableNavigator(itemsNavigator);

                    if (config.keepState) {
                        itemsNavigator.on('lowerbound upperbound', () => {
                            if (filtersNavigator) {
                                filtersNavigator.focus();
                            }
                        });
                    }

                    if (config.keyNextTab && config.keyPrevTab) {
                        itemsNavigator.on(config.keyNextTab, function (elem) {
                            if (allowedToNavigateFrom(elem) && filtersNavigator) {
                                filtersNavigator.focus().next();
                            }
                        });

                        itemsNavigator.on(config.keyPrevTab, function (elem) {
                            if (allowedToNavigateFrom(elem) && filtersNavigator) {
                                filtersNavigator.focus().previous();
                            }
                        });
                    } else {
                        this.keyNavigators.push(itemsNavigator);
                    }
                    this.managedNavigators.push(itemsNavigator);
                }
            }
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
        this.managedNavigators.forEach(navigator => navigator.destroy());
        this.managedNavigators = [];
        this.keyNavigators = [];

        return this;
    }
};
