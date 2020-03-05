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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'ui/dialog/alert',
    'taoTests/runner/runner',
    'taoTests/runner/runnerComponent',
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/plugin',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/mock/backend',
    'tpl!taoQtiTest/test/runner/plugins/content/keyNavigation/assets/layout',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/config.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/test.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/rubrics.json',
    'jquery.simulate'
], function (
    $,
    _,
    dialogAlert,
    runnerFactory,
    runnerComponent,
    pluginFactory,
    providerMock,
    backendMockFactory,
    layoutTpl,
    configData,
    testDefinition,
    itemsBank,
    rubricsBank
) {
    'use strict';

    // KeyCode constants
    const key = $.simulate.keyCode;

    // Wait delay between each cycle step (test the keyboard behavior)
    const cycleDelay = 25;

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const backendMock = backendMockFactory(testDefinition, itemsBank);

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
        {title: 'init'},
        {title: 'render'},
        {title: 'finish'},
        {title: 'destroy'},
        {title: 'trigger'},
        {title: 'getTestRunner'},
        {title: 'getAreaBroker'},
        {title: 'getConfig'},
        {title: 'setConfig'},
        {title: 'getState'},
        {title: 'setState'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'}
    ]).test('plugin API ', (data, assert) => {
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        assert.equal(
            typeof plugin[data.title],
            'function',
            `The pluginFactory instance exposes a "${data.title}" function`
        );
    });

    QUnit.module('Behavior');

    QUnit.test('Switch the navigation mode', assert => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = _.cloneDeep(configData);
        assert.expect(10);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), config)
                    .on('error', reject)
                    .on('ready', runner => {
                        assert.equal($container.find('.runner').children().length, 1, 'The test runner is rendered');

                        runner
                            .after('renderitem.runnerComponent', () => {
                                runner.off('renderitem.runnerComponent');
                                resolve(runner);
                            });
                    });
            }))
            .then(runner => {
                assert.ok(true, 'Test runner up an running');
                assert.equal(typeof runner.getPluginConfig('keyNavigation'), 'object', 'There is a configuration for the plugin');
                return runner;
            })
            .then(runner => new Promise(resolve => {
                const plugin = runner.getPlugin('keyNavigation');
                const newMode = 'native';

                assert.equal(plugin.getConfig().contentNavigatorType, 'default', 'The navigation mode is set to default');

                runner
                    .after('setcontenttabtype', mode => {
                        assert.equal(mode, newMode, 'The new mode is provided as parameter to the event');
                        assert.equal(plugin.getConfig().contentNavigatorType, newMode, 'The navigation mode has been changed');
                        resolve(runner);
                    })
                    .trigger('setcontenttabtype', newMode);
            }))
            .then(runner => runner.destroy())
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(() => assert.ok(true, 'done!'))
            .then(ready);
    });

    QUnit.test('Default navigation mode', assert => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = _.cloneDeep(configData);
        const cycle = [{
            label: 'Rubrick block',
            selector: '.qti-rubricBlock',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction input[value="choice_1"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction input[value="choice_2"]',
            key: {
                keyCode: key.DOWN
            }
        }, {
            label: 'Item interaction 3',
            selector: '.qti-interaction input[value="choice_3"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction input[value="choice_2"]',
            key: {
                keyCode: key.UP
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction input[value="choice_1"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Hide review button',
            selector: '[data-control="hide-review"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Logout link',
            selector: '#logout',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Exit link',
            selector: '#exit',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel All tab',
            selector: '.qti-navigator-filter[data-mode="all"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel Flagged tab',
            selector: '.qti-navigator-filter[data-mode="flagged"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Navigation panel current item',
            selector: '.qti-navigator-item[data-id="item-3"] .qti-navigator-label',
            key: {
                keyCode: key.DOWN
            }
        }, {
            label: 'Rubrick block',
            selector: '.qti-rubricBlock',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item wrapper',
            selector: 'section.content-wrapper',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }];
        const processCycle = (index, delay = cycleDelay) => new Promise(resolve => {
            const step = cycle[index];
            $(document.activeElement).simulate('keydown', step.key);
            setTimeout(() => {
                assert.equal(document.activeElement, $container.find(step.selector).get(0), `${step.label} got the focus`);
                resolve(index + 1);
            }, delay);
        });

        backendMock.setRubricsBank(rubricsBank);

        assert.expect(8 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), config)
                    .on('error', reject)
                    .on('ready', runner => {
                        assert.equal($container.find('.runner').children().length, 1, 'The test runner is rendered');

                        runner.after('renderitem.runnerComponent', itemRef => {
                            if (itemRef === 'item-1') {
                                runner.next();
                            } else {
                                runner.off('renderitem.runnerComponent');
                                resolve(runner);
                            }
                        });
                    });
            }))
            .then(runner => {
                assert.ok(true, 'Test runner up an running');
                assert.equal(typeof runner.getPluginConfig('keyNavigation'), 'object', 'There is a configuration for the plugin');
                return runner;
            })
            .then(runner => new Promise(resolve => {
                const plugin = runner.getPlugin('keyNavigation');

                assert.equal(plugin.getConfig().contentNavigatorType, 'default', 'The navigation mode is set to default');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => runner.destroy())
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(() => assert.ok(true, 'done!'))
            .then(ready);
    });

    QUnit.test('Linear navigation mode', assert => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = _.cloneDeep(configData);
        const cycle = [{
            label: 'Rubrick block',
            selector: '.qti-rubricBlock',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction [data-identifier="choice_1"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction [data-identifier="choice_2"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Item interaction 3',
            selector: '.qti-interaction [data-identifier="choice_3"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction [data-identifier="choice_2"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction [data-identifier="choice_1"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction [data-identifier="choice_2"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 3',
            selector: '.qti-interaction [data-identifier="choice_3"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Hide review button',
            selector: '[data-control="hide-review"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Logout link',
            selector: '#logout',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Exit link',
            selector: '#exit',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel All tab',
            selector: '.qti-navigator-filter[data-mode="all"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel Flagged tab',
            selector: '.qti-navigator-filter[data-mode="flagged"]',
            key: {
                keyCode: key.RIGHT
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.LEFT
            }
        }, {
            label: 'Navigation panel current item',
            selector: '.qti-navigator-item[data-id="item-3"] .qti-navigator-label',
            key: {
                keyCode: key.DOWN
            }
        }, {
            label: 'Rubrick block',
            selector: '.qti-rubricBlock',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item wrapper',
            selector: 'section.content-wrapper',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }];
        const processCycle = (index, delay = cycleDelay) => new Promise(resolve => {
            const step = cycle[index];
            $(document.activeElement).simulate('keydown', step.key);
            setTimeout(() => {
                assert.equal(document.activeElement, $container.find(step.selector).get(0), `${step.label} got the focus`);
                resolve(index + 1);
            }, delay);
        });

        backendMock.setRubricsBank(rubricsBank);

        assert.expect(8 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), config)
                    .on('error', reject)
                    .on('ready', runner => {
                        assert.equal($container.find('.runner').children().length, 1, 'The test runner is rendered');

                        runner
                            .after('setcontenttabtype', () => runner.next())
                            .after('renderitem.runnerComponent', itemRef => {
                                if (itemRef === 'item-1') {
                                    runner.trigger('setcontenttabtype', 'linear');
                                } else {
                                    runner.off('renderitem.runnerComponent');
                                    resolve(runner);
                                }
                            });
                    });
            }))
            .then(runner => {
                assert.ok(true, 'Test runner up an running');
                assert.equal(typeof runner.getPluginConfig('keyNavigation'), 'object', 'There is a configuration for the plugin');
                return runner;
            })
            .then(runner => new Promise(resolve => {
                const plugin = runner.getPlugin('keyNavigation');

                assert.equal(plugin.getConfig().contentNavigatorType, 'linear', 'The navigation mode is set to linear');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => runner.destroy())
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(() => assert.ok(true, 'done!'))
            .then(ready);
    });

    QUnit.test('Native navigation mode', assert => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = _.cloneDeep(configData);
        const cycle = [{
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Logout link',
            selector: '#logout',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Exit link',
            selector: '#exit',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel All tab',
            selector: '.qti-navigator-filter[data-mode="all"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel Flagged tab',
            selector: '.qti-navigator-filter[data-mode="flagged"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel Unanswered tab',
            selector: '.qti-navigator-filter[data-mode="unanswered"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Navigation panel Flagged tab',
            selector: '.qti-navigator-filter[data-mode="flagged"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Navigation panel current item',
            selector: '.qti-navigator-item[data-id="item-3"] .qti-navigator-label',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction input[value="choice_1"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction input[value="choice_2"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 3',
            selector: '.qti-interaction input[value="choice_3"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction input[value="choice_2"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Item interaction 1',
            selector: '.qti-interaction input[value="choice_1"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Item interaction 2',
            selector: '.qti-interaction input[value="choice_2"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Item interaction 3',
            selector: '.qti-interaction input[value="choice_3"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Hide review button',
            selector: '[data-control="hide-review"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Home link',
            selector: '#home',
            key: {
                keyCode: key.TAB
            }
        }, {
            label: 'Next button',
            selector: '[data-control="move-forward"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }, {
            label: 'Hide review button',
            selector: '[data-control="hide-review"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        },{
            label: 'Item interaction 3',
            selector: '.qti-interaction input[value="choice_3"]',
            key: {
                keyCode: key.TAB,
                shiftKey: true
            }
        }];
        const processCycle = (index, delay = cycleDelay) => new Promise(resolve => {
            const step = cycle[index];
            $(document.activeElement).simulate('keydown', step.key);
            setTimeout(() => {
                assert.equal(document.activeElement, $container.find(step.selector).get(0), `${step.label} got the focus`);
                resolve(index + 1);
            }, delay);
        });

        backendMock.setRubricsBank({});

        assert.expect(8 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), config)
                    .on('error', reject)
                    .on('ready', runner => {
                        assert.equal($container.find('.runner').children().length, 1, 'The test runner is rendered');

                        runner
                            .after('setcontenttabtype', () => runner.next())
                            .after('renderitem.runnerComponent', itemRef => {
                                if (itemRef === 'item-1') {
                                    runner.trigger('setcontenttabtype', 'native');
                                } else {
                                    runner.off('renderitem.runnerComponent');
                                    resolve(runner);
                                }
                            });
                    });
            }))
            .then(runner => {
                assert.ok(true, 'Test runner up an running');
                assert.equal(typeof runner.getPluginConfig('keyNavigation'), 'object', 'There is a configuration for the plugin');
                return runner;
            })
            .then(runner => new Promise(resolve => {
                const plugin = runner.getPlugin('keyNavigation');

                assert.equal(plugin.getConfig().contentNavigatorType, 'native', 'The navigation mode is set to native');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => runner.destroy())
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(() => assert.ok(true, 'done!'))
            .then(ready);
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', assert => {
        const ready = assert.async();
        const $container = $('#visual-playground');
        const $selector = $container.find('.playground-selector');
        const $view = $container.find('.playground-view');
        const modes = [];
        assert.expect(1);

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $view.html(layoutTpl());
                runnerComponent($view.find('.runner'), configData)
                    .on('error', reject)
                    .on('ready', runner => {
                        runner
                            .after('renderitem.runnerComponent', () => {
                                runner.off('renderitem.runnerComponent');
                                resolve(runner);
                            })
                            .after('setcontenttabtype', mode => {
                                if (mode !== 'native') {
                                    backendMock.setRubricsBank(rubricsBank);
                                } else {
                                    backendMock.setRubricsBank({});
                                }
                                runner.jump(0);
                            });
                    });
            }))
            .then(runner => {
                function activateMode(id) {
                    modes.forEach(mode => mode.$button.toggleClass('btn-info', id === mode.id));
                    $view.attr('data-mode', id);
                    runner.trigger('setcontenttabtype', id);
                }

                $view.find('header').on('click', 'a', e => {
                    dialogAlert(`You clicked on <b>${$(e.currentTarget).text()}</b>`);
                    e.preventDefault();
                });

                $selector
                    .on('click', 'button', e => {
                        activateMode(e.target.dataset.mode);
                    })
                    .find('button').each(function () {
                        modes.push({
                            id: this.dataset.mode,
                            $button: $(this)
                        });
                    });

                activateMode('default');
                assert.ok(true, 'The playground is ready');
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
