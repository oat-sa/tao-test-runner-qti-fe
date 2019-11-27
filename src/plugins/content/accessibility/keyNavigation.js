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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */
/**
 * Test Runner Content Plugin : Navigate through the item focusable elements using the keyboard
 *
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import navigableGroupElement from 'ui/keyNavigation/navigableGroupElement';
import shortcut from 'util/shortcut';
import pluginFactory from 'taoTests/runner/plugin';
import 'taoQtiTest/runner/plugins/content/accessibility/css/key-navigation.css';

/**
 * When either an element or its parents have this class - navigation from it would be disabled.
 *
 * @type {String}
 */
const ignoredClass = 'no-key-navigation';

/**
 * If we have now config from backend side - we set this default dataset
 *
 * @typedef {object}
 * @properties {string} contentNavigatorType - ('default' | 'linear') - type of content navigation
 */
const defaultPluginConfig = {
    contentNavigatorType: 'default'
};

const keysForTypesMap = {
    default: {
        nextGroup: 'tab',
        prevGroup: 'shift+tab',
        nextInGroup: 'right down',
        prevInGroup: 'left up',
        nextInFilters: 'right',
        prevInFilters: 'left',
        nextInList: 'down',
        prevInList: 'up',
        nextLinearFromFirst: '',
        prevLinearFromLast: ''
    },
    linear: {
        nextGroup: 'tab',
        prevGroup: 'shift+tab',
        nextInGroup: 'right down',
        prevInGroup: 'left up',
        nextInFilters: 'right',
        prevInFilters: 'left',
        nextInList: 'down',
        prevInList: 'up',
        nextLinearFromFirst: 'right',
        prevLinearFromLast: 'left'
    },
    native: {
        nextGroup: '',
        prevGroup: '',
        nextInGroup: 'tab',
        prevInGroup: 'shift+tab',
        nextInFilters: 'tab',
        prevInFilters: 'shift+tab',
        nextInList: 'tab',
        prevInList: 'shift+tab',
        nextLinearFromFirst: '',
        prevLinearFromLast: ''
    }
}
/**
 * Init the navigation in the toolbar
 *
 * @param {Object} testRunner
 * @returns {Array}
 */
function initToolbarNavigation(config) {
    const $navigationBar = $('.bottom-action-bar');
    const $focusables = $navigationBar.find('.action:not(.btn-group):visible, .action.btn-group .li-inner:visible');
    const navigables = navigableDomElement.createFromDoms($focusables);
    const isNativeNavigation = config.contentNavigatorType === 'native';
    if (navigables.length) {
        return [
            keyNavigator({
                id: 'bottom-toolbar',
                replace: true,
                group: $navigationBar,
                elements: navigables,
                defaultPosition: function defaultPosition(navigables) {
                    if (isNativeNavigation) {
                        return 0;
                    }
                    let pos = navigables.length - 1;
                    // start from the button "Next" or the button "End test"
                    _.forIn(navigables, function(navigable, i) {
                        const $element = navigable.getElement();
                        // find button "Next"
                        if ($element.data('control') &&
                            ($element.data('control') === 'move-forward' ||
                            $element.data('control') === 'move-end')) {
                            pos = i;
                            return;
                        }
                    });
                    // else the last button
                    return pos;
                }
            })
                .on(config.nextInGroup, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.next();
                    }
                })
                .on(config.prevInGroup, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.previous();
                    }
                })
                .on('activate', function(cursor) {
                    cursor.navigable
                        .getElement()
                        .click()
                        .mousedown();
                })
        ];
    }
    return [];
}

/**
 * Init the navigation in the header block
 *
 * @param {Object} testRunner
 * @returns {Array}
 */
function initHeaderNavigation(config) {
    //need global selector as currently no way to access delivery frame from test runner
    const $header = $('header');
    const $headerElements = $header.find('a:visible');
    const navigables = navigableDomElement.createFromDoms($headerElements);
    if (navigables.length) {
        return [
            keyNavigator({
                id: 'header-toolbar',
                group: $header,
                elements: navigables,
                replace: true
            })
                .on(config.nextInGroup, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.next();
                    }
                })
                .on(config.prevInGroup, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.previous();
                    }
                })
                .on('activate', function(cursor) {
                    cursor.navigable.getElement().click();
                })
        ];
    }
    return [];
}

/**
 * Init the navigation in the review panel
 *
 * @param {Object} testRunner
 * @returns {Array} the keyNavigator of the main navigation group
 */
