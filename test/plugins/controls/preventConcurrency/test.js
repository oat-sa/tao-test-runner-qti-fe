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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA
 */
define([
    'context',
    'taoTests/runner/runner',
    'taoTests/runner/proxy',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/mocks/proxyMock',
    'taoQtiTest/runner/plugins/controls/session/preventConcurrency',
    'taoQtiTest/runner/services/sequenceStore'
], function (context, runnerFactory, proxyFactory, providerMock, providerProxyMock, pluginFactory, sequenceStore) {
    'use strict';

    const providerName = 'mock';
    const TAB_SYNC_EVENTS = {
        becameActive: 'TAO_QTI_RUNNER_CONCURRENCY_TAB_BECAME_ACTIVE',
        activeTabClosed: 'TAO_QTI_RUNNER_CONCURRENCY_ACTIVE_TAB_CLOSED'
    };
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
        jumps: [
            {
                identifier: 'item-1',
                section: 's1',
                part: 'p1',
                position: 0
            }
        ]
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

    QUnit.test('module', assert => {
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

    QUnit.module('Plugin', {
        beforeEach() {
            context.featureFlags = {};
            this.originalBroadcastChannel = window.BroadcastChannel;
            this.originalHasFocus = document.hasFocus;
            this.originalVisibilityStateDescriptor = Object.getOwnPropertyDescriptor(
                Document.prototype,
                'visibilityState'
            );

            this.focused = true;
            this.visibilityState = 'visible';
            this.broadcastChannelInstances = [];

            document.hasFocus = () => this.focused;
            Object.defineProperty(Document.prototype, 'visibilityState', {
                configurable: true,
                get: () => this.visibilityState
            });

            const testState = this;
            window.BroadcastChannel = function BroadcastChannelMock(name) {
                this.name = name;
                this.listeners = {
                    message: []
                };
                this.messages = [];
                this.closed = false;
                testState.broadcastChannelInstances.push(this);
            };

            window.BroadcastChannel.prototype.addEventListener = function addEventListener(event, listener) {
                if (!this.listeners[event]) {
                    this.listeners[event] = [];
                }
                this.listeners[event].push(listener);
            };

            window.BroadcastChannel.prototype.removeEventListener = function removeEventListener(event, listener) {
                if (!this.listeners[event]) {
                    return;
                }
                this.listeners[event] = this.listeners[event].filter(currentListener => currentListener !== listener);
            };

            window.BroadcastChannel.prototype.postMessage = function postMessage(message) {
                this.messages.push(message);
            };

            window.BroadcastChannel.prototype.close = function close() {
                this.closed = true;
            };
        },
        afterEach() {
            window.BroadcastChannel = this.originalBroadcastChannel;
            document.hasFocus = this.originalHasFocus;
            if (this.originalVisibilityStateDescriptor) {
                Object.defineProperty(Document.prototype, 'visibilityState', this.originalVisibilityStateDescriptor);
            }
        }
    });

    function emitBroadcastMessage(channel, data) {
        (channel.listeners.message || []).forEach(listener => listener({ data }));
    }

    QUnit.test('set sequence number', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);

                runner.sequenceNumber = '1234-5678';

                assert.expect(1);

                return sequenceStore.getSequenceStore().then(store =>
                    store
                        .setSequenceNumber('0')
                        .then(() => plugin.init())
                        .then(() => store.getSequenceNumber())
                        .then(sequenceNumber => {
                            assert.equal(sequenceNumber, runner.sequenceNumber);
                        })
                );
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('detect concurrency', assert => {
        const ready = assert.async();
        context.featureFlags.FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS = true;
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);

                runner.sequenceNumber = '1234-5678';

                assert.expect(3);

                return sequenceStore.getSequenceStore().then(store =>
                    plugin
                        .init()
                        .then(() => store.getSequenceNumber())
                        .then(sequenceNumber => {
                            assert.equal(sequenceNumber, runner.sequenceNumber);
                        })
                        .then(
                            () =>
                                new Promise(resolve => {
                                    runner.on('concurrency', () => assert.ok('true', 'Concurrency detected'));
                                    runner.on('leave', () => {
                                        assert.ok('true', 'Test runner leaving');
                                        resolve();
                                    });
                                    sequenceStore.setSequenceNumber('foo');
                                    runner.trigger('tick');
                                })
                        )
                );
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('no concurrency', assert => {
        const ready = assert.async();
        context.featureFlags.FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS = true;
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);

                runner.sequenceNumber = '1234-5678';

                assert.expect(1);

                return sequenceStore.getSequenceStore().then(store =>
                    plugin
                        .init()
                        .then(() => store.getSequenceNumber())
                        .then(sequenceNumber => {
                            assert.equal(sequenceNumber, runner.sequenceNumber);
                        })
                        .then(
                            () =>
                                new Promise(resolve => {
                                    runner.on('concurrency', () => assert.ok('false', 'Concurrency detected'));
                                    runner.on('leave', () => {
                                        assert.ok('false', 'Test runner leaving');
                                        resolve();
                                    });
                                    runner.trigger('tick');
                                    setTimeout(resolve, 20);
                                })
                        )
                );
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('detection disabled', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);

                runner.sequenceNumber = '1234-5678';

                assert.expect(1);

                return sequenceStore.getSequenceStore().then(store =>
                    plugin
                        .init()
                        .then(() => store.getSequenceNumber())
                        .then(sequenceNumber => {
                            assert.equal(sequenceNumber, runner.sequenceNumber);
                        })
                        .then(
                            () =>
                                new Promise(resolve => {
                                    runner.on('concurrency', () => assert.ok('false', 'Concurrency detected'));
                                    runner.on('leave', () => {
                                        assert.ok('false', 'Test runner leaving');
                                        resolve();
                                    });
                                    sequenceStore.setSequenceNumber('foo');
                                    runner.trigger('tick');
                                    setTimeout(resolve, 20);
                                })
                        )
                );
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('active tab signal triggers concurrency flow', function(assert) {
        const ready = assert.async();
        const testState = this;
        context.featureFlags.FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS = true;

        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);
                runner.sequenceNumber = '1234-5678';

                assert.expect(2);

                return plugin.init().then(() => {
                    const channel = testState.broadcastChannelInstances[0];
                    channel.messages = [];
                    runner.on('leave', () => assert.ok(true, 'Concurrency still goes through leave flow'));

                    emitBroadcastMessage(channel, {
                        type: TAB_SYNC_EVENTS.becameActive,
                        tabId: 'another-tab'
                    });

                    assert.equal(channel.messages.length, 0, 'Paused tab does not re-announce active status');
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

    QUnit.test('destroy closes synchronization channel', function(assert) {
        const ready = assert.async();
        const testState = this;
        context.featureFlags.FEATURE_FLAG_PAUSE_CONCURRENT_SESSIONS = true;

        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner);
                runner.sequenceNumber = '1234-5678';

                assert.expect(2);

                return plugin.init().then(() => {
                    const channel = testState.broadcastChannelInstances[0];
                    plugin.destroy();
                    assert.ok(channel.closed, 'Broadcast channel is closed on destroy');
                    assert.equal((channel.listeners.message || []).length, 0, 'Message listener is removed');
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
});
