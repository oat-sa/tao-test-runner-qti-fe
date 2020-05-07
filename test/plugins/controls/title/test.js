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
 * @author Anton Tsymuk <anton@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/controls/title/title'
], function ($, _, runnerFactory, providerMock, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const titles = {
        test: {
            attribute: 'qti-test-title',
            className: '',
        },
        testPart: {
            attribute: 'qti-test-part-title',
            className: 'visible-hidden',
        },
        section: {
            attribute: 'qti-test-position',
            className: '',
        },
        item: {
            attribute: 'qti-test-item-title',
            className: 'visible-hidden',
        },
    };

    const sampleTestContext = {
        itemIdentifier: 'item-1',
        itemPosition: 0,
        isDeepestSectionVisible: true,
    };
    const sampleTestMap = {
        parts: {
            p1: {
                label: 'part-title',
                sections: {
                    s1: {
                        label: 'section-title',
                        items: {
                            'item-1': {
                                label: 'item-title'
                            }
                        },
                        stats: {
                            questions: 1,
                            answered: 0,
                        },
                    }
                },
                stats: {
                    questions: 1,
                    answered: 0,
                },
            }
        },
        jumps: [{
            identifier: 'item-1',
            section: 's1',
            part: 'p1',
            position: 0
        }],
        title: 'test-title',
        stats: {
            questions: 1,
            answered: 0,
        },
    };

    /**
     * The following tests applies to all plugins
     */
    QUnit.module('pluginFactory');

    QUnit.test('module', (assert) => {
        const runner = runnerFactory(providerName);

        assert.equal(typeof pluginFactory, 'function', 'The pluginFactory module exposes a function');
        assert.equal(typeof pluginFactory(runner), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            pluginFactory(runner),
            pluginFactory(runner),
            'The plugin factory provides a different instance on each call'
        );
    });

    const pluginApi = [
        { name: 'init', title: 'init' },
        { name: 'render', title: 'render' },
        { name: 'finish', title: 'finish' },
        { name: 'destroy', title: 'destroy' },
        { name: 'trigger', title: 'trigger' },
        { name: 'getTestRunner', title: 'getTestRunner' },
        { name: 'getAreaBroker', title: 'getAreaBroker' },
        { name: 'getConfig', title: 'getConfig' },
        { name: 'setConfig', title: 'setConfig' },
        { name: 'getState', title: 'getState' },
        { name: 'setState', title: 'setState' },
        { name: 'show', title: 'show' },
        { name: 'hide', title: 'hide' },
        { name: 'enable', title: 'enable' },
        { name: 'disable', title: 'disable' }
    ];

    QUnit.cases.init(pluginApi).test('plugin API ', (data, assert) => {
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);

        assert.equal(
            typeof plugin[data.name],
            'function',
            `The pluginFactory instances expose a "${data.name}" function`
        );
    });

    QUnit.test('pluginFactory.init', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);

        plugin
            .init()
            .then(() => {
                assert.equal(plugin.getState('init'), true, 'The plugin is initialised');
            })
            .catch((err) => {
                assert.ok(false, `The init failed: ${err}`);
            })
            .then(ready);
    });

    QUnit.test('pluginFactory.render', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getControlArea();
        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(9);

        plugin
            .init()
            .then(() => {
                plugin.render();

                _.forEach(_.values(titles), ({ attribute, className }) => {
                    $container.find();

                    assert.equal(
                        $container.find(`${className ? `.${className}` : ''}[data-control="${attribute}"]`).length,
                        1,
                        'Add the title with the given css class to the container'
                    );
                    assert.equal(
                        $container.find(`.visible-hidden[data-control="${attribute}-timer"]`).length,
                        1,
                        'Add the visible hidden title timer to the container'
                    );
                });

                assert.equal(
                    $container.find('.qti-controls').css('display'),
                    'none',
                    'Hide the titles by default'
                );

                ready();
            });
    });

    QUnit.test('test runner events: renderitem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getControlArea();
        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(4);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        runner.getCurrentItem = () => ({});
        runner.getCurrentPart = () => ({ label: 'part-title' });

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => {
                assert.equal(
                    $container.find('[data-control="qti-test-title"]').text(),
                    'test-title',
                    'Add test title'
                );

                assert.equal(
                    $container.find('[data-control="qti-test-part-title"]').text(),
                    ' - part-title',
                    'Add part title'
                );

                assert.equal(
                    $container.find('[data-control="qti-test-position"]').text(),
                    ' - section-title',
                    'Add section title'
                );

                assert.equal(
                    $container.find('[data-control="qti-test-item-title"]').text(),
                    ' - item-title',
                    'Add item title'
                );

                ready();
            });
    });

    QUnit.test('test runner events: unloaditem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getControlArea();
        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        runner.getCurrentItem = () => ({});
        runner.getCurrentPart = () => ({ label: 'part-title' });

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => runner.trigger('unloaditem'))
            .then(() => {
                assert.equal(
                    $container.find('.qti-controls').css('display'),
                    'none',
                    'Hide the titles after unloaditem'
                );

                ready();
            });
    });

    QUnit.test('test runner events: timertick', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getControlArea();
        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(5);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        runner.getCurrentItem = () => ({});
        runner.getCurrentPart = () => ({ label: 'part-title' });

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => {
                runner.trigger('timertick', 60000, 'test');
                assert.equal(
                    $container.find('[data-control="qti-test-title-timer"]').text(),
                    '1m to answer remaining 1 questions.',
                    'Update test timer'
                );

                runner.trigger('timertick', 60000, 'testPart');
                assert.equal(
                    $container.find('[data-control="qti-test-part-title-timer"]').text(),
                    '1m to answer remaining 1 questions.',
                    'Update part timer'
                );

                runner.trigger('timertick', 60000, 'section');
                assert.equal(
                    $container.find('[data-control="qti-test-position-timer"]').text(),
                    '1m to answer remaining 1 questions.',
                    'Update section timer'
                );

                runner.trigger('timertick', 60000, 'item');
                assert.equal(
                    $container.find('[data-control="qti-test-item-title-timer"]').text(),
                    '1m to answer the current question.',
                    'Update item timer'
                );

                const headingBeforeTimertick = $container.find('.title-box').text();
                runner.trigger('timertick', 60000, 'wrongscope');
                assert.equal(
                    $container.find('.title-box').text(),
                    headingBeforeTimertick,
                    'Heading is not update if scope unknown'
                );

                ready();
            });
    });

    QUnit.test('test runner events: timertick', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getControlArea();
        const plugin = pluginFactory(runner, areaBroker);
        const $playground = $('#title-playground-container');
        $playground.append($container);

        assert.expect(1);

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        runner.getCurrentItem = () => ({});
        runner.getCurrentPart = () => ({ label: 'part-title' });

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => {
                runner.trigger('timertick', 60000, 'test');
                runner.trigger('timertick', 60000, 'testPart');
                runner.trigger('timertick', 60000, 'section');
                runner.trigger('timertick', 60000, 'item');

                assert.ok('Playground ready');

                ready();
            });
    });
});
