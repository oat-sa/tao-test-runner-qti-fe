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
import _ from 'lodash';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableGroupElement from 'ui/keyNavigation/navigableGroupElement';
import {allowedToNavigateFrom} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';
import strategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategiesManager';
import modeFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/modesManager';
import shortcut from 'util/shortcut';

/**
 * Builds a key navigator that can apply onto a test runner
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.contentNavigatorType - the keyboard navigation mode
 * @returns {testRunnerKeyNavigator}
 */
export default function keyNavigatorFactory(testRunner, config = {}) {
    let {contentNavigatorType: mode} = config;
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
            const {strategies: navigationStrategies, config: navigationConfig} = modeFactory(mode);
            const navigators = _.flatten(navigationStrategies.map(area => {
                const strategy = strategyFactory(area, testRunner, navigationConfig);
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
                propagateTab: navigationConfig.propagateTab
            });

            if (navigationConfig.flatNavigation) {
                navigators.forEach(navigator => {
                    navigator
                        .on('upperbound', () => {
                            if (allowedToNavigateFrom(navigator)) {
                                groupNavigator.next();
                            }
                        })
                        .on('lowerbound', () => {
                            if (allowedToNavigateFrom(navigator)) {
                                groupNavigator.previous();
                                groupNavigator.getCursor().navigable.getKeyNavigator().last();
                            }
                        });
                });
            } else {
                groupNavigator
                    .on(navigationConfig.keyNextGroup, function (elem) {
                        if (allowedToNavigateFrom(elem)) {
                            this.next();
                        }
                    })
                    .on(navigationConfig.keyPrevGroup, function (elem) {
                        if (allowedToNavigateFrom(elem)) {
                            this.previous();
                        }
                    });
            }

            shortcut
                .remove('.keyNavigator')
                .add('tab.keyNavigator shift+tab.keyNavigator', function (e) {
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
         * @param {String} newMode
         * @returns {testRunnerKeyNavigator}
         */
        setMode(newMode) {
            mode = newMode;
            return this;
        },

        /**
         * Gets the active navigation mode
         * @returns {String}
         */
        getMode() {
            return mode;
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
