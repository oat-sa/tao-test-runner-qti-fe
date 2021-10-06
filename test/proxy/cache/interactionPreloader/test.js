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
 * Test of taoQtiTest/runner/proxy/cache/interactionPreloader
 */
define([
    'taoQtiTest/runner/proxy/cache/interactionPreloader',
    'taoQtiTest/runner/proxy/cache/preloaders/interactions/preloaders'
], function (interactionPreloaderFactory, preloaders) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(3);

        assert.equal(typeof interactionPreloaderFactory, 'function', 'The module exposes a function');
        assert.equal(typeof interactionPreloaderFactory(), 'object', 'The module is a factory');
        assert.notDeepEqual(interactionPreloaderFactory(), interactionPreloaderFactory(), 'The factory creates new instances');
    });

    QUnit.cases.init([{ title: 'has' }, { title: 'load' }, { title: 'unload' }]).test('method ', (data, assert) => {
        assert.expect(1);
        const preloader = interactionPreloaderFactory();

        assert.equal(typeof preloader[data.title], 'function', `The interactions preloader has the method ${data.title}`);
    });

    QUnit.module('behavior', {
        beforeEach() {
            preloaders.splice(0, preloaders.length);
        }
    });

    QUnit.test('has', assert => {
        assert.expect(3);
        const preloaderFactory = () => {
            assert.ok(true, 'Interaction preloader created');
            return {
                name: 'interaction',
                load() {
                    assert.ok(false, 'The interaction should not be loaded');
                },
                unload() {
                    assert.ok(false, 'The interaction should not be unloaded');
                }
            };
        };
        preloaders.push(preloaderFactory);
        const preloader = interactionPreloaderFactory();

        assert.ok(preloader.has('interaction'), 'The interaction preloader has a interaction preloader');
        assert.ok(!preloader.has('dummy'), 'The interaction preloader does not have a dummy preloader');
    });

    QUnit.test('load', assert => {
        assert.expect(7);
        const ready = assert.async();
        const expectedInteraction = {
            attributes: {},
            qtiClass: 'interaction'
        };
        const expectedItemData = {};
        const expectedItemIdentifier = 'item-1';
        const preloaderFactory = () => {
            assert.ok(true, 'Interaction preloader created');
            return {
                name: 'interaction',
                load(interaction, itemData, itemIdentifier) {
                    assert.strictEqual(interaction, expectedInteraction, 'The expected interaction has been given');
                    assert.strictEqual(itemData, expectedItemData, 'The expected itemData has been given');
                    assert.strictEqual(
                        itemIdentifier,
                        expectedItemIdentifier,
                        'The expected item identifier has been given'
                    );
                    assert.ok(true, 'The interaction is loaded');
                    return Promise.resolve();
                },
                unload() {
                    assert.ok(false, 'The interaction should not be unloaded');
                }
            };
        };
        preloaders.push(preloaderFactory);
        const preloader = interactionPreloaderFactory();
        preloader
            .load('interaction', expectedInteraction, expectedItemData, expectedItemIdentifier)
            .then(() => {
                assert.ok(true, 'The interaction preloader loaded interaction');
            })
            .then(() => preloader.load('dummy'))
            .then(() => {
                assert.ok(true, 'The interaction preloader accept unknown loader without failing');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });

    QUnit.test('unload', assert => {
        assert.expect(7);
        const ready = assert.async();
        const expectedInteraction = {
            attributes: {},
            qtiClass: 'interaction'
        };
        const expectedItemData = {};
        const expectedItemIdentifier = 'item-1';
        const preloaderFactory = () => {
            assert.ok(true, 'Interaction preloader created');
            return {
                name: 'interaction',
                load() {
                    assert.ok(false, 'The interaction should not be loaded');
                },
                unload(interaction, itemData, itemIdentifier) {
                    assert.strictEqual(interaction, expectedInteraction, 'The expected interaction has been given');
                    assert.strictEqual(itemData, expectedItemData, 'The expected itemData has been given');
                    assert.strictEqual(
                        itemIdentifier,
                        expectedItemIdentifier,
                        'The expected item identifier has been given'
                    );
                    assert.ok(true, 'The interaction is unloaded');
                    return Promise.resolve();
                }
            };
        };
        preloaders.push(preloaderFactory);
        const preloader = interactionPreloaderFactory();
        preloader
            .unload('interaction', expectedInteraction, expectedItemData, expectedItemIdentifier)
            .then(() => {
                assert.ok(true, 'The interaction preloader unloaded interaction');
            })
            .then(() => preloader.unload('dummy'))
            .then(() => {
                assert.ok(true, 'The interaction preloader accept unknown loader without failing');
            })
            .catch(err => assert.ok(false, err))
            .then(ready);
    });
});
