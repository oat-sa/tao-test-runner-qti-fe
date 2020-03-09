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
 * Copyright (c) 2016-2020 (original work) Open Assessment Technologies SA ;
 */
/**
 * Test Runner Content Plugin : Navigate through the item focusable elements using the keyboard
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableGroupElement from 'ui/keyNavigation/navigableGroupElement';
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';
import headerNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/headerNavigation';
import toolbarNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/toolbarNavigation';
import navigatorNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/navigatorNavigation';
import pageNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/pageNavigation';
import rubricsNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/rubricsNavigation';
import itemNavigationStrategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/itemNavigation';
import shortcut from 'util/shortcut';

const keysForTypesMap = {
    default: {
        keyNextGroup: 'tab',
        keyPrevGroup: 'shift+tab',
        keyNextInGroup: 'right down',
        keyPrevInGroup: 'left up',
        keyNextInFilters: 'right',
        keyPrevInFilters: 'left',
        keyNextInList: 'down',
        keyPrevInList: 'up',
        keyNextLinearFromFirst: '',
        keyPrevLinearFromLast: ''
    },
    linear: {
        keyNextGroup: 'tab',
        keyPrevGroup: 'shift+tab',
        keyNextInGroup: 'right down',
        keyPrevInGroup: 'left up',
        keyNextInFilters: 'right',
        keyPrevInFilters: 'left',
        keyNextInList: 'down',
        keyPrevInList: 'up',
        keyNextLinearFromFirst: 'right',
        keyPrevLinearFromLast: 'left'
    },
    native: {
        keyNextGroup: '',
        keyPrevGroup: '',
        keyNextInGroup: 'tab',
        keyPrevInGroup: 'shift+tab',
        keyNextInFilters: 'tab',
        keyPrevInFilters: 'shift+tab',
        keyNextInList: 'tab',
        keyPrevInList: 'shift+tab',
        keyNextLinearFromFirst: '',
        keyPrevLinearFromLast: ''
    }
};

/**
 * Init the navigation in the toolbar
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array}
 */
function initToolbarNavigation(testRunner, config) {
    const strategy = toolbarNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation in the header block
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array}
 */
function initHeaderNavigation(testRunner, config) {
    const strategy = headerNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation in the review panel
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array} the keyNavigator of the main navigation group
 */
function initNavigatorNavigation(testRunner, config) {
    const strategy = navigatorNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation in the item content
 * Navigable item content are interaction choices and body element with the special class "key-navigation-focusable"
 * It returns an array of keyNavigators as the content is dynamically determined
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array} of keyNavigator ids
 */
function initDefaultContentNavigation(testRunner, config) {
    const strategy = itemNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation in the item content
 * Navigable item content are interaction choices only
 * It's works with templates for default key
 *
 * @param {Object} testRunner
 * @returns {Array} of keyNavigator ids
 */
function initAllContentButtonsNavigation(testRunner, config) {
    const strategy = itemNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation of test rubric blocks
 * It returns an array of keyNavigator ids as the content is dynamically determined
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array} of keyNavigator ids
 */
function initRubricNavigation(testRunner, config) {
    const strategy = rubricsNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init the navigation to select all item page
 * make this element scrollable
 *
 * @param {Object} testRunner
 * @param {Object} config
 * @returns {Array} of keyNavigator ids
 */
function initDefaultItemNavigation(testRunner, config) {
    const strategy = pageNavigationStrategyFactory(testRunner, config);
    strategy.init();
    return strategy.getNavigators();
}

/**
 * Init test runner navigation
 * @param {Object} testRunner
 * @param {Object} pluginConfig
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
                initRubricNavigation(testRunner, config),
                initAllContentButtonsNavigation(testRunner, config),
                initToolbarNavigation(testRunner, config),
                initHeaderNavigation(testRunner, config),
                initNavigatorNavigation(testRunner, config),
                initDefaultItemNavigation(testRunner, config)
            );
            break;
        case 'native':
            navigators = _.union(
                initHeaderNavigation(testRunner, config),
                initNavigatorNavigation(testRunner, config),
                initRubricNavigation(testRunner, config),
                initDefaultContentNavigation(testRunner, config),
                initToolbarNavigation(testRunner, config)
            );
            break;
        default:
            navigators = _.union(
                initRubricNavigation(testRunner, config),
                initDefaultContentNavigation(testRunner, config),
                initToolbarNavigation(testRunner, config),
                initHeaderNavigation(testRunner, config),
                initNavigatorNavigation(testRunner, config),
                initDefaultItemNavigation(testRunner, config)
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
        propagateTab: isNativeNavigation,
    });

    if (!isNativeNavigation) {
        keyNavigatorItem
            .on(config.keyNextGroup, function(elem) {
                if (allowedToNavigateFrom(elem)) {
                    this.next();
                }
            })
            .on(config.keyPrevGroup, function(elem) {
                if (allowedToNavigateFrom(elem)) {
                    this.previous();
                }
            });
    }

    if (config.contentNavigatorType === 'linear') {
        keyNavigatorItem
            .on(config.keyNextLinearFromFirst, function(elem) {
                const isCurrentElementFirst = $(elem).is(':first-child');

                if (isCurrentElementFirst && allowedToNavigateFrom(elem)) {
                    this.next();
                }
            })
            .on(config.keyPrevLinearFromLast, function(elem) {
                const isCurrentElementLast = $(elem).is(':last-child');

                if (isCurrentElementLast && allowedToNavigateFrom(elem)) {
                    this.previous();
                }
            });
    }

    return keyNavigatorItem;
}

/**
 * Builds a key navigator that can apply onto a test runner
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.contentNavigatorType - the keyboard navigation mode
 * @returns {testRunnerKeyNavigator}
 */
export default function keyNavigatorFactory(testRunner, config) {
    let groupNavigator = null;

    /**
     * @typedef {Object} testRunnerKeyNavigator
     */
    return {
        /**
         * Setup the keyNavigator
         * @returns {testRunnerKeyNavigator}
         */
        init() {
            groupNavigator = initTestRunnerNavigation(testRunner, config);

            shortcut
                .remove('.keyNavigator')
                .add('tab.keyNavigator shift+tab.keyNavigator', function(e) {
                    if (!allowedToNavigateFrom(e.target)) {
                        return false;
                    }
                    if (!groupNavigator.isFocused()) {
                        groupNavigator.focus();
                    }
                });

            return this;
        },

        /**
         * Gets the attached testRunner
         * @returns {testRunner}
         */
        getTestRunner() {
            return testRunner;
        },

        /**
         * Switches the navigation mode
         * @param {String} mode
         * @returns {testRunnerKeyNavigator}
         */
        setMode(mode) {
            config.contentNavigatorType = mode;
            return this;
        },

        /**
         * Gets the active navigation mode
         * @returns {String}
         */
        getMode() {
            return config.contentNavigatorType;
        },

        /**
         * Tears down the keyNavigator
         * @returns {testRunnerKeyNavigator}
         */
        destroy() {
            shortcut.remove('.keyNavigator');

            if (groupNavigator) {
                groupNavigator.destroy();
            }
            groupNavigator = null;

            return this;
        }
    };
}
