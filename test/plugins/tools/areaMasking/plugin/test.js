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
 * Copyright (c) 2016-2021 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/areaMasking/areaMasking'
], function ($, runnerFactory, providerMock, areaMaskingFactory) {
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
                                categories: ['x-tao-option-areaMasking']
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

    QUnit.module('API');

    QUnit.test('module', assert => {
        const runner = runnerFactory(providerName);

        assert.expect(3);

        assert.equal(typeof areaMaskingFactory, 'function', 'The module exposes a function');
        assert.equal(typeof areaMaskingFactory(runner), 'object', 'The factory creates an object');
        assert.notStrictEqual(
            areaMaskingFactory(runner),
            areaMaskingFactory(runner),
            'The factory creates a new object'
        );
    });

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
        .test('plugin ', (data, assert) => {
            const runner = runnerFactory(providerName);
            const areaMasking = areaMaskingFactory(runner);
            assert.expect(1);

            assert.equal(typeof areaMasking[data.title], 'function', `The plugin exposes a ${data.title} method`);
        });

    QUnit.module('plugin lifecycle');

    QUnit.test('render/destroy button', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const plugin = areaMaskingFactory(runner, areaBroker);

                assert.expect(3);

                return plugin
                    .init()
                    .then(() => {
                        const $container = runner.getAreaBroker().getToolboxArea();

                        areaBroker.getToolbox().render($container);

                        const $buttonBefore = $container.find('[data-control="area-masking"]');

                        assert.equal($buttonBefore.length, 1, 'The button has been inserted');
                        assert.equal($buttonBefore.hasClass('disabled'), true, 'The button has been rendered disabled');

                        areaBroker.getToolbox().destroy();

                        const $buttonAfter = $container.find('[data-control="area-masking"]');

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

    QUnit.module('mask');

    QUnit.test('create', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const $container = $('#qunit-fixture');
                const areaBroker = runner.getAreaBroker();
                const areaMasking = areaMaskingFactory(runner, areaBroker);

                assert.expect(9);

                return areaMasking
                    .init()
                    .then(() => {
                        assert.ok(!areaMasking.getState('enabled'), 'The areaMasking starts disabled');

                        areaMasking.enable();

                        areaBroker.getToolbox().render($container);
                        runner.trigger('renderitem');

                        return areaMasking.render();
                    })
                    .then(() => new Promise(resolve => {
                        const $button = $container.find('[data-control="area-masking"]');

                        assert.ok(areaMasking.getState('enabled'), 'The areaMasking is not disabled anymore');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok(!$button.hasClass('disabled'), 'The button is not disabled anymore');

                        assert.equal($('.mask', $container).length, 0, 'No mask exists yet');
                        assert.equal(areaMasking.masks.length, 0, 'No mask is bound');

                        runner.on('plugin-maskadd.area-masking', () => {
                            assert.equal($('.mask', $container).length, 1, 'A mask has been created');
                            assert.equal(areaMasking.masks.length, 1, 'The mask is bound');
                            assert.ok($button.hasClass('active'), 'The mask button is active');

                            resolve();
                        });

                        $button.trigger('click');
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

    QUnit.test('remove', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const $container = $('#qunit-fixture');
                const areaBroker = runner.getAreaBroker();
                const areaMasking = areaMaskingFactory(runner, areaBroker);

                assert.expect(12);

                return areaMasking
                    .init()
                    .then(() => {
                        assert.ok(!areaMasking.getState('enabled'), 'The areaMasking starts disabled');

                        areaMasking.enable();

                        areaBroker.getToolbox().render($container);
                        runner.trigger('renderitem');

                        return areaMasking.render();
                    })
                    .then(() => new Promise(resolve => {
                        const $button = $container.find('[data-control="area-masking"]');

                        assert.ok(areaMasking.getState('enabled'), 'The areaMasking is not disbaled anymore');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok(!$button.hasClass('disabled'), 'The button is not disabled anymore');

                        assert.equal($('.mask', $container).length, 0, 'No mask exists yet');
                        assert.equal(areaMasking.masks.length, 0, 'No mask is bound');

                        runner
                            .on('plugin-maskadd.area-masking', () => {
                                assert.equal($('.mask', $container).length, 1, 'A mask has been created');
                                assert.equal(areaMasking.masks.length, 1, 'The mask is bound');
                                assert.ok($button.hasClass('active'), 'The mask button is active');

                                $('.mask .close', $container).click();
                            })
                            .on('plugin-maskclose.area-masking', () => setTimeout(() => {
                                assert.equal($('.mask', $container).length, 0, 'A mask has been removed');
                                assert.equal(areaMasking.masks.length, 0, 'The mask is unbound');
                                assert.ok(!$button.hasClass('active'), 'The mask button is not active anymore');

                                resolve();
                            }, 100));

                        $button.trigger('click');
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

    QUnit.test('multiple', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const $container = $('#qunit-fixture');
                const areaBroker = runner.getAreaBroker();
                const areaMasking = areaMaskingFactory(runner, areaBroker);

                assert.expect(17);

                return areaMasking
                    .init()
                    .then(() => {
                        assert.ok(!areaMasking.getState('enabled'), 'The areaMasking starts disabled');

                        areaMasking.enable();

                        areaBroker.getToolbox().render($container);
                        runner.trigger('renderitem');

                        return areaMasking.render();
                    })
                    .then(() => {
                        const $button = $container.find('[data-control="area-masking"]');

                        assert.ok(areaMasking.getState('enabled'), 'The areaMasking is not disbaled anymore');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok(!$button.hasClass('disabled'), 'The button is not disabled anymore');

                        assert.equal($('.mask', $container).length, 0, 'No mask exists yet');
                        assert.equal(areaMasking.masks.length, 0, 'No mask is bound');
                        assert.ok(!$button.hasClass('active'), 'The mask button is not active yet');

                        $button.trigger('click');
                        $button.trigger('click');
                        $button.trigger('click');
                    })
                    .then(() => new Promise(resolve => setTimeout(() => {
                        const $button = $container.find('[data-control="area-masking"]');

                        assert.equal($('.mask', $container).length, 3, '3 masks have been created');
                        assert.equal(areaMasking.masks.length, 3, '3 masks are bound');
                        assert.ok(areaMasking.getState('enabled'), 'The areaMasking is enabled');
                        assert.ok($button.hasClass('active'), 'The mask button is active');

                        $button.trigger('click');
                        $button.trigger('click');

                        resolve();
                    }, 10)))
                    .then(() => new Promise(resolve => setTimeout(() => {
                        const $button = $container.find('[data-control="area-masking"]');
                        assert.equal($('.mask', $container).length, 5, '5 masks have been created');
                        assert.equal(areaMasking.masks.length, 5, '5 masks are bound');
                        assert.ok($button.hasClass('active'), 'The mask button is active');

                        $button.trigger('click');

                        resolve();
                    }, 10)))
                    .then(() => new Promise(resolve => setTimeout(() => {
                        const $button = $container.find('[data-control="area-masking"]');
                        assert.equal($('.mask', $container).length, 5, 'There is still 5 masks');
                        assert.equal(areaMasking.masks.length, 5, 'There is still 5 masks');
                        assert.ok($button.hasClass('active'), 'The mask button is still active');

                        resolve();
                    }, 10)));
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
