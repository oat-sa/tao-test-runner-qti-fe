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
    'taoQtiItem/runner/qtiItemRunner',
    'json!taoQtiItem/test/samples/json/inlineModalFeedback.json',
    'taoQtiItem/qtiItem/core/Loader',
    'taoQtiItem/qtiCommonRenderer/renderers/Renderer',
    'taoQtiTest/runner/plugins/content/itemScrolling/itemScrolling',
], function ($, runnerFactory, providerMock, qtiItemRunner, itemData, QtiLoader, QtiRenderer, pluginFactory) {
    'use strict';

    let pluginApi;
    let runner;
    const containerId = 'item-container';
    const providerName = 'mock';
    let testRunner;

    runnerFactory.registerProvider(providerName, providerMock());

    QUnit.module('API', {
        beforeEach: function setup() {
            runner = qtiItemRunner('qti', itemData).init();
        },
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    pluginApi = [
        {name: 'init', title: 'init'},
        {name: 'render', title: 'render'},
        {name: 'finish', title: 'finish'},
        {name: 'destroy', title: 'destroy'},
        {name: 'trigger', title: 'trigger'},
        {name: 'getTestRunner', title: 'getTestRunner'},
        {name: 'getAreaBroker', title: 'getAreaBroker'},
        {name: 'getConfig', title: 'getConfig'},
        {name: 'setConfig', title: 'setConfig'},
        {name: 'getState', title: 'getState'},
        {name: 'setState', title: 'setState'},
        {name: 'show', title: 'show'},
        {name: 'hide', title: 'hide'},
        {name: 'enable', title: 'enable'},
        {name: 'disable', title: 'disable'}
    ];

    QUnit.cases.init(pluginApi).test('plugin API ', function (data, assert) {
        runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner);
        assert.equal(
            typeof plugin[data.name],
            'function',
            `The pluginFactory instances expose a "${data.name}" function`
        );
    });

    QUnit.module('itemScrolling init', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    QUnit.test('itemScrolling data loading', function (assert) {
        const ready = assert.async();
        assert.expect(2);

        runner = qtiItemRunner('qti', itemData)
            .on('init', function () {
                assert.ok(typeof this._item === 'object', 'The item data is loaded and mapped to an object');
                assert.ok(typeof this._item.bdy === 'object', 'The item contains a body object');

                ready();
            })
            .init();
    });

    QUnit.module('Item render', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    QUnit.test('Item rendering', function (assert) {
        const ready = assert.async();
        assert.expect(3);

        const container = document.getElementById(containerId);

        assert.ok(container instanceof HTMLElement, 'the item container exists');
        assert.equal(container.children.length, 0, 'the container has no children');

        runner = qtiItemRunner('qti', itemData)
            .on('render', function () {
                assert.equal(container.children.length, 1, 'the container has children');

                ready();
            })
            .init()
            .render(container);

    });

    QUnit.module('itemScrolling render', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    let item;

    QUnit.test('itemScrolling rendering', function (assert) {
        const ready = assert.async();
        let renderer;

        assert.ok(typeof 'string' === 'string', 'The renderer creates a string');

        renderer = new QtiRenderer({baseUrl: './'});
        new QtiLoader().loadItemData(itemData, function (_item) {
            const self = this;
            renderer.load(function () {
                let result, $result;
                let $textBlocks;

                item = _item;
                item.setRenderer(this);

                testRunner = runnerFactory(providerName);
                testRunner.itemRunner = {_item: item};

                result = item.render({});

                assert.ok(typeof result === 'string', 'The renderer creates a string');
                assert.ok(result.length > 0, 'The renderer create some output');

                $result = $(result);
                $textBlocks = $('.text-block-wrap', $result);

                assert.ok($result.hasClass('qti-item'), 'The result is a qti item');
                assert.equal($('.qti-itemBody', $result).length, 1, 'The result contains an item body');
                assert.equal($textBlocks.first().length, 1, 'The result contains an text block');
                assert.equal($textBlocks.first().attr('data-scrolling'), 'true', 'The text block has enabled scroll');

                $(`#${containerId}`).append($result);

                const plugin = pluginFactory(testRunner, testRunner.getAreaBroker());
                testRunner.on('resize.adaptItemHeight', function () {
                    const $contentArea = runner
                        .getAreaBroker()
                        .getContentArea();
                    const $itemContainer = $contentArea.find('.text-block-wrap[data-scrolling]');

                    $itemContainer.each(function () {
                        const $item = $(this);
                        assert.equal($item.css('overflow'), 'auto', 'The text block has styles for scrolling');
                    });

                    plugin
                        .init()
                        .then(function () {
                            testRunner.trigger('resize.adaptItemHeight');
                        })
                        .catch(function (err) {
                            assert.ok(false, err.message);
                        });

                    ready();
                }, self.getLoadedClasses());
            });

        });
    });
});