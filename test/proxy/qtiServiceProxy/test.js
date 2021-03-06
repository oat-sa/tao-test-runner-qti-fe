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
 * Copyright (c) 2016-2018 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'util/url',
    'core/communicator',
    'taoTests/runner/proxy',
    'taoQtiTest/runner/proxy/qtiServiceProxy',
    'lib/jquery.mockjax'
], function(
    $,
    _,
    urlUtil,
    communicatorFactory,
    proxyFactory,
    qtiServiceProxy
) {
    'use strict';

    QUnit.module('qtiServiceProxy');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.test('module', function(assert) {
        assert.expect(6);
        assert.equal(typeof qtiServiceProxy, 'object', 'The qtiServiceProxy module exposes an object');
        assert.equal(typeof proxyFactory, 'function', 'The proxyFactory module exposes a function');
        assert.equal(typeof proxyFactory.registerProvider, 'function', 'The proxyFactory module exposes a registerProvider method');
        assert.equal(typeof proxyFactory.getProvider, 'function', 'The proxyFactory module exposes a getProvider method');

        proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

        assert.equal(typeof proxyFactory('qtiServiceProxy'), 'object', 'The proxyFactory factory has registered the qtiServiceProxy definition and produces an instance');
        assert.notStrictEqual(proxyFactory('qtiServiceProxy'), proxyFactory('qtiServiceProxy'), 'The proxyFactory factory provides a different instance of qtiServiceProxy on each call');
    });

    QUnit
        .cases.init([
            {title: 'install'},
            {title: 'init'},
            {title: 'destroy'},
            {title: 'getTestData'},
            {title: 'getTestContext'},
            {title: 'getTestMap'},
            {title: 'sendVariables'},
            {title: 'callTestAction'},
            {title: 'getItem'},
            {title: 'submitItem'},
            {title: 'callItemAction'},
            {title: 'telemetry'},
            {title: 'loadCommunicator'}
        ])
        .test('proxy API ', function(data, assert) {
            assert.expect(1);
            assert.equal(typeof qtiServiceProxy[data.title], 'function', `The qtiServiceProxy definition exposes a "${  data.title  }" function`);
        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.init ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('init', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(7);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                responseText: caseData.response,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.on('init', function(promise, config) {
                assert.ok(true, 'The proxy has fired the "init" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "init" event');
                assert.equal(config, initConfig, 'The proxy has provided the config object through the "init" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    result = proxy.init();

                    assert.equal(typeof result, 'object', 'The proxy.init method has returned a promise');

                    result
                        .then(function(data) {
                            if (caseData.success) {
                                assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                            } else {
                                assert.ok(false, 'The proxy must throw an error!');
                            }
                        })
                        .catch(function(err) {
                            assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                        })
                        .then(function() {
                            if (caseData.sendToken) {
                                tokenHandler.getToken().then(function(storedToken) {
                                    assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                    ready();
                                });
                            }
                        });
                });
        });

    QUnit.test('qtiServiceProxy.destroy', function(assert) {
        var ready = assert.async();
        var initConfig = {
            testDefinition: 'http://tao.dev/mockTestDefinition#123',
            testCompilation: 'http://tao.dev/mockTestCompilation#123',
            serviceCallId: 'http://tao.dev/mockServiceCallId#123',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension'
            }
        };

        var proxy, tokenHandler, result;

        assert.expect(5);

        proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

        $.mockjax([{
            url: '/init*',
            headers: {
                'X-CSRF-Token': '4567'
            },
            responseText: {
                success: true
            }
        }, {
            url: '/(^init)*',
            status: 500,
            response: function() {
                assert.ok(false, 'The proxy must not use an ajax request to destroy the instance!');
            }
        }]);

        proxy = proxyFactory('qtiServiceProxy', initConfig);
        tokenHandler = proxy.getTokenHandler();

        proxy.install();

        proxy.on('destroy', function(promise) {
            assert.ok(true, 'The proxyFactory has fired the "destroy" event');
            assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "destroy" event');
        });

        tokenHandler.clearStore()
        .then(function() {
            return tokenHandler.setToken('1234');
        })
        .then(function() {
            return proxy.init();
        })
        .then(function() {

            result = proxy.destroy();

            assert.equal(typeof result, 'object', 'The proxy.destroy method has returned a promise');

            result
                .then(function() {
                    assert.ok(true, 'The proxy has resolved the promise provided by the "destroy" method!');

                    proxy.getTestContext()
                        .then(function() {
                            assert.ok(false, 'The proxy must be initialized');
                            ready();
                        })
                        .catch(function() {
                            assert.ok(true, 'The proxy must be initialized');
                            ready();
                        });
                })
                .catch(function() {
                    assert.ok(false, 'The proxy cannot reject the promise provided by the "destroy" method!');
                    ready();
                });
        }).catch(function() {
            assert.ok(false, 'The proxy has not been properly initialized!');
            ready();
        });
    });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                testData: {},
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.getTestData ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('getTestData', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(7);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.getTestData()
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            tokenHandler.clearStore()
            .then(function() {
                return tokenHandler.setToken(caseData.sendToken);
            })
            .then(function() {
                return proxy.init();
            })
            .then(function() {
                $.mockjax({
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    headers: {
                        'X-CSRF-Token': caseData.receiveToken
                    },
                    response: function(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                });

                proxy.on('getTestData', function(promise) {
                    assert.ok(true, 'The proxy has fired the "getTestData" event');
                    assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "getTestData" event');
                });

                result = proxy.getTestData();

                assert.equal(typeof result, 'object', 'The proxy.getTestData method has returned a promise');

                result.then(function(data) {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(function(err) {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                })
                .then(function() {
                    if (caseData.sendToken) {
                        tokenHandler.getToken().then(function(storedToken) {
                            assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                            ready();
                        });
                    }
                });
            });
        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                testContext: {},
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.getTestContext ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('getTestContext', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(7);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.getTestContext()
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                responseText: caseData.response,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('getTestContext', function(promise) {
                assert.ok(true, 'The proxy has fired the "getTestContext" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "getTestContext" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.getTestContext();

                    assert.equal(typeof result, 'object', 'The proxy.getTestContext method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    })
                    .catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });

        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                testMap: {},
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.getTestMap ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('getTestMap', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(7);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.getTestMap()
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('getTestMap', function(promise) {
                assert.ok(true, 'The proxy has fired the "getTestMap" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "getTestMap" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.getTestMap();

                    assert.equal(typeof result, 'object', 'The proxy.getTestMap method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    })
                    .catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });
        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            variables: {
                var1: '1',
                var2: '10'
            },
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            variables: {
                var1: '1',
                var2: '10'
            },
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            variables: {
                var1: '1',
                var2: '10'
            },
            response: 'error',
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.sendVariables ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('storeTraceData', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(8);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });


            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.sendVariables(caseData.variables)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('sendVariables', function(promise, variables) {
                assert.ok(true, 'The proxy has fired the "sendVariables" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "sendVariables" event');
                assert.deepEqual(variables, caseData.variables, 'The proxy has provided the variables through the "sendVariables" event');
            });

            tokenHandler.clearStore()
            .then(function() {
                return tokenHandler.setToken(caseData.sendToken);
            })
            .then(function() {
                return proxy.init();
            })
            .then(function() {
                result = proxy.sendVariables(caseData.variables);

                assert.equal(typeof result, 'object', 'The proxy.sendVariables method has returned a promise');

                result.then(function(data) {
                    if (caseData.success) {
                        assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(function(err) {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                })
                .then(function() {
                    if (caseData.sendToken) {
                        tokenHandler.getToken().then(function(storedToken) {
                            assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                            ready();
                        });
                    }
                });
            });
        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            action: 'move',
            params: {
                type: 'forward'
            },
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            action: 'move',
            params: {
                type: 'forward'
            },
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            action: 'move',
            params: {
                type: 'forward'
            },
            response: 'error',
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.callTestAction ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route(caseData.action, initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                serviceCallId: initConfig.serviceCallId
            });

            var proxy, tokenHandler, result;

            assert.expect(9);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.callTestAction(caseData.action, caseData.params)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('callTestAction', function(promise, action, params) {
                assert.ok(true, 'The proxy has fired the "callTestAction" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "callTestAction" event');
                assert.equal(action, caseData.action, 'The proxy has provided the action through the "callTestAction" event');
                assert.deepEqual(params, caseData.params, 'The proxy has provided the params through the "callTestAction" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.callTestAction(caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callTestAction method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    })
                    .catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });
        });

    QUnit
        .cases.init([{
            title: 'success',
            uri: 'http://tao.dev/mockItemDefinition#123',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                itemData: {
                    interactions: [{}]
                },
                itemState: {
                    response: [{}]
                },
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            uri: 'http://tao.dev/mockItemDefinition#123',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            uri: 'http://tao.dev/mockItemDefinition#123',
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.getItem ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('getItem', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                testServiceCallId: initConfig.serviceCallId,
                itemDefinition: caseData.uri
            });

            var proxy, tokenHandler, result;

            assert.expect(8);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.getItem(caseData.uri)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('getItem', function(promise, uri) {
                assert.ok(true, 'The proxy has fired the "getItem" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "getItem" event');
                assert.equal(uri, caseData.uri, 'The proxy has provided the URI through the "getItem" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.getItem(caseData.uri);

                    assert.equal(typeof result, 'object', 'The proxy.getItem method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    }).catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });
        });

    QUnit
        .cases.init([{
            title: 'success',
            uri: 'http://tao.dev/mockItemDefinition#123',
            itemState: {response: [{}]},
            itemResponse: {response: [{}]},
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            uri: 'http://tao.dev/mockItemDefinition#123',
            itemState: {response: [{}]},
            itemResponse: {response: [{}]},
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            uri: 'http://tao.dev/mockItemDefinition#123',
            itemState: {response: [{}]},
            itemResponse: {response: [{}]},
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.submitItem ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route('submitItem', initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                testServiceCallId: initConfig.serviceCallId,
                itemDefinition: caseData.uri
            });

            var proxy, tokenHandler, result;

            assert.expect(10);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.submitItem(caseData.uri, caseData.itemState, caseData.itemResponse)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('submitItem', function(promise, uri, state, response) {
                assert.ok(true, 'The proxy has fired the "submitItem" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "submitItem" event');
                assert.equal(uri, caseData.uri, 'The proxy has provided the URI through the "submitItem" event');
                assert.deepEqual(state, caseData.itemState, 'The proxy has provided the state through the "submitItem" event');
                assert.deepEqual(response, caseData.itemResponse, 'The proxy has provided the response through the "submitItem" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.submitItem(caseData.uri, caseData.itemState, caseData.itemResponse);

                    assert.equal(typeof result, 'object', 'The proxy.submitItem method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    }).catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });
        });

    QUnit
        .cases.init([{
            title: 'success',
            uri: 'http://tao.dev/mockItemDefinition#123',
            action: 'comment',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            uri: 'http://tao.dev/mockItemDefinition#123',
            action: 'comment',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            uri: 'http://tao.dev/mockItemDefinition#123',
            action: 'comment',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            receiveToken: '4567',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.callItemAction ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route(caseData.action, initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                testServiceCallId: initConfig.serviceCallId,
                itemDefinition: caseData.uri
            });

            var proxy, tokenHandler, result;

            assert.expect(10);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.callItemAction(caseData.uri, caseData.action, caseData.params)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('callItemAction', function(promise, uri, action, params) {
                assert.ok(true, 'The proxy has fired the "callItemAction" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "callItemAction" event');
                assert.equal(uri, caseData.uri, 'The proxy has provided the URI through the "callItemAction" event');
                assert.equal(action, caseData.action, 'The proxy has provided the action through the "callItemAction" event');
                assert.deepEqual(params, caseData.params, 'The proxy has provided the params through the "callItemAction" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.callItemAction(caseData.uri, caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callItemAction method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    }).catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        if (caseData.sendToken) {
                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, caseData.receiveToken, 'The proxy must update the security token');

                                ready();
                            });
                        }
                    });
                });
        });

    QUnit
        .cases.init([{
            title: 'success',
            uri: 'http://tao.dev/mockItemDefinition#123',
            signal: 'hello',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            response: {
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            uri: 'http://tao.dev/mockItemDefinition#123',
            signal: 'hello',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            response: {
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            uri: 'http://tao.dev/mockItemDefinition#123',
            signal: 'hello',
            params: {
                text: 'lorem ipsum'
            },
            sendToken: '1234',
            response: "error",
            ajaxSuccess: false,
            success: false
        }])
        .test('qtiServiceProxy.telemetry ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                testDefinition: 'http://tao.dev/mockTestDefinition#123',
                testCompilation: 'http://tao.dev/mockTestCompilation#123',
                serviceCallId: 'http://tao.dev/mockServiceCallId#123',
                bootstrap: {
                    serviceController: 'MockRunner',
                    serviceExtension: 'MockExtension'
                }
            };

            var expectedUrl = urlUtil.route(caseData.signal, initConfig.bootstrap.serviceController, initConfig.bootstrap.serviceExtension, {
                testDefinition: initConfig.testDefinition,
                testCompilation: initConfig.testCompilation,
                testServiceCallId: initConfig.serviceCallId,
                itemDefinition: caseData.uri
            });

            var proxy, tokenHandler, result;

            assert.expect(10);

            proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

            $.mockjax({
                url: '/init*',
                headers: {
                    'X-CSRF-Token': '4567-post-init'
                },
                responseText: {
                    success: true
                }
            });

            proxy = proxyFactory('qtiServiceProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy.install();

            proxy.telemetry(caseData.uri, caseData.signal, caseData.params)
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                });

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            });

            proxy.on('telemetry', function(promise, uri, signal, params) {
                assert.ok(true, 'The proxy has fired the "telemetry" event');
                assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "telemetry" event');
                assert.equal(uri, caseData.uri, 'The proxy has provided the URI through the "telemetry" event');
                assert.equal(signal, caseData.signal, 'The proxy has provided the signal through the "telemetry" event');
                assert.deepEqual(params, caseData.params, 'The proxy has provided the params through the "telemetry" event');
            });

            tokenHandler.clearStore()
                .then(function() {
                    return tokenHandler.setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    result = proxy.telemetry(caseData.uri, caseData.signal, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.telemetry method has returned a promise');

                    result.then(function(data) {
                        if (caseData.success) {
                            assert.deepEqual(data, caseData.response, 'The proxy has returned the expected data');
                        } else {
                            assert.ok(false, 'The proxy must throw an error!');
                        }
                    }).catch(function(err) {
                        assert.ok(!caseData.success, `The proxy has thrown an error! #${  err}`);
                    })
                    .then(function() {
                        tokenHandler.getToken().then(function(storedToken) {
                            assert.equal(storedToken, '4567-post-init', 'The proxy must not update the security token');

                            ready();
                        });
                    });
                });
        });

    QUnit.test('qtiServiceProxy.getCommunicator #enabled', function(assert) {
        var ready = assert.async();
        var initConfig = {
            testDefinition: 'http://tao.dev/mockTestDefinition#123',
            testCompilation: 'http://tao.dev/mockTestCompilation#123',
            serviceCallId: 'http://tao.dev/mockServiceCallId#123',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension',
                communication: {
                    enabled: true,
                    type: 'mock',
                    extension: 'MockRunner',
                    controller: 'MockCommunicator',
                    action: 'messages',
                    service: null,
                    params: {
                        interval: 30,
                        timeout: 30
                    }
                }
            }
        };

        var mockCommunicator = {
            on: function() {
                return this;
            },
            init: function() {
                assert.ok(true, 'The communicator is initialized');
                return Promise.resolve();
            },
            open: function() {
                assert.ok(true, 'The communicator is open');
                return Promise.resolve();
            },
            close: function() {
                assert.ok(true, 'The communicator is closed');
                return Promise.resolve();
            },
            destroy: function() {
                assert.ok(true, 'The communicator must be destroyed when the proxy is destroying');
                return Promise.resolve();
            }
        };

        var proxy;

        assert.expect(8);

        communicatorFactory.registerProvider(initConfig.bootstrap.communication.type, mockCommunicator);
        proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        proxy = proxyFactory('qtiServiceProxy', initConfig);

        proxy.install();

        proxy.getCommunicator()
            .then(function() {
                assert.ok(false, 'The proxy must be initialized');
            })
            .catch(function() {
                assert.ok(true, 'The proxy must be initialized');
            });

        proxy.init().then(function() {
            proxy.getCommunicator().then(function(c1) {
                var theCommunicator = c1;
                assert.ok(!!c1, 'The proxy has built a communicator handler');
                assert.equal(typeof c1, 'object', 'The proxy has built a communicator handler');

                proxy.getCommunicator().then(function(c2) {
                    assert.equal(c2, theCommunicator, 'The proxy returned the already built communicator handler');

                    proxy.destroy()
                        .then(function() {
                            ready();
                        });
                });
            });
        });
    });

    QUnit.test('qtiServiceProxy.getCommunicator #disabled', function(assert) {
        var ready = assert.async();
        var initConfig = {
            testDefinition: 'http://tao.dev/mockTestDefinition#123',
            testCompilation: 'http://tao.dev/mockTestCompilation#123',
            serviceCallId: 'http://tao.dev/mockServiceCallId#123',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension',
                communication: {
                    enabled: false,
                    type: 'mock',
                    extension: 'MockRunner',
                    controller: 'MockCommunicator',
                    action: 'messages',
                    service: null,
                    params: {
                        interval: 30,
                        timeout: 30
                    }
                }
            }
        };

        var proxy;

        assert.expect(3);

        proxyFactory.registerProvider('qtiServiceProxy', qtiServiceProxy);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        proxy = proxyFactory('qtiServiceProxy', initConfig);

        proxy.install();

        proxy.getCommunicator()
            .then(function() {
                assert.ok(false, 'The proxy must be initialized');
            })
            .catch(function() {
                assert.ok(true, 'The proxy must be initialized');
            });

        proxy.init().then(function() {
            proxy.getCommunicator().catch(function() {
                assert.ok(true, 'The communicator cannot be provided as it is disabled');

                proxy.getCommunicator().catch(function() {
                    assert.ok(true, 'The communicator cannot be provided as it is still disabled');

                    proxy.destroy()
                        .then(function() {
                            ready();
                        });
                });
            });
        });
    });

});
