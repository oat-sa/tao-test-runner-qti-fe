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
    'jquery',
    'ui/dialog/alert',
    'taoTests/runner/runnerComponent',
    'tpl!taoQtiTest/test/runner/plugins/content/keyNavigation/assets/layout',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/config.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/test.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/item.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/rubrics.json',
    'json!taoQtiTest/test/runner/plugins/content/keyNavigation/data/navigation.json'
], function (
    $,
    dialogAlert,
    runnerComponent,
    layoutTpl,
    configData,
    testDefinition,
    itemsBank,
    rubricsBank,
    navigationCases
) {
    'use strict';

    /**
     * Builds a visual playground to demo the modes of the keyNavigation plugin
     * @param {String|HTMLElemennt} container
     * @param {backendMock}backendMock
     * @returns {Promise<unknown>}
     */
    return function visualPlayground(container, backendMock) {
        const $container = $(container);
        const $selector = $container.find('.playground-selector');
        const $view = $container.find('.playground-view');
        const modes = [];

        return Promise.resolve()
            .then(() => new Promise((resolve, reject) => {
                $view.html(layoutTpl());
                runnerComponent($view.find('.runner'), configData)
                    .on('error', reject)
                    .on('ready', runner => {
                        runner
                            .after('renderitem.runnerComponent', () => {
                                runner.off('renderitem.runnerComponent');
                                resolve(runner);
                            })
                            .after('setcontenttabtype', mode => {
                                const modeData = navigationCases.find(navigation => navigation.mode === mode);
                                const {rubrics} = modeData;
                                if (rubrics) {
                                    backendMock.setRubricsBank(rubricsBank);
                                } else {
                                    backendMock.setRubricsBank({});
                                }
                                runner.jump(runner.getTestContext().itemPosition);
                            });
                    });
            }))
            .then(runner => {
                function activateMode(id) {
                    modes.forEach(mode => mode.$button.toggleClass('btn-info', id === mode.id));
                    $view.attr('data-mode', id);
                    runner.trigger('setcontenttabtype', id);
                }

                $view.find('header').on('click', 'a', e => {
                    dialogAlert(`You clicked on <b>${$(e.currentTarget).text()}</b>`);
                    e.preventDefault();
                });

                $selector
                    .on('click', 'button', e => {
                        activateMode(e.target.dataset.mode);
                    })
                    .find('button').each(function () {
                        modes.push({
                            id: this.dataset.mode,
                            $button: $(this)
                        });
                    });

                activateMode('default');
            });
    };
});
