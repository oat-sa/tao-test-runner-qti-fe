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
    'core/eventifier',
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers',
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategiesManager'
], function (
    $,
    eventifier,
    helpers,
    strategyFactory
) {
    'use strict';

    const fixtureCases = [
        {
            title: 'allowed',
            fixture: '#qunit-fixture .allowed',
            allowed: true
        },
        {
            title: 'not allowed',
            fixture: '#qunit-fixture .not-allowed',
            allowed: false
        }
    ];

    QUnit.module('helpers');

    QUnit.test('module', assert => {
        assert.expect(1);
        assert.equal(typeof helpers, 'object', 'The helpers module exposes an object');
    });

    QUnit.cases.init([
        {title: 'allowedToNavigateFrom'},
        {title: 'setupItemsNavigator'},
        {title: 'getStrategies'},
        {title: 'getNavigators'}
    ]).test('helper ', (data, assert) => {
        assert.expect(1);
        assert.equal(
            typeof helpers[data.title],
            'function',
            `The helpers exposes a "${data.title}" function`
        );
    });


    QUnit.cases.init(fixtureCases).test('allowedToNavigateFrom ', (data, assert) => {
        const $fixtures = $('.testable', data.fixture);

        assert.expect($fixtures.length * 4);

        $fixtures.each((i, el) => {
            const mockElement = {
                getElement() {
                    return el;
                }
            };
            const mockGroup = {
                getCursor() {
                    return {
                        navigable: mockElement
                    };
                }
            };
            assert.equal(helpers.allowedToNavigateFrom(el), data.allowed, 'The expected result is returned when applying the helper on the HTML element');
            assert.equal(helpers.allowedToNavigateFrom($(el)), data.allowed, 'The expected result is returned when applying the helper on the jQuery selection');
            assert.equal(helpers.allowedToNavigateFrom(mockElement), data.allowed, 'The expected result is returned when applying the helper on the navigable element');
            assert.equal(helpers.allowedToNavigateFrom(mockGroup), data.allowed, 'The expected result is returned when applying the helper on the navigable group');
        });
    });

    QUnit.cases.init(fixtureCases).test('setupItemsNavigator ', (data, assert) => {
        const ready = assert.async();
        const $fixtures = $('.testable', data.fixture);
        const config = {
            keyNextItem: 'right',
            keyPrevItem: 'left',
        };

        const getNavigationPromise = (event, action, el) => new Promise((resolve, reject) => {
            let resolved = false;
            const navigator = eventifier({
                [action]() {
                    resolved = true;
                    resolve();
                }
            });
            helpers.setupItemsNavigator(navigator, config);
            setTimeout(() => navigator.trigger(event, el), 1);
            setTimeout(() => {
                if (!resolved) {
                    reject();
                }
            }, 50);
        });
        const cases = [];

        assert.expect($fixtures.length * 2);

        $fixtures.each((i, el) => {
            cases.push(
                getNavigationPromise(config.keyNextItem, 'next', el)
                    .then(() => assert.ok(data.allowed, 'The "next()" method has been called'))
                    .catch(() => assert.ok(!data.allowed, 'The "next()" method has not been called'))
            );
            cases.push(
                getNavigationPromise(config.keyPrevItem, 'previous', el)
                    .then(() => assert.ok(data.allowed, 'The "previous()" method has been called'))
                    .catch(() => assert.ok(!data.allowed, 'The "previous()" method has not been called'))
            );
        });

        Promise
            .all(cases)
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.cases.init(fixtureCases).test('setupClickableNavigator ', (data, assert) => {
        const ready = assert.async();
        const $fixtures = $('.testable', data.fixture);
        const cases = [];

        assert.expect($fixtures.length * 2);

        $fixtures.each((i, el) => {
            const $el = $(el);
            const navigator = eventifier({});
            const cursor = {
                navigable: {
                    getElement() {
                        return $el;
                    }
                }
            };

            cases.push(new Promise(resolve => {
                $el.off('click').on('click', () => {
                    assert.ok('ok', 'The element has been clicked');
                    resolve();
                });
            }));
            cases.push(new Promise(resolve => {
                if ($el.is(':checkbox')) {
                    assert.ok('ok', 'No mouse down event expected');
                    resolve();
                } else {
                    $el.off('mousedown').on('mousedown', () => {
                        assert.ok('ok', 'The element has received a mouse down event');
                        resolve();
                    });
                }
            }));

            helpers.setupClickableNavigator(navigator);
            setTimeout(() => navigator.trigger('activate', cursor), 1);
        });

        Promise
            .all(cases)
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });

    QUnit.test('getStrategies', assert => {
        const testRunnerMock = {
            init() {}
        };
        const navigationMode = {
            strategies: ['strategy1', 'strategy2'],
            config: {
                keyNextGroup: 'tab'
            }
        };
        const strategy1 = {
            name: 'strategy1',
            init(testRunner, config) {
                assert.ok(true, 'strategy1 created');
                assert.equal(testRunner, testRunnerMock, 'The test runner instance has been supplied');
                assert.equal(config, navigationMode.config, 'The config has been supplied');
                return {
                    init() {
                        assert.ok(true, 'strategy1 initialized');
                        return strategy1;
                    }
                };
            }
        };
        const strategy2 = {
            name: 'strategy2',
            init(testRunner, config) {
                assert.ok(true, 'strategy2 created');
                assert.equal(testRunner, testRunnerMock, 'The test runner instance has been supplied');
                assert.equal(config, navigationMode.config, 'The config has been supplied');
                return {
                    init() {
                        assert.ok(true, 'strategy2 initialized');
                        return strategy2;
                    }
                };
            }
        };

        assert.expect(9);

        strategyFactory.registerProvider('strategy1', strategy1);
        strategyFactory.registerProvider('strategy2', strategy2);
        const strategies = helpers.getStrategies(navigationMode, testRunnerMock);
        assert.deepEqual(strategies, [strategy1, strategy2], 'The strategies have been built');
    });

    QUnit.cases.init([
        {
            title: 'already flat list',
            strategies: [
                {
                    getNavigators() {
                        return 1;
                    }
                },
                {
                    getNavigators() {
                        return 2;
                    }
                },
                {
                    getNavigators() {
                        return 3;
                    }
                }
            ],
            expected: [1, 2, 3]
        },
        {
            title: 'nested list',
            strategies: [
                {
                    getNavigators() {
                        return [1, 2, 3];
                    }
                },
                {
                    getNavigators() {
                        return [4, 5, 6];
                    }
                },
                {
                    getNavigators() {
                        return [7, 8, 9];
                    }
                }
            ],
            expected: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        }
    ]).test('getNavigators ', (data, assert) => {
        assert.expect(1);
        assert.deepEqual(helpers.getNavigators(data.strategies), data.expected, 'The navigators are flattened');
    });

});
