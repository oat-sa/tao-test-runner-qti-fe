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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Christophe Noël <christophe@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'ui/hider',
    'taoTests/runner/runner',
    'taoQtiTest/runner/helpers/currentItem',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/highlighter/plugin'
], function($, _, hider, runnerFactory, itemHelper, providerMock, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    itemHelper.getStimuliHrefs = () => {
        return ['http://include1.xml', 'http://include2.xml'];
    };

    function selectText(id) {
        const el = document.getElementById(id); //get element id
        const sel = window.getSelection();
        const range = document.createRange(); //range object
        range.selectNodeContents(el); //sets Range
        sel.removeAllRanges(); //remove all ranges from selection
        sel.addRange(range); //add Range to a Selection.
    }

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
                                categories: ['x-tao-option-highlighter']
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
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(6);

                return plugin
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        const $buttonMainBefore = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemoveBefore = $container.find('[data-control="highlight-clear"]');

                        assert.equal($buttonMainBefore.length, 1, 'The trigger button has been inserted');
                        assert.equal($buttonMainBefore.hasClass('disabled'), true, 'The trigger button has been rendered disabled');
                        assert.equal($buttonRemoveBefore.length, 1, 'The remove button has been inserted');
                        assert.equal($buttonMainBefore.hasClass('disabled'), true, 'The remove button has been rendered disabled');

                        areaBroker.getToolbox().destroy();

                        const $buttonMainAfter = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemoveAfter = $container.find('[data-control="highlight-clear"]');

                        assert.equal($buttonMainAfter.length, 0, 'The trigger button has been removed');
                        assert.equal($buttonRemoveAfter.length, 0, 'The remove button has been removed');
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
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(4);

                return plugin
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        return plugin.enable();
                    })
                    .then(() => {
                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        assert.equal($buttonMain.hasClass('disabled'), false, 'The trigger button has been enabled');
                        assert.equal($buttonRemove.hasClass('disabled'), false, 'The remove button has been enabled');

                        return plugin.disable();
                    })
                    .then(() => {
                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        assert.equal(
                            $buttonMain.hasClass('disabled'),
                            true,
                            'The trigger button has been disabled'
                        );
                        assert.equal(
                            $buttonRemove.hasClass('disabled'),
                            true,
                            'The remove button has been disabled'
                        );
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
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(4);

                return plugin
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        return plugin.hide();
                    })
                    .then(() => {
                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        assert.ok(hider.isHidden($buttonMain), 'The trigger button has been hidden');
                        assert.ok(hider.isHidden($buttonRemove), 'The remove button has been hidden');

                        return plugin.show();
                    })
                    .then(() => {
                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        assert.ok(!hider.isHidden($buttonMain), 'The trigger button is visible');
                        assert.ok(!hider.isHidden($buttonRemove), 'The remove button is visible');
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
     * The following tests applies to this plugin specfically
     */
    QUnit.test('runner events: loaditem / unloaditem', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(6);

                return plugin
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        runner.trigger('loaditem');

                        assert.ok(!hider.isHidden($buttonMain), 'The trigger button is visible');
                        assert.ok(!hider.isHidden($buttonRemove), 'The remove button is visible');

                        runner.trigger('unloaditem');

                        assert.ok(!hider.isHidden($buttonMain), 'The trigger button is still visible');
                        assert.ok(!hider.isHidden($buttonRemove), 'The remove button is still visible');

                        assert.equal($buttonMain.hasClass('disabled'), true, 'The trigger button has been disabled');
                        assert.equal($buttonRemove.hasClass('disabled'), true, 'The remove button has been disabled');
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
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);

                assert.expect(4);

                return plugin
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        runner.trigger('loaditem');
                        runner.trigger('renderitem');

                        assert.ok(!hider.isHidden($buttonMain), 'The trigger button is visible');
                        assert.ok(!hider.isHidden($buttonRemove), 'The remove button is visible');

                        assert.equal($buttonMain.hasClass('disabled'), false, 'The trigger button is not disabled');
                        assert.equal($buttonRemove.hasClass('disabled'), false, 'The remove button is not disabled');
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

    QUnit.test('actions: select item & stimulus texts, unload, reload', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const $container = areaBroker.getToolboxArea();
                const plugin = pluginFactory(runner, areaBroker);
                const cleanItemHtml = $('#qunit-item').html();

                assert.expect(11);

                return plugin
                    .init()
                    .then(() => new Promise(resolve => {
                        areaBroker.getToolbox().render($container);

                        runner.trigger('loaditem');
                        runner.trigger('renderitem');

                        // wait for highlighters to be loaded (async)
                        setTimeout(resolve, 1000);
                    }))
                    .then(() => new Promise(resolve => {
                        const $buttonMain = $container.find('[data-control="highlight-trigger"]');

                        // do some highlighting
                        selectText('para1');
                        $buttonMain.trigger('mousedown');
                        assert.equal($('#para1 span').length, 1, 'Para 1 was highlighted');

                        selectText('para2');
                        $buttonMain.trigger('mousedown');
                        assert.equal($('#para2 span').length, 1, 'Para 2 was highlighted');

                        selectText('stim1');
                        $buttonMain.trigger('mousedown');
                        assert.equal($('#stim1 span').length, 1, 'Stim 1 was highlighted');

                        selectText('stim2');
                        $buttonMain.trigger('mousedown');
                        assert.equal($('#stim2 span').length, 1, 'Stim 2 was highlighted');

                        assert.equal($('.qti-itemBody').find('span').length, 4, '4 highlights exist');

                        // unload the item, reset DOM
                        runner.trigger('unloaditem'); // saves
                        $('#qunit-item').empty();

                        // wait for highlighters to be saved (async)
                        setTimeout(resolve, 1000);
                    }))
                    .then(() => new Promise(resolve => {
                        $('#qunit-item').html(cleanItemHtml);

                        // load item again
                        runner.trigger('loaditem');
                        runner.trigger('renderitem'); // loads

                        // wait for highlighters to be loaded (async)
                        setTimeout(resolve, 1000);
                    }))
                    .then(() => {
                        const $buttonRemove = $container.find('[data-control="highlight-clear"]');

                        // test loaded highlights
                        assert.equal($('#para1 span').length, 1, 'Para 1 was highlighted');
                        assert.equal($('#para2 span').length, 1, 'Para 2 was highlighted');
                        assert.equal($('#stim1 span').length, 1, 'Stim 1 was highlighted');
                        assert.equal($('#stim2 span').length, 1, 'Stim 2 was highlighted');
                        assert.equal($('.qti-itemBody').find('span').length, 4, '4 highlights exist');

                        $buttonRemove.trigger('click');
                        assert.equal($('.qti-itemBody').find('span').length, 0, 'No highlights remain after clear');
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
