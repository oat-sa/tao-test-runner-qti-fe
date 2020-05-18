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
    'taoQtiTest/runner/provider/stopwatch'
], function (stopwatchFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(3);

        assert.equal(typeof stopwatchFactory, 'function', 'The module exports a function');
        assert.equal(typeof stopwatchFactory({}), 'object', 'The stopwatch factory produces an instance');
        assert.notStrictEqual(
            stopwatchFactory({}),
            stopwatchFactory({}),
            'The stopwatch factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([
        { title: 'init' },
        { title: 'start' },
        { title: 'stop' },
        { title: 'destroy' },
    ]).test('The stopwatch factory expose API', (data, assert) => {
        assert.equal(typeof stopwatchFactory({})[data.title], 'function', 'The method is exposed');
    });

    QUnit.test('stopwatch.init', (assert) => {
        const stopwatch = stopwatchFactory({});

        assert.expect(1);

        stopwatch.init();

        assert.equal(stopwatch.isInitialized(), true, 'The stopwatch is initialized');
    });

    QUnit.test('stopwatch.start', (assert) => {
        const ready = assert.async();
        const stopwatch = stopwatchFactory({});

        assert.expect(1);

        stopwatch.init();

        stopwatch.on('tick', () => {
            assert.ok('the tick event has been triggered');

            stopwatch.stop();

            ready();
        });

        stopwatch.start();
    });

    QUnit.test('stopwatch.stop', (assert) => {
        const ready = assert.async();
        const interval = 500;
        const stopwatch = stopwatchFactory({ interval });

        assert.expect(2);

        stopwatch.init();

        stopwatch.on('tick', () => {
            assert.ok('the tick event has been triggered');

            stopwatch.off('tick');
            stopwatch.on('tick', () => {
                assert.notOk('the stopwatch has been stopped, tick should not be triggered');
            });

            stopwatch.stop();

            setTimeout(() => {
                assert.ok('the tick has not been triggered');

                ready();
            }, interval * 2);
        });

        stopwatch.start();
    });

    QUnit.test('stopwatch.stop', (assert) => {
        const ready = assert.async();
        const interval = 500;
        const stopwatch = stopwatchFactory({ interval });

        assert.expect(2);

        stopwatch.init();

        stopwatch.on('tick', () => {
            assert.ok('the tick event has been triggered');

            stopwatch.off('tick');
            stopwatch.on('tick', () => {
                assert.notOk('the stopwatch has been destroyed, tick should not be triggered');
            });

            stopwatch.destroy();

            setTimeout(() => {
                assert.equal(stopwatch.isInitialized(), false, 'The stopwatch has been destroyed');

                ready();
            }, interval * 2);
        });

        stopwatch.start();
    });
});
