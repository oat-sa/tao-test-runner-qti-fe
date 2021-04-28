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
    'taoQtiTest/runner/plugins/content/rubricBlock/rubricBlock',
    'mathJax'
], function ($, runnerFactory, providerMock, pluginFactory, mathJaxMock) {
    'use strict';

    const providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    /**
     * The following tests applies to all plugins
     */
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
        { title: 'init' },
        { title: 'render' },
        { title: 'finish' },
        { title: 'destroy' },
        { title: 'trigger' },
        { title: 'getTestRunner' },
        { title: 'getAreaBroker' },
        { title: 'getConfig' },
        { title: 'setConfig' },
        { title: 'getState' },
        { title: 'setState' },
        { title: 'show' },
        { title: 'hide' },
        { title: 'enable' },
        { title: 'disable' }
    ]).test('plugin API ', (data, assert) => {
        const runner = runnerFactory(providerName);
        const timer = pluginFactory(runner);
        assert.equal(
            typeof timer[data.title],
            'function',
            `The pluginFactory instances expose a "${data.title}" function`
        );
    });

    QUnit.module('load rubric blocks', {
        beforeEach: () => {
            mathJaxMock.called = false;
        }
    });

    QUnit.test('render a rubric block', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(2);

        runner.on('rubricblock', () => {
            const $container = runner.getAreaBroker().getContainer();

            assert.equal($('#qti-rubrics', $container).length, 1, 'The rubric blocks element is created');
            assert.equal($('#qti-rubrics', $container).html(), '<p>foo</p>', 'The rubric blocks content is loaded');
            ready();
        });

        plugin
            .init()
            .then(plugin.render())
            .then(() => {
                runner.setTestContext({
                    rubrics: '<p>foo</p>'
                });
                runner.trigger('loaditem', 'foo');
                runner.trigger('renderitem');
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('load / unload a rubric block', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(4);

        runner
            .after('renderitem', () => {
                const $container = runner.getAreaBroker().getContainer();

                assert.equal($('#qti-rubrics', $container).length, 1, 'The rubric block element is created');
                assert.equal(
                    $('#qti-rubrics', $container).children().length,
                    1,
                    'The rubric block element contains an child'
                );
            })
            .after('unloaditem', () => {
                const $container = runner.getAreaBroker().getContainer();

                assert.equal($('#qti-rubrics', $container).length, 1, 'The rubric block element is created');
                assert.equal($('#qti-rubrics', $container).children().length, 0, 'The rubric block element is empty');

                ready();
            });

        plugin
            .init()
            .then(plugin.render())
            .then(() => {
                runner.setTestContext({
                    rubrics: '<p>foo</p>'
                });
                runner.trigger('loaditem', 'foo');
                runner.trigger('renderitem');

                setTimeout(() => runner.trigger('unloaditem'), 10);
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('render a rubric block with links', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(3);

        runner.on('rubricblock', () => {
            const $container = runner.getAreaBroker().getContainer();

            assert.equal($('#qti-rubrics', $container).length, 1, 'The rubric blocks element is created');
            assert.equal($('#qti-rubrics a', $container).length, 1, 'The link is in the rubric block');
            assert.equal($('#qti-rubrics a', $container).attr('target'), '_blank', 'The link has now a _blank target');
            ready();
        });

        plugin
            .init()
            .then(plugin.render())
            .then(() => {
                runner.setTestContext({
                    rubrics: '<p><a href="http://taotesting.com">foo</a></p>'
                });
                runner.trigger('loaditem', 'foo');
                runner.trigger('renderitem');
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('render a rubric block with math', assert => {
        const ready = assert.async();
        const runner = runnerFactory(providerName);
        const plugin = pluginFactory(runner, runner.getAreaBroker());

        assert.expect(4);

        runner.on('rubricblock', () => {
            const $container = runner.getAreaBroker().getContainer();

            assert.equal($('#qti-rubrics', $container).length, 1, 'The rubric blocks element is created');

            //Mathjax is mocked, so we don\'t assert the transformation
            assert.equal(
                $('#qti-rubrics', $container).find('math').length,
                1,
                'The rubric blocks element contains a math element'
            );
            assert.ok(mathJaxMock.called, 'The mathJax mock has been called');

            ready();
        });

        assert.ok(mathJaxMock.called === false, 'The mathJax mock has not been called');

        plugin
            .init()
            .then(plugin.render())
            .then(() => {
                runner.setTestContext({
                    rubrics:
                        '<div><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mrow><mi>Δ</mi><mo>=</mo><msup><mi>b</mi><mn>2</mn></msup><mo>-</mo><mrow><mn>4</mn><mo>⁢</mo><mi>a</mi><mo>⁢</mo><mi>c</mi></mrow></mro</math></div>'
                });
                runner.trigger('loaditem', 'foo');
                runner.trigger('renderitem');
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });
});
