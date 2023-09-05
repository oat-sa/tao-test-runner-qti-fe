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
define(['lodash', 'taoQtiTest/runner/helpers/messages'], function(_, messagesHelper) {
    'use strict';

    var messagesHelperApi = [{ title: 'getExitMessage' }];
    var testActionMessage = 'You will not be able to access this test once submitted. Click "OK" to continue and submit the test.';
    var actionMessage = 'Click "OK" to continue.';

    QUnit.module('helpers/messages');

    QUnit.test('module', function(assert) {
        assert.expect(1);
        assert.equal(typeof messagesHelper, 'object', 'The messages helper module exposes an object');
    });

    QUnit.cases.init(messagesHelperApi).test('helpers/messages API ', function(data, assert) {
        assert.expect(1);
        assert.equal(
            typeof messagesHelper[data.title],
            'function',
            `The messages helper expose a "${data.title}" function`
        );
    });

    /**
     * Build a fake test runner
     * @param {Object} map
     * @param {Object} context
     * @param {Object} data
     * @param {Object} responses
     * @param {Object} declarations
     * @returns {Object}
     */
    function runnerMock(map, context, data, responses, declarations) {
        return {
            getTestContext: function() {
                return context;
            },
            getTestMap: function() {
                return map;
            },
            getOptions() {
                return data;
            },
            getCurrentItem(){
                return map.parts[context.testPartId].sections[context.sectionId].items[context.itemIdentifier];
            },
            getCurrentPart(){
                return map.parts[context.testPartId];
            },
            itemRunner: {
                _item: {
                    responses: declarations
                },
                getResponses: function() {
                    return responses;
                }
            }
        };
    }

    QUnit.cases
        .init([
            {
                title: 'all answered, none flagged',
                testStats: { answered: 3 },
                partStats: { answered: 3 },
                sectionStats: { answered: 3 },
                currentItemResponse: { string: 'test' },
                currentItemAnswered: true,
                testMessage: '<b>You are about to submit the test.</b><br><br>',
                partMessage: '<b>You are about to submit this test part.</b><br><br>',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 3 of 3 question(s) for this section of the test.'
            },
            {
                title: 'current not answered, none flagged',
                testStats: { answered: 2 },
                partStats: { answered: 2 },
                sectionStats: { answered: 2 },
                currentItemResponse: null,
                currentItemAnswered: false,
                testMessage: '<b>You are about to submit the test.</b><br><br>There is 1 unanswered question.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>There is 1 unanswered question in this part of the test.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 2 of 3 question(s) for this section of the test.'
            },
            {
                title: 'current not answered, one flagged',
                testStats: { answered: 2, flagged: 1 },
                partStats: { answered: 2, flagged: 1 },
                sectionStats: { answered: 2, flagged: 1 },
                currentItemResponse: null,
                currentItemAnswered: false,
                testMessage: '<b>You are about to submit the test.</b><br><br>There is 1 unanswered question and you flagged 1 item(s) that you can review now.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>There is 1 unanswered question in this part of the test and you flagged 1 item(s) that you can review now.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 2 of 3 question(s) for this section of the test, and flagged 1 of them.'
            },
            {
                title: 'all answered, one flagged',
                testStats: { answered: 3, flagged: 1 },
                partStats: { answered: 3, flagged: 1 },
                sectionStats: { answered: 3, flagged: 1 },
                currentItemResponse: { string: 'test' },
                currentItemAnswered: true,
                testMessage: '<b>You are about to submit the test.</b><br><br>You flagged 1 item(s) that you can review now.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>You flagged 1 item(s) that you can review now.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 3 of 3 question(s) for this section of the test, and flagged 1 of them.'
            },
            {
                title: 'one flagged, test taker has just answered to the current item, but without moving from it yet',
                testStats: { answered: 1, flagged: 1 },
                partStats: { answered: 1, flagged: 1 },
                sectionStats: { answered: 1, flagged: 1 },
                currentItemResponse: { string: 'test' },
                currentItemAnswered: false,
                testMessage: '<b>You are about to submit the test.</b><br><br>There is 1 unanswered question and you flagged 1 item(s) that you can review now.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>There is 1 unanswered question in this part of the test and you flagged 1 item(s) that you can review now.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 2 of 3 question(s) for this section of the test, and flagged 1 of them.'
            },
            {
                title: 'none flagged, test taker has just answered to the current item, but without moving from it yet',
                testStats: { answered: 1 },
                partStats: { answered: 1 },
                sectionStats: { answered: 1 },
                currentItemResponse: { string: 'test' },
                currentItemAnswered: false,
                testMessage: '<b>You are about to submit the test.</b><br><br>There is 1 unanswered question.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>There is 1 unanswered question in this part of the test.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 2 of 3 question(s) for this section of the test.'
            },
            {
                title: 'none flagged, all answered, test taker has just moved to an already answered item',
                testStats: { answered: 3 },
                partStats: { answered: 3 },
                sectionStats: { answered: 3 },
                currentItemResponse: { string: 'test' },
                currentItemAnswered: true,
                testMessage: '<b>You are about to submit the test.</b><br><br>',
                partMessage: '<b>You are about to submit this test part.</b><br><br>',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 3 of 3 question(s) for this section of the test.'
            },
            {
                title: 'none flagged, all answered, test taker removes answer from a previously answered item',
                testStats: { answered: 3 },
                partStats: { answered: 3 },
                sectionStats: { answered: 3 },
                currentItemResponse: null,
                currentItemAnswered: true,
                testMessage: '<b>You are about to submit the test.</b><br><br>There is 1 unanswered question.',
                partMessage: '<b>You are about to submit this test part.</b><br><br>There is 1 unanswered question in this part of the test.',
                sectionMessage: '<b>You are about to leave this section.</b><br><br>You answered 2 of 3 question(s) for this section of the test.'
            }
        ])
        .test('helpers/messages.getExitMessage (enabled)', function(testData, assert) {
            var context = {
                itemPosition: 1,
                sectionId: 'section1',
                testPartId: 'part1',
                itemIdentifier: 'item1'
            };
            var data = {
                enableUnansweredItemsWarning: true
            };
            var map = {
                jumps: [
                    { position: 0, identifier: 'item1', section: 'section1', part: 'part1' },
                    { position: 1, identifier: 'item2', section: 'section1', part: 'part1' },
                    { position: 2, identifier: 'item3', section: 'section1', part: 'part1' }
                ],
                parts: {
                    part1: {
                        sections: {
                            section1: {
                                items: {
                                    item1: {
                                        answered : testData.currentItemAnswered
                                    },
                                    item2: {},
                                    item3: {}
                                },
                                stats: _.defaults(testData.sectionStats, {
                                    questions: 3,
                                    answered: 3,
                                    flagged: 0,
                                    viewed: 0,
                                    total: 3
                                })
                            }
                        },
                        stats: _.defaults(testData.partStats, {
                            questions: 3,
                            answered: 3,
                            flagged: 0,
                            viewed: 0,
                            total: 3
                        })
                    }
                },
                stats: _.defaults(testData.testStats, {
                    questions: 3,
                    answered: 3,
                    flagged: 0,
                    viewed: 0,
                    total: 3
                })
            };
            var declarations = {
                responsedeclaration: {
                    identifier: 'RESPONSE',
                    serial: 'responsedeclaration',
                    qtiClass: 'responseDeclaration',
                    attributes: {
                        identifier: 'RESPONSE',
                        cardinality: 'single',
                        baseType: 'string'
                    },
                    defaultValue: []
                }
            };
            var responses = {
                RESPONSE: {
                    base: testData.currentItemResponse
                }
            };
            var runner = runnerMock(map, context, data, responses, declarations);
            var message = '';
            var messageEntTestNoStat = `<b>You are about to submit the test.</b><br><br> ${testActionMessage}`;
            var messageEntTestPartNoStat = `<b>You are about to submit this test part.</b><br><br> ${actionMessage}`;
            var messageEntSectionNoStat = `<b>You are about to leave this section.</b><br><br> ${actionMessage}`;

            assert.expect(7);

            assert.equal(
                messagesHelper.getExitMessage('test', runner),
                `${testData.testMessage} ${testActionMessage}${message}`,
                'message include the right stats for test scope'
            );
            assert.equal(
                messagesHelper.getExitMessage('part', runner),
                `${testData.partMessage} ${actionMessage}${message}`,
                'message include the right stats for part scope'
            );
            assert.equal(
                messagesHelper.getExitMessage('section', runner),
                `${testData.sectionMessage} ${actionMessage}${message}`,
                'message include the right stats for section scope'
            );
            assert.equal(
                messagesHelper.getExitMessage('testWithoutInaccessibleItems', runner),
                `${testData.testMessage} ${testActionMessage}${message}`,
                'message include the right stats for testWithoutInaccessibleItems scope'
            );

            data.enableUnansweredItemsWarning = false;

            assert.equal(
                messagesHelper.getExitMessage('test', runner),
                messageEntTestNoStat,
                'no stats in test scope when option is disabled'
            );
            assert.equal(
                messagesHelper.getExitMessage('part', runner),
                messageEntTestPartNoStat,
                'no stats in part scope when option is disabled'
            );
            assert.equal(
                messagesHelper.getExitMessage('section', runner),
                messageEntSectionNoStat,
                'no stats in session scope when option is disabled'
            );
        });
});
