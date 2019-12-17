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
    'taoQtiTest/runner/plugins/tools/apipTextToSpeech/ttsApipDataProvider',
    'json!taoQtiTest/test/runner/plugins/tools/apipTextToSpeech/ttsApipDataProvider/data/data.json',
], function (ttsApipDataProvider, apipData) {
    'use strict';

    const ttsApipData = [
        {
            identifier: 'ae001',
            selector: '#cde_i289548_20',
            url: 'assets/ae001_534500.mp3',
        },
        {
            identifier: 'ae003',
            selector: '#cde_i289548_22',
            url: 'assets/ae003_534502.mp3',
        },
        {
            identifier: 'ae002',
            selector: '#cde_i289548_21',
            url: 'assets/ae002_534501.mp3',
        },
    ];
    const apipItemWithoutQtiLinkIdentifierRef = {
        accessibilityInfo: {
            accessElement: [
                {
                    '@attributes': {
                        identifier: 'ae001'
                    },
                    relatedElementInfo: {
                        spoken: {
                            audioFileInfo: [
                                {
                                    '@attributes': {
                                        mimeType: 'audio/mpeg',
                                    },
                                    fileHref: 'assets/ae001_534500.mp3',
                                },
                            ],
                        },
                    },
                },
            ],
        },
    };
    const apipItemWithoutMediaFile = {
        accessibilityInfo: {
            accessElement: [
                {
                    '@attributes': {
                        identifier: 'ae001'
                    },
                    relatedElementInfo: {
                        spoken: {
                            audioFileInfo: [
                            ],
                        },
                    },
                },
            ],
        },
    };

    QUnit.test('ttsApipDataProvider extract apip data', (assert) => {
        assert.deepEqual(ttsApipDataProvider({}), [], 'Returns empty array if there is no tts data');
        assert.deepEqual(ttsApipDataProvider(apipData), ttsApipData, 'Returns TTS APIP data');
    });

    QUnit.test('ttsApipDataProvider extract corrupted apip data', (assert) => {
        assert.ok(!ttsApipDataProvider(apipItemWithoutQtiLinkIdentifierRef).selector, 'Returns undefined selector if there is no qtiLinkIdentifierRef');
        assert.deepEqual(ttsApipDataProvider(apipItemWithoutMediaFile), [], 'Filters out items without media files');
    });
});
