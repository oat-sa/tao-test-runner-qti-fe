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
 * Timer strategy that warns the user when he leaves a timed section
 *
 * Applies on section scope, max timers.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import __ from 'i18n';
import messages from 'taoQtiTest/runner/helpers/messages';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import states from 'taoQtiTest/runner/config/states';
import mapHelper from 'taoQtiTest/runner/helpers/map';

/**
 * The message to display when exiting
 */
var exitMessage = __('Once you close this section, you cannot return to it or change your answers.');

/**
 * Creates the strategy if it applies to the given timer
 * @param {runner} testRunner
 * @param {Object} timer
 * @returns {strategy|Boolean} the strategy if applies or false
 */
export default function warnSectionLeavingStrategy(testRunner, timer) {
    /**
     * Check if the movment leads to leaving an active timed section
     * @param {String} direction - the move direction (next, previous or jump)
     * @param {String} scope - the move scope (item, section, testPart)
     * @param {Number} [position] - the position in case of jump
     * @returns {Boolean}
     */
    var leaveTimedSection = function leaveTimedSection(direction, scope, position) {
        var context = testRunner.getTestContext();
        var map = testRunner.getTestMap();
        if (
            !context.isTimeout &&
            context.itemSessionState !== states.itemSession.closed &&
            context.sectionId === timer.source
        ) {
            return navigationHelper.isLeavingSection(context, map, direction, scope, position);
        }
        return false;
    };

    if (timer && timer.scope === 'section' && timer.type === 'max') {
        return {
            name: 'warnSectionLeaving',

            /**
             * setUp entry point : blocks the move to display a message if needed
             */
            setUp: function setUp() {
                testRunner
                    .off('move.warntimedsection skip.warntimedsection')
                    .before('move.warntimedsection skip.warntimedsection', function(e, type, scope, position) {
                        const testContext = testRunner.getTestContext();
                        const testMap     = testRunner.getTestMap();
                        const testRunnerOptions = testRunner.getOptions();
                        const timerConfig = testRunnerOptions.timer || {};
                        const itemIdentifier = testContext.itemIdentifier;
                        const isLast = navigationHelper.isLast(testMap, itemIdentifier);
                        const endTestWarning = mapHelper.hasItemCategory(testMap, itemIdentifier, 'endTestWarning', true);
                        const noExitTimedSectionWarning = mapHelper.hasItemCategory(testMap, itemIdentifier, 'noExitTimedSectionWarning', true);

                        var movePromise = new Promise(function(resolve, reject) {
                            // endTestWarning has already been displayed, so we don't repeat the warning
                            if (isLast && endTestWarning) {
                                resolve();
                                // display a message if we exit a timed section
                            } else if (
                                leaveTimedSection(type || 'next', scope, position) &&
                                !noExitTimedSectionWarning &&
                                !timerConfig.keepUpToTimeout
                            ) {
                                testRunner.trigger(
                                    'confirm.exittimed',
                                    messages.getExitMessage('section', testRunner, exitMessage),
                                    resolve,
                                    reject,
                                    {
                                        buttons: {
                                            labels: {
                                                ok: __('Close this Section'),
                                                cancel: __('Review my Answers')
                                            }
                                        }
                                    }
                                );
                            } else {
                                resolve();
                            }
                        });

                        movePromise.catch(function cancelMove() {
                            // Use `defer` to be sure the timer resume will occur after the move event is
                            // finished to be handled. Otherwise, the duration plugin will be frozen and
                            // the additional time will not be taken into account!
                            _.defer(function() {
                                testRunner.trigger('enableitem enablenav');
                            });
                        });

                        return movePromise;
                    });
            },

            /**
             * complete entry point : removes the listeners
             */
            complete: function complete() {
                return this.tearDown();
            },

            /**
             * tearDown entry point : removes the listeners
             */
            tearDown: function tearDown() {
                testRunner.off('move.warntimedsection skip.warntimedsection');
            }
        };
    }
    return false;
}
