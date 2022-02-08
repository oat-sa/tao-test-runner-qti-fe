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
 * Copyright (c) 2019-2021 (original work) Open Assessment Technologies SA ;
 */

import path from 'path';
import glob from 'glob-promise';
import alias from 'rollup-plugin-alias';
import clear from 'rollup-plugin-clear';
import handlebarsPlugin from 'rollup-plugin-handlebars-plus';
import cssResolve from './css-resolve';
import wildcardExternal from '@oat-sa/rollup-plugin-wildcard-external';
import babel from 'rollup-plugin-babel';
import istanbul from 'rollup-plugin-istanbul';
import { copyFile, mkdirp } from 'fs-extra';

const { srcDir, outputDir, aliases } = require('./path');
const Handlebars = require('handlebars');

const isDev = process.env.NODE_ENV === 'development';

const inputs = glob.sync(path.join(srcDir, '**', '*.js'));

/**
 * Define all modules as external, so rollup won't bundle them together.
 */
const localExternals = inputs.map(
    input =>
        `taoQtiTest/runner/${path
            .relative(srcDir, input)
            .replace(/\\/g, '/')
            .replace(/\.js$/, '')}`
);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'amd',
            sourcemap: isDev,
            name
        },
        watch: {
            clearScreen : false
        },
        external: [
            ...localExternals,
            'handlebars',
            'interact',
            'jquery',
            'lodash',
            'moment',
            'module',
            'nouislider',
            'i18n',
            'ckeditor',
            'layout/loading-bar'
        ],
        plugins: [
            clear({
                targets: [outputDir],
                watch: false
            }),
            cssResolve(),
            wildcardExternal(['core/**', 'ui/**', 'util/**', 'lib/**', 'taoTests/**', 'taoItems/**', 'taoQtiItem/**']),
            alias({
                resolve: ['.js', '.tpl'],
                ...aliases
            }),
            handlebarsPlugin({
                handlebars: {
                    id: 'handlebars',
                    options: {
                        sourceMap: false
                    },
                    module: Handlebars
                },
                // helpers: ['build/tpl.js'],
                templateExtension: '.tpl'
            }),
            ...(process.env.COVERAGE ? [istanbul()] : []),
            babel({
                presets: [
                    [
                        '@babel/env',
                        {
                            useBuiltIns: false
                        }
                    ]
                ]
            })
        ]
    };
});

/**
 * copy template files into dist, because other modules require them
 * It is asyncronous and it was made with purpose to run parallely with build,
 * because they do not effect each other
 */
glob(path.join(srcDir, '**', '*.tpl')).then(files => {
    files.forEach(async (file) => {
        const targetFile = path.resolve(outputDir, path.relative(srcDir, file));
        await mkdirp(path.dirname(targetFile));
        copyFile(file, targetFile);
    });
});
