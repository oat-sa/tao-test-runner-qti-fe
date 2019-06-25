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
        // tpl: '/environment/tpl',

        /* TEST related */
        'qunit-parameterize': '/environment/qunit2-parameterize',
        qunit: '/node_modules/qunit/qunit',
        'taoQtiTest/test/runner': '/test',

        'taoQtiTest/runner': '/dist',

        ui: '/node_modules/@oat-sa/tao-core-ui/dist',
        core: '/node_modules/@oat-sa/tao-core-sdk/dist/core',
        util: '/node_modules/@oat-sa/tao-core-sdk/dist/util',
        taoItems: '/node_modules/@oat-sa/tao-item-runner/dist',
        jquery: '/node_modules/jquery/jquery',
        lodash: '/node_modules/lodash/lodash',
        moment: '/node_modules/moment/min/moment-with-locales',
        handlebars: '/node_modules/handlebars/dist/handlebars.amd',

        /* LIBS */
        // 'lib/dompurify/purify': '/node_modules/dompurify/dist/purify',
        // 'lib/moment-timezone.min': '/node_modules/moment-timezone/builds/moment-timezone-with-data.min',
        // async: '/node_modules/async/lib/async',
        /* LIBS END */
        helpers: '../helpers',
        lib: '/node_modules/@oat-sa/tao-core-libs/dist'
    },
    shim: {
        'qunit-parameterize': {
            deps: ['qunit/qunit']
        }
    },
    waitSeconds: 15
});

define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
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
