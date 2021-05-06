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
 * Copyright (c) 2017-2021 (original work) Open Assessment Technologies SA ;
 */

define([
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/navigation/validateResponses',
    'taoQtiTest/runner/helpers/currentItem'
], function (_, runnerFactory, providerMock, pluginFactory, currentItemHelper) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    //Mock the isAnswered helper, using testRunner property
    currentItemHelper.isAnswered = testRunner => testRunner.answered;

    //Mock the getDeclarations helper, using testRunner property
    currentItemHelper.getDeclarations = testRunner => testRunner.responses;

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
        const runner = runnerFactory(providerName);
        const timer = pluginFactory(runner);
        assert.equal(
            typeof timer[data.title],
            'function',
            `The pluginFactory instances expose a "${data.title}" function`
        );
    });

    QUnit.module('Behavior');

    QUnit.cases
        .init([
            {
                title: 'when the option is not enabled',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: false
                },
                validateResponses: true,
                answered: false,
                responses: ['foo']
            },
            {
                title: 'when the item has no interactions',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: true
                },
                validateResponses: true,
                answered: false,
                responses: []
            },
            {
                title: 'when the item is configured without the validation',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: true
                },
                answered: false,
                validateResponses: false,
                responses: ['foo']
            },
            {
                title: 'when the item is answered',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: true
                },
                validateResponses: true,
                answered: true,
                responses: ['foo']
            }
        ])
        .test('Moving is allowed ', (data, assert) => {
            const ready = assert.async();
            getTestRunner({
                options: data.options
            })
                .then(runner => {
                    const plugin = pluginFactory(runner, runner.getAreaBroker());

                    runner.getCurrentItem = () => ({ validateResponses: data.validateResponses });

                    assert.expect(1);

                    return plugin
                        .init()
                        .then(() => new Promise(resolve => {
                            runner.setTestContext(data.context);
                            runner.answered = data.answered;
                            runner.responses = data.responses;

                            runner.on('move', () => {
                                assert.ok(true, 'Move is allowed');
                                resolve();
                            });
                            runner.trigger('move');
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

    QUnit.cases
        .init([
            {
                title: 'when the item not answered',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: true
                },
                validateResponses: true,
                answered: false,
                responses: ['foo']
            }
        ])
        .test('Moving is prevented ', (data, assert) => {
            const ready = assert.async();
            getTestRunner({
                options: data.options
            })
                .then(runner => {
                    const plugin = pluginFactory(runner, runner.getAreaBroker());

                    runner.getCurrentItem = () => ({
                        validateResponses: data.validateResponses,
                        answered: data.answered
                    });

                    assert.expect(2);

                    return plugin
                        .init()
                        .then(() => new Promise((resolve, reject) => {
                            runner.setTestContext(data.context);
                            runner.answered = data.answered;
                            runner.responses = data.responses;

                            runner.on('move', () => {
                                assert.ok(false, 'Move is denied');
                                reject();
                            });
                            runner.off('alert.notallowed').on('alert.notallowed', (message, cb) => {
                                assert.equal(
                                    message,
                                    'A valid response to this item is required.',
                                    'The user receive the correct message'
                                );
                                cb();
                            });
                            runner.on('resumeitem', () => {
                                assert.ok(true, 'Move has been prevented');
                                resolve();
                            });
                            runner.trigger('move');
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

    QUnit.cases
        .init([
            {
                title: 'when the item not answered, but the `validateOnPreviousMove` flag is set to `false`',
                context: {
                    itemIdentifier: 'item-1'
                },
                options: {
                    enableValidateResponses: true
                },
                pluginConfig: {
                    validateOnPreviousMove: false
                },
                validateResponses: true,
                answered: false,
                responses: ['foo']
            }
        ])
        .test('Moving backwards is also allowed ', (data, assert) => {
            const ready = assert.async();
            getTestRunner({
                options: data.options
            })
                .then(runner => {
                    const plugin = pluginFactory(runner, runner.getAreaBroker(), data.pluginConfig);

                    runner.getCurrentItem = () => ({ validateResponses: data.validateResponses });

                    assert.expect(1);

                    return plugin
                        .init()
                        .then(() => new Promise(resolve => {
                            runner.setTestContext(data.context);
                            runner.answered = data.answered;
                            runner.responses = data.responses;

                            runner.on('move', () => {
                                assert.ok(true, 'Moving is allowed');
                                resolve();
                            });
                            runner.previous();
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
