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
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/helpers'
], function (
    helpers
) {
    'use strict';

    QUnit.module('helpers');

    QUnit.test('module', assert => {
        assert.equal(typeof helpers, 'object', 'The helpers module exposes an object');
    });

    QUnit.cases.init([
        {title: 'showElementsContent'},
        {title: 'allowedToNavigateFrom'},
        {title: 'getStrategies'},
        {title: 'getNavigators'}
    ]).test('helper ', (data, assert) => {
        assert.equal(
            typeof helpers[data.title],
            'function',
            `The helpers exposes a "${data.title}" function`
        );
    });

});
