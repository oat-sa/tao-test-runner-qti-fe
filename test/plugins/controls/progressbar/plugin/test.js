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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/controls/progressbar/progressbar',
    'json!taoQtiTest/test/runner/plugins/controls/progressbar/plugin/map.json'
], function(runnerFactory, providerMock, pluginFactory, testMap) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    /**
     * Gets a configured instance of the Test Runner
     * @returns {Promise<runner>}
     */
    function getTestRunner(config) {
        const runner = runnerFactory(providerName, [], config);
        runner.getDataHolder();
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

    /**
     * Behavior
     */
    QUnit.module('Lifecycle');

    QUnit.test('render/destroy', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker, {});
                const $container = areaBroker.getControlArea();

                assert.expect(4);

                runner.setTestContext({
                    itemPosition: 3,
                    testPartId: 'testPart-1',
                    sectionId: 'assessmentSection-1'
                });

                runner.setTestMap(testMap);

                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.progress-box').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );

                        // Plugin destroying
                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has been removed');
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

    QUnit.test('show/hide', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker, {});
                const $container = areaBroker.getControlArea();

                assert.expect(7);

                runner.setTestContext({
                    itemPosition: 3,
                    testPartId: 'testPart-1',
                    sectionId: 'assessmentSection-1'
                });

                runner.setTestMap(testMap);

                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.progress-box').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        assert.equal($container.find('.progress-box:visible').length, 1, 'The plugin is visible');

                        return plugin.hide();
                    })
                    .then(() => {
                        assert.equal($container.find('.progress-box:visible').length, 0, 'The plugin is now hidden');

                        return plugin.show();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.progress-box:visible').length,
                            1,
                            'The plugin is now visible'
                        );

                        // Plugin destroying
                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has been removed');
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

    QUnit.test('hide on informational', assert => {
        const ready = assert.async();
        getTestRunner({
            options : {
                progressIndicator: {
                    type: 'questions'
                }
            }
        })
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $container = areaBroker.getControlArea();

                assert.expect(5);

                runner.setTestContext({
                    itemPosition: 1,
                    testPartId: 'testPart-intro',
                    sectionId: 'assessmentSection-intro'
                });

                runner.setTestMap(testMap);

                return plugin
                    .init()
                    .then(() => {
                        assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has not been inserted yet');

                        // Plugin rendering
                        return plugin.render();
                    })
                    .then(() => {
                        assert.equal(
                            $container.find('.progress-box').length,
                            1,
                            'The plugin has been inserted in the right place'
                        );
                        assert.equal($container.find('.progress-box:visible').length, 0, 'The plugin is not visible');

                        // Plugin destroying
                        return plugin.destroy();
                    })
                    .then(() => {
                        assert.equal($container.find('.progress-box').length, 0, 'The plugin has been removed');
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
