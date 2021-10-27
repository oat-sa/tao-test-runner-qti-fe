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
 * Test of taoQtiTest/runner/proxy/cache/preloaders/assets/audio
 */
define(['taoQtiTest/runner/proxy/cache/preloaders/assets/audio'], function (audioPreloader) {
    'use strict';

    function assetManagerFactory() {
        const strategies = [];
        return {
            prependStrategy(strategy) {
                strategies.push(strategy);
            },
            resolve(url, data) {
                for (const strategy of strategies) {
                    const resolved = strategy.handle(url, data);
                    if (resolved) {
                        return resolved;
                    }
                }
                return false;
            }
        };
    }

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(5);
        assert.equal(typeof audioPreloader, 'object', 'The module exposes an object');
        assert.equal(audioPreloader.name, 'audio', 'The preloader has a name');
        assert.equal(typeof audioPreloader.init, 'function', 'The preloader has an init method');
        assert.equal(typeof audioPreloader.init(assetManagerFactory()), 'object', 'The preloaded has a factory');
        assert.notDeepEqual(
            audioPreloader.init(assetManagerFactory()),
            audioPreloader.init(assetManagerFactory()),
            'The factory creates new instances'
        );
    });

    QUnit.cases.init([{ title: 'loaded' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = audioPreloader.init(assetManagerFactory());

        assert.equal(typeof preloader[data.title], 'function', `The preloader has the method ${data.title}`);
    });

    QUnit.module('behavior');

    QUnit.test('load/unload', assert => {
        assert.expect(5);
        const ready = assert.async();
        const assetManager = assetManagerFactory();
        const preloader = audioPreloader.init(assetManager);
        const data = {
            asset: 'sample.mp3',
            itemIdentifier: 'item-1'
        };
        const assetUrl = `./${data.asset}`;

        preloader
            .load(assetUrl, data.asset, data.itemIdentifier)
            .then(() => {
                assert.ok(
                    /^blob/.test(assetManager.resolve(data.asset, data)),
                    'The mp3 sample was resolved as a blob'
                );
                assert.ok(preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been preloaded');
            })
            .then(() => preloader.load(assetUrl, data.asset, data.itemIdentifier))
            .then(() => {
                assert.ok(
                    /^blob/.test(assetManager.resolve(data.asset, data)),
                    'The mp3 sample was resolved as a blob'
                );
            })
            .then(() => preloader.unload(assetUrl, data.asset, data.itemIdentifier))
            .then(() => {
                assert.strictEqual(
                    assetManager.resolve(data.asset, data),
                    false,
                    'The mp3 sample is not resolved anymore'
                );
                assert.ok(!preloader.loaded(assetUrl, data.asset, data.itemIdentifier), 'The asset has been unloaded');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
