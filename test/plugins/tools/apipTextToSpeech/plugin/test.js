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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Anton Tsymuk <anton@taotesting.com>
 */
define([
    'lodash',
    'ui/hider',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/apipTextToSpeech/plugin',
    'ui/keyNavigation/navigator',
    'lib/simulator/jquery.simulate'
], function (_, hider, runnerFactory, providerMock, pluginFactory, keyNavigatorFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier: 'item-1'
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
    const apipData = {
        companionMaterialsInfo: [],
        inclusionOrder: {
            textGraphicsDefaultOrder: {
                elementOrder: [
                    {
                        '@attributes': {
                            identifierRef: 'ae001',
                        },
                        order: '1',
                    },
                ]
            },
        },
        accessibilityInfo: {
            accessElement: [
                {
                    '@attributes': {
                        identifier: 'ae001',
                    },
                    relatedElementInfo: {
                        spoken: {
                            audioFileInfo: [
                                {
                                    '@attributes': {
                                        mimeType: 'audio/mpeg',
                                    },
                                    fileHref: 'assets/ae001_534500.mp3',
                                },
                            ],
                        }
                    }
                }
            ]
        }
    };

    /**
     * The following tests applies to all plugins
     */
    QUnit.module('pluginFactory');

    QUnit.test('module', (assert) => {
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
        { name: 'init', title: 'init' },
        { name: 'render', title: 'render' },
        { name: 'finish', title: 'finish' },
        { name: 'destroy', title: 'destroy' },
        { name: 'trigger', title: 'trigger' },
        { name: 'getTestRunner', title: 'getTestRunner' },
        { name: 'getAreaBroker', title: 'getAreaBroker' },
        { name: 'getConfig', title: 'getConfig' },
        { name: 'setConfig', title: 'setConfig' },
        { name: 'getState', title: 'getState' },
        { name: 'setState', title: 'setState' },
        { name: 'show', title: 'show' },
        { name: 'hide', title: 'hide' },
        { name: 'enable', title: 'enable' },
        { name: 'disable', title: 'disable' }
    ];

    QUnit.cases.init(pluginApi).test('plugin API ', (data, assert) => {
        const runner = runnerFactory(providerName);
        const timer = pluginFactory(runner);

        assert.equal(
            typeof timer[data.name],
            'function',
            `The pluginFactory instances expose a "${data.name}" function`
        );
    });

    QUnit.test('pluginFactory.init', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        plugin
            .init()
            .then(() => {
                assert.equal(plugin.getState('init'), true, 'The plugin is initialised');

                ready();
            })
            .catch((err) => {
                assert.ok(false, `The init failed: ${err}`);
                ready();
            });
    });

    /**
     * The following tests applies to buttons-type plugins
     */
    QUnit.module('plugin button');

    QUnit.test('render/destroy button', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();
                let $button;

                areaBroker.getToolbox().render($container);

                $button = $container.find('[data-control="apiptts"]');

                assert.equal($button.length, 1, 'The trigger button has been inserted');
                assert.equal($button.hasClass('disabled'), true, 'The trigger button has been rendered disabled');

                areaBroker.getToolbox().destroy();

                $button = $container.find('[data-control="apiptts"]');

                assert.equal($button.length, 0, 'The trigger button has been removed');
                ready();
            })
            .catch((err) => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    QUnit.test('enable/disable button', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(2);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                return plugin.enable().then(() => {
                    const $button = $container.find('[data-control="apiptts"]');

                    assert.equal($button.hasClass('disabled'), false, 'The trigger button has been enabled');

                    return plugin.disable().then(() => {
                        assert.equal($button.hasClass('disabled'), true, 'The trigger button has been disabled');

                        ready();
                    });
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('show/hide button', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        runner.itemRunner = { getApipData: () => apipData };

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                return plugin.hide().then(() => {
                    const $button = $container.find('[data-control="apiptts"]');

                    assert.equal(hider.isHidden($button), true, 'The trigger button has been hidden');

                    return plugin.show().then(() => {
                        assert.equal(hider.isHidden($button), false, 'The trigger button is visible');

                        return plugin.hide().then(() => {
                            assert.equal(hider.isHidden($button), true, 'The trigger button has been hidden again');

                            ready();
                        });
                    });
                });
            })
            .catch((err) => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('runner events: loaditem / unloaditem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        runner.itemRunner = { getApipData: () => apipData };

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                const $button = $container.find('[data-control="apiptts"]');

                runner.trigger('loaditem');

                assert.equal(hider.isHidden($button), false, 'The trigger button is visible');

                runner.trigger('unloaditem');

                assert.equal(hider.isHidden($button), false, 'The trigger button is still visible');

                assert.equal($button.hasClass('disabled'), true, 'The trigger button has been disabled');

                ready();
            })
            .catch((err) => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    QUnit.test('runner events: renderitem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        runner.itemRunner = { getApipData: () => apipData };

        assert.expect(2);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                const $button = $container.find('[data-control="apiptts"]');

                runner.trigger('renderitem');

                assert.equal(hider.isHidden($button), false, 'The trigger button is visible');

                assert.equal($button.hasClass('disabled'), false, 'The trigger button is not disabled');

                ready();
            })
            .catch((err) => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    QUnit.test('Toggle on click', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        runner.itemRunner = { getApipData: () => apipData };

        plugin
            .init()
            .then(function () {
                const $container = areaBroker.getToolboxArea();

                runner.trigger('renderitem');

                areaBroker.getToolbox().render($container);

                return plugin.enable().then(() => {
                    const $button = $container.find('[data-control="apiptts"]');

                    assert.equal(plugin.getState('active'), false, 'The plugin should not be active by default');

                    $button.click();

                    assert.equal(plugin.getState('active'), true, 'The button should toggle the plugin to active state');

                    $button.click();

                    assert.equal(plugin.getState('active'), false, 'If the plugin is active, the button should toggle the plugin to non active state');

                    ready();
                });
            })
            .catch(function (err) {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('Add navigation group', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());
        const pluginName = plugin.getName();
        const groupNavigationId = `${pluginName}_navigation_group`;
        const actionPrefix = `tool-${pluginName}-`;

        assert.expect(6);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        runner.itemRunner = { getApipData: () => apipData };

        plugin
            .init()
            .then(function () {
                const $container = areaBroker.getToolboxArea();
                areaBroker.getToolbox().render($container);

                runner.trigger('renderitem');

                return plugin.enable().then(() => {
                    const $button = $container.find('[data-control="apiptts"]');

                    assert.equal($button.is(document.activeElement), false, 'The focus group is not focused by default');

                    $button.click();

                    const navigationGroup = keyNavigatorFactory.get(groupNavigationId);

                    assert.equal(typeof navigationGroup, 'object', 'The plugin create navigation group after render');

                    assert.equal($button.is(document.activeElement), true, 'The focus group is not focused after plugin activation');

                    $button.click();

                    assert.equal($button.is(document.activeElement), false, 'The focus group lose focus after plugin disabling');

                    runner.on(`${actionPrefix}next`, () => {
                        assert.ok(true, `The next event triggered after tab navigation`);

                        runner.on(`${actionPrefix}previous`, () => {
                            assert.ok(true, `The previous event triggered after tab+shift navigation`);

                            ready();
                        });

                        navigationGroup.trigger('shift+tab');
                    });

                    navigationGroup.trigger('tab');
                });
            })
            .catch(function (err) {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });
});
