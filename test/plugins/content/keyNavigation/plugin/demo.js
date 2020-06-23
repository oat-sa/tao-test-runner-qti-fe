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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/mock/backend',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/plugin/playground',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/test.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json'
], function (
    runnerFactory,
    providerMock,
    backendMockFactory,
    visualPlayground,
    testDefinition,
    itemsBank
) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const backendMock = backendMockFactory(testDefinition, itemsBank);

    QUnit.module('Visual');

    QUnit.test('Visual test', assert => {
        const ready = assert.async();
        assert.expect(1);
        visualPlayground('#visual-playground', backendMock)
            .then(() => {
                assert.ok(true, 'The playground is ready');
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });
});
