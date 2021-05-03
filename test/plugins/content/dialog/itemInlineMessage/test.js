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
 * Copyright (c) 2016-2021  (original work) Open Assessment Technologies SA;
 *
 * @author Alexander Zagovorichev <zagovorichev@1pt.com>
 */

define([
    'jquery',
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/content/dialog/itemInlineMessage',
    'taoQtiItem/runner/qtiItemRunner',
    'json!taoQtiItem/test/samples/json/inlineModalFeedback.json'
], function ($, _, testRunnerFactory, providerMock, inlineMessage, itemRunnerFactory, itemData) {
    'use strict';

    const containerId = 'item-container';
    const providerName = 'mock';
    testRunnerFactory.registerProvider(providerName, providerMock());

    const testMap = {
        identifier: 'Test',
        parts: {
            'Part1': {
                id: 'Part1',
                position: 0,
                sections: {
                    'Section1': {
                        id: 'Section1',
                        position: 0,
                        items: {
                            'FirstItem': {
                                id: 'FirstItem',
                                position: 0
                            },
                            'LastItem': {
                                id: 'LastItem',
                                position: 1
                            }
                        }
                    }
                }
            }
        },
        jumps: [{
            identifier: 'FirstItem',
            section: 'Section1',
            part: 'Part1',
            position: 0
        }, {
            identifier: 'LastItem',
            section: 'Section1',
            part: 'Part1',
            position: 1
        }]
    };

    const testContext = {
        enableAllowSkipping: false,
        itemIdentifier: 'FirstItem',
        itemPosition: 0
    };

    /**
     * Gets a configured instance of the Item Runner
     * @returns {Promise<runner>}
     */
    function getItemRunner() {
        return new Promise(resolve => {
            const runner = itemRunnerFactory('qti', itemData)
                .on('init', () => resolve(runner))
                .init();
        });
    }

    /**
     * Gets a configured instance of the Test Runner
     * @param {Object} [config] - Optional config to setup the test runner
     * @returns {Promise<runner>}
     */
    function getTestRunner(config) {
        const runner = testRunnerFactory(providerName, [], config);
        runner.getDataHolder();
        runner.setTestContext(testContext);
        runner.setTestMap(testMap);
        return Promise.resolve(runner);
    }

    QUnit.module('Item init');

    QUnit.test('Item data loading', assert => {
        const ready = assert.async();
        getItemRunner()
            .then(itemRunner => {
                assert.expect(2);

                assert.ok(typeof itemRunner._item === 'object', 'The item data is loaded and mapped to an object');
                assert.ok(typeof itemRunner._item.bdy === 'object', 'The item contains a body object');

                itemRunner.clear();
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.module('Item render');

    QUnit.test('Item rendering', assert => {
        const ready = assert.async();

        assert.expect(3);

        const container = document.getElementById(containerId);

        assert.ok(container instanceof HTMLElement, 'the item container exists');
        assert.equal(container.children.length, 0, 'the container has no children');

        getItemRunner()
            .then(itemRunner => new Promise(resolve => {
                itemRunner.on('render', () => {
                    assert.equal(container.children.length, 1, 'the container has children');

                    itemRunner.clear();
                    resolve();
                })
                    .init()
                    .render(container);
            }))
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.module('API');

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
        const ready = assert.async();
        getItemRunner()
            .then(itemRunner => {
                const feedback = inlineMessage(itemRunner);
                assert.equal(
                    typeof feedback[data.title],
                    'function',
                    `The alertMessage instances expose a "${data.title}" function`
                );

                itemRunner.clear();
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.module('alertMessage');

    QUnit.test('init', assert => {
        const ready = assert.async();
        const container = document.getElementById(containerId);

        assert.ok(container instanceof HTMLElement, 'the item container exists');
        assert.equal(container.children.length, 0, 'the container has no children');

        Promise.all([
            getItemRunner(),
            getTestRunner()
        ])
            .then(([itemRunner, testRunner]) => new Promise((resolve, reject) => {
                itemRunner
                    .on('render', () => {
                        assert.equal(container.children.length, 1, 'the container has children');

                        const feedback = inlineMessage(testRunner, testRunner.getAreaBroker());

                        feedback
                            .init({ dom: '<div>text with message for user</div>' })
                            .then(() => {
                                assert.equal(feedback.getState('init'), true, 'The feedback is initialised');
                                assert.equal(
                                    feedback.$element.text(),
                                    'text with message for user',
                                    'The message was appended'
                                );
                                assert.equal(feedback.$button.length, 1, 'The button was created');

                                itemRunner.clear();
                                resolve();
                            })
                            .catch(reject);
                    })
                    .render(container);

                testRunner.itemRunner = { _item: itemRunner };
            }))
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('render', assert => {
        const ready = assert.async();
        const container = document.getElementById(containerId);

        assert.expect(10);

        assert.ok(container instanceof HTMLElement, 'the item container exists');
        assert.equal(container.children.length, 0, 'the container has no children');

        Promise.all([
            getItemRunner(),
            getTestRunner()
        ])
            .then(([itemRunner, testRunner]) => new Promise((resolve, reject) => {
                testRunner
                    .on('plugin-render.itemInlineMessage', feedback => {
                        assert.equal(feedback.getState('ready'), true, 'The feedback is rendered');
                        const $navContainer = testRunner.getAreaBroker().getNavigationArea();
                        assert.equal(
                            $navContainer.find(feedback.$button).length,
                            1,
                            'The inline message plugin has changed navigation button'
                        );
                        assert.equal($('li.action', $navContainer).length, 1, 'Navigation has 1 children');

                        assert.equal(feedback.$element.text(), 'text with message for user', 'The content was attached');
                        assert.equal(
                            $('#qUnitTestMessage', testRunner.itemRunner.container).length,
                            1,
                            'The message is created'
                        );

                        feedback.$button.click();
                    })
                    .on('plugin-resume.itemInlineMessage', () => {
                        assert.equal(
                            $('#qUnitTestMessage', testRunner.itemRunner.container).length,
                            0,
                            'The message is deleted'
                        );

                        itemRunner.clear();
                        resolve();
                    });

                itemRunner
                    .on('render', () => {
                        assert.equal(container.children.length, 1, 'the container has children');
                        assert.equal(
                            $('li.action', testRunner.getAreaBroker().getNavigationArea()).length,
                            0,
                            'Navigation has no children'
                        );

                        const feedback = inlineMessage(testRunner, testRunner.getAreaBroker());

                        feedback
                            .init({ dom: '<div id="qUnitTestMessage">text with message for user</div>' })
                            .then(() => feedback.render())
                            .catch(reject);
                    })
                    .render(container);

                testRunner.itemRunner = { _item: itemRunner };
            }))
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });
});
