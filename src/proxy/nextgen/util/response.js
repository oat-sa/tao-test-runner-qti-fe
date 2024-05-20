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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * If a "response" object (can be the item state or item response or both)
 * contains some promise, we wait for those promises to resolve and replace them by their current value.
 * @param {Object} response
 * @returns {Promise<Object>} the resolved response
 */
export function waitForResponsePromises(response) {
    if (!response || typeof response !== 'object') {
        return Promise.resolve(response);
    }
    const asyncResponses = [];

    //TODO it can be safer to have a deep clone and update the result of the promise into the clone
    const resolvedResponse = Object.assign({}, response);
    const extractPromises = targetObject => {
        if (targetObject && typeof targetObject === 'object') {
            for (let key of Object.keys(targetObject)) {
                if (targetObject[key] instanceof Promise) {
                    const responsePromise = targetObject[key];

                    //tells the promise has a consumer,
                    //and the consumer will handle the rejection
                    responsePromise.handled = true;

                    asyncResponses.push(
                        new Promise((resolve, reject) => {
                            responsePromise
                                .then(result => {
                                    //once resolved, the response is updated
                                    //with the promise result
                                    targetObject[key] = result;
                                    resolve();
                                })
                                .catch(reject);
                        })
                    );
                } else {
                    extractPromises(targetObject[key]);
                }
            }
        }
    };
    extractPromises(resolvedResponse);
    return Promise.all(asyncResponses).then(() => resolvedResponse);
}
