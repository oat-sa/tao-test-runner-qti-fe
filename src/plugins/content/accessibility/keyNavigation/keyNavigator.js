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

/**
 * A list of navigation factories per navigation areas
 * @type {Object}
 */
const navigationAreaFactories = {
    header: headerNavigationStrategyFactory,
    toolbar: toolbarNavigationStrategyFactory,
    navigator: navigatorNavigationStrategyFactory,
    page: pageNavigationStrategyFactory,
    rubrics: rubricsNavigationStrategyFactory,
    item: itemNavigationStrategyFactory
};

/**
 * The list of available modes
 * @type {Object}
 */
const navigationModes = {
    native: {
        areas: ['header', 'navigator', 'rubrics', 'item', 'toolbar'],
        keys: {
            keyNextGroup: '',
            keyPrevGroup: '',
            keyNextInGroup: 'tab',
            keyPrevInGroup: 'shift+tab',
            keyNextInFilters: 'tab',
            keyPrevInFilters: 'shift+tab',
            keyNextInList: 'tab',
            keyPrevInList: 'shift+tab'
        }
    },
    linear: {
        areas: ['rubrics', 'item', 'toolbar', 'header', 'navigator', 'page'],
        keys: {
            keyNextGroup: 'tab',
            keyPrevGroup: 'shift+tab',
            keyNextInGroup: 'right down',
            keyPrevInGroup: 'left up',
            keyNextInFilters: 'right',
            keyPrevInFilters: 'left',
            keyNextInList: 'down',
            keyPrevInList: 'up'
        }
    },
    default: {
        areas: ['rubrics', 'item', 'toolbar', 'header', 'navigator', 'page'],
        keys: {
            keyNextGroup: 'tab',
            keyPrevGroup: 'shift+tab',
            keyNextInGroup: 'right down',
            keyPrevInGroup: 'left up',
            keyNextInFilters: 'right',
            keyPrevInFilters: 'left',
            keyNextInList: 'down',
            keyPrevInList: 'up'
        }
    },
};

/**
 * Builds a key navigator that can apply onto a test runner
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.contentNavigatorType - the keyboard navigation mode
 * @returns {testRunnerKeyNavigator}
 */
export default function keyNavigatorFactory(testRunner, config = {}) {
    let {contentNavigatorType} = config;
    let groupNavigator = null;
    let strategies = [];

    /**
     * @typedef {Object} testRunnerKeyNavigator
     */
    return {
        /**
         * Setup the keyNavigator
         * @returns {testRunnerKeyNavigator}
         */
        init() {
            const isNativeNavigation = contentNavigatorType === 'native';
            const navigationMode = navigationModes[contentNavigatorType];
            const navigationConfig = Object.assign({contentNavigatorType}, navigationMode.keys);
            const navigators = _.flatten(navigationMode.areas.map(area => {
                const strategyFactory = navigationAreaFactories[area];
                const strategy = strategyFactory(testRunner, navigationConfig);
                strategies.push(strategy);
                return strategy.init();
            }));

            //blur current focused element, to reinitialize keyboard navigation
            if (document.activeElement) {
                document.activeElement.blur();
            }

            groupNavigator = keyNavigator({
                id: 'test-runner',
                replace: true,
                loop: true,
                elements: navigableGroupElement.createFromNavigators(navigators),
                // we don't need to propagate tabs for the main navigation, because we've rewritten them and this is not an element
                // there is an issue with nested navigators
                propagateTab: isNativeNavigation
            });

            if (isNativeNavigation) {
                navigators.forEach(navigator => {
                    navigator
                        .on('upperbound', function moveToNextGroup() {
                            if (allowedToNavigateFrom(navigator)) {
                                groupNavigator.next();
                            }
                        })
                        .on('lowerbound', function moveToPrevGroup() {
                            if (allowedToNavigateFrom(navigator)) {
                                groupNavigator.previous();
                                groupNavigator.getCursor().navigable.getKeyNavigator().last();
                            }
                        });
                });
            } else {
                groupNavigator
                    .on(navigationConfig.keyNextGroup, function(elem) {
                        if (allowedToNavigateFrom(elem)) {
                            this.next();
                        }
                    })
                    .on(navigationConfig.keyPrevGroup, function(elem) {
                        if (allowedToNavigateFrom(elem)) {
                            this.previous();
                        }
                    });
            }

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
            contentNavigatorType = mode;
            return this;
        },

        /**
         * Gets the active navigation mode
         * @returns {String}
         */
        getMode() {
            return contentNavigatorType;
        },

        /**
         * Tears down the keyNavigator
         * @returns {testRunnerKeyNavigator}
         */
        destroy() {
            shortcut.remove('.keyNavigator');

            strategies.forEach(strategy => strategy.destroy());

            if (groupNavigator) {
                groupNavigator.destroy();
            }
            groupNavigator = null;
            strategies = [];

            return this;
        }
    };
}
