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
 * Copyright (c) 2026 Open Assessment Technologies SA ;
 */

/**
 * Resolves a worker URL relative to the current module file.
 * @param {Object} currentModule
 * @param {string} workerRelativePath
 * @returns {string|null}
 */
export function resolveWorkerUrl(currentModule, workerRelativePath) {
    if (!workerRelativePath) {
        return null;
    }

    if (typeof require === 'function' && require.toUrl) {
        return require.toUrl(workerRelativePath);
    }

    if (!currentModule?.uri) {
        return null;
    }

    if (typeof URL !== 'undefined') {
        return new URL(workerRelativePath, currentModule.uri).toString();
    }

    return null;
}

/**
 * Creates SharedWorker instance by URL.
 * @param {string} workerUrl
 * @returns {SharedWorker|null}
 */
export function createSharedWorker(workerUrl) {
    if (typeof window === 'undefined' || typeof SharedWorker === 'undefined' || !workerUrl) {
        return null;
    }

    return new SharedWorker(workerUrl);
}
