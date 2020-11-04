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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 * @author Oleg Belanovich <oleg.belanovich@taotesting.com>
 */

import typeCaster from 'util/typeCaster';
import pluginFactory from 'taoTests/runner/plugin';

/**
 * Creates the loading bar plugin.
 * Displays a loading bar when a blocking task is running
 */
export default pluginFactory({
    name: 'itemScrolling',

    /**
     * Initializes the plugin (called during runner's init)
     */
    init: function init() {
        const testRunner = this.getTestRunner();
        const $contentArea = testRunner
            .getAreaBroker()
            .getContentArea();

        const gridRowBottomMargin = 12,
            qtiItemPadding = 30 * 2;

        testRunner
            .on('renderitem', function() {
                adaptItemHeight();
                $(window).off('resize.adaptItemHeight');
                $(window).on('resize.adaptItemHeight', adaptItemHeight);
            });


        function adaptItemHeight() {
            const $itemContainer = $contentArea.find('.text-block-wrap[data-scrolling]');
            const contentHeight = getItemRunnerHeight() - getExtraGridRowHeight() - getSpaceAboveQtiContent() - gridRowBottomMargin - qtiItemPadding;

            $itemContainer.each(function() {
                const $item = $(this);
                const isScrollable = typeCaster.strToBool($item.attr('data-scrolling') || 'false');
                const selectedHeight = parseFloat($item.attr('data-scrolling-height')) || 100;
                const containerParent = $item.parent().closest('.text-block-wrap[data-scrolling]');

                if ($item.length && isScrollable) {
                    $item.css({'overflow' : 'auto'});
                    if (containerParent.length > 0) {
                        $item.css('max-height', `${containerParent.height() * (selectedHeight * 0.01)}px`);
                    } else {
                        $item.css('max-height', `${contentHeight * (selectedHeight * 0.01)}px`);
                    }
                }
            });
        }

        // depending on the context (item preview, new/old test runner...) available height is computed differently
        function getItemRunnerHeight() {
            var $testRunnerSections = $('.test-runner-sections');

            // exists only in the new test runner
            if ($testRunnerSections.length) {
                return $testRunnerSections.get(0).getBoundingClientRect().height;
            }
            // otherwise, we assume that we are in an iframe with all space available (= item preview, old test runner)
            return $(window).height();
        }

        // extra grid row are there in case of a vertical layout (item on top/bottom of the question)
        function getExtraGridRowHeight() {
            var $gridRows = $('.qti-itemBody > .grid-row'),
                extraHeight = 0;

            $gridRows.each(function() {
                var $gridRow = $(this),
                    $itemContainer = $gridRow.find('[data-scrolling]');

                if (! $itemContainer.length) {
                    extraHeight += $gridRow.outerHeight(true);
                }
            });
            return extraHeight;
        }

        // most of the time this will be rubrick's block height in the new test runner
        function getSpaceAboveQtiContent() {
            var $testRunnerSections = $('.test-runner-sections'),
                $qtiContent = $('#qti-content');

            if ($testRunnerSections.length && $qtiContent.length) {
                return ($qtiContent.get(0).getBoundingClientRect().top - $testRunnerSections.get(0).getBoundingClientRect().top);
            }
            return 0;
        }
    }

});
