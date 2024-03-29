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
 * Test of taoQtiTest/runner/proxy/cache/preloaders/assets/image
 */
define(['taoQtiTest/runner/proxy/cache/preloaders/assets/image'], function (imagePreloader) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(5);
        assert.equal(typeof imagePreloader, 'object', 'The module exposes an object');
        assert.equal(imagePreloader.name, 'img', 'The preloader has a name');
        assert.equal(typeof imagePreloader.init, 'function', 'The preloader has an init method');
        assert.equal(typeof imagePreloader.init(), 'object', 'The preloaded has a factory');
        assert.notDeepEqual(imagePreloader.init(), imagePreloader.init(), 'The factory creates new instances');
    });

    QUnit.cases.init([{ title: 'loaded' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = imagePreloader.init();

        assert.equal(typeof preloader[data.title], 'function', `The preloader has the method ${data.title}`);
    });

    QUnit.module('behavior');

    QUnit.test('load/unload', assert => {
        assert.expect(4);
        const ready = assert.async();
        const preloader = imagePreloader.init();
        const data = {
            asset: 'sample.jpg',
            itemIdentifier: 'item-1'
        };
        const assetUrl = `./${data.asset}`;

        //Hack the Image element to assert the load
        window.Image = function () {
            assert.ok(true, 'A new image is created');
        };
        Object.defineProperty(window.Image.prototype, 'src', {
            set: function src(url) {
                assert.equal(url, assetUrl, 'The image has been preloaded');
            }
        });

        preloader
            .load(assetUrl, data.asset, data.itemIdentifier)
            .then(() => {
                assert.ok(preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been preloaded');
            })
            .then(() => preloader.unload(assetUrl, data.asset, data.itemIdentifier))
            .then(() => {
                assert.ok(!preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been unloaded');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
