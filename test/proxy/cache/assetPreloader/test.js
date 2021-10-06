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
 * Test of taoQtiTest/runner/proxy/cache/assetPreloader
 */
define([
    'taoQtiTest/runner/proxy/cache/assetPreloader',
    'taoQtiTest/runner/proxy/cache/preloaders/assets/preloaders'
], function (assetPreloaderFactory, preloaders) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(3);

        assert.equal(typeof assetPreloaderFactory, 'function', 'The module exposes a function');
        assert.equal(typeof assetPreloaderFactory(), 'object', 'The module is a factory');
        assert.notDeepEqual(assetPreloaderFactory(), assetPreloaderFactory(), 'The factory creates new instances');
    });

    QUnit.cases.init([{ title: 'has' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = assetPreloaderFactory();

        assert.equal(typeof preloader[data.title], 'function', `The assets preloader has the method ${data.title}`);
    });

    QUnit.module('behavior', {
        beforeEach() {
            preloaders.splice(0, preloaders.length);
        }
    });

    QUnit.test('has', assert => {
        assert.expect(4);
        const expectedAssetManager = {};
        const cssPreloaderFactory = assetManager => {
            assert.ok(true, 'CSS preloader created');
            assert.strictEqual(assetManager, expectedAssetManager, 'The expected assetManager has been given');
            return {
                name: 'css',
                load() {
                    assert.ok(false, 'The asset should not be loaded');
                },
                unload() {
                    assert.ok(false, 'The asset should not be unloaded');
                }
            };
        };
        preloaders.push(cssPreloaderFactory);
        const preloader = assetPreloaderFactory(expectedAssetManager);

        assert.ok(preloader.has('css'), 'The asset preloader has a CSS preloader');
        assert.ok(!preloader.has('dummy'), 'The asset preloader does not have a dummy preloader');
    });

    QUnit.test('load', assert => {
        assert.expect(8);
        const ready = assert.async();
        const expectedAssetManager = {};
        const expectedUrl = 'sample.css';
        const expectedSourceUrl = 'http://test.com/sample.css';
        const expectedItemIdentifier = 'item-1';
        const cssPreloaderFactory = assetManager => {
            assert.ok(true, 'CSS preloader created');
            assert.strictEqual(assetManager, expectedAssetManager, 'The expected assetManager has been given');
            return {
                name: 'css',
                load(url, sourceUrl, itemIdentifier) {
                    assert.strictEqual(url, expectedUrl, 'The expected url has been given');
                    assert.strictEqual(sourceUrl, expectedSourceUrl, 'The expected source url has been given');
                    assert.strictEqual(
                        itemIdentifier,
                        expectedItemIdentifier,
                        'The expected item identifier has been given'
                    );
                    assert.ok(true, 'The asset is loaded');
                    return Promise.resolve();
                },
                unload() {
                    assert.ok(false, 'The asset should not be unloaded');
                }
            };
        };
        preloaders.push(cssPreloaderFactory);
        const preloader = assetPreloaderFactory(expectedAssetManager);
        preloader
            .load('css', expectedUrl, expectedSourceUrl, expectedItemIdentifier)
            .then(() => {
                assert.ok(true, 'The asset preloader loaded asset');
            })
            .then(() => preloader.load('dummy'))
            .then(() => {
                assert.ok(true, 'The asset preloader accept unknown loader without failing');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });

    QUnit.test('unload', assert => {
        assert.expect(8);
        const ready = assert.async();
        const expectedAssetManager = {};
        const expectedUrl = 'sample.css';
        const expectedSourceUrl = 'http://test.com/sample.css';
        const expectedItemIdentifier = 'item-1';
        const cssPreloaderFactory = assetManager => {
            assert.ok(true, 'CSS preloader created');
            assert.strictEqual(assetManager, expectedAssetManager, 'The expected assetManager has been given');
            return {
                name: 'css',
                load() {
                    assert.ok(false, 'The asset should not be loaded');
                },
                unload(url, sourceUrl, itemIdentifier) {
                    assert.strictEqual(url, expectedUrl, 'The expected url has been given');
                    assert.strictEqual(sourceUrl, expectedSourceUrl, 'The expected source url has been given');
                    assert.strictEqual(
                        itemIdentifier,
                        expectedItemIdentifier,
                        'The expected item identifier has been given'
                    );
                    assert.ok(true, 'The asset is unloaded');
                    return Promise.resolve();
                }
            };
        };
        preloaders.push(cssPreloaderFactory);
        const preloader = assetPreloaderFactory(expectedAssetManager);
        preloader
            .unload('css', expectedUrl, expectedSourceUrl, expectedItemIdentifier)
            .then(() => {
                assert.ok(true, 'The asset preloader unloaded asset');
            })
            .then(() => preloader.unload('dummy'))
            .then(() => {
                assert.ok(true, 'The asset preloader accept unknown loader without failing');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
