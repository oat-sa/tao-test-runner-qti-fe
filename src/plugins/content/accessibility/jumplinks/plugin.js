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

/**
 * @author aliaksandr paliakou <lecosson@gmail.com>
 */

import __ from 'i18n';
import $ from 'jquery';
import pluginFactory from 'taoTests/runner/plugin';
import isReviewPanelEnabled from 'taoQtiTest/runner/helpers/isReviewPanelEnabled';
import { getJumpElementFactory, getItemStatus } from './helpers';
import jumplinksFactory from './jumplinks';
import shortcutsFactory from './shortcuts';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import containerTpl from './container.tpl';

/**
 * Creates the JumpLinks plugin.
 * adding jumplinks accessibility feature for quick navigation
 */
export default pluginFactory({
    name: 'jumplinks',

    /**
     * Initializes the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const item = testRunner.getCurrentItem();
        const config = {
            isReviewPanelEnabled: isReviewPanelEnabled(testRunner),
            questionStatus: getItemStatus(item)
        };
        const testRunnerOptions = testRunner.getOptions();
        const pluginShortcuts = (testRunnerOptions.shortcuts || {})[this.getName()] || {};
        const areaBroker = this.getAreaBroker();
        const getJumpElement = getJumpElementFactory(areaBroker);

        if (testRunnerOptions.allowShortcuts) {
            shortcut.add(
                namespaceHelper.namespaceAll('Alt+Shift+T', this.getName(), true),
                function() {
                    getJumpElement.container.focus();
                },
                {
                    avoidInput: true,
                    prevent: true
                }
            );

            shortcut.add(
                namespaceHelper.namespaceAll('Alt+Shift+Q', this.getName(), true),
                function() {
                    getJumpElement.question.focus();
                },
                {
                    avoidInput: true,
                    prevent: true
                }
            );
        }

        this.jumplinks = jumplinksFactory(config)
            .on('render', () => {
                this.jumplinks.on('jump', (jumpTo) => {
                    const $element = getJumpElement[jumpTo];
                    $element.focus();
                });

                this.jumplinks.on('shortcuts', () => {
                    if (this.shortcuts) {
                        return;
                    }

                    this.shortcuts = shortcutsFactory({});

                    this.shortcuts.render(this.getAreaBroker().getControlArea());

                    this.shortcuts.on('close', () => {
                        this.shortcuts.destroy();

                        this.shortcuts = null;
                    });
                });
            })
            .on('update', function update(params) {
                this.trigger('changeReviewPanel', params.isReviewPanelEnabled);
                this.trigger('changeQuesitionStatus', params.questionStatus);
            })
            .on('changeReviewPanel', function changeReviewPanel(enabled) {
                const elem = this.getElement();
                const panelJumplink = elem
                    .find('[data-jump="teststatus"]')
                    .parent();
                if (enabled) {
                    panelJumplink.removeClass('hidden');
                } else {
                    panelJumplink.addClass('hidden');
                }
            })
            .on('changeQuesitionStatus', function changeQuesitionStatus(questionStatus) {
                const elem = this.getElement();
                const text = `${__('Question')} - ${questionStatus}`;
                elem
                    .find('[data-jump="question"] > b')
                    .text(text);
            });

        testRunner
            .on('loaditem', () => {
                const currentItem = testRunner.getCurrentItem();
                const updatedConfig = {
                    isReviewPanelEnabled: isReviewPanelEnabled(testRunner),
                    questionStatus: getItemStatus(currentItem)
                };

                this.jumplinks.trigger('update', updatedConfig);
            })
            .on('tool-flagitem', () => {
                const currentItem = testRunner.getCurrentItem();
                const questionStatus = getItemStatus(
                    Object.assign(currentItem, { flagged: !item.flagged })
                );

                this.jumplinks.trigger('changeQuesitionStatus', questionStatus);
            });
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        const jumplinksContainer = $(containerTpl());
        $('.content-wrap').prepend(jumplinksContainer);
        this.jumplinks.render(jumplinksContainer);
    },
});
