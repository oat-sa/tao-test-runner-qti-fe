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
    'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/modesManager'
], function (
    modesFactory
) {
    'use strict';

    QUnit.module('modesManager');

    QUnit.test('module', assert => {
        assert.equal(typeof modesFactory, 'function', 'The modesFactory module exposes a function');
        assert.equal(typeof modesFactory('default'), 'object', 'The modesFactory factory produces an instance');
        assert.notStrictEqual(
            modesFactory('default'),
            modesFactory('default'),
            'The modesFactory factory provides a different instance on each call'
        );
    });

    QUnit.cases.init([{
        title: 'default',
        mode: 'default',
        config: {
            additional: 'foo'
        },
        expected: {
            strategies: ['rubrics', 'item', 'toolbar', 'header', 'top-toolbar', 'navigator', 'page'],
            config: {
                autoFocus: true,
                keepState: true,
                propagateTab: false,
                flatNavigation: false,
                keyNextGroup: 'tab',
                keyPrevGroup: 'shift+tab',
                keyNextItem: 'right down',
                keyPrevItem: 'left up',
                keyNextTab: 'right',
                keyPrevTab: 'left',
                keyNextContent: 'down',
                keyPrevContent: 'up',
                additional: 'foo'
            }
        }
    }, {
        title: 'linear',
        mode: 'linear',
        config: {
            additional: 'foo'
        },
        expected: {
            strategies: ['rubrics', 'linearItem', 'toolbar', 'header', 'top-toolbar', 'navigator', 'page'],
            config: {
                autoFocus: true,
                keepState: true,
                propagateTab: false,
                flatNavigation: false,
                keyNextGroup: 'tab',
                keyPrevGroup: 'shift+tab',
                keyNextItem: 'right down',
                keyPrevItem: 'left up',
                keyNextTab: 'right',
                keyPrevTab: 'left',
                keyNextContent: 'down',
                keyPrevContent: 'up',
                additional: 'foo'
            }
        }
    }, {
        title: 'native',
        mode: 'native',
        config: {
            additional: 'foo'
        },
        expected: {
            strategies: ['header', 'top-toolbar', 'navigator', 'item', 'toolbar'],
            config: {
                autoFocus: false,
                keepState: false,
                propagateTab: true,
                flatNavigation: true,
                keyNextGroup: '',
                keyPrevGroup: '',
                keyNextItem: 'tab',
                keyPrevItem: 'shift+tab',
                keyNextTab: '',
                keyPrevTab: '',
                keyNextContent: '',
                keyPrevContent: '',
                additional: 'foo'
            }
        }
    }]).test('Navigation mode ', (data, assert) => {
        const result = modesFactory(data.mode, data.config);
        assert.deepEqual(result, data.expected, `The mode ${data.mode} is properly configured`);
    });

});
