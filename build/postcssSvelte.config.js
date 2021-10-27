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
 * Copyright (c) 2020-2021 (original work) Open Assessment Technologies SA ;
 */
const path = require('path');

const plugins = [
    // require('postcss-import')(require('postcss-normalize')().postcssImport()),
    require('postcss-mixins')({
        mixinsDir: '/var/www/html/tao-community/tao-test-runner-qti-fe/node_modules/@oat-sa-private/ui-identity/css/mixins'
    }),
    require('postcss-preset-env')({
        stage: 1,
        importFrom: [
            '/var/www/html/tao-community/tao-test-runner-qti-fe/node_modules/@oat-sa-private/ui-identity/css/abstracts/_breakpoints.css'
        ]
    })
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(require('cssnano'));
}

module.exports = {
    map: { inline: false },
    plugins
};
