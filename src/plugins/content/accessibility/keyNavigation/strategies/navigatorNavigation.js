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
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import {
    allowedToNavigateFrom,
    setupItemsNavigator,
    setupClickableNavigator
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

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
        let filtersNavigator;
        let itemsNavigator;
        let $filters, $trees, navigableFilters, navigableTrees;

        //the tag to identify if the item listing has been browsed, to only "smart jump" to active item only on the first visit
        let itemListingVisited = false;
        //the position of the filter in memory, to only "smart jump" to active item only on the first visit
        let currentFilter;

        this.managedNavigators = [];
        this.keyNavigators = [];

        if ($navigator.length && !$navigator.hasClass('disabled')) {
            $filters = $navigator.find('.qti-navigator-filters .qti-navigator-filter');
            navigableFilters = navigableDomElement.createFromDoms($filters);
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
            $trees = $navigator.find('.qti-navigator-tree .qti-navigator-item:not(.unseen) .qti-navigator-label');
            navigableTrees = navigableDomElement.createFromDoms($trees);
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
                    if (config.keyNextTab) {
                        itemsNavigator.on(config.keyNextTab, function (elem) {
                            if (allowedToNavigateFrom(elem) && filtersNavigator) {
                                filtersNavigator.focus().next();
                            }
                        });
                    }

                    if (config.keyPrevTab) {
                        itemsNavigator.on(config.keyPrevTab, function (elem) {
                            if (allowedToNavigateFrom(elem) && filtersNavigator) {
                                filtersNavigator.focus().previous();
                            }
                        });
                    }
                } else {
                    this.keyNavigators.push(itemsNavigator);
                }
                this.managedNavigators.push(itemsNavigator);
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