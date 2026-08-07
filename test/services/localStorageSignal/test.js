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
 * Copyright (c) 2026 Open Assessment Technologies SA ;
 */
define(['taoQtiTest/runner/services/localStorageSignal'], function (localStorageSignal) {
    'use strict';

    QUnit.module('localStorageSignal');

    QUnit.test('is a namespace', function (assert) {
        assert.equal(typeof localStorageSignal, 'object');
    });

    QUnit.test('it has the required methods', function (assert) {
        assert.equal(typeof localStorageSignal.emitStorageSignal, 'function');
        assert.equal(typeof localStorageSignal.createStorageSignalWatcher, 'function');
    });

    QUnit.test('emitStorageSignal writes payload to localStorage', function (assert) {
        const originalSetItem = window.localStorage.setItem;
        const originalNow = Date.now;
        const key = 'tao.signal.test';
        const payload = 'my-sequence';
        const now = 123456;
        let storedKey;
        let storedValue;

        Date.now = function () {
            return now;
        };
        window.localStorage.setItem = function (inputKey, inputValue) {
            storedKey = inputKey;
            storedValue = inputValue;
        };

        localStorageSignal.emitStorageSignal(key, payload);

        assert.equal(storedKey, key);
        assert.equal(storedValue, `${payload}:${now}`);

        window.localStorage.setItem = originalSetItem;
        Date.now = originalNow;
    });

    QUnit.test('createStorageSignalWatcher reacts only to its signal key', function (assert) {
        const done = assert.async();
        const originalAdd = window.addEventListener;
        const originalRemove = window.removeEventListener;
        let registeredHandler = null;
        let removedHandler = null;
        let onSignalCount = 0;

        window.addEventListener = function (eventName, handler) {
            if (eventName === 'storage') {
                registeredHandler = handler;
            }
        };
        window.removeEventListener = function (eventName, handler) {
            if (eventName === 'storage') {
                removedHandler = handler;
            }
        };

        const unregister = localStorageSignal.createStorageSignalWatcher(
            'tao.signal.target',
            function onSignal() {
                onSignalCount += 1;
            },
            0
        );

        assert.equal(typeof unregister, 'function');
        assert.equal(typeof registeredHandler, 'function');

        registeredHandler({ key: 'tao.signal.other' });
        assert.equal(onSignalCount, 0);

        registeredHandler({ key: 'tao.signal.target' });

        setTimeout(function () {
            assert.equal(onSignalCount, 2);

            unregister();
            assert.strictEqual(removedHandler, registeredHandler);

            window.addEventListener = originalAdd;
            window.removeEventListener = originalRemove;
            done();
        }, 5);
    });
});
