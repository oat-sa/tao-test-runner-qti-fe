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
/**
 * @author Anastasia Razumovskaya <nastya.razum96@gmail.com>
 */
define([
    'jquery',
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/content/accessibility/mainLandmark/header'
], function ($, _, runnerFactory, providerMock, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier: 'item-1',
        itemPosition: 0,
        isDeepestSectionVisible: true,
    };

    const item = {
        label: 'item-title',
        viewed: true,
        flagged: false,
        answered: true
    };
    const sampleTestMap = {
        parts: {
            p1: {
                label: 'part-title',
                sections: {
                    s1: {
                        label: 'section-title',
                        items: {
                            'item-1': item
                        }
                    }
                }
            }
        }
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
        {name: 'init', title: 'init'},
        {name: 'render', title: 'render'}
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
        const $container = areaBroker.getArea('mainLandmark');
        const plugin = pluginFactory(runner, areaBroker);

        plugin
            .init()
            .then(() => {
                plugin.render();

                assert.equal(
                    $container.find(`span[data-control="qti-test-item-title"]`).length,
                    1,
                    'Add the question title to the container'
                );
                assert.equal(
                    $container.find(`span[data-control="qti-test-item-state"]`).length,
                    1,
                    'Add the question state to the container'
                );

                ready();
            });
    });

    QUnit.test('test runner events: renderitem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getArea('mainLandmark');
        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(2);

        runner.getTestContext = () => sampleTestContext;
        runner.getTestMap = () => sampleTestMap;
        runner.getCurrentItem = () => item;

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => {
                assert.equal(
                    $container.find('[data-control="qti-test-item-title"]').text(),
                    'item-title',
                    'Add item title'
                );

                assert.equal(
                    $container.find('[data-control="qti-test-item-state"]').text(),
                    'Answered',
                    'Add item state'
                );

                ready();
            });
    });

    QUnit.test('test runner events: tool-flagitem', (assert) => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const areaBroker = runner.getAreaBroker();
        const $container = areaBroker.getArea('mainLandmark');

        const plugin = pluginFactory(runner, areaBroker);

        assert.expect(1);

        runner.getTestContext = () => sampleTestContext;
        runner.getTestMap = () => sampleTestMap;
        runner.getCurrentItem = () => item;

        plugin
            .init()
            .then(() => {
                plugin.render();

                return runner.trigger('renderitem');
            })
            .then(() => runner.trigger('tool-flagitem'))
            .then(() => {
                assert.equal(
                    $container.find('[data-control="qti-test-item-state"]').text(),
                    'Flagged',
                    'Change item state'
                );

                ready();
            });
    });
});
