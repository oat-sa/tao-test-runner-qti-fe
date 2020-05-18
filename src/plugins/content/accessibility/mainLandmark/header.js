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
import pluginFactory from 'taoTests/runner/plugin';
import headerTpl from 'taoQtiTest/runner/plugins/content/accessibility/mainLandmark/header.tpl';
import mapHelper from 'taoQtiTest/runner/helpers/map';


export default pluginFactory({
    name: 'mainLandmark',
    init: function init() {
        const testRunner = this.getTestRunner();
        const testMap = testRunner.getTestMap();

        const updateTitles = () => {
            const testContext = testRunner.getTestContext();
            const currentItem = mapHelper.getItem(
                testMap,
                testContext.itemIdentifier
            );

            let state = 'unseen';
            if (currentItem.flagged) {
                state = 'flagged'
            } else if (currentItem.answered) {
                state = 'answered'
            } else if (currentItem.viewed) {
                state = 'viewed'
            }

            // update item title
            this.$title
                .text(`${currentItem.label}`)
                .show();

            // update item state
            this.$state
                .text(`${state}`)
                .show();
        };

        testRunner.after('renderitem', () => {
            updateTitles();
        });
    },
    render: function render() {
        const $container = this.getAreaBroker().getArea('titleHeader');
        this.$element = $(headerTpl());
        $container.append(this.$element);

        this.$title = $container.find(`[data-control="qti-test-item-title"]`);
        this.$state = $container.find(`[data-control="qti-test-item-state"]`);
    },
});
