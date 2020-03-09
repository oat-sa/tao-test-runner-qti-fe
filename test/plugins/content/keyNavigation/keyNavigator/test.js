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
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/keyNavigator',
    'taoQtiTest/test/runner/mocks/providerMock',
    'tpl!taoQtiTest/test/runner/plugins/content/keyNavigation/assets/layout',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/config-nokb.json',
    'taoQtiTest/test/runner/plugins/content/keyNavigation/mock/backend',
    'jquery.simulate'
], function (
    $,
    _,
    runnerFactory,
    runnerComponent,
    keyNavigatorFactory,
    providerMock,
    layoutTpl,
    configData
) {
    'use strict';

    // KeyCode constants
    const key = $.simulate.keyCode;

    // Wait delay between each cycle step (test the keyboard behavior)
    const cycleDelay = 25;

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    QUnit.module('keyNavigatorFactory');

    QUnit.test('module', assert => {
        assert.equal(typeof keyNavigatorFactory, 'function', 'The keyNavigatorFactory module exposes a function');
        assert.equal(typeof keyNavigatorFactory(), 'object', 'The keyNavigator factory produces an instance');
        assert.notStrictEqual(
            keyNavigatorFactory(),
            keyNavigatorFactory(),
            'The keyNavigator factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'setMode'},
        {title: 'destroy'}
    ]).test('keyNavigator API ', (data, assert) => {
        const keyNavigator = keyNavigatorFactory();
        assert.equal(
            typeof keyNavigator[data.title],
            'function',
            `The keyNavigatorFactory instance exposes a "${data.title}" function`
        );
    });

    QUnit.module('Behavior');

    QUnit.test('Switch the navigation mode', assert => {
        assert.expect(3);

        const config = {
            contentNavigatorType: 'default'
        };
        const keyNavigator = keyNavigatorFactory(config);

        assert.equal(config.contentNavigatorType, 'default', 'The default mode is set');

        keyNavigator.setMode('native');
        assert.equal(config.contentNavigatorType, 'native', 'The native mode is set');

        keyNavigator.setMode('linear');
        assert.equal(config.contentNavigatorType, 'linear', 'The linear mode is set');
    });

    QUnit.test('Default navigation mode', assert => {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = {
            contentNavigatorType: 'default'
        };
        const keyNavigator = keyNavigatorFactory(config);
        const cycle = [{
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
            label: 'Item interaction 1',
            selector: '.qti-interaction input[value="choice_1"]',
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

        assert.expect(7 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), _.cloneDeep(configData))
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
                keyNavigator.init(runner);
                return runner;
            })
            .then(runner => new Promise(resolve => {
                assert.equal(config.contentNavigatorType, 'default', 'The navigation mode is set to default');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => () => {
                keyNavigator.destroy();
                runner.destroy();
            })
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
        const config = {
            contentNavigatorType: 'linear'
        };
        const keyNavigator = keyNavigatorFactory(config);
        const cycle = [{
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
            label: 'Item interaction 1',
            selector: '.qti-interaction [data-identifier="choice_1"]',
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

        assert.expect(7 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), _.cloneDeep(configData))
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
                keyNavigator.init(runner);
                return runner;
            })
            .then(runner => new Promise(resolve => {
                assert.equal(config.contentNavigatorType, 'linear', 'The navigation mode is set to linear');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => () => {
                keyNavigator.destroy();
                runner.destroy();
            })
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
        const config = {
            contentNavigatorType: 'native'
        };
        const keyNavigator = keyNavigatorFactory(config);
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

        assert.expect(7 + cycle.length);

        assert.equal($container.children().length, 0, 'The container is empty');

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $container.html(layoutTpl());
                assert.equal($container.children().length, 1, 'The layout is rendered');
                assert.equal($container.find('.runner').children().length, 0, 'The test runner is not rendered yet');

                runnerComponent($container.find('.runner'), _.cloneDeep(configData))
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
                keyNavigator.init(runner);
                return runner;
            })
            .then(runner => new Promise(resolve => {
                assert.equal(config.contentNavigatorType, 'native', 'The navigation mode is set to native');

                let queue = Promise.resolve(0);
                document.activeElement.blur();
                _.times(cycle.length, () => queue = queue.then(processCycle));

                queue.then(() => resolve(runner));
            }))
            .then(runner => () => {
                keyNavigator.destroy();
                runner.destroy();
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(() => assert.ok(true, 'done!'))
            .then(ready);
    });
});
