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
 * Copyright (c) 2017-2019 Open Assessment Technologies SA ;
 */

/**
 * Test of taoQtiTest/runner/proxy/cache/itemStore
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['taoQtiTest/runner/proxy/cache/itemStore'], function (itemStoreFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(1);

        assert.equal(typeof itemStoreFactory, 'function', 'The module exposes a function');
    });

    QUnit.test('factory', assert => {
        assert.expect(2);

        assert.equal(typeof itemStoreFactory(), 'object', 'The factory creates an object');
        assert.notDeepEqual(itemStoreFactory(), itemStoreFactory(), 'The factory creates a new object');
    });

    QUnit.cases
        .init([
            { title: 'has' },
            { title: 'get' },
            { title: 'set' },
            { title: 'update' },
            { title: 'remove' },
            { title: 'prune' },
            { title: 'clear' },
            { title: 'setCacheSize' },
            { title: 'setItemTTL' }
        ])
        .test('instance API ', (data, assert) => {
            assert.expect(1);

            const itemStore = itemStoreFactory();

            assert.equal(typeof itemStore[data.title], 'function', `The store exposes the method ${data.title}`);
        });

    QUnit.module('behavior');

    QUnit.test('basic access', assert => {
        const ready = assert.async();
        const item = { foo: true };
        const key = 'item1';

        assert.expect(6);

        const itemStore = itemStoreFactory();
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        assert.equal(itemStore.has(key), false, 'The store does not contains the given item');
        itemStore
            .get(key)
            .then(value => {
                assert.equal(typeof value, 'undefined', 'The store does not contains the given item');
            })
            .then(() => itemStore.set(key, item))
            .then(assigned => {
                assert.ok(assigned, 'The value assignment is done');
                assert.ok(itemStore.has(key), 'The store contains the given item');
                return itemStore.get(key);
            })
            .then(value => {
                assert.deepEqual(value, item, 'The store gives the correct item');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('limited size', assert => {
        const ready = assert.async();
        assert.expect(15);

        const itemStore = itemStoreFactory({ maxSize: 4 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        itemStore
            .set('item1', { name: 'item1' })
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
            })
            .then(() => itemStore.set('item2', { name: 'item2' }))
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
            })
            .then(() => itemStore.set('item3', { name: 'item3' }))
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
            })
            .then(() => itemStore.set('item4', { name: 'item4' }))
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
                assert.ok(itemStore.has('item4'), 'The store contains the given item');
            })
            .then(() => itemStore.set('item5', { name: 'item5' }))
            .then(() => {
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
                assert.ok(itemStore.has('item4'), 'The store contains the given item');
                assert.ok(itemStore.has('item5'), 'The store contains the given item');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('limited TTL', assert => {
        const ready = assert.async();
        assert.expect(3);

        const itemStore = itemStoreFactory({ itemTTL: 10 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        itemStore
            .set('item1', { name: 'item1' })
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
            })
            .then(() => new Promise(resolve => setTimeout(resolve, 50)))
            .then(() => {
                assert.ok(!itemStore.has('item1'), 'The store does not contain the given item anymore');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('remove', assert => {
        const ready = assert.async();
        assert.expect(13);

        const itemStore = itemStoreFactory({ maxSize: 4 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        Promise.all([
            itemStore.set('item1', { name: 'item1' }),
            itemStore.set('item2', { name: 'item2' }),
            itemStore.set('item3', { name: 'item3' }),
            itemStore.set('item4', { name: 'item4' })
        ])
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
                assert.ok(itemStore.has('item4'), 'The store contains the given item');
            })
            .then(() => itemStore.remove('item3'))
            .then(removed => {
                assert.ok(removed, 'The removal went well');
                assert.ok(!itemStore.has('item3'), 'The item was removed from the store');
            })
            .then(() => {
                assert.ok(!itemStore.has('zoobizoob'), 'The item does not exists');
                return itemStore.remove('zoobizoob');
            })
            .then(removed => {
                assert.ok(!removed, 'Nothing to remove');
            })
            .then(() => itemStore.set('item5', { name: 'item5' }))
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item4'), 'The store contains the given item');
                assert.ok(itemStore.has('item5'), 'The store contains the given item');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('update', assert => {
        const ready = assert.async();
        assert.expect(9);

        const itemStore = itemStoreFactory({ maxSize: 4 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        Promise.all([
            itemStore.set('item1', { name: 'item1' }),
            itemStore.set('item2', {
                name: 'item2',
                response: ['choice1', 'choice2'],
                some: 'data'
            }),
            itemStore.set('item3', { name: 'item3' })
        ])
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
            })
            .then(() => itemStore.update('item2', 'response', []))
            .then(() => itemStore.update('item2', 'some', 'thing else'))
            .then(updated => {
                assert.ok(updated, 'The updated went well');
                assert.ok(itemStore.has('item2'), 'The item is still in the store from the store');

                return itemStore.get('item2');
            })
            .then(newItem => {
                assert.deepEqual(
                    newItem,
                    {
                        name: 'item2',
                        response: [],
                        some: 'thing else'
                    },
                    'The item has been updated correclty'
                );
            })
            .then(() => {
                assert.ok(!itemStore.has('zoobizoob'), 'The item does not exists');
                return itemStore.update('zoobizoob', 'nope', true);
            })
            .then(updated => {
                assert.ok(!updated, 'Nothing to update');
            })
            .then(() => {
                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('prune', assert => {
        const ready = assert.async();
        assert.expect(8);

        const itemStore = itemStoreFactory({ itemTTL: 10 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        itemStore
            .set('item1', { name: 'item1' })
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');

                return new Promise(resolve => setTimeout(resolve, 50));
            })
            .then(() => {
                assert.ok(!itemStore.has('item1'), 'The store does not contain the given item anymore');

                return itemStore.remove('item1');
            })
            .then(result => {
                assert.ok(result, 'The item has been removed');
                return itemStore.set('item1', { name: 'item1' });
            })
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');

                return new Promise(resolve => setTimeout(resolve, 50));
            })
            .then(() => {
                assert.ok(!itemStore.has('item1'), 'The store does not contain the given item anymore');

                return itemStore.prune();
            })
            .then(() => {
                assert.ok(!itemStore.has('item1'), 'The store does not contain the given item anymore');

                return itemStore.remove('item1');
            })
            .then(result => {
                assert.ok(!result, 'The item has already been removed');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('clear', assert => {
        const ready = assert.async();
        assert.expect(8);

        const itemStore = itemStoreFactory({ maxSize: 4 });
        assert.equal(typeof itemStore, 'object', 'The store is an object');

        Promise.all([
            itemStore.set('item1', { name: 'item1' }),
            itemStore.set('item2', { name: 'item2' }),
            itemStore.set('item3', { name: 'item3' })
        ])
            .then(() => {
                assert.ok(itemStore.has('item1'), 'The store contains the given item');
                assert.ok(itemStore.has('item2'), 'The store contains the given item');
                assert.ok(itemStore.has('item3'), 'The store contains the given item');
            })
            .then(() => itemStore.clear())
            .then(cleared => {
                assert.ok(cleared, 'The clear wen well');
                assert.ok(!itemStore.has('item1'), 'The item was removed from the store');
                assert.ok(!itemStore.has('item2'), 'The item was removed from the store');
                assert.ok(!itemStore.has('item3'), 'The item was removed from the store');

                ready();
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });
});
