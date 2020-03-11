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
import * as modes from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/modes/index';

/**
 * Defines the mode config
 * @typedef {Object} keyNavigationMode
 * @property {String[]} strategies
 * @property {keyNavigationStrategyConfig} config
 */


/**
 * Builds a key navigator modes manager.
 *
 * @param {String} mode - the name of the mode to get
 * @returns {keyNavigationMode}
 */
export default function modeFactory(mode) {
    const instance = modeFactory.getProvider(mode);
    return instance.init();
}

// bootstrap the manager and register the strategies
providerRegistry(modeFactory);
Object.values(modes).forEach(mode => modeFactory.registerProvider(mode.name, mode));