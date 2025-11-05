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
import _ from 'lodash';
import typeCaster from 'util/typeCaster';
import pluginFactory from 'taoTests/runner/plugin';
import { getIsItemWritingModeVerticalRl, getIsWritingModeVerticalRl } from 'taoQtiTest/runner/helpers/verticalWriting';

const minimalAcceptableSize = 20;

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
        let $root;

        testRunner
            .on('renderitem', () => {
                $root = testRunner.getAreaBroker().getContainer();
                const isItemVerticalWriting = getIsItemWritingModeVerticalRl();
                const $itemScrollContainer = getItemScrollContainer(isItemVerticalWriting);

                if ($itemScrollContainer.length) {
                    this.itemResizeCallback = _.throttle(() => requestAnimationFrame(adaptBlockSize), 200);
                    this.itemResizeObserver = new ResizeObserver(this.itemResizeCallback);
                    this.itemResizeObserver.observe($itemScrollContainer.get(0));
                }
            })
            .on('unloaditem', () => {
                if (this.itemResizeObserver) {
                    this.itemResizeObserver.disconnect();
                }
                if (this.itemResizeCallback && this.itemResizeCallback.cancel) {
                    this.itemResizeCallback.cancel();
                }
            });

        function getItemScrollContainer(isItemVerticalWriting) {
            return isItemVerticalWriting
                ? $root.find('.qti-itemBody')
                : $root.find('.test-runner-sections > .content-wrapper');
        }

        function adaptBlockSize() {
            const isItemVerticalWriting = getIsItemWritingModeVerticalRl();
            const $itemScrollContainer = getItemScrollContainer(isItemVerticalWriting);

            const $blockContainers = $itemScrollContainer.find('[data-scrolling="true"]');

            const innerItemSize =
                getItemRunnerBlockSize($itemScrollContainer, isItemVerticalWriting) -
                getQtiItemAndItemBodyPadding($itemScrollContainer, isItemVerticalWriting) -
                2;

            const contentBlockSize =
                innerItemSize -
                getGridRowBlockMargin() -
                getExtraGridRowBlockSize(isItemVerticalWriting) -
                getSpaceAroundQtiContent($itemScrollContainer, isItemVerticalWriting);

            defineItemSizeVariable(innerItemSize);

            $blockContainers.each(function () {
                const $block = $(this);
                const isBlockVerticalWriting = getIsWritingModeVerticalRl($block);

                const isScrollable = typeCaster.strToBool($block.attr('data-scrolling') || 'false');
                const selectedBlockSize = parseFloat($block.attr('data-scrolling-height')) || 100;
                const containerParent = $block.parent().closest('[data-scrolling="true"]');
                const containerBlockSize = isItemVerticalWriting ? containerParent.width() : containerParent.height();
                const overflowCssProp = isItemVerticalWriting ? 'overflow-x' : 'overflow-y';
                const maxSizeCssProp = isItemVerticalWriting ? 'max-width' : 'max-height';

                if ($block.length && isScrollable) {
                    $block.data('scrollable', true);
                    $block.css({ [overflowCssProp]: 'auto' });

                    if (containerParent.length > 0) {
                        $block.css(maxSizeCssProp, `${containerBlockSize * (selectedBlockSize * 0.01)}px`);
                    } else {
                        const maxSize = contentBlockSize * (selectedBlockSize * 0.01);
                        if (maxSize > minimalAcceptableSize) {
                            $block.css(maxSizeCssProp, `${maxSize}px`);
                        } else {
                            // contentBlockSize could turn out to be negative or very small because of
                            //  'getExtraGridRowBlockSize' [other grid-row's content is unexpectedly long] or 'getSpaceAroundQtiContent';
                            // then we show block with natural size (no scrollbars);
                            // but for block with different writing-mode need to define *some* size.
                            if (isBlockVerticalWriting !== isItemVerticalWriting) {
                                $block.css(maxSizeCssProp, `${innerItemSize / 2}px`);
                            }
                        }
                    }

                    if (isBlockVerticalWriting !== isItemVerticalWriting) {
                        $block.css('block-size', '100%');
                    }
                }
            });
        }

        // may be useful in custom item css,
        // if scrollable block size must be defined more accurately than what Authoring Editor proposes
        function defineItemSizeVariable(innerItemSize) {
            $root
                .find('.qti-itemBody')
                .get(0)
                .style.setProperty('--item-container-inner-block-size', `${innerItemSize}px`);
        }

        function getItemRunnerBlockSize($itemScrollContainer, isItemVerticalWriting) {
            const rect = $itemScrollContainer.get(0).getBoundingClientRect();
            return isItemVerticalWriting ? rect.width : rect.height;
        }

        // if layout is: text (scroll-block) on top/bottom of the question (interaction), then:
        //   ensure whole item fits on the screen (fit interaction, and let scroll-block fill remaining space;
        //   if there are several scroll-blocks, split this remaining space between them based on their `data-scrolling-height )
        // notes:
        //  - should have been enabled by the special option? it may not always be a desirable behavior!
        //  - applies to `.grid-row`, but not to `.colrow`
        function getExtraGridRowBlockSize(isItemVerticalWriting) {
            var $gridRows = $root.find('.qti-itemBody > .grid-row'),
                extraBlockSize = 0;

            $gridRows.each(function () {
                var $gridRow = $(this),
                    $blockContainer = $gridRow.find('[data-scrolling="true"]');

                if (!$blockContainer.length) {
                    extraBlockSize += isItemVerticalWriting ? $gridRow.outerWidth(true) : $gridRow.outerHeight(true);
                }
            });

            return extraBlockSize;
        }

        // rubrick's block height
        function getSpaceAroundQtiContent($itemScrollContainer, isItemVerticalWriting) {
            if (isItemVerticalWriting) {
                return 0;
            }

            const itemScrollContainer = $itemScrollContainer.get(0);
            const $qtiContent = $root.find('#qti-content');

            if ($qtiContent.length && itemScrollContainer.contains($qtiContent.get(0))) {
                const qtiContentRect = $qtiContent.get(0).getBoundingClientRect();
                const itemRunnerContainerRect = itemScrollContainer.getBoundingClientRect();
                return qtiContentRect.top - itemRunnerContainerRect.top + itemScrollContainer.scrollTop;
            }
            return 0;
        }

        // all elems between item-scroll-container and itemBody, including itemBody
        function getQtiItemAndItemBodyPadding($itemScrollContainer, isItemVerticalWriting) {
            let padding = 0;
            const $itemBody = $root.find('.qti-itemBody');

            const propNames = isItemVerticalWriting
                ? ['padding-left', 'padding-right']
                : ['padding-top', 'padding-bottom'];
            const parentsUntil = $itemScrollContainer.get(0).contains($itemBody.get(0))
                ? $itemBody.parentsUntil($itemScrollContainer).toArray()
                : [];

            for (const el of [...parentsUntil, $itemBody.get(0)]) {
                if ($itemScrollContainer.get(0).contains(el)) {
                    const compStyle = getComputedStyle(el);
                    for (const propName of propNames) {
                        padding += parseFloat(compStyle.getPropertyValue(propName) || 0);
                    }
                }
            }
            return padding;
        }

        // a) dual-column: one row, 2 columns - one with full-height scrollable block, other with interaction
        // b) 'getExtraGridRowBlockSize' where text (scroll-block) on top/bottom of the question (interaction) should fit on screen
        function getGridRowBlockMargin() {
            let margin = 0;

            const $gridRows = $root.find('.qti-itemBody > .grid-row');
            $gridRows.each(function () {
                const $gridRow = $(this);
                const $blockContainer = $gridRow.find('[data-scrolling="true"]');
                if ($blockContainer.length) {
                    // "getExtraGridRowBlockSize" includes height of rows *without* scroll containers;
                    // here we include margins of rows *with* scroll containers
                    const $col = $blockContainer.closest('[class*=" col-"], [class^="col-"]');

                    const margins = [
                        [$col, 'margin-block-start'],
                        [$gridRow, 'margin-block-start'],
                        [$col, 'margin-block-end'],
                        [$gridRow, 'margin-block-end']
                    ];
                    for (const [$el, prop] of margins) {
                        margin += $el.length ? parseFloat(getComputedStyle($el.get(0)).getPropertyValue(prop) || 0) : 0;
                    }
                }
            });
            return margin;
        }
    },
    destroy: function destroy() {
        if (this.itemResizeObserver) {
            this.itemResizeObserver.disconnect();
        }
        if (this.itemResizeCallback && this.itemResizeCallback.cancel) {
            this.itemResizeCallback.cancel();
        }
    }
});
