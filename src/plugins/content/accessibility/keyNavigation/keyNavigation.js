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
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableGroupElement from 'ui/keyNavigation/navigableGroupElement';
import {
    allowedToNavigateFrom,
    setupItemsNavigator,
    getStrategies,
    getNavigators
} from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers';
import modeFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/modesManager';
import shortcut from 'util/shortcut';

/**
 * The event namespace used to register removable listeners
 * @type {String}
 */
const eventNS = '.keyNavigation';

/**
 * Builds a key navigator that can apply onto a test runner
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {Object} config - the config to apply
 * @param {String} config.contentNavigatorType - the keyboard navigation mode
 * @returns {testRunnerKeyNavigator}
 */
export default function keyNavigationFactory(testRunner, config = {}) {
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
            const navigationMode = modeFactory(contentNavigatorType, config);
            const navigationConfig = navigationMode.config;
            strategies = getStrategies(navigationMode, testRunner);
            const navigators = getNavigators(strategies);

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
                setupItemsNavigator(groupNavigator, {
                    keyNextItem: navigationConfig.keyNextGroup,
                    keyPrevItem: navigationConfig.keyPrevGroup
                });
            }

            shortcut
                .remove(eventNS)
                .add(`tab${eventNS} shift+tab${eventNS}`, function (e) {
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
            contentNavigatorType = newMode;
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
            shortcut.remove(eventNS);

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
