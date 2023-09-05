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
/**
 * @author Anton Tsymuk <anton@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/controls/timer/plugin',
    'json!taoQtiTest/test/runner/plugins/controls/progressbar/plugin/map.json'
], function ($, _, runnerFactory, providerMock, pluginFactory, testMap) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const runnerConfig = {
        options: {
            review: {
                enabled: false
            },
            timer: {
                restoreTimerFromClient: false
            }
        }
    };
    const runnerConfigClientMode = {
        options: {
            review: {
                enabled: false
            },
            timer: {
                restoreTimerFromClient: true
            }
        }
    };

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

    const pluginApi = [
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
    ];

    QUnit.cases.init(pluginApi).test('plugin API ', (data, assert) => {
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);

        assert.equal(
            typeof plugin[data.title],
            'function',
            `The pluginFactory instances expose a "${data.title}" function`
        );
    });

    QUnit.test('pluginFactory.init', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfig)
            .then(runner => {
                const plugin = pluginFactory(runner);

                runner.setTestContext({
                    review: 3,
                    testPartId: 'testPart-1',
                    sectionId: 'assessmentSection-1',
                    options: {
                        review: {
                            enabled: false
                        }
                    }
                });

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin is initialised');
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

    QUnit.test('render/destroy', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfig)
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const $container = areaBroker.getControlArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(4);

                runner.setTestContext({
                    review: 3,
                    testPartId: 'testPart-1',
                    sectionId: 'assessmentSection-1'
                });

                runner.setTestMap(testMap);

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');
                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.timer-wrapper').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );

                        // Plugin destroying
                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has been removed');
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

    QUnit.module('Options');

    QUnit.test('no timers in item/section', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfig)
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $container = areaBroker.getControlArea();

                assert.expect(4);

                runner.setTestContext({
                    itemPosition: 1,
                    testPartId: 'testPart-intro',
                    sectionId: 'assessmentSection-intro'
                });

                runner.setTestMap(testMap);

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                plugin.install();
                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.timer-wrapper').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        runner.trigger('renderitem');
                        setTimeout(() => {
                            assert.equal($container.find('.timer-wrapper:visible').length, 0, 'The plugin is not visible');
                        }, 50);

                        // Plugin destroying
                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has been removed');
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

    QUnit.test('timers set for item/section', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfig)
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $container = areaBroker.getControlArea();

                assert.expect(7);

                runner.setTestContext({
                    itemPosition: 1,
                    testPartId: 'testPart-intro',
                    sectionId: 'assessmentSection-intro',
                    timeConstraints: [{
                        allowLateSubmission: false,
                        extraTime: { total: 0, consumed: 0, remaining: 0 },
                        label: 'Section Intro',
                        maxTime: 120,
                        maxTimeRemaining: 120,
                        minTime: false,
                        minTimeRemaining: false,
                        qtiClassName: 'assessmentSection',
                        source: 'assessmentSection-intro'
                    }]
                });

                runner.setTestMap(testMap);

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                plugin.install();
                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => new Promise(resolve => {
                        assert.equal(
                            $container.find('.timer-wrapper').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        runner.trigger('renderitem');
                        setTimeout(() => {
                            assert.equal($container.find('.timer-wrapper:visible').length, 1, 'The plugin is visible');
                            assert.equal($container.find('.time').text(), '00:02:00', 'The time is displayed 00:02:00');
                            runner.trigger('tick', 1000);

                            resolve();
                        }, 50);
                    }))
                    .then(() => new Promise((resolve, reject) => {
                        setTimeout(() => {
                            assert.equal($container.find('.time').text(), '00:01:59', 'The time is displayed 00:01:59');
                            // Plugin destroying
                            plugin.destroy()
                                .then(() => {
                                    assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has been removed');

                                    resolve();
                                })
                                .catch(reject);
                        }, 50);
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

    QUnit.test('mode server, timer does not pause on disableitem event', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfig)
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $container = areaBroker.getControlArea();

                assert.expect(9);

                runner.setTestContext({
                    itemPosition: 1,
                    testPartId: 'testPart-intro',
                    sectionId: 'assessmentSection-intro',
                    timeConstraints: [{
                        allowLateSubmission: false,
                        extraTime: { total: 0, consumed: 0, remaining: 0 },
                        label: 'Section Intro',
                        maxTime: 120,
                        maxTimeRemaining: 120,
                        minTime: false,
                        minTimeRemaining: false,
                        qtiClassName: 'assessmentSection',
                        source: 'assessmentSection-intro'
                    }]
                });

                runner.setTestMap(testMap);

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                plugin.install();
                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => new Promise(resolve => {
                        assert.equal(
                            $container.find('.timer-wrapper').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        runner.trigger('renderitem');
                        setTimeout(() => {
                            assert.equal($container.find('.timer-wrapper:visible').length, 1, 'The plugin is visible');
                            assert.equal($container.find('.timer-wrapper:visible').length, 1, 'The plugin is visible');
                            assert.equal($container.find('.time').text(), '00:02:00', 'The time is displayed 00:02:00');
                            runner.trigger('tick', 1000);

                            resolve();
                        }, 50);
                    }))
                    .then(() => new Promise(resolve => {
                        setTimeout(() => {
                            assert.equal($container.find('.time').text(), '00:01:59', 'The time is displayed 00:01:59');
                            runner.trigger('disableitem');
                            runner.trigger('tick', 1000);

                            resolve();
                        }, 50);
                    }))
                    .then(() => new Promise((resolve, reject) => {
                        setTimeout(() => {
                            assert.equal($container.find('.time').text(), '00:01:58', 'The time is running, displayed 00:01:58');
                            // Plugin destroying
                            plugin.destroy()
                                .then(() => {
                                    assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has been removed');

                                    resolve();
                                })
                                .catch(reject);
                        }, 50);
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

    QUnit.test('mode client, timer pauses on disableitem event', assert => {
        const ready = assert.async();
        getTestRunner(runnerConfigClientMode)
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $container = areaBroker.getControlArea();

                assert.expect(9);

                runner.setTestContext({
                    itemPosition: 1,
                    testPartId: 'testPart-intro',
                    sectionId: 'assessmentSection-intro',
                    timeConstraints: [{
                        allowLateSubmission: false,
                        extraTime: { total: 0, consumed: 0, remaining: 0 },
                        label: 'Section Intro',
                        maxTime: 120,
                        maxTimeRemaining: 120,
                        minTime: false,
                        minTimeRemaining: false,
                        qtiClassName: 'assessmentSection',
                        source: 'assessmentSection-intro'
                    }]
                });

                runner.setTestMap(testMap);

                runner.getCurrentItem = () => ({});
                runner.getCurrentPart = () => ({});

                plugin.install();
                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => new Promise(resolve => {
                        assert.equal(
                            $container.find('.timer-wrapper').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        runner.trigger('renderitem');
                        setTimeout(() => {
                            assert.equal($container.find('.timer-wrapper:visible').length, 1, 'The plugin is visible');
                            assert.equal($container.find('.timer-wrapper:visible').length, 1, 'The plugin is visible');
                            assert.equal($container.find('.time').text(), '00:02:00', 'The time is displayed 00:02:00');
                            runner.trigger('tick', 1000);

                            resolve();
                        }, 50);
                    }))
                    .then(() => new Promise(resolve => {
                        setTimeout(() => {
                            assert.equal($container.find('.time').text(), '00:01:59', 'The time is displayed 00:01:59');
                            runner.trigger('disableitem');
                            runner.trigger('tick', 1000);

                            resolve();
                        }, 50);
                    }))
                    .then(() => new Promise((resolve, reject) => {
                        setTimeout(() => {
                            assert.equal($container.find('.time').text(), '00:01:59', 'The time paused, displayed 00:01:59');
                            // Plugin destroying
                            return plugin.destroy()
                                .then(() => {
                                    assert.equal($container.find('.timer-wrapper').length, 0, 'The plugin has been removed');

                                    resolve();
                                })
                                .catch(reject);
                        }, 50);
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
