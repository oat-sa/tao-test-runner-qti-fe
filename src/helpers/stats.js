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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * This helper provides more statistics about the test
 *
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import _ from 'lodash';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import currentItemHelper from 'taoQtiTest/runner/helpers/currentItem';

export default {

    /**
     * Return scope stats that takes into account any test taker interaction made since the item has been loaded
     * @param {String} scope - scope to consider for calculating the stats
     * @param {Object} runner - testRunner instance
     * @param {Boolean} sync - flag for sync the unanswered stats in exit message and the unanswered stats in the toolbox. Default false
     * @returns {Object} the stats
     */
    getInstantStats(scope, runner, sync) {
        const map      = runner.getTestMap();
        const context  = runner.getTestContext();
        const item     = runner.getCurrentItem();
        const testPart = runner.getCurrentPart();
        const stats = _.clone(mapHelper.getScopeStats(map, context.itemPosition, scope));

        if (!item.informational) {
            const isItemCurrentlyAnswered = currentItemHelper.isAnswered(runner);
            if (!isItemCurrentlyAnswered && item.answered) {
                stats.answered--;
            } else if ((isItemCurrentlyAnswered || sync) && !item.answered) {
                stats.answered++;
                // eslint-disable-next-line no-dupe-else-if
            } else if (sync && !isItemCurrentlyAnswered && item.answered && testPart.isLinear) {
                stats.answered++;
            }
        }

        return stats;
    }
};
