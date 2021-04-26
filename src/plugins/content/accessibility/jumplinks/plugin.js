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
import { getJumpElementFactory, getItemStatus, isReviewPanelHidden } from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/helpers';
import jumplinksFactory from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/jumplinks';
import shortcutsFactory from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/shortcuts';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import containerTpl from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/container.tpl';

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
        const shortcutsConfig = navigator.appVersion.indexOf("Mac") !== -1
            ? {
                shortcutsGroups: [
                    {
                        id: 'navigation-shortcuts',
                        label: __('Navigation shortcuts'),
                        shortcuts: [
                            {
                                id: 'next',
                                shortcut: 'OPTION + Shift + N',
                                label: __('Go to the next question'),
                            },
                            {
                                id: 'previous',
                                shortcut: 'OPTION + Shift + P',
                                label: __('Go to the previous question'),
                            },
                            {
                                id: 'current',
                                shortcut: 'OPTION + Shift + Q',
                                label: __('Go to the current question'),
                            },
                            {
                                id: 'top',
                                shortcut: 'OPTION + Shift + T',
                                label: __('Go to the top of the page'),
                            },
                        ]
                    },
                ]
            }
            : {};

        if (testRunnerOptions.allowShortcuts) {
            pluginShortcuts.goToTop && shortcut.add(
                namespaceHelper.namespaceAll(pluginShortcuts.goToTop, this.getName(), true),
                function() {
                    $('[tabindex]').first().focus();
                },
                {
                    avoidInput: true,
                    prevent: true
                }
            );

            pluginShortcuts.goToQuestion && shortcut.add(
                namespaceHelper.namespaceAll(pluginShortcuts.goToQuestion, this.getName(), true),
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

                    this.shortcuts = shortcutsFactory(shortcutsConfig);

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
            .on('renderitem', () => {
                const currentItem = testRunner.getCurrentItem();
                const updatedConfig = {
                    isReviewPanelEnabled: !isReviewPanelHidden(testRunner) && isReviewPanelEnabled(testRunner),
                    questionStatus: getItemStatus(currentItem)
                };
                const announcedText = __('Item %s loaded', currentItem.position);
                let $announce = $('[aria-live=polite][role=alert]').first();

                if ($announce.length !== 1) {
                    $announce = $('<div aria-live="polite" role="alert" class="visible-hidden"></div>');
                    $('main').first().append($announce);
                }
                $announce.text(announcedText);

                this.jumplinks.trigger('update', updatedConfig);
            })
            .on('tool-flagitem', () => {
                const currentItem = testRunner.getCurrentItem();
                const questionStatus = getItemStatus(
                    Object.assign({}, currentItem, { flagged: !currentItem.flagged })
                );

                this.jumplinks.trigger('changeQuesitionStatus', questionStatus);
            })
            .on('tool-reviewpanel', () => {
                const wasHidden = isReviewPanelHidden(testRunner);

                this.jumplinks.trigger('changeReviewPanel', wasHidden);
            })
            .after('renderitem', () => {
                getJumpElement.question.attr('tabindex', '-1').focus();
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
