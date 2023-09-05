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
import keyNavigatorFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/keyNavigation';
import pluginFactory from 'taoTests/runner/plugin';
import 'taoQtiTest/runner/plugins/content/accessibility/css/key-navigation.css';

/**
 * If we have now config from backend side - we set this default dataset
 *
 * @typedef {object}
 * @properties {string} contentNavigatorType - ('default' | 'linear') - type of content navigation
 */
const defaultPluginConfig = {
    contentNavigatorType: 'default'
};

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'keyNavigation',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const pluginConfig = _.defaults(this.getConfig(), defaultPluginConfig);
        const keyNavigator = keyNavigatorFactory(testRunner, pluginConfig);

        /**
         *  Update plugin state based on changes
         */
        testRunner
            .after('renderitem', () => {
                // make sure that keyNavigator is destroyed
                // to preevent multiple instances to be active at the same time
                if (keyNavigator.isActive()) {
                    keyNavigator.destroy();
                }

                keyNavigator.init();
            })
            .on('unloaditem', () => {
                keyNavigator.destroy();
            })

            /**
             * @param {string} type - type of content tab navigation,
             * can be: 'default', 'linear', 'native'
             */
            .on('setcontenttabtype', type => {
                keyNavigator.setMode(type);
                pluginConfig.contentNavigatorType = type;
            });
    }
});
