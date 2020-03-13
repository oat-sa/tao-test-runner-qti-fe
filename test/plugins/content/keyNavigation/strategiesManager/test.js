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
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategiesManager'
], function (
    strategiesManager
) {
    'use strict';

    const testRunnerMock = {};

    QUnit.module('strategiesManager');

    QUnit.test('module', assert => {
        assert.equal(typeof strategiesManager, 'function', 'The strategiesManager module exposes a function');
        assert.equal(typeof strategiesManager('page', testRunnerMock), 'object', 'The strategiesManager factory produces an instance');
        assert.notStrictEqual(
            strategiesManager('page', testRunnerMock),
            strategiesManager('page', testRunnerMock),
            'The strategiesManager factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([
        { title: 'page' },
        { title: 'header' },
        { title: 'rubrics' },
        { title: 'toolbar' },
        { title: 'item' },
        { title: 'linearItem' },
        { title: 'navigator' }
    ]).test('Navigation strategy ', (data, assert) => {
        const result = strategiesManager(data.title, testRunnerMock);
        assert.deepEqual(typeof result, 'object', `The strategy ${data.title} has been created`);
        assert.deepEqual(typeof result.init, 'function', `The strategy ${data.title} has a init() api`);
        assert.deepEqual(typeof result.destroy, 'function', `The strategy ${data.title} has a destroy() api`);
        assert.deepEqual(typeof result.getNavigators, 'function', `The strategy ${data.title} has a getNavigators() api`);
    });

});
