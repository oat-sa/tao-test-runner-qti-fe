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
 * Test of taoQtiTest/runner/proxy/cache/preloaders/assets/stylesheet
 */
define(['taoQtiTest/runner/proxy/cache/preloaders/assets/stylesheet'], function (stylesheetPreloader) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(5);
        assert.equal(typeof stylesheetPreloader, 'object', 'The module exposes an object');
        assert.equal(stylesheetPreloader.name, 'css', 'The preloader has a name');
        assert.equal(typeof stylesheetPreloader.init, 'function', 'The preloader has an init method');
        assert.equal(typeof stylesheetPreloader.init(), 'object', 'The preloaded has a factory');
        assert.notDeepEqual(
            stylesheetPreloader.init(),
            stylesheetPreloader.init(),
            'The factory creates new instances'
        );
    });

    QUnit.cases.init([{ title: 'loaded' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = stylesheetPreloader.init();

        assert.equal(typeof preloader[data.title], 'function', `The preloader has the method ${data.title}`);
    });

    QUnit.module('behavior');

    QUnit.test('load/unload', assert => {
        assert.expect(5);
        const ready = assert.async();
        const preloader = stylesheetPreloader.init();
        const data = {
            asset: 'sample.css',
            itemIdentifier: 'item-1'
        };
        const assetUrl = `./${data.asset}`;

        assert.strictEqual(
            document.querySelector(`head link[href="${assetUrl}"]`),
            null,
            'The asset is not yet loaded'
        );

        preloader
            .load(assetUrl, data.asset, data.itemIdentifier)
            .then(() => {
                assert.ok(
                    document.querySelector(`head link[href="${assetUrl}"]`) instanceof HTMLLinkElement,
                    'The asset has been preloaded'
                );
                assert.ok(preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been preloaded');
            })
            .then(() => preloader.unload(assetUrl, data.asset, data.itemIdentifier))
            .then(() => {
                assert.strictEqual(
                    document.querySelector(`head link[href="${assetUrl}"]`),
                    null,
                    'The asset has been unloaded'
                );
                assert.ok(!preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been unloaded');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
