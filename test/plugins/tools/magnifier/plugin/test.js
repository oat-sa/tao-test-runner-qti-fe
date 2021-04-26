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

define([
    'jquery',
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/magnifier/magnifier'
], function ($, _, runnerFactory, providerMock, magnifierFactory) {
    'use strict';

    const uiDelay = 50;

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
                                categories: ['x-tao-option-magnifier']
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
     * @returns {Promise<runner>}
     */
    function getTestRunner() {
        const runner = runnerFactory(providerName);
        runner.getDataHolder();
        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);
        return Promise.resolve(runner);
    }

    QUnit.module('API');

    QUnit.test('module', assert => {
        const runner = runnerFactory(providerName);

        assert.expect(3);

        assert.equal(typeof magnifierFactory, 'function', 'The module exposes a function');
        assert.equal(typeof magnifierFactory(runner), 'object', 'The factory creates an object');
        assert.notStrictEqual(magnifierFactory(runner), magnifierFactory(runner), 'The factory creates a new object');
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
            const magnifier = magnifierFactory(runner);
            assert.expect(1);

            assert.equal(typeof magnifier[data.title], 'function', `The plugin exposes a ${data.title} method`);
        });

    QUnit.module('plugin lifecycle');

    QUnit.test('init', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = runner.getAreaBroker().getToolboxArea();

                assert.expect(4);

                return magnifier
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        const $button = $container.find('[data-control="magnify"]');

                        assert.equal($button.length, 1, 'The magnifier has created a button');
                        assert.ok(magnifier.getState('init'), 'The magnifier is initialised');
                        assert.ok(!magnifier.getState('enabled'), 'The magnifier starts disabled');
                        assert.ok($button.hasClass('disabled'), 'The button starts disabled');
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

    QUnit.test('render', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = runner.getAreaBroker().getToolboxArea();

                assert.expect(4);

                return magnifier
                    .init()
                    .then(() => {
                        assert.ok(magnifier.getState('init'), 'The magnifier is initialised');

                        areaBroker.getToolbox().render($container);

                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(!magnifier.getState('enabled'), 'The magnifier starts disabled');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok($button.hasClass('disabled'), 'The plugin button starts disabled');
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

    QUnit.test('state', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = runner.getAreaBroker().getToolboxArea();

                assert.expect(11);

                return magnifier
                    .init()
                    .then(() => {
                        assert.ok(magnifier.getState('init'), 'The magnifier is initialised');

                        areaBroker.getToolbox().render($container);

                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(!magnifier.getState('enabled'), 'The magnifier starts disabled');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok($button.hasClass('disabled'), 'The plugin button starts disabled');

                        return magnifier.enable();
                    })
                    .then(() => {
                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(magnifier.getState('enabled'), 'The magnifier is now enabled');
                        assert.ok(!$button.hasClass('disabled'), 'The plugin button is enabled');

                        assert.ok(!$button.hasClass('hidden'), 'The plugin button is visible');

                        return magnifier.hide();
                    })
                    .then(() => {
                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok($button.hasClass('hidden'), 'The plugin button is hidden');

                        return magnifier.show();
                    })
                    .then(() => {
                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(!$button.hasClass('hidden'), 'The plugin button is visible');

                        return magnifier.disable();
                    })
                    .then(() => {
                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(!magnifier.getState('enabled'), 'The magnifier is now disabled');
                        assert.ok($button.hasClass('disabled'), 'The plugin button is disabled');
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

    QUnit.test('destroy', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = runner.getAreaBroker().getToolboxArea();

                assert.expect(3);

                return magnifier
                    .init()
                    .then(() => {
                        areaBroker.getToolbox().render($container);

                        const $button = $container.find('[data-control="magnify"]');

                        assert.ok(magnifier.getState('init'), 'The magnifier is initialised');

                        assert.equal($button.length, 1, 'The plugin button has been appended');

                        return magnifier.destroy();
                    })
                    .then(() => {
                        areaBroker.getToolbox().destroy();

                        const $button = $container.find('[data-control="magnify"]');

                        assert.equal($button.length, 0, 'The plugin button has been removed');
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

    QUnit.module('magnifier');

    QUnit.test('create', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => new Promise(resolve => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = $('#qunit-fixture');
                let $button;

                assert.expect(12);

                runner.setTestContext(sampleTestContext);
                runner.setTestMap(sampleTestMap);

                runner.on('plugin-magnifier-create.magnifier', () => {
                    assert.equal($('.magnifier', $container).length, 1, 'A magnifier has been created');
                    assert.ok($('.magnifier', $container).hasClass('hidden'), 'The magnifier is hidden');
                });

                runner.on('plugin-magnifier-show.magnifier', () => {
                    _.defer(() => {
                        assert.ok(!$('.magnifier', $container).hasClass('hidden'), 'The magnifier is visible');
                        assert.ok($button.hasClass('active'), 'The button is turned on');

                        _.delay(() => {
                            $button.trigger('click');
                        }, uiDelay);
                    });
                });

                runner.on('plugin-magnifier-hide.magnifier', () => {
                    _.defer(() => {
                        assert.ok($('.magnifier', $container).hasClass('hidden'), 'The magnifier is hidden');
                        assert.ok(!$button.hasClass('active'), 'The button is turned off');

                        runner.off('.magnifier');
                        resolve();
                    });
                });

                magnifier
                    .init()
                    .then(() => {
                        assert.ok(!magnifier.getState('enabled'), 'The magnifier starts disabled');

                        areaBroker.getToolbox().render(areaBroker.getToolboxArea());
                        $button = $('[data-control="magnify"]', areaBroker.getToolboxArea());

                        return magnifier.enable();
                    })
                    .then(() => {
                        assert.ok(magnifier.getState('enabled'), 'The magnifier is not disabled anymore');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok(!$button.hasClass('disabled'), 'The button is not disabled anymore');
                        assert.ok(!$button.hasClass('active'), 'The button is not turned on');

                        assert.equal($('.magnifier', $container).length, 0, 'No magnifier exists yet');

                        $button.trigger('click');
                    });
            }))
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('zoom', assert => {
        const ready = assert.async();
        getTestRunner()
            .then(runner => new Promise(resolve => {
                const areaBroker = runner.getAreaBroker();
                const magnifier = magnifierFactory(runner, areaBroker);
                const $container = $('#qunit-fixture');
                let $button;
                let expectedZoomLevel = 2;

                assert.expect(8);

                runner.setTestContext(sampleTestContext);
                runner.setTestMap(sampleTestMap);

                runner.on('plugin-magnifier-create.magnifier', () => {
                    assert.equal($('.magnifier', $container).length, 1, 'A magnifier has been created');

                    _.delay(() => {
                        expectedZoomLevel = 2.5;

                        runner.trigger('tool-magnifier-in');

                        _.delay(() => {
                            expectedZoomLevel = 2;
                            runner.trigger('tool-magnifier-out');

                            _.delay(() => {
                                resolve();
                            }, uiDelay);
                        }, uiDelay);
                    }, uiDelay);
                });

                runner.on('plugin-magnifier-zoom.magnifier', (plugin, zoomLevel) => {
                    assert.equal(zoomLevel, expectedZoomLevel, 'The magnifier is set the right zoom level');
                });

                magnifier
                    .init()
                    .then(() => {
                        assert.ok(!magnifier.getState('enabled'), 'The magnifier starts disabled');

                        areaBroker.getToolbox().render(areaBroker.getToolboxArea());
                        $button = $('[data-control="magnify"]', areaBroker.getToolboxArea());

                        return magnifier.enable();
                    })
                    .then(() => {
                        assert.ok(magnifier.getState('enabled'), 'The magnifier is not disabled anymore');
                        assert.equal($button.length, 1, 'The plugin button has been appended');
                        assert.ok(!$button.hasClass('disabled'), 'The button is not disabled anymore');

                        assert.equal($('.magnifier', $container).length, 0, 'No magnifier exists yet');

                        $button.trigger('click');
                    });
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
