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
    'taoTests/runner/runner',
    'taoTests/runner/runnerComponent',
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/plugin',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/mock/backend',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/plugin/playground',
    'tpl!taoQtiTest/test/runner/plugins/content/keyNavigation/assets/layout',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/config.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/test.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/rubrics.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/navigation.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/navigationFizzy.json',
    'jquery.simulate'
], function (
    $,
    _,
    runnerFactory,
    runnerComponent,
    pluginFactory,
    providerMock,
    backendMockFactory,
    visualPlayground,
    layoutTpl,
    configData,
    testDefinition,
    itemsBank,
    rubricsBank,
    navigationCases,
    navigationFizzyCases
) {
    'use strict';

    // KeyCode constants
    const keyCode = $.simulate.keyCode;

    // Wait delay between each navigation step (test the keyboard behavior)
    const stepDelay = 1;

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

    QUnit.cases.init([...navigationCases, ...navigationFizzyCases]).test('Navigation mode ', (data, assert) => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = _.cloneDeep(configData);
        const processNavigationStep = (index, delay = stepDelay) => new Promise(resolve => {
            const step = data.steps[index];
            const key = Object.assign({}, step.key);
            key.keyCode = keyCode[key.keyCode] || key.keyCode;
            $(document.activeElement).simulate('keydown', key);
            setTimeout(() => {
                assert.equal(document.activeElement, $container.find(step.selector).get(0), `${step.label} got the focus`);
                resolve(index + 1);
            }, delay);
        });

        const testData = _.cloneDeep(backendMock.getTestData());
        testData.config.review.reviewLayout = data.reviewLayout || 'default';

        backendMock.setTestData(testData);
        backendMock.setRubricsBank(data.rubrics && rubricsBank);

        assert.expect(8 + data.steps.length);

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
                                if (itemRef !== 'item-3') {
                                    runner.trigger('setcontenttabtype', data.mode);
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

                assert.equal(plugin.getConfig().contentNavigatorType, data.mode, `The navigation mode is set to ${data.mode}`);

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(data.steps.length, () => queue = queue.then(processNavigationStep));

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
        assert.expect(1);

        const testData = _.cloneDeep(backendMock.getTestData());
        testData.config.review.reviewLayout = 'default';
        backendMock.setTestData(testData);

        visualPlayground('#visual-playground', backendMock)
            .then(() => {
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
