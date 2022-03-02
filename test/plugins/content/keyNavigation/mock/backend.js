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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
/**
 * Test Runner backend mock: simulate the backend for a basic navigation
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'context',
    'taoQtiTest/runner/helpers/map',
    'taoQtiTest/runner/helpers/testContextBuilder',
    'lib/jquery.mockjax'
], function (
    $,
    context,
    mapHelper,
    testContextBuilder
) {
    'use strict';

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Provision the context with a proper root url to prevent failure from the URL helper
    context.root_url = window.location.origin;

    /**
     * Mocks the backend
     *
     * @param {Object} testDefinition
     * @param {Object} itemsBank
     * @param {Object} rubricsBank
     * @returns {backend}
     */
    return function backendFactory(testDefinition, itemsBank, rubricsBank = {}) {
        let {testData, testContext, testMap} = testDefinition;

        /**
         * Gets the item id targeted by an URL
         * @param {String} url
         * @returns {String}
         */
        const getItemId = url => {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;
            return params && params.get('itemDefinition');
        };

        /**
         * Defines the backend API
         * @typedef {Object} backend
         * @type {backend}
         */
        const backend = {
            /**
             * Gets the test data
             * @returns {Object}
             */
            getTestData() {
                return testData;
            },

            /**
             * Sets the test data
             * @param {Object} data
             * @returns {backend}
             */
            setTestData(data) {
                testData = data;
                return this;
            },

            /**
             * Gets the test context
             * @returns {Object}
             */
            getTestContext() {
                return testContext;
            },

            /**
             * Sets the test context
             * @param {Object} data
             * @returns {backend}
             */
            setTestContext(data) {
                testContext = data;
                return this;
            },

            /**
             * Gets the test map
             * @returns {Object}
             */
            getTestMap() {
                return testMap;
            },

            /**
             * Sets the test map
             * @param {Object} data
             * @returns {backend}
             */
            setTestMap(data) {
                testMap = data;
                return this;
            },

            /**
             * Gets the bank of items
             * @returns {Object}
             */
            getItemsBank() {
                return itemsBank;
            },

            /**
             * Sets the bank of items
             * @param {Object} data
             * @returns {backend}
             */
            setItemsBank(data) {
                itemsBank = data;
                return this;
            },

            /**
             * Gets a particular item
             * @param {String} itemId
             * @returns {Object}
             */
            getItem(itemId) {
                return itemsBank[itemId];
            },

            /**
             * Sets a particular item
             * @param {String} itemId
             * @param {Object} itemData
             * @returns {backend}
             */
            setItem(itemId, itemData) {
                itemsBank[itemId] = itemData;
                return this;
            },

            /**
             * Gets the bank of rubrics
             * @returns {Object}
             */
            getRubricsBank() {
                return rubricsBank;
            },

            /**
             * Sets the bank of rubrics
             * @param {Object} data
             * @returns {backend}
             */
            setRubricsBank(data) {
                rubricsBank = data;
                return this;
            },

            /**
             * Gets rubrics for a particular section
             * @param {String} sectionId
             * @returns {Object}
             */
            getRubric(sectionId) {
                return rubricsBank[sectionId];
            },

            /**
             * Sets rubrics for a particular section
             * @param {String} sectionId
             * @param {Object} rubrics
             * @returns {backend}
             */
            setRubric(sectionId, rubrics) {
                rubricsBank[sectionId] = rubrics;
                return this;
            },

            /**
             * Basic navigator to move inside the test. Returns the test context
             *
             * @param {String} itemId
             * @param {String} direction
             * @param {String} ref
             * @returns {Object}
             */
            navigator(itemId, direction, ref) {
                const item = mapHelper.getItem(testMap, itemId);
                const last = testMap.jumps.length - 1;
                const actions = {
                    next() {
                        return item.position < last ? item.position + 1 : 0;
                    },
                    previous() {
                        return Math.max(0, item.position - 1);
                    },
                    jump() {
                        return ref;
                    }
                };
                const action = actions[direction] || actions.next();
                const newTextContext = testContextBuilder.buildTestContextFromPosition(testContext, testMap, action(), 1);
                const rubricBlocks = backend.getRubric(newTextContext.sectionId);
                if (rubricBlocks) {
                    Object.assign(newTextContext, rubricBlocks);
                }
                return newTextContext;
            }
        };

        // The test map must contain a jumps table
        mapHelper.createJumpTable(testMap);

        // Mock the queries
        $.mockjax({
            url: '/init*',
            response: function () {
                this.responseText = {
                    success: true,
                    toolStates: [],
                    lastStoreId: false,
                    messages: [],
                    testData,
                    testContext,
                    testMap
                };
            }
        });
        $.mockjax({
            url: '/getItem*',
            response: function (settings) {
                const itemId = getItemId(settings.url);
                this.responseText = backend.getItem(itemId);
            }
        });
        $.mockjax({
            url: '/move*',
            response: function (settings) {
                const itemId = getItemId(settings.url);
                const {direction, ref} = settings.data;

                this.responseText = {
                    success: true,
                    testContext: backend.navigator(itemId, direction, ref)
                };
            }
        });

        return backend;
    };
});
