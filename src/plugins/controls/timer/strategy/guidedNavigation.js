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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Timer strategy that enforce the test taker to stay in
 * front of the item until the timer completes,
 * by hidding the navigation elements.
 * Once the timer completes, the test moves to the next item.
 *
 * Applies on item scope, locked timers only, linear test part and
 * the test configuration "guidedNavigation"
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

/**
 * Creates the strategy if it applies to the given timer
 * @param {runner} testRunner
 * @param {Object} timer
 * @returns {strategy|Boolean} the strategy if applies or false
 */
export default function guidedNavigationStrategy(testRunner, timer) {
    const testRunnerOptions = testRunner.getOptions();
    const testPart = testRunner.getCurrentPart();

    if (
        timer &&
        timer.type === 'locked' &&
        timer.scope === 'item' &&
        testRunnerOptions.guidedNavigation === true &&
        testPart && testPart.isLinear
    ) {
        return {
            name: 'guidedNavigation',

            /**
             * setUp entry point : hides the navigation
             */
            setUp: function setUp() {
                testRunner.trigger('hidenav');
            },

            /**
             * complete entry point : enables back the navigation
             */
            complete: function complete() {
                testRunner.trigger('disableitem disablenav shownav');

                setTimeout(function() {
                    testRunner.trigger('move', 'next', 'item');
                }, 500);
            }
        };
    }
    return false;
}
