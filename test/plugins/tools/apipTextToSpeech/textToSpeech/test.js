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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Anton Tsymuk <anton@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'taoQtiTest/runner/plugins/tools/apipTextToSpeech/textToSpeech',
    'lib/simulator/jquery.simulate',
], function ($, _, componentFactory) {
    'use strict';

    const apipData = [
        {
            selector: '#apip-element-1',
            url: '/test/plugins/tools/apipTextToSpeech/textToSpeech/data/5.mp3'
        },
        {
            selector: '#apip-element-2',
            url: '/test/plugins/tools/apipTextToSpeech/textToSpeech/data/5.mp3'
        },
        {
            selector: '#apip-element-3',
            url: '/test/plugins/tools/apipTextToSpeech/textToSpeech/data/5.mp3'
        },
    ];
    const audioInstance = {
        load: () => { },
        pause: () => { },
        play: () => { },
        setAttribute: () => { },
        addEventListener: () => { },
    };
    const originalAudio = Audio;

    const apipElements = apipData.map(({ selector }) => $(`<div id="${selector.replace('#', '')}"><span>${selector}</span></div>`));

    QUnit.test('module', (assert) => {
        const $container = $('#qunit-fixture');

        assert.equal(typeof componentFactory, 'function', 'The component factory module exposes a function');
        assert.equal(typeof componentFactory($('<div></div>'), {}), 'object', 'The component factory produces an instance');
        assert.notStrictEqual(
            componentFactory($('<div></div>'), {}),
            componentFactory($('<div></div>'), {}),
            'The component factory provides a different instance on each call'
        );
        assert.throws(
            () => {
                componentFactory($container, {});
                componentFactory($container, {});
            },
            'The component throws an error when the container already have assigned tts component'
        );
    });

    const componentApi = [
        // default component api
        { name: 'init', title: 'init' },
        { name: 'render', title: 'render' },
        { name: 'destroy', title: 'destroy' },
        { name: 'trigger', title: 'trigger' },
        { name: 'getConfig', title: 'getConfig' },
        { name: 'setState', title: 'setState' },
        { name: 'show', title: 'show' },
        { name: 'hide', title: 'hide' },
        { name: 'enable', title: 'enable' },
        { name: 'disable', title: 'disable' },
        // component api
        { name: 'close', title: 'close' },
        { name: 'getCurrentItem', title: 'getCurrentItem' },
        { name: 'handleContentNodeClick', title: 'handleContentNodeClick' },
        { name: 'initDefaultModeItem', title: 'initDefaultModeItem' },
        { name: 'initItemWithTextSelection', title: 'initItemWithTextSelection' },
        { name: 'initNextItem', title: 'initNextItem' },
        { name: 'initDefaultModePlayback', title: 'initDefaultModePlayback' },
        { name: 'setMediaContentData', title: 'setMediaContentData' },
        { name: 'setPlaybackRate', title: 'setPlaybackRate' },
        { name: 'setTTSStateOnContainer', title: 'setTTSStateOnContainer' },
        { name: 'stop', title: 'stop' },
        { name: 'togglePlayback', title: 'togglePlayback' },
        { name: 'toggleSFHMode', title: 'toggleSFHMode' },
        { name: 'toggleSettings', title: 'toggleSettings' },
    ];

    QUnit.cases.init(componentApi).test('component API ', (data, assert) => {
        const $container = $('#qunit-fixture');

        const ttsComponent = componentFactory($container, {});

        assert.equal(
            typeof ttsComponent[data.name],
            'function',
            `The component factory instances expose a "${data.name}" function`
        );
    });

    QUnit.module('componentInstance', {
        after: () => {
            // eslint-disable-next-line no-global-assign
            Audio = originalAudio;
        },
        before: () => {
            // eslint-disable-next-line no-global-assign
            Audio = function () {
                return audioInstance;
            };
        }
    });

    QUnit.test('componentInstance.clearAPIPElements', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});
        const { elementClass } = ttsComponent.getConfig();

        assert.expect(1);

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);
        ttsComponent.clearAPIPElements();

        assert.equal($(`.${elementClass}`).length, 0, 'The component cleans up apip lements');
    });

    QUnit.test('componentInstance.close', (assert) => {
        const $container = $('#qunit-fixture');
        const ready = assert.async();
        const ttsComponent = componentFactory($container, {});

        assert.expect(4);

        ttsComponent.setState('playing', true);
        ttsComponent.setState('sfhMode', true);
        ttsComponent.setState('settings', true);

        ttsComponent.on('close', () => {
            assert.ok('The component triggers "close" event');

            assert.equal(ttsComponent.is('playing'), false, 'The component toggle playing state to false');
            assert.equal(ttsComponent.is('sfhMode'), false, 'The component toggle sfhMode state to false');
            assert.equal(ttsComponent.is('settings'), false, 'The component toggle settings state to false');

            ready();
        });

        ttsComponent.close();
    });

    QUnit.test('componentInstance.handleContentNodeClick', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(7);

        apipElements[0].click();

        assert.equal(ttsComponent.is('playing'), false, 'The component does not start playback on click if sfh mode is disabled');

        ttsComponent.setState('sfhMode', true);

        apipElements.forEach(($element) => {
            $element.click();

            const { selector } = ttsComponent.getCurrentItem();


            assert.ok(ttsComponent.is('playing'), 'The component starts playback on click');
            assert.ok($element.is(selector), `The component starts playback for ${selector} element`);
        });
    });

    QUnit.test('componentInstance.initItemWithTextSelection', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(4);

        ttsComponent.initItemWithTextSelection();

        assert.ok(!ttsComponent.getCurrentItem(), 'The component does not sets current item if there is not selection');

        apipElements.forEach(($element) => {
            const selection = window.getSelection();
            const selectionRange = document.createRange();

            selectionRange.selectNode($element.children()[0]);
            selection.removeAllRanges();
            selection.addRange(selectionRange);

            ttsComponent.initItemWithTextSelection();

            const { selector } = ttsComponent.getCurrentItem();

            assert.ok($element.is(selector), `The current item is ${selector}`);
        });
    });

    QUnit.test('componentInstance.initDefaultModePlayback', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(1);

        ttsComponent.initDefaultModePlayback();

        const { selector } = ttsComponent.getCurrentItem();

        assert.ok(apipElements[0].is(selector), 'The component sets first item as current');
    });

    QUnit.test('componentInstance.initNextItem', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(6);

        ttsComponent.initDefaultModePlayback();
        ttsComponent.initNextItem();

        let selector = ttsComponent.getCurrentItem().selector;

        assert.ok(apipElements[1].is(selector), 'The component switches to next item');
        assert.equal(ttsComponent.is('playing'), false, 'The component keeps playing state');

        ttsComponent.setState('playing', true);
        ttsComponent.initNextItem();

        selector = ttsComponent.getCurrentItem().selector;

        assert.ok(apipElements[2].is(selector), 'The component switches to next item');
        assert.equal(ttsComponent.is('playing'), true, 'The component keeps playing state');

        ttsComponent.initNextItem();

        assert.ok(!ttsComponent.getCurrentItem(), 'The component sets current item to null if there is no items for playback');
        assert.equal(ttsComponent.is('playing'), false, 'The component change playback state to false');
    });

    QUnit.test('componentInstance.setMediaContentData', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});
        const { elementClass } = ttsComponent.getConfig();

        assert.expect(2);

        ttsComponent.setState('playing', true);
        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.equal(ttsComponent.is('playing'), false, 'The component stops playback');
        assert.equal($(`.${elementClass}`).length, 3, 'The component adds css class to apip content elements');
    });

    QUnit.test('componentInstance.setTTSStateOnContainer', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        assert.expect(2);

        ttsComponent.setTTSStateOnContainer('playing', true);

        assert.equal($container.hasClass('tts-playing'), true, 'The component adds state class to the container');

        ttsComponent.setTTSStateOnContainer('playing', false);

        assert.equal($container.hasClass('tts-playing'), false, 'The component removes state class from the page');
    });

    QUnit.test('componentInstance.stop', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(2);

        ttsComponent.initDefaultModePlayback();
        ttsComponent.setTTSStateOnContainer('playing', true);
        ttsComponent.stop();

        assert.ok(!ttsComponent.getCurrentItem(), 'The component sets current item to null');
        assert.equal(ttsComponent.is('playing'), false, 'The component stops playback');
    });

    QUnit.test('componentInstance.togglePlayback', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.expect(3);

        ttsComponent.setState('sfhMode', true);
        ttsComponent.togglePlayback();

        assert.equal(ttsComponent.is('playing'), false, 'The component does not start playback if there is no current item');

        ttsComponent.setState('sfhMode', false);
        ttsComponent.togglePlayback();

        assert.equal(ttsComponent.is('playing'), true, 'The component starts playback');

        ttsComponent.togglePlayback();

        assert.equal(ttsComponent.is('playing'), false, 'The component pauses playback');
    });

    QUnit.test('componentInstance.toggleSFHMode', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        assert.expect(3);

        ttsComponent.setState('playing', true);
        ttsComponent.toggleSFHMode();

        assert.equal(ttsComponent.is('playing'), false, 'The component stops playback');
        assert.equal(ttsComponent.is('sfhMode'), true, 'The component sets sfhMode to true');

        ttsComponent.toggleSFHMode();

        assert.equal(ttsComponent.is('sfhMode'), false, 'The component sets sfhMode to false');
    });

    QUnit.test('componentInstance.toggleSettings', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});

        assert.expect(2);

        ttsComponent.toggleSettings();

        assert.equal(ttsComponent.is('settings'), true, 'The component sets settings state to true');

        ttsComponent.toggleSettings();

        assert.equal(ttsComponent.is('settings'), false, 'The component sets settings state to false');
    });

    QUnit.test('componentInstance.on("destroy")', (assert) => {
        const $container = $('#qunit-fixture');
        const ttsComponent = componentFactory($container, {});
        const { elementClass } = ttsComponent.getConfig();

        assert.expect(3);

        $container.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);
        ttsComponent.setState('playing', true);
        ttsComponent.destroy();

        assert.equal($container.hasClass('tts-component-container'), false, 'The component cleans up container');
        assert.equal(ttsComponent.is('playing'), false, 'The component stops playback');
        assert.equal($(`.${elementClass}`).length, 0, 'The component cleans up apip lements');
    });

    QUnit.module('Visual');

    QUnit.test('visual test', (assert) => {
        var $firstPlaygroundContainer = $('#tts-first-playground-container');
        var $secondPlaygroundContainer = $('#tts-second-playground-container');

        const firstTtsComponent = componentFactory($firstPlaygroundContainer, {});
        $firstPlaygroundContainer.append(...apipElements);
        firstTtsComponent.setMediaContentData(apipData);

        const secondTtsComponent = componentFactory($secondPlaygroundContainer, { top: 85 });
        $secondPlaygroundContainer.append(
            ...apipData.map(({ selector }) => $(`<div id="${selector.replace('#', '')}"><span>${selector}</span></div>`))
        );
        secondTtsComponent.setMediaContentData(apipData);

        assert.ok(true);
    });
});
