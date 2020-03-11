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

import providerRegistry from 'core/providerRegistry';
import * as strategies from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategies/index';

/**
 * Defines the strategies API
 * @typedef {Object} keyNavigationStrategy
 * @property {Function} init
 * @property {Function} destroy
 * @property {Function} getNavigators
 */

/**
 * Defines the config structure for the navigation strategies
 * @typedef {Object} keyNavigationStrategyConfig
 * @property {Boolean} autoFocus - auto select the main action when available in a group
 * @property {Boolean} keepState - for strategies able to keep the state, allow to keep the position of the focused
 * element when moving away from the group and restore it when the group retrieves the focus
 * @property {Boolean} propagateTab - propagate the Tab key to the upper level
 * @property {Boolean} flatNavigation - flatten the navigation between groups, allowing to forward the focus to the
 * following group when a group boundary is reached. If disabled, the only way to move between groups is to use the
 * related key combination
 * @property {String} keyNextItem - the keyboard shortcut to move to the next item (inside the scope)
 * @property {String} keyPrevItem - the keyboard shortcut to move to the previous item (inside the scope)
 * @property {String} keyNextGroup - the keyboard shortcut to move to the next group (outside the scope)
 * @property {String} keyPrevGroup - the keyboard shortcut to move to the previous group (outside the scope)
 * @property {String} keyNextTab - the keyboard shortcut to move to the next tab of the bar
 * @property {String} keyPrevTab - the keyboard shortcut to move to the previous tab of the bar
 * @property {String} keyNextContent - the keyboard shortcut to move to the next content element
 * @property {String} keyPrevContent - the keyboard shortcut to move to the previous content element
 */

/**
 * Builds a key navigator strategies manager.
 *
 * @param {String} strategy - the name of the strategy to build
 * @param {testRunner} testRunner - the test runner instance to control
 * @param {keyNavigationStrategyConfig} config - the config to apply
 * @returns {keyNavigationStrategy}
 */
export default function strategyFactory(strategy, testRunner, config) {
    const instance = strategyFactory.getProvider(strategy);
    return instance.init(testRunner, config);
}

// bootstrap the manager and register the strategies
providerRegistry(strategyFactory);
Object.values(strategies).forEach(strategy => strategyFactory.registerProvider(strategy.name, strategy));