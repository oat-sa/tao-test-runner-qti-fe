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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Helps you build URLs based on the API patterns
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
export default {
    /**
     * Let's you create the endpoint URL by concat
     * ${rootUrl}/${path}/${path}...
     *
     * @param {String} rootUrl - configuration endpoint rootUrl
     * @param {String...} paths - path chunks
     * @returns {String} the URL
     */
    urlFromPaths(rootUrl = '', ...paths) {
        return [rootUrl, ...paths].reduce((acc, chunk) => {
            //prevent double slashes in the concat while keeping it inside a chunk (ie. http://)
            if (acc.length && chunk.length) {
                return `${acc.replace(/\/$/, '')}/${chunk.replace(/^\//, '')}`;
            }
            acc += chunk;
            return acc;
        }, '');
    },

    /**
     * Let's you create the endpoint URL based on the following pattern:
     * ${rootUrl}/${path}
     *
     * @param {Object} [options]
     * @param {String} [options.rootUrl] - configuration endpoint rootUrl
     * @param {String} [options.path] - configuration endpoint query path
     * @returns {String} the URL
     */
    urlFromConfig({ rootUrl = '', path = '/api/v1' } = {}) {
        return this.urlFromPaths(rootUrl, path);
    },

    /**
     * Let's you create the endpoint URL based on the following pattern:
     * ${rootUrl}/${path}/${id}/${resource}
     *
     * @param {String} id - the identifier in the path
     * @param {Object} [options]
     * @param {String} [options.rootUrl] - configuration endpoint rootUrl
     * @param {String} [options.path] - configuration endpoint query path
     * @param {String} [options.resource] - configuration endpoint resource name
     * @returns {String} the URL
     */
    urlFromResourceConfig(id = '', { rootUrl = '', path = '/api/v1', resource = '' } = {}) {
        return this.urlFromPaths(rootUrl, path, id, resource);
    }
};
