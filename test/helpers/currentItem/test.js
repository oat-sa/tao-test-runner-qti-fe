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
 * Copyright (c) 2016-2025 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['lodash', 'taoQtiTest/runner/helpers/currentItem'], function (_, currentItemHelper) {
    'use strict';

    var messagesHelperApi = [
        { title: 'getDeclarations' },
        { title: 'getResponseDeclaration' },
        { title: 'toResponse' },
        { title: 'isQtiValueNull' },
        { title: 'isQuestionAnswered' },
        { title: 'isAnswered' },
        { title: 'isValid' }
    ];

    /**
     * Build a fake test runner with embedded item runner
     * @param {Object} responses
     * @param {Object} declarations
     * @param {String} itemId
     * @param {Object} itemBdy
     * @returns {Object}
     */
    function runnerMock(responses, declarations, itemId, itemBdy, itemState) {
        return {
            itemRunner: {
                _item: {
                    responses: declarations,
                    bdy: itemBdy,
                    itemIdentifier: itemId
                },
                getResponses: function () {
                    return responses;
                },
                getState: function () {
                    return itemState;
                }
            }
        };
    }

    QUnit.module('helpers/currentItem');

    QUnit.test('module', function (assert) {
        assert.expect(1);

        assert.equal(typeof currentItemHelper, 'object', 'The currentItem helper module exposes an object');
    });

    QUnit.cases.init(messagesHelperApi).test('helpers/currentItem API ', function (data, assert) {
        assert.expect(1);

        assert.equal(
            typeof currentItemHelper[data.title],
            'function',
            `The currentItem helper expose a "${data.title}" function`
        );
    });

    QUnit.test('helpers/currentItem.getDeclarations', function (assert) {
        var declarations = {
            responsedeclaration1: {
                identifier: 'RESPONSE1',
                serial: 'responsedeclaration1',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE1',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            },
            responsedeclaration2: {
                identifier: 'RESPONSE2',
                serial: 'responsedeclaration2',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE2',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            }
        };
        var runner = runnerMock({}, declarations);

        assert.expect(1);

        assert.equal(
            currentItemHelper.getDeclarations(runner),
            declarations,
            'The helper has returned the right list of responses declarations'
        );
    });

    QUnit.test('helpers/currentItem.getResponseDeclaration', function (assert) {
        var declarations = {
            responsedeclaration1: {
                identifier: 'RESPONSE1',
                serial: 'responsedeclaration1',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE1',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            },
            responsedeclaration2: {
                identifier: 'RESPONSE2',
                serial: 'responsedeclaration2',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE2',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            }
        };
        var runner = runnerMock({}, declarations);

        assert.expect(2);

        assert.equal(
            currentItemHelper.getResponseDeclaration(runner, 'RESPONSE1'),
            declarations.responsedeclaration1,
            'The helper has returned the first declaration'
        );
        assert.equal(
            currentItemHelper.getResponseDeclaration(runner, 'RESPONSE2'),
            declarations.responsedeclaration2,
            'The helper has returned the second declaration'
        );
    });

    QUnit.test('helpers/currentItem.toResponse', function (assert) {
        assert.expect(9);

        assert.deepEqual(
            currentItemHelper.toResponse(null, 'string', 'single'),
            { base: null },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse('foo', 'string', 'single'),
            { base: { string: 'foo' } },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(['foo'], 'string', 'single'),
            { base: { string: 'foo' } },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(['foo'], 'string', 'multiple'),
            { list: { string: ['foo'] } },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(null, 'string', 'multiple'),
            { list: { string: [] } },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(['choice_2 choice_3', 'choice_2 choice_4'], 'directedPair', 'multiple'),
            {
                list: {
                    directedPair: [
                        ['choice_2', 'choice_3'],
                        ['choice_2', 'choice_4']
                    ]
                }
            },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(['choice_2 choice_3', 'choice_2 choice_4'], 'pair', 'multiple'),
            {
                list: {
                    pair: [
                        ['choice_2', 'choice_3'],
                        ['choice_2', 'choice_4']
                    ]
                }
            },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse(['true', 'false'], 'boolean', 'multiple'),
            { list: { boolean: [true, false] } },
            'The helper has built the right response'
        );
        assert.deepEqual(
            currentItemHelper.toResponse([true, false], 'boolean', 'multiple'),
            { list: { boolean: [true, false] } },
            'The helper has built the right response'
        );
    });

    QUnit.test('helpers/currentItem.isQtiValueNull', function (assert) {
        assert.expect(5);

        assert.equal(currentItemHelper.isQtiValueNull(null, 'string', 'single'), true, 'The response should be null');
        assert.equal(
            currentItemHelper.isQtiValueNull({ base: { string: null } }, 'string', 'single'),
            true,
            'The response should be null'
        );
        assert.equal(
            currentItemHelper.isQtiValueNull({ base: { string: 'foo' } }, 'string', 'single'),
            false,
            'The response should not be null'
        );
        assert.equal(
            currentItemHelper.isQtiValueNull({ list: { string: ['foo'] } }, 'string', 'multiple'),
            false,
            'The response should not be null'
        );
        assert.equal(
            currentItemHelper.isQtiValueNull({ list: { string: [] } }, 'string', 'multiple'),
            true,
            'The response should be null'
        );
    });

    QUnit.test('helpers/currentItem.isQuestionAnswered', function (assert) {
        assert.expect(21);

        // Null
        assert.equal(
            currentItemHelper.isQuestionAnswered(null, 'string', 'single'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: null }, 'string', 'single'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { string: null } }, 'string', 'single'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered(null, 'integer', 'single'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered(null, 'float', 'single'),
            false,
            'The question should not be answered'
        );

        // Default
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { string: 'foo' } }, 'string', 'single', 'foo'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ list: { string: ['foo'] } }, 'string', 'multiple', ['foo']),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { integer: 0 } }, 'integer', 'single', 0),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { integer: 5000000000 } }, 'integer', 'single', 5e9),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { float: 1.1 } }, 'float', 'single', 1.1),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { float: 1.0000000001 } }, 'float', 'single', 1.0000000001),
            false,
            'The question should not be answered'
        );

        // Null and not default
        assert.equal(
            currentItemHelper.isQuestionAnswered(null, 'string', 'single', 'foo'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: null }, 'string', 'single', 'foo'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { string: null } }, 'string', 'single', 'foo'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { integer: null } }, 'integer', 'single', 0),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { float: null } }, 'float', 'single', 1.1),
            false,
            'The question should not be answered'
        );

        // Not null or default
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { string: 'foo' } }, 'string', 'single'),
            true,
            'The question should be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ list: { string: ['foo'] } }, 'string', 'multiple'),
            true,
            'The question should be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ list: { string: [] } }, 'string', 'multiple'),
            false,
            'The question should not be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { integer: 0 } }, 'integer', 'single'),
            true,
            'The question should be answered'
        );
        assert.equal(
            currentItemHelper.isQuestionAnswered({ base: { float: 1.1 } }, 'float', 'single'),
            true,
            'The question should be answered'
        );
    });

    QUnit.test('helpers/currentItem.isAnswered', function (assert) {
        var declarations = {
            responsedeclaration1: {
                identifier: 'RESPONSE1',
                serial: 'responsedeclaration1',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE1',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            },
            responsedeclaration2: {
                identifier: 'RESPONSE2',
                serial: 'responsedeclaration2',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE2',
                    cardinality: 'single',
                    baseType: 'string'
                },
                defaultValue: []
            }
        };
        var fullyResponded = { RESPONSE1: { base: { string: 'bar' } }, RESPONSE2: { base: { string: 'foo' } } };
        var partiallyResponded = { RESPONSE1: { base: null }, RESPONSE2: { base: { string: 'foo' } } };
        var notResponded = { RESPONSE1: { base: null }, RESPONSE2: { base: null } };

        var fullyRespondedRunner = runnerMock(fullyResponded, declarations);
        var partiallyRespondedRunner = runnerMock(partiallyResponded, declarations);
        var notRespondedRunner = runnerMock(notResponded, declarations);

        var partially = false;

        assert.expect(6);

        assert.equal(
            currentItemHelper.isAnswered(fullyRespondedRunner),
            true,
            'The fully answered item should be answered'
        );
        assert.equal(
            currentItemHelper.isAnswered(partiallyRespondedRunner),
            true,
            'The partially answered item should be answered'
        );
        assert.equal(
            currentItemHelper.isAnswered(notRespondedRunner),
            false,
            'The unanswered item should not be answered'
        );

        assert.equal(
            currentItemHelper.isAnswered(fullyRespondedRunner, partially),
            true,
            'The fully answered item should be answered'
        );
        assert.equal(
            currentItemHelper.isAnswered(partiallyRespondedRunner, partially),
            false,
            'The partially answered item should not be answered'
        );
        assert.equal(
            currentItemHelper.isAnswered(notRespondedRunner, partially),
            false,
            'The unanswered item should not be answered'
        );
    });

    QUnit.cases
        .init([
            {
                title: 'undefined item',
                itemId: 'item-0',
                itemBdy: null,
                expectedResult: []
            },
            {
                title: 'without stimulus',
                itemId: 'item-1',
                itemBdy: {
                    elements: {}
                },
                expectedResult: []
            },
            {
                title: 'with stimulus',
                itemId: 'item-2',
                itemBdy: {
                    elements: {
                        first: {
                            attributes: {
                                href: 'http://path/to/something.xml'
                            },
                            qtiClass: 'include'
                        },
                        second: {
                            attributes: {
                                href: 'http://path/to/something/else.xml'
                            },
                            qtiClass: 'choiceInteraction'
                        }
                    }
                },
                expectedResult: ['http://path/to/something.xml']
            }
        ])
        .test('helpers/currentItem.getStimuliHrefs', function (caseData, assert) {
            var runner = runnerMock(null, null, caseData.itemId, caseData.itemBdy);
            var hrefs = currentItemHelper.getStimuliHrefs(runner, caseData.itemId);

            assert.expect(1);

            assert.deepEqual(hrefs, caseData.expectedResult, 'getStimuli returns correct value');
        });

    QUnit.test('helpers/currentItem.isValid', function (assert) {
        const declarations = {
            responsedeclaration1: {
                identifier: 'RESPONSE1',
                serial: 'responsedeclaration1',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE1',
                    cardinality: 'single',
                    baseType: 'integer'
                },
                defaultValue: []
            },
            responsedeclaration2: {
                identifier: 'RESPONSE2',
                serial: 'responsedeclaration2',
                qtiClass: 'responseDeclaration',
                attributes: {
                    identifier: 'RESPONSE2',
                    cardinality: 'single',
                    baseType: 'float'
                },
                defaultValue: []
            }
        };
        const responses = { RESPONSE1: { base: { integer: '3' } }, RESPONSE2: { base: { float: '3.14' } } };

        const oneInvalidRunner = runnerMock(responses, declarations, null, null, {
            RESPONSE1: { response: { base: { integer: '3' } }, validity: { isValid: false } },
            RESPONSE2: { response: { base: { float: '3.14' } } }
        });
        const noInvalidRunner = runnerMock(responses, declarations, null, null, {
            RESPONSE1: { response: { base: { integer: '3' } }, validity: { isValid: true } },
            RESPONSE2: { response: { base: { float: '3.14' } } }
        });
        const noInvalidNoValidityRunner = runnerMock(responses, declarations, null, null, {
            RESPONSE1: { response: { base: { integer: '3' } } },
            RESPONSE2: { response: { base: { float: '3.14' } } }
        });
        const noDeclarationsRunner = runnerMock({}, {}, null, null, {});

        assert.equal(
            currentItemHelper.isValid(oneInvalidRunner),
            false,
            'item with isValid:false in validity state is invalid'
        );
        assert.equal(
            currentItemHelper.isValid(noInvalidRunner),
            true,
            'item with isValid:true in validity state is invalid'
        );
        assert.equal(
            currentItemHelper.isValid(noInvalidNoValidityRunner),
            true,
            'item without validity state defined is valid'
        );
        assert.equal(currentItemHelper.isValid(noDeclarationsRunner), true, 'item without declarations is valid');
    });
});
