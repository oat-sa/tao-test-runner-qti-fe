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
import containerTpl from './container.tpl';

function findFocusable(targetElement) {
    const $elem = $(targetElement)
        .find(':not(.hidden)[tabindex]').first();
    return $elem;
}

/**
 * close shortcuts popup
 */
function closeShortcuts() {
    this.shortcuts.hide();
    this.shortcuts.getElement().off('click', this.closeShortcuts);
    $(window).off('keydown', this.closeShortcuts);
}

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
        }

        this.jumplinks = jumplinksFactory(config)
            .on('render', () => {
                const closeShortcutsHandler = closeShortcuts.bind(this);
                this.jumplinks.on('jump', (jumpTo) => {
                    const areaBroker = this.getAreaBroker();
                    const $element = getJumpElementFactory(areaBroker)[jumpTo];
                    $element.focus();
                });
                this.jumplinks.on('shortcuts', () => {
                    this.shortcuts.show();
                    this.shortcuts.getElement()
                        .off('click', closeShortcutsHandler)
                        .on('click', closeShortcutsHandler);
                    $(window)
                        .off('keydown', closeShortcutsHandler)
                        .on('keydown', closeShortcutsHandler);
                });
            })
            .on('update', function update(params) {
                this.trigger('changeReviewPanel', params.isReviewPanelEnabled);
                this.trigger('changeQuesitionStatus', params.questionStatus);
            })
            .on('changeReviewPanel', function changeReviewPanel (enabled) {
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
                const text = __('Question') + ' - ' + questionStatus;
                elem
                    .find('[data-jump="question"] > b')
                    .text(text);
            });
        
        testRunner
            .on('loaditem', () => {
                const item = testRunner.getCurrentItem();
                const config = {
                    isReviewPanelEnabled: isReviewPanelEnabled(testRunner),
                    questionStatus: getItemStatus(item)
                }

                this.jumplinks.trigger('update', config);
            })
            .on('tool-flagitem', () => {
                const item = testRunner.getCurrentItem();
                const questionStatus = getItemStatus({ ...item, flagged: !item.flagged });

                this.jumplinks.trigger('changeQuesitionStatus', questionStatus);
            })
        this.shortcuts = shortcutsFactory({});
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        const jumplinksContainer = $(containerTpl());
        $('.content-wrap').prepend(jumplinksContainer);
        this.jumplinks.render(jumplinksContainer);
        this.shortcuts.render(this.getAreaBroker().getControlArea());
    },
});
