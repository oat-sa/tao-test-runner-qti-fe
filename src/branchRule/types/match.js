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
 * @author Péter Halász <peter@taotesting.com>
 */

/**
 * MATCH branching rule
 *
 * @param {Object} branchRuleDefinition       the definition object of the branch rule, which contains additional branching rules, and also the target
 * @param {Object} item                       item object from the itemStore
 * @param {Object} navigationParams           object of navigation parameters which got passed to the navigation action
 * @param {branchRuleMapper} branchRuleMapper
 * @param {responseStore} responseStore
 */
export default function matchBranchRuleFactory(
    branchRuleDefinition,
    item,
    navigationParams,
    branchRuleMapper,
    responseStore
) {
    var variableIdentifier = branchRuleDefinition.variable['@attributes'].identifier;
    var correctIdentifier = branchRuleDefinition.correct['@attributes'].identifier;

    return {
        /**
         * Evaluates that the value of given variable is matching or not of the value of the given correct response
         * @returns {boolean}
         */
        validate: function validate() {
            return Promise.all([
                responseStore.getCorrectResponse(correctIdentifier),
                responseStore.getResponse(variableIdentifier)
            ]).then(function (result) {
                return result[0].includes(result[1]);
            });
        }
    };
}
