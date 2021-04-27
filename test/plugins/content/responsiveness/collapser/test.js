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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 */
/**
 * @author Christophe Noël <christophe@taotesting.com>
 */
define([

    'lodash',
    'jquery',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/mocks/areaBrokerMock',
    'taoQtiTest/runner/plugins/content/responsiveness/collapser'
], function (
    _,
    $,
    runnerFactory,
    providerMock,
    areaBrokerMock,
    pluginFactory
) {
    'use strict';

    const fixtureId = '#qunit-fixture';

    const noLabelCls = 'tool-label-collapsed';
    const noLabelSelector = `.${noLabelCls}`;

    const ICON_WIDTH = 20;
    const TEXT_WIDTH = 70;
    const BTN_MARGIN = 10;
    const NAV_PADDING = 20;

    const ALL_EXPANDED =
        7 * ICON_WIDTH + // 5 toolbox buttons + 2 nav buttons
        6 * TEXT_WIDTH + // 1 toolbox button is always collapsed, see test.html
        7 * BTN_MARGIN +
        NAV_PADDING +
        20; //Scrollbar width

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    QUnit.module('Module');

    QUnit.test('Module export', assert => {
        assert.expect(1);

        assert.ok(typeof pluginFactory === 'function', 'The module expose a function');
    });

    QUnit.module('Collapser');

    //******************   With preconfigured order   ******************//

    QUnit.test('collapse/expand with preconfigured order', assert => {
        const ready = assert.async();
        const $container = $(fixtureId);

        const collapseOrder = [
            '[data-control="prefixed-one"]',
            '[data-control="prefixed-two"],[data-control="three"],[data-control="four"]',
            '[data-control="five"]',
            '[data-control="navi-prev"],[data-control="navi-next"]'
        ];

        let $actionsBar;
        let $collapsed;
        let newWidth;
        let collapsedBtns;
        let resizeCount = 0;

        assert.expect(49);

        const areaBroker = areaBrokerMock({
            $brokerContainer: $container,
            mapping: {
                actionsBar: $container.find('.bottom-action-bar .control-box'),
                toolbox: $container.find('.tools-box'),
                navigation: $container.find('.navi-box')
            }
        });

        runnerFactory.registerProvider(providerName, providerMock({ areaBroker: areaBroker }));
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, areaBroker, {
            collapseTools: false,
            collapseInOrder: true,
            collapseOrder: collapseOrder
        });

        runner.after('collapseTools', () => {
            resizeCount++;

            switch (resizeCount) {
                case 1: {
                    collapsedBtns = 0;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    $actionsBar.width(ALL_EXPANDED - 1);
                    runner.trigger('collapseTools');
                    break;
                }
                case 2: {
                    collapsedBtns = 1;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 has been collapsed');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 3: {
                    collapsedBtns = 3;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 4: {
                    collapsedBtns = 4;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                    assert.ok($container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 has been collapsed');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 5: {
                    collapsedBtns = 6;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                    assert.ok($container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 has been collapsed');
                    assert.ok($container.find(collapseOrder[3]).hasClass(noLabelCls), 'prev & next have been collapsed');

                    collapsedBtns = 4;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 6: {
                    collapsedBtns = 4;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 remain collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remain collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 remain collapsed');
                    assert.ok($container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 remain collapsed');
                    assert.ok(!$container.find(collapseOrder[3]).hasClass(noLabelCls), 'prev & next have been expanded');

                    collapsedBtns = 3;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 7: {
                    collapsedBtns = 3;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 remain collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remain collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 remain collapsed');
                    assert.ok(!$container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find(collapseOrder[3]).hasClass(noLabelCls), 'prev & next have been expanded');

                    collapsedBtns = 1;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 8: {
                    collapsedBtns = 1;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 remain collapsed');
                    assert.ok(!$container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been expanded');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been expanded');
                    assert.ok(!$container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find(collapseOrder[3]).hasClass(noLabelCls), 'prev & next have been expanded');

                    newWidth = ALL_EXPANDED + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 9: {
                    collapsedBtns = 0;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok(!$container.find(collapseOrder[0]).hasClass(noLabelCls), 'button1 has been expanded');
                    assert.ok(!$container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been expanded');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been expanded');
                    assert.ok(!$container.find(collapseOrder[2]).hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find(collapseOrder[3]).hasClass(noLabelCls), 'prev & next have been expanded');

                    ready();
                    break;
                }
            }
        });

        plugin.init()
            .then(() => {
                $actionsBar = areaBroker.getArea('actionsBar');

                $actionsBar.width(ALL_EXPANDED);
                runner.trigger('loaditem');
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    //******************   Without preconfigured order   ******************//

    QUnit.test('collapse/expand without preconfigured order', assert => {
        const ready = assert.async();
        const $container = $(fixtureId);

        const collapseOrder = [];

        let $actionsBar;
        let $collapsed;
        let newWidth;
        let collapsedBtns;
        let resizeCount = 0;

        assert.expect(57);

        const areaBroker = areaBrokerMock({
            $brokerContainer: $container,
            mapping: {
                actionsBar: $container.find('.bottom-action-bar .control-box'),
                toolbox: $container.find('.tools-box'),
                navigation: $container.find('.navi-box')
            }
        });

        runnerFactory.registerProvider(providerName, providerMock({ areaBroker: areaBroker }));
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, areaBroker, {
            collapseTools: true,
            collapseNavigation: true,
            collapseInOrder: true,
            collapseOrder: collapseOrder
        });

        runner.after('collapseTools', () => {
            resizeCount++;

            switch (resizeCount) {
                case 1: {
                    collapsedBtns = 0;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    $actionsBar.width(ALL_EXPANDED - 1);
                    runner.trigger('collapseTools');
                    break;
                }
                case 2: {
                    collapsedBtns = 2;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);
                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 3: {
                    collapsedBtns = 3;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                    assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has not been collapsed (because there is still space)');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 4: {
                    collapsedBtns = 4;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                    assert.ok($container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been collapsed');
                    assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has not been collapsed (because there is still space)');

                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) - 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 5: {
                    collapsedBtns = 6;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                    assert.ok($container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been collapsed');
                    assert.ok($container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been collapsed');
                    assert.ok($container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been collapsed');

                    collapsedBtns = 4;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 6: {
                    collapsedBtns = 4;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 remains collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remains collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 remains collapsed');
                    assert.ok($container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 remains collapsed');
                    assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been expanded');
                    assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been expanded');

                    collapsedBtns = 3;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 7: {
                    collapsedBtns = 3;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 remains collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remains collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 remains collapsed');
                    assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been expanded');
                    assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been expanded');

                    collapsedBtns = 1;
                    newWidth = ALL_EXPANDED - (TEXT_WIDTH * collapsedBtns) + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 8: {

                    //Two because the first two buttons are in a group
                    collapsedBtns = 2;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 remains collapsed');
                    assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remains collapsed');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been expanded');
                    assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been expanded');
                    assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been expanded');


                    newWidth = ALL_EXPANDED + 1;
                    $actionsBar.width(newWidth);
                    runner.trigger('collapseTools');
                    break;
                }
                case 9: {
                    collapsedBtns = 0;

                    $collapsed = $container.find(noLabelSelector);
                    assert.equal($collapsed.length, collapsedBtns, `${collapsedBtns} buttons are collapsed`);

                    assert.ok(!$container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been expanded');
                    assert.ok(!$container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been expanded');
                    assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                    assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been expanded');
                    assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been expanded');
                    assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been expanded');
                    assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been expanded');

                    ready();
                    break;
                }
            }
        });

        plugin.init()
            .then(() => {
                $actionsBar = areaBroker.getArea('actionsBar');

                $actionsBar.width(ALL_EXPANDED);
                runner.trigger('loaditem');
            })
            .catch(err => {
                assert.ok(false, `Error in init method: ${err}`);
                ready();
            });
    });

    //******************   Do not collapse in order   ******************//

    QUnit
        .cases.init([
        { title: 'Tools and Nav', collapseTools: true, collapseNavigation: true },
        { title: 'Tools', collapseTools: true, collapseNavigation: false },
        { title: 'Nav', collapseTools: false, collapseNavigation: true }
    ])
        .test('collapse/expand all at once', (data, assert) => {
            const ready = assert.async();
            const $container = $(fixtureId);

            let $actionsBar;
            let $nav;
            let $toolbox;
            let resizeCount = 0;

            assert.expect(16);

            const areaBroker = areaBrokerMock({
                $brokerContainer: $container,
                mapping: {
                    actionsBar: $container.find('.bottom-action-bar .control-box'),
                    toolbox: $container.find('.tools-box'),
                    navigation: $container.find('.navi-box')
                }
            });

            runnerFactory.registerProvider(providerName, providerMock({ areaBroker: areaBroker }));
            const runner = runnerFactory(providerName);
            const plugin = pluginFactory(runner, areaBroker, {
                collapseTools: data.collapseTools,
                collapseNavigation: data.collapseNavigation
            });

            runner.after('collapseTools', () => {
                resizeCount++;

                switch (resizeCount) {

                    // Original state
                    case 1: {
                        assert.ok(!$nav.hasClass(noLabelCls), 'nav is expanded');
                        assert.ok(!$toolbox.hasClass(noLabelCls), 'toolbox is expanded');

                        $actionsBar.width(ALL_EXPANDED - 1);
                        runner.trigger('collapseTools');
                        break;
                    }
                    case 2: {

                        // Collapse all in the applicable containers (tools|navi)

                        if (data.collapseNavigation) {
                            assert.ok($container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been collapsed');
                            assert.ok($container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been collapsed');
                        } else {
                            assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button remains expanded');
                            assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button remains expanded');
                        }

                        if (data.collapseTools) {
                            assert.ok($container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been collapsed');
                            assert.ok($container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been collapsed');
                            assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                            assert.ok($container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been collapsed');
                            assert.ok($container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been collapsed');
                        } else {
                            assert.ok(!$container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 remains expanded');
                            assert.ok(!$container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 remains expanded');
                            assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                            assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 remains expanded');
                            assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 remains expanded');
                        }

                        $actionsBar.width(ALL_EXPANDED + 1);
                        runner.trigger('collapseTools');
                        break;
                    }
                    case 3: {

                        // Expand all
                        assert.ok(!$container.find('[data-control="prefixed-one"]').hasClass(noLabelCls), 'button1 has been expanded');
                        assert.ok(!$container.find('[data-control="prefixed-two"]').hasClass(noLabelCls), 'button2 has been expanded');
                        assert.ok(!$container.find('[data-control="three"]').hasClass(noLabelCls), 'button3 has NOT been collapsed (always collapsed, see markup in test.html)');
                        assert.ok(!$container.find('[data-control="four"]').hasClass(noLabelCls), 'button4 has been expanded');
                        assert.ok(!$container.find('[data-control="five"]').hasClass(noLabelCls), 'button5 has been expanded');

                        assert.ok(!$container.find('[data-control="navi-prev"]').hasClass(noLabelCls), 'navi-prev button has been expanded');
                        assert.ok(!$container.find('[data-control="navi-next"]').hasClass(noLabelCls), 'navi-next button has been expanded');

                        ready();
                        break;
                    }
                }
            });

            plugin.init()
                .then(() => {
                    $actionsBar = areaBroker.getArea('actionsBar');
                    $nav = areaBroker.getArea('navigation');
                    $toolbox = areaBroker.getArea('toolbox');

                    $actionsBar.width(ALL_EXPANDED);
                    runner.trigger('loaditem');
                })
                .catch(err => {
                    assert.ok(false, `Error in init method: ${err}`);
                    ready();
                });
        });

});
