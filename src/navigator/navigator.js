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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */

/**
 * Navigate inside a test based on the information we have (testMap and testContext),
 * we can't guess some of the information, so we're back to the default values :
 *  - rubric blocks (we just leave it, except if we change the section)
 *  - timers (we remove them if we change the scope)
 *  - attempts (we calculated the remaining attempts based on the last known value)
 *  - feedback is not supported
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import testContextBuilder from 'taoQtiTest/runner/helpers/testContextBuilder';

/**
 * Gives you a navigator
 * @param {Object} testContext
 * @param {Object} testMap
 * @returns {Object} the navigator
 * @throws {TypeError} if the given parameters aren't objects
 */
var navigatorFactory = function navigatorFactory(testContext, testMap, itemStore) {
    if (!_.all([testContext, testMap], _.isPlainObject)) {
        throw new TypeError('The navigator must be built with a testData, a testContext and a testMap');
    }

    return {
        /**
         * Selects and execute the navigation method based on the direction/scope.
         *
         * @param {String} direction - the move direction (next, previous or jump)
         * @param {String} scope - the move scope (item, section, testPart)
         * @param {Number} [position] - the position in case of jump
         * @returns {Promise} - the result of the nav
         */
        navigate: function navigate(direction, scope, position) {
            return new Promise(function(resolve, reject) {
                var methodName = direction.toLowerCase() + scope.substr(0, 1).toUpperCase() + scope.substr(1).toLowerCase();

                if (_.isFunction(this[methodName])) {
                    this[methodName](position, attempt)
                        then(newTestContext => resolve(newTestContext))
                        .catch(() => reject);
                }
                
                reject();
            });

        },

        /**
         * Navigate to the next item
         * @returns {Promise} the new test context
         */
        nextItem: function nextItem() {
            return this.jumpItem(testContext.itemPosition + 1);
        },

        /**
         * Navigate to the next item
         * @returns {Promise} the new test context
         */
        previousItem: function previsousItem() {
            return this.jumpItem(testContext.itemPosition - 1);
        },

        /**
         * Navigate to the next item
         * @returns {Promise} the new test context
         */
        nextSection: function nextSection() {
            var sectionStats = mapHelper.getSectionStats(testMap, testContext.sectionId);
            var section = mapHelper.getSection(testMap, testContext.sectionId);

            return this.jumpItem(section.position + sectionStats.total);
        },

        /**
         * Navigate to the given position
         * @param {Number} position - the position
         * @returns {Promise} the new test context
         */
        jumpItem: function jumpItem(position) {
            var item = mapHelper.getItemAt(updatedMap, position);
            if (item && itemStore.has(item.id)) {
                return itemStore.get(item.id)
                    .then(itemFromStore => {
                        const newTestContext = testContextBuilder.buildTestContextFromPosition(testContext, testMap, position, itemFromStore.attempt)
                        return itemStore.update(newTestContext.itemIdentifier, 'attempt', newTestContext.attempt)
                            .then(() => newTestContext);
                    })
            }
            return Promise.resolve(testContextBuilder.buildTestContextFromPosition(testContext, testMap, position));
        }
    };
};

export default navigatorFactory;
