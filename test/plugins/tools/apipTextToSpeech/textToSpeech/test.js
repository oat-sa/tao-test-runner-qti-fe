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

    const apipElements = apipData.map(({ selector }) => $(`<div id="${selector.replace('#', '')}"><span>${selector}</span></div>`));

    QUnit.test('visual test', (assert) => {
        var $playgroundContainer = $('#tts-playground-container');

        const ttsComponent = componentFactory($playgroundContainer, {});

        $playgroundContainer.append(...apipElements);
        ttsComponent.setMediaContentData(apipData);

        assert.ok(true);
    });
});
