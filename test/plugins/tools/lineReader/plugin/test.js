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
 * @author Christophe Noël <christophe@taotesting.com>
 */
define([
    'lodash',
    'ui/hider',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/lineReader/plugin',
    'lib/simulator/jquery.simulate'
], function(_, hider, runnerFactory, providerMock, pluginFactory) {
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
                                categories: ['x-tao-option-lineReader']
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

    QUnit.test('pluginFactory.init', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        plugin
            .init()
            .then(() => {
                assert.equal(plugin.getState('init'), true, 'The plugin is initialised');

                ready();
            })
            .catch(err => {
                assert.ok(false, `The init failed: ${err}`);
                ready();
            });
    });

    /**
     * The following tests applies to buttons-type plugins
     */
    QUnit.module('plugin button');

    QUnit.test('render/destroy button', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(4);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                const $buttonBefore = $container.find('[data-control="line-reader"]');

                assert.equal($buttonBefore.length, 1, 'The trigger button has been inserted');
                assert.equal($buttonBefore.hasClass('disabled'), true, 'The trigger button has been rendered disabled');
                assert.equal($buttonBefore.hasClass('disabled'), true, 'The remove button has been rendered disabled');

                areaBroker.getToolbox().destroy();

                const $buttonAfter = $container.find('[data-control="line-reader"]');

                assert.equal($buttonAfter.length, 0, 'The trigger button has been removed');
                ready();
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    QUnit.test('enable/disable button', assert => {
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
                    const $button = $container.find('[data-control="line-reader"]');

                    assert.equal($button.hasClass('disabled'), false, 'The trigger button has been enabled');

                    return plugin.disable().then(() => {
                        assert.equal($button.hasClass('disabled'), true, 'The trigger button has been disabled');

                        ready();
                    });
                });
            })
            .catch(err => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('show/hide button', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                return plugin.hide().then(() => {
                    const $button = $container.find('[data-control="line-reader"]');

                    assert.ok(hider.isHidden($button), 'The trigger button has been hidden');

                    return plugin.show().then(() => {
                        assert.ok(!hider.isHidden($button), 'The trigger button is visible');

                        return plugin.hide().then(() => {
                            assert.ok(hider.isHidden($button), 'The trigger button has been hidden again');

                            ready();
                        });
                    });
                });
            })
            .catch(err => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('runner events: loaditem / unloaditem', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                const $container = runner.getAreaBroker().getToolboxArea();

                areaBroker.getToolbox().render($container);

                const $button = $container.find('[data-control="line-reader"]');

                runner.trigger('loaditem');

                assert.ok(!hider.isHidden($button), 'The trigger button is visible');

                runner.trigger('unloaditem');

                assert.ok(!hider.isHidden($button), 'The trigger button is still visible');

                assert.equal($button.hasClass('disabled'), true, 'The trigger button has been disabled');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    QUnit.test('runner events: renderitem', assert => {
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

                const $button = $container.find('[data-control="line-reader"]');

                runner.trigger('renderitem');

                assert.ok(!hider.isHidden($button), 'The trigger button is visible');

                assert.equal($button.hasClass('disabled'), false, 'The trigger button is not disabled');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    /**
     * The following tests are specific to this plugin
     */
    QUnit.module('line reader');

    QUnit.test('Render compound mask', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(4);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                const $contentContainer = areaBroker.getContentArea().parent(),
                    $masks = $contentContainer.find('.line-reader-mask'),
                    $overlays = $contentContainer.find('.line-reader-overlay');

                runner.trigger('renderitem');

                assert.equal($masks.length, 8, '8 masks have been rendered');
                assert.equal($overlays.length, 1, '1 overlay has been rendered');

                assert.ok($masks.hasClass('hidden'), 'masks are hidden by default');
                assert.ok($overlays.hasClass('hidden'), 'overlays are hidden by default');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('Toggle on click', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(8);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                const $contentContainer = areaBroker.getContentArea().parent(),
                    $toolboxContainer = areaBroker.getToolboxArea(),
                    $masks = $contentContainer.find('.line-reader-mask'),
                    $overlays = $contentContainer.find('.line-reader-overlay');

                runner.trigger('renderitem');

                areaBroker.getToolbox().render($toolboxContainer);
                const $button = areaBroker.getToolboxArea().find('[data-control="line-reader"]');

                assert.equal($masks.length, 8, '8 masks have been rendered');
                assert.equal($overlays.length, 1, '1 overlay has been rendered');

                assert.ok($masks.hasClass('hidden'), 'masks are hidden by default');
                assert.ok($overlays.hasClass('hidden'), 'overlays are hidden by default');

                $button.click();

                assert.ok(!$masks.hasClass('hidden'), 'masks are now visible on a button mouse click');
                assert.ok(!$overlays.hasClass('hidden'), 'overlays are now visible on a button mouse click');

                $button.click();

                assert.ok($masks.hasClass('hidden'), 'masks are hidden again on a button mouse click');
                assert.ok($overlays.hasClass('hidden'), 'overlays are hidden again on a button mouse click');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });

    QUnit.test('Toggle on keyboard shortcut', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName, {}, {
            options: {
                allowShortcuts: true,
                shortcuts: {
                    'line-reader': {
                        toggle: 'c'
                    }
                }
            }
        });
        const areaBroker = runner.getAreaBroker();
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(6);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        plugin
            .init()
            .then(() => {
                const $contentContainer = areaBroker.getContentArea().parent(),
                    $masks = $contentContainer.find('.line-reader-mask'),
                    $overlays = $contentContainer.find('.line-reader-overlay');

                runner.trigger('renderitem');

                assert.ok($masks.hasClass('hidden'), 'masks are hidden by default');
                assert.ok($overlays.hasClass('hidden'), 'overlays are hidden by default');

                $contentContainer.simulate('keydown', {
                    charCode: 0,
                    keyCode: 67,
                    which: 67,
                    code: 'KeyC',
                    key: 'c',
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false
                });

                assert.ok(!$masks.hasClass('hidden'), 'masks are now visible on keyboard shortcut');
                assert.ok(!$overlays.hasClass('hidden'), 'overlays are now visible on keyboard shortcut');

                $contentContainer.simulate('keydown', {
                    charCode: 0,
                    keyCode: 67,
                    which: 67,
                    code: 'KeyC',
                    key: 'c',
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false
                });

                assert.ok($masks.hasClass('hidden'), 'masks are hidden again on keyboard shortcut');
                assert.ok($overlays.hasClass('hidden'), 'overlays are hidden again on keyboard shortcut');

                ready();
            })
            .catch(err => {
                assert.ok(false, `Unexpected error: ${err}`);
                ready();
            });
    });
});
