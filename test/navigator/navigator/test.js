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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'taoQtiTest/runner/navigator/navigator',
    'json!taoQtiTest/test/runner/navigator/navigator/testMap.json',
    'json!taoQtiTest/test/runner/navigator/navigator/testContexts.json'
], function(testNavigator, testMap, testContexts) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.equal(typeof testNavigator, 'function', 'The navigator is a function');
    });

    QUnit.test('factory', function(assert) {
        assert.expect(5);

        assert.throws(
            function() {
                testNavigator();
            },
            TypeError,
            'factory called without parameter'
        );

        assert.throws(
            function() {
                testNavigator({});
            },
            TypeError,
            'factory called without all parameters'
        );

        assert.throws(
            function() {
                testNavigator(testContexts.context1);
            },
            TypeError,
            'factory called without all parameters'
        );

        assert.equal(typeof testNavigator({}, testMap), 'object', 'The factory creates an object');
        assert.notEqual(
            testNavigator({}, testMap),
            testNavigator({}, testMap),
            'The factory creates new objects'
        );
    });

    QUnit.cases
        .init([
            {
                title: 'navigate'
            },
            {
                title: 'nextItem'
            },
            {
                title: 'previousItem'
            },
            {
                title: 'nextSection'
            },
            {
                title: 'jumpItem'
            }
        ])
        .test('Method ', function(data, assert) {
            assert.expect(1);

            assert.equal(
                typeof testNavigator({}, testMap)[data.title],
                'function',
                `The instance exposes a "${  data.title  }" method`
            );
        });

    QUnit.module('navigator.nextItem');

    QUnit.test('is moving to the next item inside a section', function(assert) {
        var updatedContext;

        assert.expect(6);

        updatedContext = testNavigator(testContexts.context1, testMap).nextItem();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-2',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 1, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-1',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
        assert.deepEqual(updatedContext.timeConstraints, [], 'The updated context has no time constraints');
        assert.deepEqual(
            updatedContext.options,
            {
                reviewScreen: true,
                markReview: true,
                endTestWarning: true,
                zoom: true,
                allowComment: false,
                allowSkipping: true,
                exitButton: false,
                logoutButton: false
            },
            'The updated context contains the correct options'
        );
    });

    QUnit.test('is moving to the next item over a section', function(assert) {
        var updatedContext;

        assert.expect(6);

        updatedContext = testNavigator(testContexts.context2, testMap).nextItem();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-4',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 3, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-2',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
        assert.deepEqual(
            updatedContext.timeConstraints,
            [
                {
                    label: 'Rubric block',
                    source: 'assessmentSection-2',
                    seconds: '60',
                    extraTime: 0,
                    allowLateSubmission: false,
                    qtiClassName: 'assessmentSection'
                }
            ],
            'The updated context contains the new section time constraints'
        );
        assert.deepEqual(
            updatedContext.options,
            {
                calculator: true,
                zoom: true,
                fooBarBaz: true,
                awesomeCategory: true,
                allowComment: false,
                allowSkipping: true,
                exitButton: false,
                logoutButton: false
            },
            'The updated context contains the correct options'
        );
    });

    QUnit.test('is moving to the next item over a testPart', function(assert) {
        var updatedContext;

        assert.expect(4);

        updatedContext = testNavigator(testContexts.context3, testMap).nextItem();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-15',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 14, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-6',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-2', 'The updated context contains the correct test part id');
    });

    QUnit.test('is moving to the next item over timed sections', function(assert) {
        var updatedContext;

        assert.expect(5);

        updatedContext = testNavigator(testContexts.context4, testMap).nextItem();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-7',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 6, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-3',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
        assert.deepEqual(
            updatedContext.timeConstraints,
            [
                {
                    label: 'Timed section',
                    source: 'assessmentSection-3',
                    seconds: '90',
                    extraTime: 0,
                    allowLateSubmission: false,
                    qtiClassName: 'assessmentSection'
                }
            ],
            'The updated context contains the new section time constraints'
        );
    });

    QUnit.test('is moving to the next item to the end', function(assert) {
        var updatedContext;

        assert.expect(1);

        updatedContext = testNavigator(testContexts.context5, testMap).nextItem();
        assert.equal(updatedContext, false, 'There is no next item');
    });

    QUnit.module('navigator.previousItem');

    QUnit.test('is moving to the previous item inside a section', function(assert) {
        var updatedContext;

        assert.expect(4);

        updatedContext = testNavigator(testContexts.context2, testMap).previousItem();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-2',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 1, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-1',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
    });

    QUnit.module('navigator.nextSection');

    QUnit.test('is moving to the next section', function(assert) {
        var updatedContext;

        assert.expect(5);

        updatedContext = testNavigator(testContexts.context4, testMap).nextSection();

        assert.equal(
            updatedContext.itemIdentifier,
            'item-7',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 6, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-3',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
        assert.deepEqual(
            updatedContext.timeConstraints,
            [
                {
                    label: 'Timed section',
                    source: 'assessmentSection-3',
                    seconds: '90',
                    extraTime: 0,
                    allowLateSubmission: false,
                    qtiClassName: 'assessmentSection'
                }
            ],
            'The updated context contains the new section time constraints'
        );
    });

    QUnit.module('navigator.jumpItem');

    QUnit.test('is jumping to the 2nd previous item', function(assert) {
        var updatedContext;

        assert.expect(5);

        updatedContext = testNavigator(testContexts.context4, testMap).jumpItem(3);

        assert.equal(
            updatedContext.itemIdentifier,
            'item-4',
            'The updated context contains the correct item identifier'
        );
        assert.equal(updatedContext.itemPosition, 3, 'The updated context contains the correct item position');
        assert.equal(
            updatedContext.sectionId,
            'assessmentSection-2',
            'The updated context contains the correct section id'
        );
        assert.equal(updatedContext.testPartId, 'testPart-1', 'The updated context contains the correct test part id');
        assert.deepEqual(
            updatedContext.timeConstraints,
            [
                {
                    label: 'Rubric block',
                    source: 'assessmentSection-2',
                    seconds: '60',
                    extraTime: 0,
                    allowLateSubmission: false,
                    qtiClassName: 'assessmentSection'
                }
            ],
            'The updated context contains the new section time constraints'
        );
    });

    QUnit.module('navigator.navigate');

    QUnit.test('executes the correct movement', function(assert) {
        var aTestNaviagtor = testNavigator(testContexts.context4, testMap);

        assert.expect(5);

        assert.deepEqual(aTestNaviagtor.navigate('next', 'item'), aTestNaviagtor.nextItem());
        assert.deepEqual(aTestNaviagtor.navigate('previous', 'item'), aTestNaviagtor.previousItem());
        assert.deepEqual(aTestNaviagtor.navigate('next', 'section'), aTestNaviagtor.nextSection());
        assert.deepEqual(aTestNaviagtor.navigate('jump', 'item', 3), aTestNaviagtor.jumpItem(3));

        assert.equal(typeof aTestNaviagtor.navigate('forward', 'test-part', 3), 'undefined');
    });
});
