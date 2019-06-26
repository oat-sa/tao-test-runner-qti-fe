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

requirejs.config({
    baseUrl: '/',
    paths: {
        css: '/node_modules/require-css/css',
        json: '/node_modules/requirejs-plugins/src/json',
        text: '/node_modules/requirejs-plugins/lib/text',

        /* TEST related */
        'qunit-parameterize': '/environment/qunit2-parameterize',
        qunit: '/node_modules/qunit/qunit',
        'taoQtiTest/test/runner': '/test',
        'taoQtiItem/test/samples': '/test/samples',

        'taoQtiTest/runner': '/dist',
        // because of templates
        'taoQtiTestSource/runner': '/src',

        basicStyle: '/css',

        ui: '/node_modules/@oat-sa/tao-core-ui/dist',
        core: '/node_modules/@oat-sa/tao-core-sdk/dist/core',
        util: '/node_modules/@oat-sa/tao-core-sdk/dist/util',
        'taoItems/assets': '/node_modules/@oat-sa/tao-item-runner/dist/assets',
        'taoItems/runner': '/node_modules/@oat-sa/tao-item-runner/dist/runner',
        'taoQtiItem/runner': '/node_modules/@oat-sa/tao-item-runner-qti/dist/runner',
        'taoQtiItem/qtiItem': '/node_modules/@oat-sa/tao-item-runner-qti/dist/qtiItem',
        'taoQtiItem/qtiCommonRenderer': '/node_modules/@oat-sa/tao-item-runner-qti/dist/qtiCommonRenderer',
        'taoQtiItem/qtiRunner': '/node_modules/@oat-sa/tao-item-runner-qti/dist/qtiRunner',
        'taoTests/runner': '/node_modules/@oat-sa/tao-test-runner/dist',
        jquery: '/node_modules/jquery/jquery',
        lodash: '/node_modules/lodash/lodash',
        moment: '/node_modules/moment/min/moment-with-locales',
        handlebars: '/node_modules/handlebars/dist/handlebars.amd',

        /* LIBS */
        'lib/dompurify/purify': '/node_modules/dompurify/dist/purify',
        'lib/simulator': '/lib/simulator',
        'lib/unmatrix': '/lib/unmatrix',
        class: '/lib/class',
        tpl: '/lib/tpl',
        'lib/jquery.mockjax': '/node_modules/jquery-mockjax/dist/jquery.mockjax',
        // 'lib/moment-timezone.min': '/node_modules/moment-timezone/builds/moment-timezone-with-data.min',
        async: '/node_modules/async/lib/async',
        'lib/gamp/gamp': '/node_modules/gamp/src/gamp',
        select2: '/node_modules/select2/select2',
        interact: '/node_modules/interactjs/dist/interact',
        'lib/popper/tooltip': '/node_modules/tooltip.js/dist/umd/tooltip',
        popper: '/node_modules/popper.js/dist/umd/popper',
        /* LIBS END */
        lib: '/node_modules/@oat-sa/tao-core-libs/dist'
    },
    shim: {
        'qunit-parameterize': {
            deps: ['qunit/qunit']
        }
    },
    waitSeconds: 15
});

define('qunitLibs', [
    'qunit/qunit',
    'css!qunit/qunit.css',
    'css!basicStyle/tao-main-style.css',
    'css!basicStyle/new-test-runner.css'
]);
define('qunitEnv', ['qunitLibs', 'qunit-parameterize'], function() {
    requirejs.config({ nodeIdCompat: true });
});

define('context', ['module'], function(module) {
    return module.config();
});

define('i18n', ['core/format'], format => (text, ...variables) => {
    if (variables) {
        text = format(text, ...variables);
    }
    return text;
});

define('taoQtiItem/portableElementRegistry/assetManager/portableAssetStrategy', [], () => ({
    name: 'mock',
    handle: () => {}
}));

define('taoQtiItem/portableElementRegistry/ciRegistry', [], () => ({
    resetProviders() {
        throw new Error('Not implemented');
    },
    registerProvider() {
        throw new Error('Not implemented');
    }
}));
define('taoQtiItem/portableElementRegistry/icRegistry', [], () => ({
    resetProviders() {
        throw new Error('Not implemented');
    },
    registerProvider() {
        throw new Error('Not implemented');
    }
}));
define('taoQtiItem/portableElementRegistry/provider/sideLoadingProviderFactory', [], () => {});
