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
 * Copyright (c) 2021 Open Assessment Technologies SA ;
 */

/**
 * Test of taoQtiTest/runner/proxy/cache/preloaders/interactions/extendedText
 */
define(['taoQtiTest/runner/proxy/cache/preloaders/interactions/extendedText'], function (extendedTextPreloader) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(5);
        assert.equal(typeof extendedTextPreloader, 'object', 'The module exposes an object');
        assert.equal(extendedTextPreloader.name, 'extendedTextInteraction', 'The preloader has a name');
        assert.equal(typeof extendedTextPreloader.init, 'function', 'The preloader has an init method');
        assert.equal(typeof extendedTextPreloader.init(), 'object', 'The preloaded has a factory');
        assert.notDeepEqual(
            extendedTextPreloader.init(),
            extendedTextPreloader.init(),
            'The factory creates new instances'
        );
    });

    QUnit.cases.init([{ title: 'loaded' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = extendedTextPreloader.init();

        assert.equal(typeof preloader[data.title], 'function', `The preloader has the method ${data.title}`);
    });

    QUnit.module('behavior');

    QUnit.test('load/unload', assert => {
        //assert.expect(4);
        const ready = assert.async();
        const preloader = extendedTextPreloader.init();
        const interaction = {
            attributes: {
                format: 'xhtml'
            }
        };
        const itemData = {
            data: {
                attributes: {
                    'xml:lang': 'fr-FR'
                }
            }
        };
        const itemIdentifier = 'item-1';

        preloader
            .load(interaction, itemData, itemIdentifier)
            .then(() => {
                assert.ok(
                    preloader.loaded(interaction, itemData, itemIdentifier),
                    'The interaction has been preloaded'
                );
            })
            .then(() => preloader.unload(interaction, itemData, itemIdentifier))
            .then(() => {
                assert.ok(
                    preloader.loaded(interaction, itemData, itemIdentifier),
                    'The interaction is still preloaded'
                );
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
