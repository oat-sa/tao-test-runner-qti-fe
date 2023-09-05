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
 * Copyright (c) 2020-2021 (original work) Open Assessment Technologies SA
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/controls/duration/duration',
    'core/polling',
    'taoTests/runner/proxy',
    'taoQtiTest/test/runner/mocks/proxyMock'
], function (runnerFactory, providerMock, pluginFactory, pollingFactory, proxyFactory, providerProxyMock) {
    'use strict';

    const providerName = 'mock';
    proxyFactory.registerProvider(providerName, providerProxyMock());
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier: 'item-1',
        attempt: 1
    };

    const sampleTestMap = {
        parts: {
            p1: {
                sections: {
                    s1: {
                        items: {
                            'item-1': {
                                categories: ['x-tao-option-apiptts']
                            }
                        }
                    }
                }
            }
        },
        jumps: [{
            identifier: 'item-1',
            section: 's1',
            part: 'p1',
            position: 0
        }]
    };

    /**
     * Gets a configured instance of the Test Runner
     * @param {Object} [config] - Optional config to setup the test runner
     * @returns {Promise<runner>}
     */
    function getTestRunner(config) {
        const runner = runnerFactory(providerName, [], config);
        runner.getDataHolder();
        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        return Promise.resolve(runner);
    }

    /**
     * Generic tests
     */
    QUnit.module('pluginFactory');

    QUnit.test('module', (assert) => {
        const runner = runnerFactory(providerName);

        assert.expect(3);

        assert.equal(typeof pluginFactory, 'function', 'The pluginFactory module exposes a function');
        assert.equal(typeof pluginFactory(runner), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            pluginFactory(runner),
            pluginFactory(runner),
            'The plugin factory provides a different instance on each call'
        );
    });

    QUnit.module('Plugin API');

    QUnit.cases
        .init([
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
        ])
        .test('plugin API ', (data, assert) => {
            const runner = runnerFactory(providerName);
            const plugin = pluginFactory(runner);

            assert.expect(1);

            assert.equal(
                typeof plugin[data.title],
                'function',
                `The pluginFactory instances expose a ${data.title} function`
            );
        });

    QUnit.module('Plugin init');

    QUnit.test('tick', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);
                const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

                assert.expect(1);

                return plugin
                    .init()
                    .then(() => {
                        runner.trigger('renderitem');

                        return runner.getPluginStore('duration');
                    })
                    .then(durationStore => new Promise(resolve => {
                        runner.trigger('tick', 10000);

                        // add timeout to make sure that store has been updated
                        setTimeout(() => {
                            durationStore.getItem(itemAttemptId).then((duration) => {
                                assert.equal(duration, 10, 'the plugin updates duration every tick');

                                resolve();
                            });
                        }, 100);
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

    QUnit.test('plugin-get.duration', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => new Promise(resolve => {
                const plugin = pluginFactory(runner);
                const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

                assert.expect(1);

                const getDuration = durationPromise => {
                    durationPromise.then((duration) => {
                        assert.equal(duration, 10, 'the plugin handles plugin-get.duration event');

                        resolve();
                    });
                };

                plugin
                    .init()
                    .then(() => {
                        runner.trigger('renderitem');

                        // add timeout to make sure that store has been updated

                        runner.getPluginStore('duration').then(() => {
                            runner.trigger('tick', 10000);
                            setTimeout(() => {
                                runner.trigger('plugin-get.duration', itemAttemptId, getDuration);
                            }, 100);
                        });

                    });
            }))
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });
});
