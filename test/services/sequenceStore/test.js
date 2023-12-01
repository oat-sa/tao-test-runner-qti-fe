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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA ;
 */
define(['taoQtiTest/runner/services/sequenceStore'], function (sequenceStore) {
    'use strict';

    QUnit.module('sequenceStore');

    QUnit.test('is a namespace', function (assert) {
        assert.equal(typeof sequenceStore, 'object');
    });

    QUnit.test('it has the required methods', function (assert) {
        assert.equal(typeof sequenceStore.getSequenceStore, 'function');
        assert.equal(typeof sequenceStore.getSequenceNumber, 'function');
    });

    QUnit.module('sequenceStore.getSequenceStore()');

    QUnit.test('is a factory', function (assert) {
        assert.equal(typeof sequenceStore.getSequenceStore, 'function');
        assert.notEqual(sequenceStore.getSequenceStore(), sequenceStore.getSequenceStore());
    });

    QUnit.test('returns a promise', function (assert) {
        assert.equal(typeof sequenceStore.getSequenceStore(), 'object');
        assert.ok(sequenceStore.getSequenceStore() instanceof Promise);
    });

    QUnit.test('it has the required methods', function (assert) {
        const done = assert.async();
        sequenceStore
            .getSequenceStore()
            .then(sequenceNumber => {
                assert.equal(typeof sequenceNumber.setSequenceNumber, 'function');
                assert.equal(typeof sequenceNumber.getSequenceNumber, 'function');
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(done);
    });

    QUnit.test('write/read the sequence number', function (assert) {
        const done = assert.async();
        sequenceStore
            .getSequenceStore()
            .then(sequenceNumber => {
                const number = '1234-5678';
                return sequenceNumber
                    .setSequenceNumber(number)
                    .then(() => sequenceNumber.getSequenceNumber())
                    .then(value => {
                        assert.equal(value, number);
                    });
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(done);
    });

    QUnit.module('sequenceStore.getSequenceNumber()');

    QUnit.test('returns a sequence number', function (assert) {
        const done = assert.async();
        const now = 1234;
        const identifier = 'test';
        const testRunner = {
            getTestStore() {
                return {
                    getStorageIdentifier() {
                        return Promise.resolve(identifier);
                    }
                };
            }
        };

        Date.now = () => now;

        sequenceStore
            .getSequenceNumber(testRunner)
            .then(sequenceNumber => {
                assert.equal(sequenceNumber, `${identifier}-${now}`);
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(done);
    });
});
