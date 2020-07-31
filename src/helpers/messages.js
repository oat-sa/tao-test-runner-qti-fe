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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */

import __ from 'i18n';
import statsHelper from 'taoQtiTest/runner/helpers/stats';

/**
 * Completes an exit message
 * @param {String} message - custom message that will be appended to the unanswered stats count
 * @param {String} scope - scope to consider for calculating the stats
 * @param {Object} runner - testRunner instance
 * @param {Boolean} sync - flag for sync the unanswered stats in exit message and the unanswered stats in the toolbox
 * @returns {String} Returns the message text
 */
function getExitMessage(scope, runner, sync) {
    let itemsCountMessage = '';

    const testRunnerOptions = sync.getOptions();
    const messageEnabled = testRunnerOptions.enableUnansweredItemsWarning;

    if (messageEnabled) {
        itemsCountMessage = getUnansweredItemsWarning(scope, runner, sync);
    }

    return itemsCountMessage.trim();
}

/**
 * Build message if not all items have answers
 * @param {String} scope - scope to consider for calculating the stats
 * @param {Object} runner - testRunner instance
 * @param {Boolean} sync - flag for sync the unanswered stats in exit message and the unanswered stats in the toolbox. Default false
 * @returns {String} Returns the message text
 */
function getUnansweredItemsWarning(scope, runner, sync) {
    var stats = statsHelper.getInstantStats(scope, runner, sync);
    var unansweredCount = stats && stats.questions - stats.answered;
    var flaggedCount = stats && stats.flagged;
    var itemsCountMessage = '';

    if (scope === 'section' || scope === 'testSection') {
        itemsCountMessage = `<b>${__('You are about to leave this section.')}</b>`
        itemsCountMessage += __(
            'You answered %s of %s question(s) for this section of the test.',
            stats.answered.toString(),
            stats.questions.toString()
        );
        if (flaggedCount) {
            itemsCountMessage += `, ${__('and flagged %s of them', flaggedCount.toString())}`;
        }
    } else if (scope === 'test' || scope === 'testWithoutInaccessibleItems') {
        itemsCountMessage = `<b>${__('You are about to submit the test.')}</b>`
        if (unansweredCount > 1) {
            itemsCountMessage += __('There are %s unanswered questions. You will not be able to return to this test after you submit your answers.', stats.questions.toString());
        } else if (unansweredCount === 1) {
            itemsCountMessage += __('There is %s unanswered question. You will not be able to return to this test after you submit your answers.', stats.questions.toString());
        } else if (unansweredCount === 0) {
            itemsCountMessage += __('You will not be able to return to this test after you submit your answers.');
        }
        if (flaggedCount) {
            itemsCountMessage += ` ${__(
                'and you flagged %s item(s) that you can review now',
                flaggedCount.toString()
            )}`;
        }
    } else if (scope === 'part') {
        itemsCountMessage = `<b>${__('You are about to submit this test part.')}</b>`
        if (unansweredCount > 1) {
            itemsCountMessage += __('There are %s unanswered questions in this part of the test.', stats.questions.toString());
        } else if (unansweredCount === 1) {
            itemsCountMessage += __('There is %s unanswered question in this part of the test.', stats.questions.toString());
        }
        if (flaggedCount) {
            itemsCountMessage += ` ${__(
                'and you flagged %s item(s) that you can review now',
                flaggedCount.toString()
            )}`;
        }
    }

    if (itemsCountMessage) {
        itemsCountMessage += '.';
    }
    return itemsCountMessage;
}

export default {
    getExitMessage: getExitMessage
};