function initNavigatorNavigation(testRunner, config) {
    const $panel = testRunner.getAreaBroker().getPanelArea();
    const $navigator = $panel.find('.qti-navigator');
    const isNativeNavigation = config.contentNavigatorType === 'native';
    const navigators = [];
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
                keepState: isNativeNavigation ? false : true,
                id: 'navigator-filters',
                replace: true,
                elements: navigableFilters,
                group: $navigator.find('.qti-navigator-filters')
            })
                .on(config.nextInFilters, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.next();
                    }
                })
                .on(config.prevInFilters, function(elem) {
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
                    .on(config.nextInList, function(elem) {
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
                    .on(config.prevInList, function(elem) {
                        if (!allowedToNavigateFrom(elem)) {
                            return false;
                        } else if (itemsNavigator) {
                            _.defer(function() {
                                itemsNavigator.last();
                            });
                        }
                    })
            }
            navigators.push(filtersNavigator);
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
                defaultPosition: function defaultPosition(navigables) {
                    const pos = 0;
                    if (filterCursor && filterCursor.navigable.getElement().data('mode') !== 'flagged') {
                        _.forIn(navigables, function(navigable, i) {
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
                .on(config.nextInList, function(elem) {
                    if (!allowedToNavigateFrom(elem)) {
                        return false;
                    } else {
                        this.next();
                    }
                })
                .on(config.prevInList, function(elem) {
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
                    .on(config.nextInFilters, function(elem) {
                        if (!allowedToNavigateFrom(elem)) {
                            return false;
                        } else if (filtersNavigator) {
                            filtersNavigator.focus().next();
                        }
                    })
                    .on(config.prevInFilters, function(elem) {
                        if (!allowedToNavigateFrom(elem)) {
                            return false;
                        } else if (filtersNavigator) {
                            filtersNavigator.focus().previous();
                        }
                    });
            }
            if (isNativeNavigation) {
                navigators.push(itemsNavigator);
            }
        }
    }
    return navigators;
}

/**
 * Init the navigation in the item content
 * Navigable item content are interaction choices and body element with the special class "key-navigation-focusable"
 * It returns an array of keyNavigators as the content is dynamically determined
 *
 * @param {Object} testRunner
 * @returns {Array} of keyNavigator ids
 */
function initDefaultContentNavigation(testRunner, config) {
    let itemNavigators = [];
    const $content = testRunner.getAreaBroker().getContentArea();

    //the item focusable body elements are considered scrollable
    $content.find('.key-navigation-focusable').addClass('key-navigation-scrollable');
    $content
        .find('.key-navigation-focusable,.qti-interaction')
        .filter(function() {
            //filter out interaction as it will be managed separately
            return !$(this).parents('.qti-interaction').length;
        })
        .each(function() {
            const $itemElement = $(this);
            if ($itemElement.hasClass('qti-interaction')) {
                itemNavigators = _.union(itemNavigators, initInteractionNavigation($itemElement, testRunner, config));
            } else {
                itemNavigators.push(
                    keyNavigator({
                        elements: navigableDomElement.createFromDoms($itemElement),
                        group: $itemElement,
                        propagateTab: false
                    })
                );
            }
        });

    return itemNavigators;
}

/**
 * Init the navigation in the item content
 * Navigable item content are interaction choices only
 * It's works with templates for default key
 *
 * @param {Object} testRunner
 * @returns {Array} of keyNavigator ids
 */
function initAllContentButtonsNavigation(testRunner) {
    const navigableElements = [];
    const $content = testRunner.getAreaBroker().getContentArea();
    const $qtiIteractionsNodeList = $content.find('.key-navigation-focusable,.qti-interaction').filter(function() {
        //filter out interaction as it will be managed separately
        return !$(this).parents('.qti-interaction').length;
    });
    const $qtiChoiceNodesList = $qtiIteractionsNodeList.find('.qti-choice');

    //the item focusable body elements are considered scrollable
    $content.find('.key-navigation-focusable').addClass('key-navigation-scrollable');

    $qtiChoiceNodesList.each(function() {
        const $itemElement = $(this);
        const keyNavigatorItem = keyNavigator({
            elements: navigableDomElement.createFromDoms($itemElement),
            group: $itemElement,
            propagateTab: false
        });

        keyNavigatorItem.on('activate', function(cursor) {
            const $elt = cursor.navigable.getElement();
            //jQuery <= 1.9.0 the checkbox values are set
            //after the click event if triggerred with jQuery
            if ($elt.is(':checkbox')) {
                $elt.each(function() {
                    this.click();
                });
            } else {
                $elt.click();
            }
        });

        navigableElements.push(keyNavigatorItem);
    });

    return navigableElements;
}

/**
 * Init interaction key navigation from the interaction navigator
 *
 * @param {JQuery} $interaction - the interaction container
 * @returns {Array} array of navigators created from interaction container
 */
function initInteractionNavigation($interaction, testRunner, config) {
    let $inputs;
    let interactionNavigables;
    const interactionNavigators = [];

    //add navigable elements from prompt
    $interaction.find('.key-navigation-focusable').each(function() {
        const $nav = $(this);
        if (!$nav.closest('.qti-choice').length) {
            interactionNavigators.push(
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
    $inputs = $interaction.is(':input') ? $interaction : $interaction.find(':input');
    interactionNavigables = navigableDomElement.createFromDoms($inputs);

    if (interactionNavigables.length) {
        const keyNavigatorItem = keyNavigator({
            elements: interactionNavigables,
            group: $interaction,
            loop: false
        });

        keyNavigatorItem
            .on(config.nextInGroup, function(elem) {
                if (!allowedToNavigateFrom(elem)) {
                    return false;
                } else {
                    this.next();
                }
            })
            .on(config.prevInGroup, function(elem) {
                if (!allowedToNavigateFrom(elem)) {
                    return false;
                } else {
                    this.previous();
                }
            })
            .on('activate', function(cursor) {
                const $elt = cursor.navigable.getElement();

                //jQuery <= 1.9.0 the checkbox values are set
                //after the click event if triggerred with jQuery
                if ($elt.is(':checkbox')) {
                    $elt.each(function() {
                        this.click();
                    });
                } else {
                    $elt.click();
                }
            })
            .on('focus', function(cursor) {
		        const $qtiChoice = cursor.navigable.getElement().closest('.qti-choice');
                $qtiChoice.addClass('key-navigation-highlight');
                showElementsContent($qtiChoice, testRunner.getAreaBroker().getContentArea());
            })
            .on('blur', function(cursor) {
                cursor.navigable
                    .getElement()
                    .closest('.qti-choice')
                    .removeClass('key-navigation-highlight');
            });

        interactionNavigators.push(keyNavigatorItem);
    }

    return interactionNavigators;
}

/**
 * Scrolling to the top of the required element
 */
function showElementsContent($el, $visibleContainer) {
    const $wrapper = $visibleContainer.closest('.content-wrapper');
    if ($wrapper.length && $el.length) {
        $wrapper.scrollTop($el.offset().top + $wrapper.scrollTop() - $wrapper.offset().top);
    }
}

/**
 * Init the navigation of test rubric blocks
 * It returns an array of keyNavigator ids as the content is dynamically determined
 *
 * @param {Object} testRunner
 * @returns {Array} of keyNavigator ids
 */
function initRubricNavigation() {
    let $itemElements;
    const rubricNavigators = [];
    const $rubricArea = $('#qti-rubrics');

    $itemElements = $rubricArea.find('.qti-rubricBlock');
    $itemElements.each(function() {
        const $itemElement = $(this);
        const id = `rubric_element_navigation_group_${rubricNavigators.length}`;

        rubricNavigators.push(
            keyNavigator({
                id: id,
                elements: navigableDomElement.createFromDoms($itemElement),
                group: $itemElement,
                replace: true
            })
        );
    });

    return rubricNavigators;
}

/**
 * Init the navigation to select all item page
 * make this element scrollable
 *
 * @param {Object} testRunner
 * @returns {Array} of keyNavigator ids
 */
function initDefaultItemNavigation(testRunner) {
    const itemNavigators = [];
    const $container = $(testRunner.getAreaBroker().getContainer());
    const $wrapper = $container.find('.content-wrapper');
    let keyNavigatorItem;
    const navigables = navigableDomElement.createFromDoms($wrapper);

    $wrapper.addClass('key-navigation-scrollable');
    if (navigables.length) {
        const itemId = testRunner.getCurrentItem().id;
        keyNavigatorItem = keyNavigator({
            id: `item-content-wrapper_${itemId}`,
            group: $wrapper,
            elements: navigables,
            propagateTab: false, // inner item navigators will send tab to this element
            replace: true,
        });

        itemNavigators.push(
            keyNavigatorItem
        );
    }

    return itemNavigators;
}

/**
 * Init test runner navigation
 * @param testRunner
 * @returns {*}
 */
function initTestRunnerNavigation(testRunner, pluginConfig) {
    let keyNavigatorItem;
    let navigators;

    //blur current focused element, to reinitialize keyboard navigation
    if (document.activeElement) {
        document.activeElement.blur();
    }
    const config = Object.assign({}, pluginConfig, keysForTypesMap[pluginConfig.contentNavigatorType]);
    switch (config.contentNavigatorType) {
        case 'linear':
            navigators = _.union(
                initRubricNavigation(testRunner),
                initAllContentButtonsNavigation(testRunner),
                initToolbarNavigation(config),
                initHeaderNavigation(config),
                initNavigatorNavigation(testRunner, config),
                initDefaultItemNavigation(testRunner)
            );
            break;
        case 'native':
                navigators = _.union(
                    initHeaderNavigation(config),
                    initNavigatorNavigation(testRunner, config),
                    initRubricNavigation(testRunner),
                    initDefaultContentNavigation(testRunner, config),
                    initToolbarNavigation(config),
                );
                break;
        default:
            navigators = _.union(
                initRubricNavigation(testRunner),
                initDefaultContentNavigation(testRunner, config),
                initToolbarNavigation(config),
                initHeaderNavigation(config),
                initNavigatorNavigation(testRunner, config),
                initDefaultItemNavigation(testRunner)
            );
            break;
    }
    const isNativeNavigation = config.contentNavigatorType === 'native';
    if (isNativeNavigation) {
        _.forEach(navigators, function addListeners(navigator){
            navigator
                .on('upperbound', function moveToNextGroup() {
                    if (allowedToNavigateFrom(navigator)) {
                        keyNavigatorItem.next();
                    }
                })
                .on('lowerbound', function moveToPrevGroup() {
                    if (allowedToNavigateFrom(navigator)) {
                        keyNavigatorItem.previous();
                        keyNavigatorItem.getCursor().navigable.getKeyNavigator().last();
                    }
                });
        });
    }

    navigators = navigableGroupElement.createFromNavigators(navigators);

    keyNavigatorItem = keyNavigator({
        id: 'test-runner',
        replace: true,
        loop: true,
        elements: navigators,
        // we don't need to propagate tabs for the main navigation, because we've rewritten them and this is not an element
        // there is an issue with nested navigators
        propagateTab: isNativeNavigation ? true : false,
    });

    if (!isNativeNavigation) {
        keyNavigatorItem
            .on(config.nextGroup, function(elem) {
                if (allowedToNavigateFrom(elem)) {
                    this.next();
                }
            })
            .on(config.prevGroup, function(elem) {
                if (allowedToNavigateFrom(elem)) {
                    this.previous();
                }
            });
    }

    if (config.contentNavigatorType === 'linear') {
        keyNavigatorItem
            .on(config.nextLinearFromFirst, function(elem) {
                const isCurrentElementFirst = $(elem).is(':first-child');

                if (isCurrentElementFirst && allowedToNavigateFrom(elem)) {
                    this.next();
                }
            })
            .on(config.prevLinearFromLast, function(elem) {
                const isCurrentElementLast = $(elem).is(':last-child');

                if (isCurrentElementLast && allowedToNavigateFrom(elem)) {
                    this.previous();
                }
            });
    }

    return keyNavigatorItem;
}

/**
 * Checks whether element is navigable from
 *
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function allowedToNavigateFrom(element) {
    const $element = $(element);

    if ($element.hasClass(ignoredClass) || $element.parents(`.${ignoredClass}`).length > 0) {
        return false;
    }

    return true;
}

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'keyNavigation',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init: function init() {
        const self = this;
        const testRunner = this.getTestRunner();
        const pluginConfig = Object.assign({}, defaultPluginConfig, this.getConfig());

        //start disabled
        this.disable();

        /**
         *  Update plugin state based on changes
         */
        testRunner
            .after('renderitem', function() {
                self.groupNavigator = initTestRunnerNavigation(testRunner, pluginConfig);

                shortcut.add('tab shift+tab', function(e) {
                    if (!allowedToNavigateFrom(e.target)) {
                        return false;
                    }
                    if (!self.groupNavigator.isFocused()) {
                        self.groupNavigator.focus();
                    }
                });
            })
            .on('unloaditem', function() {
                self.disable();
            })
            /**
             * @param {string} type - type of content tab navigation,
             * can be: 'default' || 'linear'
             */
            .on('setcontenttabtype', function(type) {
                pluginConfig.contentNavigatorType = type;
            });
    },

    /**
     * Called during the runner's destroy phase
     */
    destroy: function destroy() {
        shortcut.remove(`.${this.getName()}`);
        if (this.groupNavigator) {
            this.groupNavigator.destroy();
        }
    }
});
