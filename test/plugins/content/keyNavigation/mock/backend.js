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
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/init.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json',
    'lib/jquery.mockjax'
], function (
    $,
    context,
    mapHelper,
    testContextBuilder,
    initData,
    itemData
) {
    'use strict';

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Provision the context with a proper root url to prevent failure from the URL helper
    context.root_url = window.location.origin;

    // Basic navigator to move inside the test
    function navigator(itemId, direction, ref) {
        const {testMap, testContext} = initData;
        mapHelper.createJumpTable(testMap);
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
        return testContextBuilder.buildTestContextFromPosition(testContext, testMap, action(), 1);
    }

    // Mock the queries
    $.mockjax({
        url: '/init*',
        responseText: initData
    });
    $.mockjax({
        url: '/getItem*',
        response: function(settings) {
            const url = new URL(settings.url);
            const params = url.searchParams;
            const itemId = params && params.get('itemDefinition');
            this.responseText = itemData[itemId];
        }
    });
    $.mockjax({
        url: '/move*',
        response: function(settings) {
            const url = new URL(settings.url);
            const params = url.searchParams;
            const itemId = params && params.get('itemDefinition');
            const {direction, ref} = settings.data;

            this.responseText = {
                success: true,
                testContext: navigator(itemId, direction, ref)
            };
        }
    });

});
