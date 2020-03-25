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
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategiesManager'
], function (
    strategiesManager
) {
    'use strict';

    const testRunnerMock = {
        init() {}
    };

    QUnit.module('strategiesManager');

    QUnit.test('module', assert => {
        assert.equal(typeof strategiesManager, 'function', 'The strategiesManager module exposes a function');
        assert.equal(typeof strategiesManager('page', testRunnerMock), 'object', 'The strategiesManager factory produces an instance');
        assert.notStrictEqual(
            strategiesManager('page', testRunnerMock),
            strategiesManager('page', testRunnerMock),
            'The strategiesManager factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'getName'},
        {title: 'getTestRunner'},
        {title: 'getConfig'},
        {title: 'getNavigators'}
    ]).test('API ', (data, assert) => {
        const instance = strategiesManager('page', testRunnerMock);
        assert.equal(
            typeof instance[data.title],
            'function',
            `The instance exposes a "${data.title}" function`
        );
    });

    QUnit.test('factory', assert => {
        const strategyConfig= {
            keyNextGroup: 'tab'
        };
        const navigator1 = [1, 2, 3];
        const navigator2 = [4, 5, 6];
        const strategy1 = {
            name: 'strategy1',
            init() {
                assert.ok(true, 'strategy1 created');
            },
            getNavigators() {
                return navigator1;
            },
            destroy() {
                assert.ok(true, 'strategy1 destroyed');
            }
        };
        const strategy2 = {
            name: 'strategy2',
            init() {
                assert.ok(true, 'strategy2 created');
            },
            getNavigators() {
                return navigator2;
            },
            destroy() {
                assert.ok(true, 'strategy2 destroyed');
            }
        };

        assert.expect(18);

        strategiesManager.registerProvider('strategy1', strategy1);
        strategiesManager.registerProvider('strategy2', strategy2);
        const instance1 = strategiesManager('strategy1', testRunnerMock, strategyConfig);
        assert.equal(typeof instance1, 'object', 'The strategy 1 have been built');
        assert.equal(instance1.init(), instance1, 'The instance is initialized');
        assert.equal(instance1.getNavigators(), navigator1, 'The navigators of the strategy1 are returned');
        assert.equal(instance1.getName(), 'strategy1', 'The instance relates to Strategy 1');
        assert.equal(instance1.getConfig(), strategyConfig, 'The config is returned');
        assert.equal(instance1.getTestRunner(), testRunnerMock, 'The test runner is returned');
        assert.equal(instance1.destroy(), instance1, 'The instance is destroyed');

        const instance2 = strategiesManager('strategy2', testRunnerMock, strategyConfig);
        assert.equal(typeof instance2, 'object', 'The strategy 2 have been built');
        assert.equal(instance2.init(), instance2, 'The instance is initialized');
        assert.equal(instance2.getNavigators(), navigator2, 'The navigators of the strategy2 are returned');
        assert.equal(instance2.getName(), 'strategy2', 'The instance relates to Strategy 2');
        assert.equal(instance2.getConfig(), strategyConfig, 'The config is returned');
        assert.equal(instance2.getTestRunner(), testRunnerMock, 'The test runner is returned');
        assert.equal(instance2.destroy(), instance2, 'The instance is destroyed');
    });

    QUnit.cases.init([
        { title: 'page' },
        { title: 'header' },
        { title: 'rubrics' },
        { title: 'toolbar' },
        { title: 'item' },
        { title: 'linearItem' },
        { title: 'navigator' }
    ]).test('Navigation strategy ', (data, assert) => {
        const result = strategiesManager(data.title, testRunnerMock);
        assert.equal(typeof result, 'object', `The strategy ${data.title} has been created`);
        assert.equal(typeof result.init, 'function', `The strategy ${data.title} has a init() api`);
        assert.equal(typeof result.destroy, 'function', `The strategy ${data.title} has a destroy() api`);
        assert.equal(typeof result.getNavigators, 'function', `The strategy ${data.title} has a getNavigators() api`);
        assert.equal(typeof result.getName, 'function', `The strategy ${data.title} has a getName() api`);
        assert.equal(result.getName(), data.title, `The strategy ${data.title} has the expected name`);
    });

});
