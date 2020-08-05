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

define(['lodash', 'taoQtiTest/runner/plugins/navigation/next/nextWarningHelper'], function(_, warningHelper) {
    'use strict';

    var warnBeforeEndData, warnBeforeNextData;

    QUnit.module('warningHelper');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.ok(typeof warningHelper === 'function', 'The module expose a function');
    });

    QUnit.module('End test warning');

    warnBeforeEndData = [
        {
            title: 'no warning',
            input: {},
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'endTestWarning: not on last item',
            input: { endTestWarning: true },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'endTestWarning: last item',
            input: {
                endTestWarning: true,
                isLast: true
            },
            output: { warnNext: false, warnEnd: true }
        },
        {
            title: 'endTestWarning: last item, unansweredOnly, no unanswered / flagged items',
            input: {
                unansweredOnly: true,
                endTestWarning: true,
                isLast: true,
                stats: { flagged: 0, questions: 10, answered: 10 }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'endTestWarning: last item, unansweredOnly, flagged items',
            input: {
                unansweredOnly: true,
                endTestWarning: true,
                isLast: true,
                stats: { flagged: 5 }
            },
            output: { warnNext: false, warnEnd: true }
        },
        {
            title: 'endTestWarning: last item, unansweredOnly, unanswered items',
            input: {
                unansweredOnly: true,
                endTestWarning: true,
                isLast: true,
                stats: { questions: 10, answered: 5 }
            },
            output: { warnNext: false, warnEnd: true }
        },
        {
            title: 'endTestWarning: last item, unansweredOnly, unanswered & flagged items',
            input: {
                unansweredOnly: true,
                endTestWarning: true,
                isLast: true,
                stats: { flagged: 5, questions: 10, answered: 5 }
            },
            output: { warnNext: false, warnEnd: true }
        },
        {
            title: 'nextPartWarning: next part identical',
            input: {
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'CURRENT_PART' }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different, category not set',
            input: {
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different',
            input: {
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different, unansweredOnly, no unanswered / flagged',
            input: {
                unansweredOnly: true,
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' },
                stats: { flagged: 0, questions: 10, answered: 10 }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different, unansweredOnly, flagged',
            input: {
                unansweredOnly: true,
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' },
                stats: { flagged: 5 }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different, unansweredOnly, unanswered',
            input: {
                unansweredOnly: true,
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' },
                stats: { questions: 10, answered: 5 }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'nextPartWarning: next part different, unansweredOnly, unanswered & flagged',
            input: {
                unansweredOnly: true,
                nextPartWarning: true,
                testPartId: 'CURRENT_PART',
                nextPart: { id: 'NEXT_PART' },
                stats: { flagged: 1, questions: 10, answered: 5 }
            },
            output: { warnNext: false, warnEnd: false }
        }
    ];

    QUnit.cases.init(warnBeforeEndData).test('End test warning', function(data, assert) {
        var helper = warningHelper(data.input);

        assert.expect(2);

        assert.ok(
            helper.shouldWarnBeforeEnd() === data.output.warnEnd,
            'shouldWarnBeforeEnd returns the correct value'
        );
        assert.ok(
            helper.shouldWarnBeforeNext() === data.output.warnNext,
            'shouldWarnBeforeNext returns the correct value'
        );
    });

    QUnit.module('Next item warning');

    warnBeforeNextData = [
        {
            title: 'no warning',
            input: {},
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'Next item warning option is active, but nothing justifies the warning',
            input: { nextItemWarning: true },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'Warning is displayed if current item is the last',
            input: {
                nextItemWarning: true,
                isLast: true
            },
            output: { warnNext: true, warnEnd: true }
        },
        {
            title: 'Warning is always displayed in a linear section',
            input: {
                nextItemWarning: true,
                isLinear: true
            },
            output: { warnNext: true, warnEnd: false }
        },
        {
            title: 'Warning is displayed if on last attempt',
            input: {
                nextItemWarning: true,
                remainingAttempts: 0
            },
            output: { warnNext: true, warnEnd: false }
        },
        {
            title: 'Warning is displayed if item has a limited number of attempts',
            input: {
                nextItemWarning: true,
                remainingAttempts: 12
            },
            output: { warnNext: true, warnEnd: false }
        },
        {
            title: 'Warning is displayed if current part is non linear, but the next part is linear',
            input: {
                nextItemWarning: true,
                isLinear: false,
                nextPart: { id: 'NEXT_PART', isLinear: true }
            },
            output: { warnNext: true, warnEnd: false }
        },
        {
            title: 'Warning is not displayed if current part is non linear, and next part is non linear too',
            input: {
                nextItemWarning: true,
                isLinear: false,
                nextPart: { id: 'NEXT_PART', isLinear: false }
            },
            output: { warnNext: false, warnEnd: false }
        },
        {
            title: 'Warning is displayed if current part is linear, and next part is non linear',
            input: {
                nextItemWarning: true,
                isLinear: true,
                nextPart: { id: 'NEXT_PART', isLinear: false }
            },
            output: { warnNext: true, warnEnd: false }
        },
        {
            title: 'Warning is not displayed if there is no part change on next action',
            input: {
                nextItemWarning: true,
                isLinear: false,
                nextPart: { id: 'CURRENT_PART', isLinear: false }
            },
            output: { warnNext: false, warnEnd: false }
        }
    ];

    QUnit.cases.init(warnBeforeNextData).test('Next item warning', function(data, assert) {
        var helper = warningHelper(data.input);

        assert.expect(2);

        assert.ok(
            helper.shouldWarnBeforeEnd() === data.output.warnEnd,
            'shouldWarnBeforeEnd returns the correct value'
        );
        assert.ok(
            helper.shouldWarnBeforeNext() === data.output.warnNext,
            'shouldWarnBeforeNext returns the correct value'
        );
    });
});
