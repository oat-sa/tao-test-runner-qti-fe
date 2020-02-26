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
    'context',
    'ui/dialog/alert',
    'taoTests/runner/runner',
    'taoTests/runner/runnerComponent',
    'taoQtiTest/runner/helpers/map',
    'taoQtiTest/runner/helpers/testContextBuilder',
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation',
    'taoQtiTest/test/runner/mocks/providerMock',
    'tpl!taoQtiTest/test/runner/plugins/content/keyNavigation/layout',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/config.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/init.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json',
    'lib/jquery.mockjax'
], function (
    $,
    _,
    context,
    dialogAlert,
    runnerFactory,
    runnerComponent,
    mapHelper,
    testContextBuilder,
    pluginFactory,
    providerMock,
    layoutTpl,
    configData,
    initData,
    itemData
) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Provision the context with a proper root url to prevent failure from the URL helper
    context.root_url = window.location.origin;

    // Basic navigator to move inside the test
    function navigator(itemId, direction, ref) {
        const {testMap, testContext} = initData;
        mapHelper.createJumpTable(testMap);
        const item = mapHelper.getItem(testMap, itemId);
        const last = testMap.jumps.length - 1;
        const actions = {
            next() {
                return item.position < last ? item.position + 1 : 0;
            },
            previous() {
                return Math.max(0, item.position - 1);
            },
            jump() {
                return ref;
            }
        };
        const action = actions[direction] || actions.next();
        return testContextBuilder.buildTestContextFromPosition(testContext, testMap, action(), 1);
    }

    // Mock the queries
    $.mockjax({
        url: '/init*',
        responseText: initData
    });
    $.mockjax({
        url: '/getItem*',
        response: function(settings) {
            const url = new URL(settings.url);
            const params = url.searchParams;
            const itemId = params && params.get('itemDefinition');
            this.responseText = itemData[itemId];
        }
    });
    $.mockjax({
        url: '/move*',
        response: function(settings) {
            const url = new URL(settings.url);
            const params = url.searchParams;
            const itemId = params && params.get('itemDefinition');
            const {direction, ref} = settings.data;

            this.responseText = {
                success: true,
                testContext: navigator(itemId, direction, ref)
            };
        }
    });

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


    QUnit.module('Visual');

    QUnit.test('Visual test', assert => {
        const ready = assert.async();
        const $container = $('#visual-playground');
        const $selector = $container.find('.playground-selector');
        const $view = $container.find('.playground-view');
        const modes = [];
        assert.expect(1);

        Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $view.html(layoutTpl());
                runnerComponent($view.find('.runner'), configData)
                    .on('error', reject)
                    .on('ready', runner => {
                        runner
                            .after('renderitem.runnerComponent', () => {
                                runner.off('renderitem.runnerComponent');
                                resolve(runner);
                            })
                            .after('setcontenttabtype', () => runner.jump(0));
                    });
            }))
            .then(runner => {
                function activateMode(id) {
                    modes.forEach(mode => mode.$button.toggleClass('btn-info', id === mode.id));
                    $view.attr('data-mode', id);
                    runner.trigger('setcontenttabtype', id);
                }

                $view.find('header').on('click', 'a', e => {
                    dialogAlert(`You clicked on <b>${$(e.currentTarget).text()}</b>`);
                    e.preventDefault();
                });

                $selector
                    .on('click', 'button', e => {
                        activateMode(e.target.dataset.mode);
                    })
                    .find('button').each(function () {
                        modes.push({
                            id: this.dataset.mode,
                            $button: $(this)
                        });
                    });

                activateMode('default');
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
