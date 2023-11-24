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
import store from 'core/store';

const STORE_ID = 'current';
const SEQUENCE_NUMBER = 'sequence';

export default {
    /**
     * Creates a store for the sequence number for the session.
     * @returns {Promise} - Resolved with the store API.
     */
    getSequenceStore() {
        return store(STORE_ID).then(sequenceStore => ({
            /**
             * Stores the sequence number for the session.
             * @param {string} sequenceNumber - The new sequence number to set for the session.
             * @returns {Promise} - Resolved once the sequence number has been stored.
             */
            setSequenceNumber(sequenceNumber) {
                return sequenceStore.setItem(SEQUENCE_NUMBER, sequenceNumber);
            },

            /**
             * Reads the sequence number for the session from the storage.
             * @returns {Promise<string>} - Resolved with the sequence number for the session.
             */
            getSequenceNumber() {
                return sequenceStore.getItem(SEQUENCE_NUMBER);
            }
        }));
    },

    /**
     * Creates a sequence number for the test runner.
     * @returns {Promise<string>} - Resolved with sequence number for the session.
     */
    getSequenceNumber(testRunner) {
        return testRunner
            .getTestStore()
            .getStorageIdentifier()
            .then(storeId => `${storeId}-${Date.now()}`);
    }
};
