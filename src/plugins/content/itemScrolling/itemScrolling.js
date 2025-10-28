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

import $ from 'jquery';
import typeCaster from 'util/typeCaster';
import pluginFactory from 'taoTests/runner/plugin';
import { getIsItemWritingModeVerticalRl } from 'taoQtiTest/runner/helpers/verticalWriting';

//TODO: import
const writingModeVerticalRlClass = 'writing-mode-vertical-rl';
const writingModeHorizontalTbClass = 'writing-mode-horizontal-tb';

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
        const $contentArea = testRunner.getAreaBroker().getContentArea();

        testRunner
            .on('renderitem', function () {
                // qti-itemBody is item scroll container in vertical writing mode (but not in horizontal);
                // window resize is not enough, because if review-panel is used, it can be closed/opened, and that affects qti-itemBody width.
                const isItemVerticalWriting = getIsItemWritingModeVerticalRl();
                const $itemScrollContainer = isItemVerticalWriting ? $('.qti-itemBody') : $('.content-wrapper'); //test-runner-sections?

                this.itemResizeObserver = new ResizeObserver(() => requestAnimationFrame(adaptBlockSize));
                this.itemResizeObserver.observe($itemScrollContainer.get(0));
            })
            .on('unloaditem', function () {
                if (this.itemResizeObserver) {
                    this.itemResizeObserver.disconnect();
                }
            });

        function adaptBlockSize() {
            const isItemVerticalWriting = getIsItemWritingModeVerticalRl();

            const $blockContainer = $contentArea.find('[data-scrolling="true"]');
            const isBlockVerticalWriting =
                $blockContainer.hasClass(writingModeVerticalRlClass) ||
                (isItemVerticalWriting && !$blockContainer.hasClass(writingModeHorizontalTbClass));

            const contentBlockSize =
                getItemRunnerBlockSize(isItemVerticalWriting) -
                // getExtraGridRowBlockSize(isItemVerticalWriting) -
                // getSpaceAroundQtiContent(isItemVerticalWriting) -
                // getQtiItemAndItemBodyPadding(isItemVerticalWriting) -
                // getGridRowBlockMargin() -
                2;
            console.log('contentBlockSizeAA', contentBlockSize);

            $blockContainer.each(function () {
                const $item = $(this);
                const isScrollable = typeCaster.strToBool($item.attr('data-scrolling') || 'false');
                const selectedBlockSize = parseFloat($item.attr('data-scrolling-height')) || 100;
                const containerParent = $item.parent().closest('[data-scrolling="true"]');
                const containerBlockSize = isItemVerticalWriting ? containerParent.width() : containerParent.height();
                const overflowCssProp = isItemVerticalWriting ? 'overflow-x' : 'overflow-y'; //why inline style?
                const maxSizeCssProp = isItemVerticalWriting ? 'max-width' : 'max-height';

                if ($item.length && isScrollable) {
                    $item.data('scrollable', true);
                    $item.css({ [overflowCssProp]: 'auto' });

                    if (containerParent.length > 0) {
                        $item.css(maxSizeCssProp, `${containerBlockSize * (selectedBlockSize * 0.01)}px`);
                    } else {
                        $item.css(maxSizeCssProp, `${contentBlockSize * (selectedBlockSize * 0.01)}px`);
                    }

                    if (isBlockVerticalWriting && !isItemVerticalWriting) {
                        $item.css('width', '100%'); //why inline style?
                    } else if (!isBlockVerticalWriting && isItemVerticalWriting) {
                        $item.css('height', '100%'); //why inline style?
                    }
                }
            });
        }
        // depending on the context (item preview, new/old test runner...) available height is computed differently
        function getItemRunnerBlockSize(isItemVerticalWriting) {
            // var $testRunnerSections = $('.test-runner-sections'); //content-wrapper?
            //TEMP:
            var $testRunnerSections = isItemVerticalWriting ? $('.qti-itemBody') : $('.content-wrapper');

            // exists only in the new test runner
            if ($testRunnerSections.length) {
                const rect = $testRunnerSections.get(0).getBoundingClientRect();
                return isItemVerticalWriting ? rect.width : rect.height;
            }
            // otherwise, we assume that we are in an iframe with all space available (= item preview, old test runner)
            return isItemVerticalWriting ? $(window).width() : $(window).height();
        }

        // extra grid row are there in case of a vertical layout (item on top/bottom of the question)
        function getExtraGridRowBlockSize(isItemVerticalWriting) {
            // ? this is NOT usual dual-column + full-width-block layout.
            // this is two col-12 rows + half-width block layout.
            // still, what? we should ignore height attr and make both rows fit?
            var $gridRows = $('.qti-itemBody > .grid-row'),
                extraBlockSize = 0;

            $gridRows.each(function () {
                var $gridRow = $(this),
                    $itemContainer = $gridRow.find('[data-scrolling="true"]');

                //if this row doesn't have item container, then except its height.
                //? should be then only if 'full-height' attr and maybe 2 total grid-rows
                // [so I guess this plugin supports 2 versions: dual-column and this. Need to split to 3 scenarios: these 2, then the rest]
                if (!$itemContainer.length) {
                    extraBlockSize += isItemVerticalWriting ? $gridRow.outerWidth(true) : $gridRow.outerHeight(true);
                }
            });
            return extraBlockSize;
        }

        // most of the time this will be rubrick's block height in the new test runner;
        // if vertical-writing, can also be review-panel on the left
        function getSpaceAroundQtiContent(isItemVerticalWriting) {
            var $testRunnerSections = $('.test-runner-sections'), //content-wrapper?
                $qtiContent = $('#qti-content');

            if ($testRunnerSections.length && $qtiContent.length) {
                const qtiContentRect = $qtiContent.get(0).getBoundingClientRect();
                const testRunnerSectionsRect = $testRunnerSections.get(0).getBoundingClientRect();
                if (isItemVerticalWriting) {
                    return testRunnerSectionsRect.width - qtiContentRect.width;
                }
                return qtiContentRect.top - testRunnerSectionsRect.top;
            }
            return 0;
        }

        function getQtiItemAndItemBodyPadding(isItemVerticalWriting) {
            let padding = 0;
            const propNames = isItemVerticalWriting
                ? ['padding-left', 'padding-right']
                : ['padding-top', 'padding-bottom'];
            for (const $el of [$('.qti-item'), $('.qti-itemBody')]) {
                const compStyle = getComputedStyle($el.get(0));
                for (const propName of propNames) {
                    padding += parseFloat(compStyle.getPropertyValue(propName) || 0);
                }
            }
            return padding;
        }

        function getGridRowBlockMargin() {
            let margin = 0;
            const $gridRows = $('.qti-itemBody > .grid-row');
            if ($gridRows.length > 0) {
                margin += parseFloat(getComputedStyle($gridRows.get(0)).getPropertyValue('margin-block-start') || 0);
                margin += parseFloat(
                    getComputedStyle($gridRows.last().get(0)).getPropertyValue('margin-block-end') || 0
                );
            }
            return margin;
        }
    },
    destroy: function destroy() {
        if (this.itemResizeObserver) {
            this.itemResizeObserver.disconnect();
        }
    }
});
