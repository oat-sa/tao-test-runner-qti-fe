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
 * Copyright (c) 2017-2019 Open Assessment Technologies SA ;
 */

/**
 * @deprecated please use `taoTests/runner/providerLoader` instead
 *
 *
 * Loads the configured proxy provider, based on the module config :
 *
 * {
        'providerName' : 'qtiServiceProxy',
        'module'       : 'taoQtiTest/runner/proxy/qtiServiceProxy'
 * }
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import module from 'module';
import proxy from 'taoTests/runner/proxy';

/**
 * The configuration of the provider to use with it's AMD module
 */
var config = _.defaults(module.config(), {
    providerName: 'qtiServiceProxy',
    module: 'taoQtiTest/runner/proxy/qtiServiceProxy'
});

/**
 * Load and register the configured providers
 * @returns {Promise} resolves with the regsitered provider name
 */
export default function load() {
    return new Promise(function(resolve, reject) {
        require([config.module], function(proxyProvider) {
            proxy.registerProvider(config.providerName, proxyProvider);
            resolve(config.providerName);
        }, reject);
    });
}
