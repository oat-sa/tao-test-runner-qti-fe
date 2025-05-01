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
import { getIsItemWritingModeVerticalRl } from 'taoQtiTest/runner/helpers/itemProperties';

/**
 * @fires 'resized-itembody' when item body is resized
 * @param {Object} testRunner
 */
function connectItemBodyResizeObserver(testRunner) {
    const resizeObserver = new ResizeObserver(() => {
        testRunner.trigger('resized-itembody');
    });

    testRunner
        .on('renderitem', function () {
            const $itemBody = $('.qti-itemBody');
            resizeObserver.observe($itemBody.get(0));
        })
        .on('unloaditem', function () {
            resizeObserver.disconnect();
        })
        .on('destroy', function () {
            resizeObserver.disconnect();
        });
}

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

        const gridRowBlockEndMargin = 12,
            qtiItemPadding = 30 * 2;

        connectItemBodyResizeObserver(testRunner);

        testRunner.on('resized-itembody', function () {
            adaptItemBlockSize();
        });

        function adaptItemBlockSize() {
            const isVerticalWritingMode = getIsItemWritingModeVerticalRl();

            const $itemContainer = $contentArea.find('[data-scrolling="true"]');
            const contentBlockSize =
                getItemRunnerBlockSize(isVerticalWritingMode) -
                getExtraGridRowBlockSize(isVerticalWritingMode) -
                getSpaceAroundQtiContent(isVerticalWritingMode) -
                gridRowBlockEndMargin -
                qtiItemPadding;

            $itemContainer.each(function () {
                const $item = $(this);
                const isScrollable = typeCaster.strToBool($item.attr('data-scrolling') || 'false');
                const selectedBlockSize = parseFloat($item.attr('data-scrolling-height')) || 100;
                const containerParent = $item.parent().closest('[data-scrolling="true"]');
                const containerBlockSize = isVerticalWritingMode ? containerParent.width() : containerParent.height();
                const overflowCssProp = isVerticalWritingMode ? 'overflow-x' : 'overflow-y';

                if ($item.length && isScrollable) {
                    $item.data('scrollable', true);
                    $item.css({ [overflowCssProp]: 'scroll' });
                    if (containerParent.length > 0) {
                        $item.css('max-block-size', `${containerBlockSize * (selectedBlockSize * 0.01)}px`);
                    } else {
                        $item.css('max-block-size', `${contentBlockSize * (selectedBlockSize * 0.01)}px`);
                    }
                }
            });
        }
        // depending on the context (item preview, new/old test runner...) available height is computed differently
        function getItemRunnerBlockSize(isVerticalWritingMode) {
            var $testRunnerSections = $('.test-runner-sections');

            // exists only in the new test runner
            if ($testRunnerSections.length) {
                const rect = $testRunnerSections.get(0).getBoundingClientRect();
                return isVerticalWritingMode ? rect.width : rect.height;
            }
            // otherwise, we assume that we are in an iframe with all space available (= item preview, old test runner)
            return isVerticalWritingMode ? $(window).width() : $(window).height();
        }

        // extra grid row are there in case of a vertical layout (item on top/bottom of the question)
        function getExtraGridRowBlockSize(isVerticalWritingMode) {
            var $gridRows = $('.qti-itemBody > .grid-row'),
                extraBlockSize = 0;

            $gridRows.each(function () {
                var $gridRow = $(this),
                    $itemContainer = $gridRow.find('[data-scrolling="true"]');

                if (!$itemContainer.length) {
                    extraBlockSize += isVerticalWritingMode ? $gridRow.outerWidth(true) : $gridRow.outerHeight(true);
                }
            });
            return extraBlockSize;
        }

        // most of the time this will be rubrick's block height in the new test runner;
        // if vertical-writing, can also be review-panel on the left
        function getSpaceAroundQtiContent(isVerticalWritingMode) {
            var $testRunnerSections = $('.test-runner-sections'),
                $qtiContent = $('#qti-content');

            if ($testRunnerSections.length && $qtiContent.length) {
                const qtiContentRect = $qtiContent.get(0).getBoundingClientRect();
                const testRunnerSectionsRect = $testRunnerSections.get(0).getBoundingClientRect();
                if (isVerticalWritingMode) {
                    return testRunnerSectionsRect.width - qtiContentRect.width;
                }
                return qtiContentRect.top - testRunnerSectionsRect.top;
            }
            return 0;
        }
    }
});
