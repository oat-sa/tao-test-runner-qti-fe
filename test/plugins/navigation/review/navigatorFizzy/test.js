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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'lodash',
    'taoQtiTest/runner/plugins/navigation/review/navigatorFizzy',
    'json!taoQtiTest/test/runner/plugins/navigation/review/navigatorFizzy/data.json'
], function ($, _, navigatorFactory, sample) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function (assert) {
        assert.expect(1);
        assert.equal(typeof navigatorFactory, 'function', 'The module exposes a function');
    });

    QUnit.test('factory', function (assert) {
        assert.expect(2);
        assert.equal(typeof navigatorFactory(sample.config), 'object', 'The factory creates an object');
        assert.notDeepEqual(
            navigatorFactory(sample.config),
            navigatorFactory(sample.config),
            'The factory creates a new object'
        );
    });

    QUnit.cases
        .init([
            {
                title: 'init'
            },
            {
                title: 'destroy'
            },
            {
                title: 'render'
            },
            {
                title: 'show'
            },
            {
                title: 'hide'
            },
            {
                title: 'enable'
            },
            {
                title: 'disable'
            },
            {
                title: 'is'
            },
            {
                title: 'setState'
            },
            {
                title: 'getContainer'
            },
            {
                title: 'getElement'
            },
            {
                title: 'getTemplate'
            },
            {
                title: 'setTemplate'
            }
        ])
        .test('inherited component API contains ', function (data, assert) {
            var component = navigatorFactory(sample.config);
            assert.expect(1);
            assert.equal(typeof component[data.title], 'function', `The component has the method ${data.title}`);
        });

    QUnit.cases
        .init([
            {
                title: 'on'
            },
            {
                title: 'off'
            },
            {
                title: 'trigger'
            }
        ])
        .test('inherited eventifier API contains ', function (data, assert) {
            var component = navigatorFactory(sample.config);
            assert.expect(1);
            assert.equal(typeof component[data.title], 'function', `The component has the method ${data.title}`);
        });

    QUnit.cases
        .init([
            {
                title: 'setItemFlag'
            },
            {
                title: 'updateConfig'
            },
            {
                title: 'update'
            },
            {
                title: 'select'
            }
        ])
        .test('own API contains ', function (data, assert) {
            var component = navigatorFactory(sample.config);
            assert.expect(1);
            assert.equal(typeof component[data.title], 'function', `The component has the method ${data.title}`);
        });

    QUnit.module('Behavior');

    QUnit.test('layout structure', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');

        var component = navigatorFactory(sample.config);

        assert.expect(12);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal($container.children().length, 0, 'The container is empty');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function () {
                var $element = $('.qti-navigator', $container);
                assert.equal($element.length, 1, 'The component has been attached to the container');
                assert.ok($element.hasClass('rendered'), 'The component has the rendered class');

                assert.equal($('.qti-navigator-header', $element).length, 1, 'The component contains a header section');
                assert.equal($('.qti-navigator-tree', $element).length, 1, 'The component contains a tree section');

                assert.deepEqual(
                    $element[0],
                    this.getElement()[0],
                    'The found element match the one bound to the component'
                );
            })
            .on('update', function () {
                const closeButton = $('.qti-navigator > .qti-navigator-header > .icon-close', $container);
                assert.equal(closeButton.length, 1, 'The panel contains close button');
                assert.equal($('li.buttonlist-item', $container).length, 10, 'All items are present');
                assert.equal(
                    $('.qti-navigator-section > .qti-navigator-label', $container).length,
                    1,
                    'section title is present'
                );
                assert.equal(
                    $('.qti-navigator-section > .qti-navigator-items', $container).length,
                    1,
                    'section items are present'
                );

                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });

    QUnit.test('renders informational item', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-1'].informational = true;

        assert.expect(1);

        navigatorFactory(sample.config)
            .on('update', function () {
                //first item shows the info icon
                assert.equal(
                    document.querySelectorAll('li[data-id="item-1"] .icon-info').length,
                    1,
                    'Informational icon on the button'
                );

                ready();
            })
            .render($container)
            .update(map, sample.context);
    });

    QUnit.test('renders bookmarked item', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-1'].flagged = true;

        assert.expect(1);

        navigatorFactory(sample.config)
            .on('update', function () {
                assert.equal(
                    document.querySelectorAll('li[data-id="item-1"] .icon-flagged').length,
                    1,
                    'Bookmark icon on the button'
                );
                ready();
            })
            .render($container)
            .update(map, sample.context);
    });

    QUnit.test('renders with section titles enabled', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = Object.assign({}, sample.config, { displaySectionTitles: true });

        assert.expect(2);

        navigatorFactory(config)
            .on('update', function () {
                assert.equal(
                    $('.qti-navigator-section > .qti-navigator-label', $container).text().trim(),
                    'Section 1',
                    'Section title is showing on panel'
                );
                assert.equal(
                    $('.qti-navigator-header > .qti-navigator-text', $container).text(),
                    'Test overview',
                    'Review panel title exists'
                );

                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });

    QUnit.test('renders with section titles disabled', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const config = Object.assign({}, sample.config, { displaySectionTitles: false });

        assert.expect(3);

        navigatorFactory(config)
            .on('update', function () {
                assert.equal(
                    $('.qti-navigator-section > .qti-navigator-label', $container).length,
                    0,
                    'No section titles on panel'
                );
                assert.equal(
                    $('.qti-navigator-header > .qti-navigator-text', $container).text(),
                    'Test overview',
                    'Review panel title still exists'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item', $container).length,
                    10,
                    'All items are visible'
                );

                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });

    QUnit.cases
        .init([
            { displayItemTooltip: true, expected: 'Item 1' },
            { displayItemTooltip: false, expected: void 0 }
        ])
        .test('renders item tooltip depending on displayItemTooltip setting', (data, assert) => {
            const ready = assert.async();
            const $container = $('#qunit-fixture');
            const config = Object.assign({}, sample.config, { displayItemTooltip: data.displayItemTooltip });

            assert.expect(1);

            navigatorFactory(config)
                .on('update', function () {
                    assert.equal(
                        $('.buttonlist-item[data-id="item-1"] button', $container).attr('title'),
                        data.expected,
                        'Item tooltip is shown depending on displayItemTooltip setting'
                    );
                    ready();
                })
                .render($container)
                .update(sample.map, sample.context);
        });

    QUnit.test('on button click, triggers "jump" (preventsUnseen=true)', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);
        const config = Object.assign({}, sample.config, { preventsUnseen: true });

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-2'].viewed = false;
        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-3'].viewed = true;

        assert.expect(4);

        navigatorFactory(config)
            .on('update', function () {
                const $viewedBtn = $(
                    '.qti-navigator-fizzy .buttonlist-item.viewed[data-id="item-3"] button',
                    $container
                );
                assert.equal($viewedBtn.length, 1, 'Item button exists and is viewed');
                $viewedBtn.click();
            })
            .on('jump', function (clickedItemPosition) {
                assert.equal(clickedItemPosition, 2, 'Triggers jump to position, on click on viewed item');

                let unseenJumpPosition = 'abc';
                this.off('jump').on('jump', function (nextItemPosition) {
                    unseenJumpPosition = nextItemPosition;
                });

                const $unseenBtn = $(
                    '.qti-navigator-fizzy .buttonlist-item.unseen[data-id="item-2"] button',
                    $container
                );
                assert.equal($unseenBtn.length, 1, 'Item button exists and is unseen');
                $unseenBtn.click();

                setTimeout(() => {
                    assert.equal(unseenJumpPosition, 'abc', 'Does not trigger jump, on click on unseen item');
                    ready();
                }, 0);
            })
            .render($container)
            .update(map, sample.context);
    });

    QUnit.test('on button click, triggers "jump" (preventsUnseen=false)', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);
        const config = Object.assign({}, sample.config, { preventsUnseen: false });

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-2'].viewed = false;
        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-3'].viewed = true;

        assert.expect(4);

        navigatorFactory(config)
            .on('update', function () {
                const $viewedBtn = $(
                    '.qti-navigator-fizzy .buttonlist-item.viewed[data-id="item-3"] button',
                    $container
                );
                assert.equal($viewedBtn.length, 1, 'Item button exists and is viewed');
                $viewedBtn.click();
            })
            .on('jump', function (clickedItemPosition) {
                assert.equal(clickedItemPosition, 2, 'Triggers jump to position, on click on viewed item');

                let unseenJumpPosition = 'abc';
                this.off('jump').on('jump', function (nextItemPosition) {
                    unseenJumpPosition = nextItemPosition;
                });

                const $unseenBtn = $(
                    '.qti-navigator-fizzy .buttonlist-item.unseen[data-id="item-2"] button',
                    $container
                );
                assert.equal($unseenBtn.length, 1, 'Item button exists and is unseen');
                $unseenBtn.click();

                setTimeout(() => {
                    assert.equal(unseenJumpPosition, 1, 'Triggers jump to position, on click on unseen item');
                    ready();
                }, 0);
            })
            .render($container)
            .update(map, sample.context);
    });

    QUnit.test('on close button click, triggers "close"', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');

        assert.expect(2);

        navigatorFactory(sample.config)
            .on('update', function () {
                const $closeBtn = $('.qti-navigator-fizzy .qti-navigator-header .icon-close', $container);
                assert.equal($closeBtn.length, 1, 'Close button exists');
                $closeBtn.click();
            })
            .on('close', function () {
                assert.ok(true, 'Triggers close, on click on close button');
                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });

    QUnit.test('on "select" api call, sets active item and triggers "selected"', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');

        assert.expect(6);

        navigatorFactory(sample.config)
            .on('update', function () {
                const $item = $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"]', $container);
                assert.equal($item.length, 1, 'Item button exists');
                assert.equal($item.hasClass('buttonlist-item-active'), false, 'Item button is selected');
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item.buttonlist-item-active', $container).length,
                    1,
                    'Other button is selected'
                );

                this.select(2);
            })
            .on('selected', function () {
                assert.ok(true, 'Triggers selected');

                const $item = $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"]', $container);
                assert.equal($item.hasClass('buttonlist-item-active'), true, 'Item button is selected');
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item.buttonlist-item-active', $container).length,
                    1,
                    'No other buttons are selected'
                );

                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });

    QUnit.test('on "setItemFlag" api call, bookmarks item', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-2'].flagged = false;
        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-3'].flagged = true;

        assert.expect(4);

        navigatorFactory(sample.config)
            .on('update', function () {
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-2"] .icon-flagged', $container).length,
                    0,
                    'Not bookmarked item exists'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"] .icon-flagged', $container).length,
                    1,
                    'Bookmarked item exists'
                );

                this.setItemFlag(1, true);
                this.setItemFlag(2, false);

                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-2"] .icon-flagged', $container).length,
                    1,
                    'Not bookmarked item was bookmarked'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"] .icon-flagged', $container).length,
                    0,
                    'Bookmarked item is no longer bookmarked'
                );

                ready();
            })
            .render($container)
            .update(map, sample.context);
    });

    QUnit.test('on "update" api call, updates component and triggers "update"', function (assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture');
        const map = _.cloneDeep(sample.map);
        const context = _.cloneDeep(sample.context);

        map.parts['testPart-1'].sections['assessmentSection-1'].items['item-3'].answered = false;
        context.itemIdentifier = 'item-1';

        assert.expect(8);

        navigatorFactory(sample.config)
            .on('update', function () {
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"]', $container).length,
                    1,
                    'Triggers update, item exists'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"].answered', $container).length,
                    0,
                    'Map data is applied'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-1"].buttonlist-item-active', $container)
                        .length,
                    1,
                    'Context data is applied'
                );
                assert.equal(
                    $('.qti-navigator-fizzy .buttonlist-item[data-id="item-2"].buttonlist-item-active', $container)
                        .length,
                    0,
                    'Context data is applied'
                );

                const updateMap = _.cloneDeep(map);
                const updateContext = _.cloneDeep(sample.context);

                updateMap.parts['testPart-1'].sections['assessmentSection-1'].items['item-3'].answered = true;
                updateContext.itemIdentifier = 'item-2';

                this.off('update').on('update', function () {
                    assert.equal(
                        $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"]', $container).length,
                        1,
                        'Triggers update, item exists'
                    );
                    assert.equal(
                        $('.qti-navigator-fizzy .buttonlist-item[data-id="item-3"].answered', $container).length,
                        1,
                        'Map change is applied'
                    );
                    assert.equal(
                        $('.qti-navigator-fizzy .buttonlist-item[data-id="item-1"].buttonlist-item-active', $container)
                            .length,
                        0,
                        'Context change is applied'
                    );
                    assert.equal(
                        $('.qti-navigator-fizzy .buttonlist-item[data-id="item-2"].buttonlist-item-active', $container)
                            .length,
                        1,
                        'Context change is applied'
                    );

                    ready();
                });

                this.update(updateMap, updateContext);
            })
            .render($container)
            .update(map, context);
    });

    QUnit.module('Visual');

    QUnit.test('visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#outside');

        assert.expect(1);

        navigatorFactory(sample.config)
            .on('render', function () {
                assert.ok(true);

                ready();
            })
            .render($container)
            .update(sample.map, sample.context);
    });
});
