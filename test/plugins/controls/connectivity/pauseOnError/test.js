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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
define([
    'lodash',
    'taoTests/runner/runner',
    'taoQtiTest/runner/plugins/controls/connectivity/pauseOnError'
], function (_, runnerFactory, pluginFactory) {
    'use strict';

    const providerName = 'mock';
    const getRunner = () => runnerFactory(providerName, [pluginFactory]);
    runnerFactory.registerProvider(providerName, {
        name: providerName,
        loadAreaBroker() {
        },
        loadProxy() {
        },
        init() {
        }
    });

    QUnit.module('pauseOnError plugin');

    QUnit.test('module', assert => {
        const runner = getRunner();

        assert.equal(typeof pluginFactory, 'function', 'The pluginFactory module exposes a function');
        assert.equal(typeof pluginFactory(runner), 'object', 'The plugin factory produces an instance');
        assert.notStrictEqual(
            pluginFactory(runner),
            pluginFactory(runner),
            'The plugin factory provides a different instance on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'init' },
            { title: 'render' },
            { title: 'finish' },
            { title: 'destroy' },
            { title: 'trigger' },
            { title: 'getTestRunner' },
            { title: 'getAreaBroker' },
            { title: 'getConfig' },
            { title: 'setConfig' },
            { title: 'getState' },
            { title: 'setState' },
            { title: 'show' },
            { title: 'hide' },
            { title: 'enable' },
            { title: 'disable' }
        ])
        .test('plugin API ', (data, assert) => {
            const runner = getRunner();
            const plugin = pluginFactory(runner);
            assert.equal(
                typeof plugin[data.title],
                'function',
                `The pluginFactory instance exposes a "${data.title}" function`
            );
        });

    QUnit.test('error then reload', assert => {
        const done = assert.async();
        const runner = getRunner();

        assert.expect(6);
        runner
            .on('init', () => {
                assert.ok(true, 'Runner has been initialized');
                runner.trigger('error', new Error('test'));
            })
            .on('confirm.*', (message, accept, cancel, options) => {
                assert.equal(typeof message, 'string', 'String message provided');
                assert.equal(typeof accept, 'function', 'Accept callback provided');
                assert.equal(typeof cancel, 'function', 'Cancel callback provided');
                assert.equal(typeof options, 'object', 'Options provided');
                cancel();
            })
            .before('pause', () => {
                assert.ok(false, 'The pause should not be triggered!');
                runner.destroy();
                return Promise.reject();
            })
            .before('reloadpage', () => {
                assert.ok(true, 'A page reload has been triggered');
                runner.destroy();
                return Promise.reject();
            })
            .on('destroy', done)
            .init();
    });

    QUnit.test('error then pause', assert => {
        const done = assert.async();
        const runner = getRunner();

        assert.expect(6);
        runner
            .on('init', () => {
                assert.ok(true, 'Runner has been initialized');
                runner.trigger('error', new Error('test'));
            })
            .on('confirm.*', (message, accept, cancel, options) => {
                assert.equal(typeof message, 'string', 'String message provided');
                assert.equal(typeof accept, 'function', 'Accept callback provided');
                assert.equal(typeof cancel, 'function', 'Cancel callback provided');
                assert.equal(typeof options, 'object', 'Options provided');
                accept();
            })
            .before('pause', context => {
                assert.equal(typeof context, 'object', 'The pause has been triggered and a context is provided');
                runner.destroy();
                return Promise.reject();
            })
            .before('reloadpage', () => {
                assert.ok(false, 'A page reload should not be triggered!');
                runner.destroy();
                return Promise.reject();
            })
            .on('destroy', done)
            .init();
    });
});
