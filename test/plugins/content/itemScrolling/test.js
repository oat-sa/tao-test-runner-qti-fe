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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test the test runner plugin rubricBlock
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/mocks/areaBrokerMock',
    'taoQtiTest/runner/plugins/content/itemScrolling/itemScrolling'
], function($, runnerFactory, providerMock, areaBrokerMock, pluginFactory) {
    'use strict';

    var pluginApi;
    var providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    /**
     * The following tests applies to all plugins
     */
    QUnit.module('pluginFactory');

    QUnit.test('module', function(assert) {
        var runner = runnerFactory(providerName);

        assert.equal(typeof pluginFactory, 'function', 'The pluginFactory module exposes a function');
        assert.equal(typeof pluginFactory(runner), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            pluginFactory(runner),
            pluginFactory(runner),
            'The plugin factory provides a different instance on each call'
        );
    });

    pluginApi = [
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

    QUnit.module('itemScrolling');

    QUnit.test('itemScrolling init', function(assert) {
        var ready = assert.async();
        var runner = runnerFactory(providerName);
        var plugin = pluginFactory(runner, runner.getAreaBroker());
        var height = 0;

        runner.on('resize.adaptItemHeight', function() {
            const $contentArea = runner
                .getAreaBroker()
                .getContentArea();
            const $itemContainer = $contentArea.find('.text-block-wrap[data-scrolling]');
            console.log('ItemContainer: ', $itemContainer);
            $itemContainer.each(function() {
                const $item = $(this);
                console.log('CSS: ', $item);
            });
        });

        plugin
            .init()
            .then(function() {
                runner.trigger('renderitem');
                runner.trigger('resize.adaptItemHeight');
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });
});
