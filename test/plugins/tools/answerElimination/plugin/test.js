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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA
 */

define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/answerElimination/eliminator'
], function(runnerFactory, providerMock, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier : 'item-1'
    };
    const sampleTestMap = {
        parts: {
            p1 : {
                sections : {
                    s1 : {
                        items : {
                            'item-1' : {
                                categories: ['x-tao-option-eliminator']
                            }
                        }
                    }
                }
            }
        },
        jumps : [{
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
        const plugin = pluginFactory(runner);
        assert.expect(1);
        assert.equal(
            typeof plugin[data.title],
            'function',
            `The pluginFactory instances expose a "${  data.title  }" function`
        );
    });

    /**
     * Button
     */
    QUnit.module('Button');

    QUnit.test('render/enable/disable/destroy', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, areaBroker);
        const toolbox = areaBroker.getToolbox();
        const $container = areaBroker.getToolboxArea();
        const buttonSelector = '[data-control="eliminator"]';

        assert.expect(12);

        plugin
            .init()
            .then(() => {
                assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                // Toolbox rendering
                toolbox.render($container);

                const $button = $container.find(buttonSelector);

                assert.equal($button.length, 1, 'The plugin button has been inserted in the right place');
                assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');

                // Plugin rendering
                return plugin.render().then(() => {
                    assert.equal(plugin.getState('ready'), true, 'The plugin is ready');

                    // Enabling
                    return plugin.enable().then(() => {
                        assert.equal(plugin.getState('enabled'), true, 'The plugin is enabled');
                        assert.equal($button.hasClass('disabled'), false, 'The button is not disabled');

                        // Disabling
                        return plugin.disable().then(() => {
                            assert.equal(plugin.getState('enabled'), false, 'The plugin is disabled');
                            assert.equal($button.hasClass('disabled'), true, 'The button is disabled');
                            assert.equal($button.hasClass('active'), false, 'The button is turned off');

                            // Plugin destroying
                            return plugin.destroy().then(() => {
                                const $buttonBefore = $container.find(buttonSelector);

                                assert.equal(plugin.getState('init'), false, 'The plugin is destroyed');
                                assert.equal(
                                    $buttonBefore.length,
                                    1,
                                    'The plugin button has not been destroyed by the plugin'
                                );

                                // Toolbox destroying
                                toolbox.destroy();

                                const $buttonAfter = $container.find(buttonSelector);

                                assert.equal($buttonAfter.length, 0, 'The button has been removed');
                                ready();
                            });
                        });
                    });
                });
            })
            .catch(err => {
                assert.ok(false, `Unexpected failure : ${  err.message}`);
                ready();
            });
    });

    QUnit.test('show/hide', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, areaBroker);
        const toolbox = areaBroker.getToolbox();
        const $container = areaBroker.getToolboxArea();
        const buttonSelector = '[data-control="eliminator"]';

        assert.expect(7);

        plugin
            .init()
            .then(() => {
                assert.equal(plugin.getState('init'), true, 'The plugin has been initialized');

                // Toolbox rendering
                toolbox.render($container);

                const $button = $container.find(buttonSelector);

                plugin.setState('visible', true);

                assert.equal($button.length, 1, 'The plugin button has been inserted in the right place');
                assert.equal(plugin.getState('visible'), true, 'The plugin is visible');

                // Hiding
                return plugin.hide().then(() => {
                    assert.equal(plugin.getState('visible'), false, 'The plugin is not visible');
                    assert.equal($button.css('display'), 'none', 'The plugin element is hidden');

                    // Showing
                    return plugin.show().then(() => {
                        assert.equal(plugin.getState('visible'), true, 'The plugin is visible');
                        assert.notEqual($button.css('display'), 'none', 'The plugin element is visible');

                        ready();
                    });
                });
            })
            .catch(err => {
                assert.ok(false, `Unexpected failure : ${  err.message}`);
                ready();
            });
    });

    QUnit.test('runner events: loaditem / unloaditem', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());
        const toolbox = areaBroker.getToolbox();
        const $container = areaBroker.getToolboxArea();
        const buttonSelector = '[data-control="eliminator"]';

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        assert.expect(4);

        plugin
            .init()
            .then(() => {
                toolbox.render($container);

                const $button = $container.find(buttonSelector);

                assert.equal($button.length, 1, 'The plugin button has been inserted in the right place');

                runner.trigger('loaditem');

                assert.notEqual($button.css('display'), 'none', 'The plugin button is visible');

                runner.trigger('unloaditem');

                assert.notEqual($button.css('display'), 'none', 'The plugin button is still visible');
                assert.equal($button.hasClass('disabled'), true, 'The button is disabled');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${  err}`);
            });
    });

    QUnit.test('runner events: renderitem', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());
        const areaBroker = runner.getAreaBroker();
        const toolbox = areaBroker.getToolbox();
        const $container = areaBroker.getToolboxArea();
        const buttonSelector = '[data-control="eliminator"]';
        const interaction = document.querySelector('.qti-choiceInteraction');

        areaBroker.getContentArea().append(interaction);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        assert.expect(3);

        plugin
            .init()
            .then(() => {
                toolbox.render($container);

                const $button = $container.find(buttonSelector);

                assert.equal($button.length, 1, 'The plugin button has been inserted in the right place');

                runner.trigger('renderitem');

                assert.notEqual($button.css('display'), 'none', 'The plugin button is visible');
                assert.equal($button.hasClass('disabled'), false, 'The button is not disabled');

                ready();
            })
            .catch(err => {
                assert.ok(false, `An error has occurred: ${  err}`);
                ready();
            });
    });
});
