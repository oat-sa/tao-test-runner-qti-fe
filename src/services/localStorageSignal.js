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
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA.
 */

import loggerFactory from 'core/logger';

const logger = loggerFactory('taoQtiTest/runner/services/localStorageSignal');

/**
 * @param {string} signalKey
 * @param {string} payload
 */
export function emitStorageSignal(signalKey, payload) {
    try {
        window.localStorage.setItem(signalKey, `${payload}:${Date.now()}`);
    } catch (error) {
        logger.warn(`Unable to emit storage signal for key "${signalKey}".`, error);
    }
}

/**
 * @param {string} signalKey
 * @param {Function} onSignal
 * @param {number} delayMs
 * @returns {Function: void}
 */
export function createStorageSignalWatcher(signalKey, onSignal, delayMs = 120) {
    const onStorageChanged = event => {
        if (event && event.key && event.key !== signalKey) {
            return;
        }

        onSignal();
        setTimeout(onSignal, delayMs);
    };

    window.addEventListener('storage', onStorageChanged);

    return () => {
        window.removeEventListener('storage', onStorageChanged);
    };
}
