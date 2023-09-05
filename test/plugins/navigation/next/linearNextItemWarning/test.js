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
 * Copyright (c) 2019-2021 (original work) Open Assessment Technologies SA ;
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/navigation/next/linearNextItemWarning'
], function (runnerFactory, providerMock, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    /**
     * Gets a configured instance of the Test Runner
     * @param {Object} [config] - Optional config to setup the test runner
     * @returns {Promise<runner>}
     */
    function getTestRunner(config) {
        const runner = runnerFactory(providerName, [], config);
        runner.getDataHolder();
        return Promise.resolve(runner);
    }

    /**
     * The following tests applies to all plugins
     */
    QUnit.module('pluginFactory');

    QUnit.test('module', assert => {
        assert.expect(3);
        const runner = runnerFactory(providerName);
        assert.equal(typeof pluginFactory, 'function', 'The pluginFactory module exposes a function');
        assert.equal(typeof pluginFactory(runner), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            pluginFactory(runner),
            pluginFactory(runner),
            'The plugin factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([
        { title: 'init' },
        { title: 'render' },
        { title: 'finish' },
        { title: 'destroy' },
        { title: 'trigger' },
        { title: 'getTestRunner' },
        { title: 'getAreaBroker' },
        { title: 'getConfig' },
        { title: 'setConfig' },
        { title: 'getState' },
        { title: 'setState' },
        { title: 'show' },
        { title: 'hide' },
        { title: 'enable' },
        { title: 'disable' }
    ]).test('plugin API ', (data, assert) => {
        assert.expect(1);
        const runner = runnerFactory(providerName);
        const timer = pluginFactory(runner);
        assert.equal(
            typeof timer[data.title],
            'function',
            `The pluginFactory instances expose a "${data.title}" function`
        );
    });

    /**
     * Specific tests for this plugin
     */
    QUnit.module('Behavior');

    const testMap = {
        identifier: 'Test',
        parts: {
            'Part1': {
                id: 'Part1',
                position: 0,
                isLinear: true,
                sections: {
                    'Section1': {
                        id: 'Section1',
                        position: 0,
                        items: {
                            'FirstItem': {
                                id: 'FirstItem',
                                position: 0
                            },
                            'LastItem': {
                                id: 'LastItem',
                                position: 1
                            }
                        }
                    }
                }
            }
        },
        jumps: [{
            identifier: 'FirstItem',
            section: 'Section1',
            part: 'Part1',
            position: 0
        }, {
            identifier: 'LastItem',
            section: 'Section1',
            part: 'Part1',
            position: 1
        }]
    };

    // No dialog expected
    QUnit.cases.init([{
        title: 'when the next part warning is set',
        testContext: {
            enableAllowSkipping: false,
            options: {
                nextPartWarning: true,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        item: {
            informational: false
        },
        isLinear: true

    }, {
        title: 'when the next section warning is set',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: true
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        scope: 'section',
        item: {
            informational: false
        },
        isLinear: true
    }, {
        title: 'when the item is informational',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        item: {
            informational: true
        },
        isLinear: true
    }, {
        title: 'when the item is the last item',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'LastItem',
            itemPosition: 1
        },
        item: {
            informational: false
        },
        isLinear: true
    }, {
        title: 'when the config setting is undefined',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        item: {
            informational: false
        },
        isLinear: true
    }, {
        title: 'when the config setting is explicitly false',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        testConfig: {
            forceEnableLinearNextItemWarning: false
        },
        item: {
            informational: false
        },
        isLinear: true
    }, {
        title: 'when the test is not linear',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        item: {
            informational: false
        },
        isLinear: false
    }]).test('No dialog is triggered ', (data, assert) => {
        const ready = assert.async();
        getTestRunner({
            options: data.testConfig
        })
            .then(runner => {
                const plugin = pluginFactory(runner, runner.getAreaBroker());

                // mock test store init
                runner.getTestStore = function getTestStore() {
                    return {
                        setVolatile() {
                        }
                    };
                };
                runner.getCurrentItem = () => data.item;
                runner.getCurrentPart = () => Object.assign({
                    isLinear: data.isLinear
                }, testMap.part);

                assert.expect(1);

                return plugin
                    .init()
                    .then(() => new Promise(resolve => {
                        runner.setTestContext(data.testContext);
                        runner.setTestMap(testMap);

                        // dialog would be instantiated *before* move occurs
                        runner.on('move', () => {
                            assert.ok(true, 'The move took place without interruption');
                            runner.destroy();
                            resolve();
                            return Promise.reject();
                        });
                        runner.trigger('move', 'next', data.scope);
                    }))
                    .catch(err => {
                        assert.ok(false, err.message);
                        ready();
                    });
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    // Dialog expected
    QUnit.cases.init([{
        title: 'when a next warning is needed',
        event: 'next',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        testConfig: {
            forceEnableLinearNextItemWarning: true
        },
        item: {
            informational: false
        },
        isLinear: true
    }, {
        title: 'when a skip warning is needed',
        event: 'skip',
        testContext: {
            options: {
                nextPartWarning: false,
                nextSectionWarning: false
            },
            itemIdentifier: 'FirstItem',
            itemPosition: 0
        },
        testConfig: {
            forceEnableLinearNextItemWarning: true
        },
        item: {
            informational: false
        },
        isLinear: true
    }]).test('Dialog will be triggered ', (data, assert) => {
        const ready = assert.async();
        getTestRunner({
            options: data.testConfig
        })
            .then(runner => {
                const plugin = pluginFactory(runner, runner.getAreaBroker());

                // mock test store init
                runner.getTestStore = function getTestStore() {
                    return {
                        getStore() {
                            return Promise.reject();
                        },
                        setVolatile() {
                        }
                    };
                };
                runner.getCurrentItem = () => data.item;
                runner.getCurrentPart = () => Object.assign({
                    isLinear: data.isLinear
                }, testMap.part);

                assert.expect(1);

                return plugin
                    .init()
                    .then(() => new Promise(resolve => {
                        runner.setTestContext(data.testContext);
                        runner.setTestMap(testMap);

                        runner.on('disablenav', () => {
                            assert.ok(true, 'The dialog interrupted the move');
                            runner.destroy();
                            resolve();
                        });
                        runner.trigger('move', data.event);
                    }));
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
