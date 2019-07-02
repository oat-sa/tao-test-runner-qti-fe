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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */

define(['jquery', 'ui/component/placeable', 'taoQtiTest/runner/plugins/tools/areaMasking/mask'], function(
    $,
    makePlaceable,
    maskComponentFactory
) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(1);
        assert.equal(typeof maskComponentFactory, 'function', 'The module exposes a function');
    });

    QUnit.test('factory', function(assert) {
        assert.expect(2);
        assert.equal(typeof maskComponentFactory(), 'object', 'The factory creates an object');
        assert.notDeepEqual(maskComponentFactory(), maskComponentFactory(), 'The factory creates a new object');
    });

    QUnit.cases
        .init([
            { name: 'init', title: 'init' },
            { name: 'destroy', title: 'destroy' },
            { name: 'render', title: 'render' },
            { name: 'show', title: 'show' },
            { name: 'hide', title: 'hide' },
            { name: 'enable', title: 'enable' },
            { name: 'disable', title: 'disable' },
            { name: 'is', title: 'is' },
            { name: 'setState', title: 'setState' },
            { name: 'getContainer', title: 'getContainer' },
            { name: 'getElement', title: 'getElement' },
            { name: 'getTemplate', title: 'getTemplate' },
            { name: 'setTemplate', title: 'setTemplate' }
        ])
        .test('component API contains ', function(data, assert) {
            var component = maskComponentFactory();
            assert.expect(1);
            assert.equal(typeof component[data.name], 'function', `The component has the method ${data.name}`);
        });

    QUnit.test('component is placeable', function(assert) {
        var component = makePlaceable(maskComponentFactory());
        assert.expect(1);
        assert.ok(makePlaceable.isPlaceable(component), 'created component is placeable');
    });

    QUnit.module('Behavior');

    QUnit.test('DOM', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        assert.expect(9);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal($container.children().length, 0, 'The container is empty');

        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element = $('.mask-container', $container);
                assert.equal($element.length, 1, 'The component has been attached to the container');
                assert.ok($element.hasClass('rendered'), 'The component has the rendered class');
                assert.equal($('.controls', $element).length, 1, 'The controls element is there');
                assert.equal($('.controls .view', $element).length, 1, 'The view controls element is there');
                assert.equal($('.controls .close', $element).length, 1, 'The close controls element is there');
                assert.deepEqual(
                    $element[0],
                    this.getElement()[0],
                    'The found element match the one bound to the component'
                );

                ready();
            })
            .init({})
            .render($container);
    });

    QUnit.test('preview', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory().init({
            previewDelay: 1000,
            renderTo: $container,
            draggableContainer: $container
        });

        assert.expect(12);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element = this.getElement();
                var $inner = $('.inner', $element);
                var $previewBtn = $('.view', $element);

                assert.equal($previewBtn.length, 1, 'The preview button exists');
                assert.equal($inner.length, 1, 'The inner element exists');
                assert.ok(!this.is('previewing'), 'We are not previewing');
                assert.ok(!$container.hasClass('previewing'), 'We are not previewing');
                assert.equal($inner.css('opacity'), 1, 'The inner element is opaque');

                $previewBtn.trigger('click');
            })
            .on('preview', function() {
                var self = this;
                const $localContainer = this.getElement();
                var $element = $('.mask', $localContainer);
                var $inner = $('.inner', $element);

                assert.ok(this.is('previewing'), 'We are previewing');
                assert.ok($localContainer.hasClass('previewing'), 'We are previewing');

                //Takes into account the CSS transition
                setTimeout(function() {
                    assert.ok(parseFloat($inner.css('opacity')) < 1, 'The inner element is transparent');
                }, 650);

                setTimeout(function() {
                    assert.ok(!self.is('previewing'), 'We are not previewing anymore');
                }, 1050);

                setTimeout(function() {
                    assert.equal($inner.css('opacity'), 1, 'The inner element is opaque again');
                    ready();
                }, 1650);
            })
            .render($container);
    });

    QUnit.test('close', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');
        var component = maskComponentFactory();

        assert.expect(3);

        assert.equal($container.length, 1, 'The container exists');
        assert.equal(typeof component, 'object', 'The component has been created');

        component
            .on('render', function() {
                var $element = this.getElement();
                var $closeBtn = $('.close', $element);

                assert.equal($closeBtn.length, 1, 'The preview button exists');

                $closeBtn.trigger('click');
            })
            .on('destroy', function() {
                ready();
            })
            .init({})
            .render($container);
    });

    QUnit.module('Visual');

    QUnit.test('visual test', function(assert) {
        var ready = assert.async();
        var $container = $('#outside');

        assert.expect(1);

        maskComponentFactory()
            .on('render', function() {
                assert.ok(true);
                ready();
            })
            .init({ renderTo: $container, draggableContainer: $container });
    });
});
