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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
define(['taoQtiTest/runner/config/states'], function(states) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.equal(typeof states, 'object', 'the module exports an object');
    });
    QUnit.test('content', assert => {
        assert.equal(typeof states.testSession, 'object', 'the test session states are exposed');
        assert.equal(typeof states.itemSession, 'object', 'the item session states are exposed');
    });

    QUnit.test('frozen values', assert => {
        assert.equal(states.testSession.initial, 0, 'the test session initial state is correct');
        assert.equal(states.itemSession.interacting, 1, 'the item session interacting state is correct');

        assert.throws( () => {
            states.testSession.initial = 42;
        }, 'the property is read only');
        assert.throws( () => {
            states.itemSession.interacting = 66;
        }, 'the property is read only');

        assert.equal(states.testSession.initial, 0, 'the test session initial state remains correct');
        assert.equal(states.itemSession.interacting, 1, 'the test session interacting state remains correct');
    });
});
