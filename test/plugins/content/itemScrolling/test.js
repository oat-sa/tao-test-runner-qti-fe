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
 * Test the test runner plugin rubricBlock
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/test/runner/mocks/areaBrokerMock',
    'taoQtiItem/runner/qtiItemRunner',
    'json!taoQtiItem/test/samples/json/inlineModalFeedback.json',
    'taoQtiItem/qtiItem/core/Loader',
    'taoQtiItem/qtiCommonRenderer/renderers/Renderer',
    'taoQtiTest/runner/plugins/content/itemScrolling/itemScrolling',
], function ($, runnerFactory, providerMock, areaBrokerMock, qtiItemRunner, itemData, QtiLoader, QtiRenderer, pluginFactory) {
    'use strict';

    itemData = {
        "identifier": "i5fa1562041342745bf1f971f9ec37c",
        "serial": "item_5fa2a1c8767ad740071033",
        "qtiClass": "assessmentItem",
        "attributes": {
            "identifier": "i5fa1562041342745bf1f971f9ec37c",
            "title": "Item 4",
            "label": "Item 4",
            "xml:lang": "en-US",
            "adaptive": false,
            "timeDependent": false,
            "toolName": "TAO",
            "toolVersion": "3.4.0-sprint139",
            "class": ""
        },
        "body": {
            "serial": "container_containeritembody_5fa2a1c876775453516340",
            "body": "\n    <div class=\"grid-row\">\n      <div class=\"col-12\">\n        <div class=\"text-block-wrap inner\" data-scrolling=\"true\" data-scrolling-height=\"50\">\n          <p>Lorem ipsum dolor sit amet, consectetur adipisicing ...<\/p>\n          <p>\u00a0<\/p>\n          <p>\u00a0<\/p>\n          <div class=\"text-block-wrap outer\" data-scrolling=\"true\" data-scrolling-height=\"50\">\n            {{xinclude_5fa2a1c87b4e9722396069}}\n          <\/div>\n        <\/div>\n      <\/div>\n    <\/div>\n  ",
            "elements": {
                "xinclude_5fa2a1c87b4e9722396069": {
                    "serial": "xinclude_5fa2a1c87b4e9722396069",
                    "qtiClass": "include",
                    "attributes": {
                        "href": "taomedia:\/\/mediamanager\/https_2_tao-inst_0_docker_0_localhost_1_ontologies_1_tao_0_rdf_3_i5f96c7ef552268fc0562774b9a42b6"
                    },
                    "body": {
                        "serial": "container_containerstatic_5fa2a1c87bd41621570395",
                        "body": "\n    \n        <div class=\"grid-row\">\n    <div class=\"col-12\">test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long\n<div>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n\n<p>test sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then longtest sstring long very long longer then long<\/p>\n<\/div><\/div>\n<\/div>\n    \n",
                        "elements": {},
                        "debug": {
                            "relatedItem": "item_5fa2a1c8767ad740071033"
                        }
                    },
                    "debug": {
                        "relatedItem": "item_5fa2a1c8767ad740071033"
                    }
                }
            },
            "debug": {
                "relatedItem": "item_5fa2a1c8767ad740071033"
            }
        },
        "debug": {
            "relatedItem": "item_5fa2a1c8767ad740071033"
        },
        "namespaces": {
            "": "http:\/\/www.imsglobal.org\/xsd\/imsqti_v2p2",
            "m": "http:\/\/www.w3.org\/1998\/Math\/MathML",
            "xi": "http:\/\/www.w3.org\/2001\/XInclude",
            "xsi": "http:\/\/www.w3.org\/2001\/XMLSchema-instance"
        },
        "schemaLocations": {
            "http:\/\/www.imsglobal.org\/xsd\/imsqti_v2p2": "http:\/\/www.imsglobal.org\/xsd\/qti\/qtiv2p2\/imsqti_v2p2.xsd"
        },
        "stylesheets": {
            "stylesheet_5fa2a1c879ae5712640514": {
                "serial": "stylesheet_5fa2a1c879ae5712640514",
                "qtiClass": "stylesheet",
                "attributes": {
                    "href": "style\/custom\/tao-user-styles.css",
                    "type": "text\/css",
                    "media": "all",
                    "title": ""
                },
                "debug": {
                    "relatedItem": "item_5fa2a1c8767ad740071033"
                }
            }
        },
        "outcomes": {},
        "responses": {},
        "feedbacks": {},
        "responseProcessing": {
            "serial": "response_templatesdriven_5fa2a1c87e381270995749",
            "qtiClass": "responseProcessing",
            "attributes": {},
            "debug": {
                "relatedItem": "item_5fa2a1c8767ad740071033"
            },
            "processingType": "templateDriven",
            "responseRules": []
        },
        "apipAccessibility": ""
    };

    var pluginApi;
    var runner;
    var containerId = 'item-container';
    var providerName = 'mock';
    let testRunner;

    runnerFactory.registerProvider(providerName, providerMock());

    QUnit.module('API', {
        beforeEach: function setup() {
            runner = qtiItemRunner('qti', itemData).init();
        },
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    pluginApi = [
        {name: 'init', title: 'init'},
        {name: 'render', title: 'render'},
        {name: 'finish', title: 'finish'},
        {name: 'destroy', title: 'destroy'},
        {name: 'trigger', title: 'trigger'},
        {name: 'getTestRunner', title: 'getTestRunner'},
        {name: 'getAreaBroker', title: 'getAreaBroker'},
        {name: 'getConfig', title: 'getConfig'},
        {name: 'setConfig', title: 'setConfig'},
        {name: 'getState', title: 'getState'},
        {name: 'setState', title: 'setState'},
        {name: 'show', title: 'show'},
        {name: 'hide', title: 'hide'},
        {name: 'enable', title: 'enable'},
        {name: 'disable', title: 'disable'}
    ];

    QUnit.cases.init(pluginApi).test('plugin API ', function (data, assert) {
        var runner = runnerFactory(providerName);
        var plugin = pluginFactory(runner);
        assert.equal(
            typeof plugin[data.name],
            'function',
            `The pluginFactory instances expose a "${data.name}" function`
        );
    });

    QUnit.module('itemScrolling init', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    QUnit.test('itemScrolling data loading', function (assert) {
        var ready = assert.async();
        assert.expect(2);

        runner = qtiItemRunner('qti', itemData)
            .on('init', function () {
                assert.ok(typeof this._item === 'object', 'The item data is loaded and mapped to an object');
                assert.ok(typeof this._item.bdy === 'object', 'The item contains a body object');

                ready();
            })
            .init();
    });

    QUnit.module('Item render', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    QUnit.test('Item rendering', function (assert) {
        var ready = assert.async();
        assert.expect(3);

        const container = document.getElementById(containerId);

        assert.ok(container instanceof HTMLElement, 'the item container exists');
        assert.equal(container.children.length, 0, 'the container has no children');

        runner = qtiItemRunner('qti', itemData)
            .on('render', function () {
                assert.equal(container.children.length, 1, 'the container has children');

                ready();
            })
            .init()
            .render(container);

    });

    QUnit.module('itemScrolling render', {
        afterEach: function () {
            if (runner) {
                runner.clear();
            }
        }
    });

    let item;

    QUnit.test('itemScrolling rendering', function (assert) {
        var ready = assert.async();
        var renderer;

        assert.ok(typeof 'string' === 'string', 'The renderer creates a string');

        renderer = new QtiRenderer({baseUrl: './'});
        new QtiLoader().loadItemData(itemData, function (_item) {
            var self = this;
            renderer.load(function () {
                var result, $result;
                var $textBlocks;

                item = _item;
                item.setRenderer(this);

                var $container = $(`#rendering`);
                var areaBroker = areaBrokerMock({
                    $brokerContainer: $container
                });
                runnerFactory.registerProvider(providerName, providerMock({areaBroker: areaBroker}));

                testRunner = runnerFactory(providerName);
                testRunner.itemRunner = {_item: item};

                result = item.render({});

                assert.ok(typeof result === 'string', 'The renderer creates a string');
                assert.ok(result.length > 0, 'The renderer create some output');

                $result = $(result);
                $textBlocks = $('.text-block-wrap', $result);

                assert.ok($result.hasClass('qti-item'), 'The result is a qti item');
                assert.equal($('.qti-itemBody', $result).length, 1, 'The result contains an item body');
                assert.equal($textBlocks.first().length, 1, 'The result contains an text block');
                assert.equal($textBlocks.first().attr('data-scrolling'), 'true', 'The text block has enabled scroll');

                testRunner.getAreaBroker().getContentArea().append($result);

                var plugin = pluginFactory(testRunner, testRunner.getAreaBroker());
                testRunner.on('renderitem', function () {
                    console.log($textBlocks);
                    ready();
                });

                plugin
                    .init()
                    .then(function () {
                        testRunner.trigger('renderitem');
                    })
                    .catch(function (err) {
                        assert.ok(false, err.message);
                        ready();
                    });
            }, self.getLoadedClasses());
        });

    });
});
