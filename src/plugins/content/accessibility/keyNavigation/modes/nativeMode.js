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

/**
 * Native key navigation mode
 */
export default {
    name: 'native',

    /**
     * Builds the key navigation config for the "native" mode
     * @param {keyNavigationStrategyConfig} config - additional config to set
     * @returns {keyNavigationMode}
     */
    init(config = {}) {
        return {
            // todo: add access to the page and the rubric blocks
            strategies: ['header', 'top-toolbar', 'navigator', 'item', 'toolbar'],
            config: Object.assign({
                autoFocus: false,
                keepState: false,
                propagateTab: true,
                flatNavigation: true,
                keyNextGroup: '',
                keyPrevGroup: '',
                keyNextItem: 'tab',
                keyPrevItem: 'shift+tab',
                keyNextTab: '',
                keyPrevTab: '',
                keyNextContent: '',
                keyPrevContent: ''
            }, config)
        };
    }
};
