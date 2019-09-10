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
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'taoTests/runner/runner',
    'taoQtiTest/runner/provider/qti',
    'json!taoQtiTest/test/runner/provider/qti/testMap.json'
], function(runnerFactory, qtiProvider, testMapData) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.expect(1);

        assert.equal(typeof qtiProvider, 'object', 'The module exports and object');
    });

    QUnit.cases.init([
        { title: 'destroy' },
        { title: 'finish' },
        { title: 'flush' },
        { title: 'getPersistentState' },
        { title: 'init' },
        { title: 'install' },
        { title: 'loadAreaBroker' },
        { title: 'loadItem' },
        { title: 'loadPersistentStates' },
        { title: 'loadProbeOverseer' },
        { title: 'loadProxy' },
        { title: 'loadTestStore' },
        { title: 'render' },
        { title: 'setPersistentState' },
        { title: 'unloadItem' },
    ]).test('The runner provider expose the method ', (data, assert) => {
        assert.equal(typeof qtiProvider[data.title], 'function', 'The method is exposed');
    });

    QUnit.module('Installed behavior', {
        beforeEach(){
            runnerFactory.registerProvider(qtiProvider.name, Object.assign({}, qtiProvider, {
                init(){},
                render(){}
            }));
            this.runner = runnerFactory('qti', {
                mockPlugin(){
                    return {
                        name : 'mock-plugin',
                        getName(){
                            return this.name;
                        },
                        init(){},
                    };
                }
            });
        },
        afterEach(){
            runnerFactory.clearProviders();
        }
    });

    QUnit.test('getCurrentItem', function(assert) {

        assert.expect(8);

        const item1 = testMapData.parts.Introduction.sections['assessmentSection-1'].items['item-1'];
        const item8 = testMapData.parts.QTIExamples.sections['assessmentSection-2'].items['item-8'];
        const done = assert.async();

        assert.equal(typeof this.runner.getCurrentItem, 'undefined', 'The method getCurrentItem is not installed');

        this.runner.on('init', () => {

            assert.equal(typeof this.runner.getCurrentItem, 'function', 'The method getCurrentItem is now installed');

            assert.notOk(this.runner.getCurrentItem(), 'The testMap is not set so no item');

            this.runner.setTestMap(testMapData);

            assert.notOk(this.runner.getCurrentItem(), 'The testContext is not set so no item');

            this.runner.setTestContext({});
            assert.notOk(this.runner.getCurrentItem(), 'The context is wrong, so no current item');

            this.runner.setTestContext({
                itemIdentifier: 'item-12438',
                itemPosition: 12437
            });
            assert.notOk(this.runner.getCurrentItem(), 'The context is wrong, so no current');

            this.runner.setTestContext({
                itemIdentifier: 'item-8',
                itemPosition: 7
            });
            assert.deepEqual(this.runner.getCurrentItem(), item8, 'The current item is returned');

            this.runner.setTestContext({
                itemIdentifier: 'item-1',
                itemPosition: 0
            });
            assert.deepEqual(this.runner.getCurrentItem(), item1, 'The current item is returned');

            done();
        })
        .on('error', err => {
            assert.ok(false, err.message);
            done();
        })
        .init();
    });

    QUnit.test('getCurrentSection', function(assert) {

        assert.expect(8);

        const section1 = testMapData.parts.Introduction.sections['assessmentSection-1'];
        const section2 = testMapData.parts.QTIExamples.sections['assessmentSection-2'];
        const done = assert.async();

        assert.equal(typeof this.runner.getCurrentSection, 'undefined', 'The method getCurrentSection is not installed');

        this.runner.on('init', () => {

            assert.equal(typeof this.runner.getCurrentSection, 'function', 'The method getCurrentSection is now installed');

            assert.notOk(this.runner.getCurrentSection(), 'The testMap is not set so no section');

            this.runner.setTestMap(testMapData);

            assert.notOk(this.runner.getCurrentSection(), 'The testContext is not set so no section');

            this.runner.setTestContext({});
            assert.notOk(this.runner.getCurrentSection(), 'The context is wrong, so no current section');

            this.runner.setTestContext({
                sectionId: 'area-51'
            });
            assert.notOk(this.runner.getCurrentSection(), 'The context is wrong, so no current section');

            this.runner.setTestContext({
                sectionId: 'assessmentSection-1'
            });
            assert.deepEqual(this.runner.getCurrentSection(), section1, 'The current section is returned');

            this.runner.setTestContext({
                sectionId: 'assessmentSection-2'
            });
            assert.deepEqual(this.runner.getCurrentSection(), section2, 'The current section is returned');

            done();
        })
        .on('error', err => {
            assert.ok(false, err.message);
            done();
        })
        .init();
    });

    QUnit.test('getCurrentPart', function(assert) {

        assert.expect(8);

        const part1 = testMapData.parts.Introduction;
        const part2 = testMapData.parts.QTIExamples;
        const done = assert.async();

        assert.equal(typeof this.runner.getCurrentPart, 'undefined', 'The method getCurrentPart is not installed');

        this.runner.on('init', () => {

            assert.equal(typeof this.runner.getCurrentPart, 'function', 'The method getCurrentPart is now installed');

            assert.notOk(this.runner.getCurrentPart(), 'The testMap is not set so no part');

            this.runner.setTestMap(testMapData);

            assert.notOk(this.runner.getCurrentPart(), 'The testContext is not set so no part');

            this.runner.setTestContext({});
            assert.notOk(this.runner.getCurrentPart(), 'The context is wrong, so no current part');

            this.runner.setTestContext({
                sectionId: 'part-66'
            });
            assert.notOk(this.runner.getCurrentPart(), 'The context is wrong, so no current part');

            this.runner.setTestContext({
                testPartId: 'Introduction'
            });
            assert.deepEqual(this.runner.getCurrentPart(), part1, 'The current section is returned');

            this.runner.setTestContext({
                testPartId: 'QTIExamples'
            });
            assert.deepEqual(this.runner.getCurrentPart(), part2, 'The current part is returned');

            done();
        })
        .on('error', err => {
            assert.ok(false, err.message);
            done();
        })
        .init();
    });
});
