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
 * Copyright (c) 2025 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';

/**
 * If item has 'vertical-rl' writing mode
 * @returns {Boolean}
 */
export const getIsItemWritingModeVerticalRl = () => {
    const itemBody = $('.qti-itemBody');
    return itemBody.hasClass('writing-mode-vertical-rl');
};

/**
 * If element has 'vertical-rl' writing mode
 * @param {jQuery} $container
 * @returns {Boolean}
 */
export const getIsWritingModeVerticalRl = $container => {
    if (!$container.length) {
        return false;
    }
    const $wrtitingModeParent = $container.closest('.writing-mode-vertical-rl, .writing-mode-horizontal-tb');
    return $wrtitingModeParent.length && $wrtitingModeParent.hasClass('writing-mode-vertical-rl');
};
