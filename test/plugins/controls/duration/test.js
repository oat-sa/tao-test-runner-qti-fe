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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/controls/duration/duration',
    'core/polling',
    'taoTests/runner/proxy',
    'taoQtiTest/test/runner/mocks/proxyMock',
], function (runnerFactory, providerMock, pluginFactory, pollingFactory, proxyFactory, providerProxyMock) {
    'use strict';

    const providerName = 'mock';
    proxyFactory.registerProvider(providerName, providerProxyMock());
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier: 'item-1',
        attempt: 1,
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

    QUnit.test('polling', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;
        const checksCount = 3;
        let currentCheck = 1;
        let prevDuration;

        assert.expect(checksCount);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                runner.trigger('renderitem');

                runner.getPluginStore('duration').then((durationStore) => {
                    pollingFactory({
                        action: () => {
                            durationStore.getItem(itemAttemptId).then((duration) => {
                                assert.notDeepEqual(duration, prevDuration, 'the plugin updates duration every second');

                                if (currentCheck++ === 3) {
                                    ready();
                                }
                            });
                        },
                        autoStart: true,
                        interval: 1100,
                        max: 3
                    });
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('before disable item', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                runner.trigger('renderitem');

                runner.getPluginStore('duration').then((durationStore) => {
                    setTimeout(
                        () => {
                            runner.trigger('disableitem');
                            setTimeout(
                                () => {
                                    durationStore.getItem(itemAttemptId).then((duration) => {
                                        assert.ok(duration, 'the plugin updates duration before disable item');

                                        ready();
                                    });
                                },
                                100
                            );
                        },
                        100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('set duration before move', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        runner.getProxy().addCallActionParams = ({ itemDuration }) => {
            assert.ok(itemDuration, 'the plugin updates duration before move to the next item');

            ready();
        };

        plugin
            .init()
            .then(() => {
                runner.trigger('renderitem');

                runner.getPluginStore('duration').then(() => {
                    setTimeout(
                        () => {
                            runner.trigger('move');
                        },
                        100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('plugin-get.duration', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        const getDuration = (durationPromise) => {
            durationPromise.then((duration) => {
                assert.ok(duration, 'the plugin handles plugin-get.duration event');

                ready();
            });
        };

        plugin
            .init()
            .then(() => {
                runner.trigger('renderitem');

                runner.getPluginStore('duration').then(() => {
                    setTimeout(
                        () => {
                            runner.trigger('plugin-get.duration', {}, itemAttemptId, getDuration);
                        },
                        1100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    /**
     * Behavior
     */
    QUnit.module('Lifecycle');

    QUnit.test('enable', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                plugin.enable();

                runner.getPluginStore('duration').then((durationStore) => {
                    setTimeout(
                        () => {
                            durationStore.getItem(itemAttemptId).then((duration) => {
                                assert.ok(duration, 'the plugin updates duration when it is enabled');

                                ready();
                            });
                        },
                        1100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('enable', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                plugin.enable();

                runner.getPluginStore('duration').then((durationStore) => {
                    setTimeout(
                        () => {
                            durationStore.getItem(itemAttemptId).then((duration) => {
                                assert.ok(duration, 'the plugin updates duration when it is enabled');

                                ready();
                            });
                        },
                        1100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('disable', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(2);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                plugin.enable();

                runner.getPluginStore('duration').then((durationStore) => {
                    setTimeout(
                        () => {
                            let updatedDuration;

                            durationStore.getItem(itemAttemptId).then((duration) => {
                                updatedDuration = duration;

                                assert.ok(duration, 'the plugin updates duration when it is enabled');

                                plugin.disable();
                            });
                            setTimeout(
                                () => {
                                    durationStore.getItem(itemAttemptId).then((duration) => {
                                        assert.equal(duration, updatedDuration, 'the plugin stops updating duration after disabling');

                                        ready();
                                    });
                                },
                                1100
                            );
                        },
                        1100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('destroy', function (assert) {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        const itemAttemptId = `${sampleTestContext.itemIdentifier}#${sampleTestContext.attempt}`;

        assert.expect(2);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                plugin.enable();

                runner.getPluginStore('duration').then((durationStore) => {
                    setTimeout(
                        () => {
                            let updatedDuration;

                            durationStore.getItem(itemAttemptId).then((duration) => {
                                updatedDuration = duration;

                                assert.ok(duration, 'the plugin updates duration when it is enabled');

                                plugin.destroy();
                            });
                            setTimeout(
                                () => {
                                    durationStore.getItem(itemAttemptId).then((duration) => {
                                        assert.equal(duration, updatedDuration, 'the plugin stops updating duration after destroing');

                                        ready();
                                    });
                                },
                                1100
                            );
                        },
                        1100
                    );
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });
});
