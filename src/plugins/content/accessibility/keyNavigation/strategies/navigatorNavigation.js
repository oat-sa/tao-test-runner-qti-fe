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
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';

/**
 * Builds a key navigator strategy applying onto the navigation panel
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.keyNextItem - the keyboard shortcut to move to the next item (inside the scope)
 * @param {String} config.keyPreviousItem - the keyboard shortcut to move to the previous item (inside the scope)
 * @param {String} config.keyNextGroup - the keyboard shortcut to move to the next group (outside the scope)
 * @param {String} config.keyPreviousGroup - the keyboard shortcut to move to the previous group (outside the scope)
 * @returns {keyNavigatorStrategy}
 */
export default function navigatorNavigationStrategyFactory(testRunner, config) {
    let keyNavigators = [];

    /**
     * @typedef {Object} keyNavigatorStrategy
     */
    return {
        /**
         * Setup the keyNavigator strategy
         * @returns {keyNavigatorStrategy}
         */
        init() {
            const $panel = testRunner.getAreaBroker().getPanelArea();
            const $navigator = $panel.find('.qti-navigator');
            const isNativeNavigation = config.contentNavigatorType === 'native';
            let filtersNavigator;
            let itemsNavigator;
            let $filters, $trees, navigableFilters, navigableTrees;

            //the tag to identify if the item listing has been browsed, to only "smart jump" to active item only on the first visit
            let itemListingVisited = false;
            //the position of the filter in memory, to only "smart jump" to active item only on the first visit
            let filterCursor;

            if ($navigator.length && !$navigator.hasClass('disabled')) {
                $filters = $navigator.find('.qti-navigator-filters .qti-navigator-filter');
                navigableFilters = navigableDomElement.createFromDoms($filters);
                if (navigableFilters.length) {
                    filtersNavigator = keyNavigator({
                        keepState: !isNativeNavigation,
                        id: 'navigator-filters',
                        replace: true,
                        elements: navigableFilters,
                        group: $navigator.find('.qti-navigator-filters')
                    })
                        .on(config.keyNextInFilters, function(elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.next();
                            }
                        })
                        .on(config.keyPrevInFilters, function(elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.previous();
                            }
                        })
                        .on('activate', function(cursor) {
                            cursor.navigable.getElement().click();
                        })
                        .on('focus', function(cursor, origin) {
                            if (!isNativeNavigation) {
                                //activate the tab in the navigators
                                cursor.navigable.getElement().click();

                                //reset the item listing browsed tag whenever the focus on the filter happens after a focus on another element
                                if ((filterCursor && filterCursor.position !== cursor.position) || origin) {
                                    itemListingVisited = false;
                                }
                                //set the filter cursor in memory
                                filterCursor = cursor;
                            }

                        });
                    if (!isNativeNavigation) {
                        filtersNavigator
                            .on(config.keyNextInList, function(elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else if (itemsNavigator) {
                                    _.defer(function() {
                                        if (itemListingVisited) {
                                            itemsNavigator.focus().first();
                                        } else {
                                            itemsNavigator.focus();
                                        }
                                    });
                                }
                            })
                            .on(config.keyPrevInList, function(elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else if (itemsNavigator) {
                                    _.defer(function() {
                                        itemsNavigator.last();
                                    });
                                }
                            });
                    }
                    keyNavigators.push(filtersNavigator);
                }

                const $navigatorTree = $panel.find('.qti-navigator-tree');
                $trees = $navigator.find('.qti-navigator-tree .qti-navigator-item:not(.unseen) .qti-navigator-label');
                navigableTrees = navigableDomElement.createFromDoms($trees);
                if (navigableTrees.length) {
                    //instantiate a key navigator but do not add it to the returned list of navigators as this is not supposed to be reached with tab key
                    itemsNavigator = keyNavigator({
                        id: 'navigator-items',
                        replace: true,
                        elements: navigableTrees,
                        group: $navigatorTree,
                        defaultPosition(navigables) {
                            let pos = 0;
                            if (filterCursor && filterCursor.navigable.getElement().data('mode') !== 'flagged') {
                                _.forEach(navigables, function(navigable, i) {
                                    const $parent = navigable.getElement().parent('.qti-navigator-item');
                                    //find the first active and visible item
                                    if ($parent.hasClass('active') && $parent.is(':visible')) {
                                        pos = i;
                                        return false;
                                    }
                                });
                            }
                            return pos;
                        }
                    })
                        .on(config.keyNextInList, function(elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.next();
                            }
                        })
                        .on(config.keyPrevInList, function(elem) {
                            if (!allowedToNavigateFrom(elem)) {
                                return false;
                            } else {
                                this.previous();
                            }
                        })
                        .on('activate', function(cursor) {
                            cursor.navigable.getElement().click();
                        })
                        .on('lowerbound upperbound', function() {
                            if (!isNativeNavigation && filtersNavigator) {
                                filtersNavigator.focus();
                            }
                        })
                        .on('focus', function(cursor) {
                            itemListingVisited = true;
                            cursor.navigable
                                .getElement()
                                .parent()
                                .addClass('key-navigation-highlight');
                        })
                        .on('blur', function(cursor) {
                            cursor.navigable
                                .getElement()
                                .parent()
                                .removeClass('key-navigation-highlight');
                        });
                    if (!isNativeNavigation) {
                        itemsNavigator
                            .on(config.keyNextInFilters, function(elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else if (filtersNavigator) {
                                    filtersNavigator.focus().next();
                                }
                            })
                            .on(config.keyPrevInFilters, function(elem) {
                                if (!allowedToNavigateFrom(elem)) {
                                    return false;
                                } else if (filtersNavigator) {
                                    filtersNavigator.focus().previous();
                                }
                            });
                    }
                    if (isNativeNavigation) {
                        keyNavigators.push(itemsNavigator);
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
            return keyNavigators;
        },

        /**
         * Tears down the keyNavigator strategy
         * @returns {keyNavigatorStrategy}
         */
        destroy() {
            keyNavigators.forEach(navigator => navigator.destroy());
            keyNavigators = [];

            return this;
        }
    };
}