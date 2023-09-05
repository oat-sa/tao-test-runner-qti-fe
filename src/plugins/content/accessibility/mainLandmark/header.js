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
 * Test Runner Content Accessibility Plugin : MainLandmark
 *
 * @author Anastasia Razumovskaya <nastya.razum96@gmail.com>
 */
import $ from 'jquery';
import __ from 'i18n';
import pluginFactory from 'taoTests/runner/plugin';
import headerTpl from 'taoQtiTest/runner/plugins/content/accessibility/mainLandmark/header.tpl';

function getState(item) {
    let state = __('Unseen');
    if (item.flagged) {
        state = __('Flagged');
    } else if (item.answered) {
        state = __('Answered');
    } else if (item.viewed) {
        state = __('Viewed');
    }
    return state;
}

export default pluginFactory({
    name: 'mainLandmark',
    init() {
        const testRunner = this.getTestRunner();

        const updateTitle = (item) => {
            this.$title
                .text(`${item.label}`)
                .show();
        };

        const updateState = (item) => {
            this.$state
                .text(`${getState(item)}`)
                .show();
        };

        testRunner
            .after('renderitem', () => {
                const item = testRunner.getCurrentItem();
                updateTitle(item);
                updateState(item);
            })
            .on('tool-flagitem', () => {
                let item = testRunner.getCurrentItem();
                item = Object.assign({}, item, { flagged: !item.flagged });
                updateState(item);
            });
    },
    render() {
        const $container = this.getAreaBroker().getArea('mainLandmark');
        this.$element = $(headerTpl());
        $container.append(this.$element);

        this.$title = $container.find(`[data-control="qti-test-item-title"]`);
        this.$state = $container.find(`[data-control="qti-test-item-state"]`);
    },
});
