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
 * @author Christophe Noël <christophe@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'ui/hider',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/answerMasking/plugin',
    'lib/simulator/jquery.simulate'
], function($, _, hider, runnerFactory, providerMock, pluginFactory) {
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
                                categories: ['x-tao-option-answerMasking']
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
        getTestRunner()
            .then(runner => {
                const plugin = pluginFactory(runner, runner.getAreaBroker());

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

    /**
     * The following tests applies to buttons-type plugins
     */
    QUnit.module('plugin button');

    QUnit.test('render/destroy button', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(3);

                return plugin
                    .init()
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        const $buttonBefore = $container.find('[data-control="answer-masking"]');

                        assert.equal($buttonBefore.length, 1, 'The button has been inserted');
                        assert.equal($buttonBefore.hasClass('disabled'), true, 'The button has been rendered disabled');

                        areaBroker.getToolbox().destroy();

                        const $buttonAfter = $container.find('[data-control="answer-masking"]');

                        assert.equal($buttonAfter.length, 0, 'The button has been removed');
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

    QUnit.test('enable/disable button', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(2);

                return plugin
                    .init()
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        return plugin.enable();
                    })
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();
                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');

                        return plugin.disable();
                    })
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();
                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
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

    QUnit.test('show/hide button', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(3);

                return plugin
                    .init()
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        return plugin.hide();
                    })
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();
                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.ok(hider.isHidden($button), 'The button has been hidden');

                        return plugin.show();
                    })
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();
                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.ok(!hider.isHidden($button), 'The button is visible');

                        return plugin.hide();
                    })
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();
                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.ok(hider.isHidden($button), 'The button has been hidden again');
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

    QUnit.test('runner events: loaditem / unloaditem', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(3);

                areaBroker.getContentArea().append(
                    $('<div>', {
                        class: 'qti-choiceInteraction'
                    })
                );

                return plugin
                    .init()
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        const $button = $container.find('[data-control="answer-masking"]');

                        runner.trigger('loaditem');

                        assert.ok(!hider.isHidden($button), 'The button is visible');

                        runner.trigger('unloaditem');

                        assert.ok(!hider.isHidden($button), 'The button is still visible');

                        assert.equal($button.hasClass('disabled'), true, 'The trigger button has been disabled');
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

    QUnit.test('runner events: renderitem', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(2);

                areaBroker.getContentArea().append(
                    $('<div>', {
                        class: 'qti-choiceInteraction'
                    })
                );

                return plugin
                    .init()
                    .then(() => {
                        const $container = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        runner.trigger('renderitem');

                        const $button = $container.find('[data-control="answer-masking"]');

                        assert.ok(!hider.isHidden($button), 'The button is visible');

                        assert.equal($button.hasClass('disabled'), false, 'The button is not disabled');
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

    /**
     * The following tests applies to plugin UI (mouse click and keyboard shortcuts)
     */
    QUnit.module('plugin UI');

    QUnit.test('Toggle on keyboard shortcut', assert => {
        const ready = assert.async();
        getTestRunner({
            options : {
                allowShortcuts: true,
                shortcuts: {
                    'answer-masking': {
                        toggle: 'c'
                    }
                }
            }
        })
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);
                const $contentContainer = areaBroker.getContentArea();

                assert.expect(5);

                areaBroker.getContentArea().append(
                    $('<div>', {
                        class: 'qti-choiceInteraction'
                    })
                );

                return plugin
                    .init()
                    .then(() => new Promise(resolve => {
                        const $toolboxContainer = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($toolboxContainer);
                        const $button = areaBroker.getToolboxArea().find('[data-control="answer-masking"]');

                        runner.trigger('renderitem');

                        assert.equal($button.hasClass('active'), false, 'button is turned off');

                        runner.after('tool-answer-masking-toggle.test', () => {
                            runner.off('.test');

                            assert.ok(true, 'first keypressed has triggered the correct event');
                            assert.equal($button.hasClass('active'), true, 'button is turned on');

                            resolve();
                        });

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
                    }))
                    .then(() => new Promise(resolve => {
                        const $button = areaBroker.getToolboxArea().find('[data-control="answer-masking"]');

                        runner.after('tool-answer-masking-toggle.test', () => {
                            runner.off('.test');


                            assert.ok(true, 'second keypressed has triggered the correct event');
                            assert.equal($button.hasClass('active'), false, 'button is turned off again');
                            resolve();
                        });

                        $(document).simulate('keydown', {
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

    QUnit.test('Toggle on click', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(5);

                areaBroker.getContentArea().append(
                    $('<div>', {
                        class: 'qti-choiceInteraction'
                    })
                );

                return plugin
                    .init()
                    .then(() => new Promise(resolve => {
                        const $toolboxContainer = areaBroker.getToolboxArea();

                        areaBroker.getToolbox().render($toolboxContainer);
                        const $button = areaBroker.getToolboxArea().find('[data-control="answer-masking"]');

                        runner.trigger('renderitem');

                        assert.equal($button.hasClass('active'), false, 'button is turned off');

                        runner.after('tool-answer-masking-toggle.test', () => {
                            runner.off('.test');

                            assert.ok(true, 'first click has triggered the correct event');
                            assert.equal($button.hasClass('active'), true, 'button is turned on');


                            resolve();
                        });

                        $button.click();
                    }))
                    .then(() => new Promise(resolve => {
                        const $button = areaBroker.getToolboxArea().find('[data-control="answer-masking"]');

                        runner.after('tool-answer-masking-toggle.test', () => {
                            runner.off('.test');

                            assert.ok(true, 'second click has triggered the correct event');
                            assert.equal($button.hasClass('active'), false, 'button is turned off again');

                            resolve();
                        });

                        $button.click();
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
