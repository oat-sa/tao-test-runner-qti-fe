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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */
/**
 * Test the time\'s plugin countdown component
 */
define(['jquery', 'taoQtiTest/runner/plugins/controls/timer/component/countdown'], function($, countdownFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof countdownFactory, 'function', 'The countdownFactory module exposes a function');
        assert.equal(typeof countdownFactory(), 'object', 'The countdownFactory factory produces an object');
        assert.notStrictEqual(
            countdownFactory(),
            countdownFactory(),
            'The countdownFactory factory provides a different object on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'destroy' },
            { title: 'render' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' },
            { title: 'is' },
            { title: 'setState' },
            { title: 'getContainer' },
            { title: 'getElement' },
            { title: 'getTemplate' },
            { title: 'setTemplate' }
        ])
        .test('Component API ', function(data, assert) {
            var instance = countdownFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The countdownFactory exposes the component method "${data.title}`
            );
        });

    QUnit.cases
        .init([{ title: 'on' }, { title: 'off' }, { title: 'trigger' }, { title: 'before' }, { title: 'after' }])
        .test('Eventifier API ', function(data, assert) {
            var instance = countdownFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The countdownFactory exposes the eventifier method "${data.title}`
            );
        });

    QUnit.cases
        .init([{ title: 'update' }, { title: 'start' }, { title: 'stop' }, { title: 'complete' }])
        .test('Instance API ', function(data, assert) {
            var instance = countdownFactory();
            assert.equal(
                typeof instance[data.title],
                'function',
                `The countdownFactory exposes the method "${data.title}`
            );
        });

    QUnit.module('Behavior');

    QUnit.test('Lifecycle', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture');

        assert.expect(20);

        countdownFactory($container, {
            id: 'timer-1',
            label: 'Timer 01',
            remainingTime: 2000
        })
            .on('init', function() {
                assert.ok(!this.is('rendered'), 'The component is not rendered');
                assert.ok(!this.is('started'), 'The component is not  started');
                assert.ok(!this.is('running'), 'The component is not running');
                assert.ok(!this.is('completed'), 'The component is not yet completed');
            })
            .on('render', function() {
                assert.ok(this.is('rendered'), 'The component is now rendered');
                assert.ok(!this.is('started'), 'The component is not  started');
                assert.ok(!this.is('running'), 'The component is not running');
                assert.ok(!this.is('completed'), 'The component is not yet completed');

                this.start();
            })
            .on('start.first', function() {
                this.off('start.first');

                assert.ok(this.is('rendered'), 'The component is still rendered');
                assert.ok(this.is('running'), 'The component is now running');
                assert.ok(!this.is('completed'), 'The component is not yet completed');

                this.stop();
            })
            .on('stop.first', function() {
                this.off('stop.first');

                assert.ok(this.is('rendered'), 'The component is still rendered');
                assert.ok(!this.is('running'), 'The component is not running anymore');
                assert.ok(!this.is('completed'), 'The component is not yet completed');

                this.on('start.second', function() {
                    this.off('start.second');

                    assert.ok(this.is('rendered'), 'The component is still rendered');
                    assert.ok(this.is('running'), 'The component is running again');
                    assert.ok(!this.is('completed'), 'The component is not yet completed');

                    this.complete();
                });
                this.start();
            })
            .on('complete', function() {
                assert.ok(this.is('rendered'), 'The component is still rendered');
                assert.ok(!this.is('running'), 'The component is not running anymore');
                assert.ok(this.is('completed'), 'The component is now completed');

                this.destroy();
            })
            .on('destroy', function() {
                ready();
            });
    });

    QUnit.test('Rendering', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture .timer-box');

        assert.expect(8);

        assert.equal($('.countdown', $container).length, 0, 'No timer in the container');

        countdownFactory($container, {
            id: 'timer-1',
            label: 'Timer 01',
            remainingTime: 12987000
        }).on('render', function() {
            var $element = this.getElement();

            assert.equal($('.countdown', $container).length, 1, 'The component has been inserted');
            assert.equal($('.countdown', $container)[0], $element[0], 'The component element is correct');

            assert.equal(
                $('.label', $element)
                    .text()
                    .trim(),
                'Timer 01',
                'The label is set'
            );
            assert.equal($element.attr('title'), 'Timer 01', 'The label is set as tooltip');
            assert.equal($element.data('control'), 'timer-1', 'The timer id is set as data-control');

            assert.equal(
                $('.label', $element)
                    .text()
                    .trim(),
                'Timer 01',
                'The label is set'
            );
            assert.equal($('.time', $element).text(), '03:36:27', 'The time is displayed');

            ready();
        });
    });

    QUnit.test('external countdown', function(assert) {
        var ready = assert.async();
        var $container = $('#qunit-fixture .timer-box');
        var $time;
        assert.expect(7);

        countdownFactory($container, {
            id: 'timer-2',
            label: 'Timer 02',
            remainingTime: 3000,
            polling: false
        })
            .on('render', function() {
                $time = $('.time', this.getElement());
                assert.equal($time.text(), '00:00:03', 'The time is displayed');

                this.start();
            })
            .on('start', function() {
                var self = this;
                setTimeout(function() {
                    assert.equal($time.text(), '00:00:03', 'The time is displayed');
                    self.update(2000);
                    assert.equal($time.text(), '00:00:02', 'The time is displayed');
                }, 1000);
                setTimeout(function() {
                    assert.equal($time.text(), '00:00:02', 'The time is displayed');
                    self.update(1000);
                    assert.equal($time.text(), '00:00:01', 'The time is displayed');
                }, 2000);
                setTimeout(function() {
                    assert.equal($time.text(), '00:00:01', 'The time is displayed');
                    self.update(-10);
                }, 3000);
            })
            .on('complete', function() {
                assert.equal($time.text(), '00:00:00', 'The time is displayed');
                ready();
            });
    });

    QUnit.test('screenreader waringins', function(assert) {
        const ready = assert.async();
        const $container = $('#qunit-fixture .timer-box');
        const message = () => {};
        const scope = 'test';

        assert.expect(3);

        countdownFactory($container, {
            id: 'timer-2',
            label: 'Timer 02',
            remainingTime: 3000,
            warningsForScreenreader: [
                {
                    level: 'success',
                    message,
                    scope,
                    threshold: 3000
                }
            ]
        })
            .on('render', function() {
                this.start();
            })
            .on('start', function() {
                this.update(2000);
            })
            .on('warnscreenreader', (messageArg, remainingTime, scopeArg) => {
                assert.equal(messageArg, message, 'the message is provided');
                assert.equal(typeof remainingTime, 'number', 'the remaning time is provided');
                assert.equal(scopeArg, scope, 'the scope is provided');

                ready();
            });
    });

    QUnit.module('Visual test');

    QUnit.test('Countdow', function(assert) {
        const ready = assert.async();
        const remaining = 10000;
        const container = document.querySelector('#visual .timer-box');
        let ticksCount = 10;

        assert.expect(1);

        countdownFactory(container, {
            id: 'timer-1',
            label: 'Timer 01',
            remainingTime: remaining,
            warnings: [
                {
                    level: 'success',
                    message: 'be green',
                    threshold: 3000
                },
                {
                    level: 'danger',
                    message: 'be orange',
                    threshold: 6000
                }
            ]
        })
            .on('start', function() {
                const self = this;

                this.ticksInterval = setInterval(function() {
                    self.update(--ticksCount * 1000);
                }, 1000);
            })
            .on('complete', function() {
                assert.ok(true);

                clearInterval(this.ticksInterval);

                ready();
            })
            .on('change', function() {
                // console.log(c);
            })
            .on('warn', function() {
                // console.log(d);
            })
            .on('render', function() {
                this.start();
            });
    });
});
