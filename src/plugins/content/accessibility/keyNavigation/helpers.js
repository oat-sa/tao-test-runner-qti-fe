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
 * Copyright (c) 2016-2020 (original work) Open Assessment Technologies SA ;
 */
import $ from 'jquery';

/**
 * When either an element or its parents have this class - navigation from it would be disabled.
 *
 * @type {String}
 */
const ignoredClass = 'no-key-navigation';

/**
 * Scrolling to the top of the required element
 * @param {jQuery} $el
 * @param {jQuery} $visibleContainer
 */
export function showElementsContent($el, $visibleContainer) {
    const $wrapper = $visibleContainer.closest('.content-wrapper');
    if ($wrapper.length && $el.length) {
        $wrapper.scrollTop($el.offset().top + $wrapper.scrollTop() - $wrapper.offset().top);
    }
}

/**
 * Checks whether element is navigable from
 *
 * @param {HTMLElement|keyNavigator} element
 * @returns {boolean}
 */
export function allowedToNavigateFrom(element) {
    if (element.getCursor) {
        const {navigable} = element.getCursor();
        element = navigable;
    }
    if (element.getElement) {
        element = element.getElement();
    }
    const $element = $(element);

    if ($element.hasClass(ignoredClass) || $element.parents(`.${ignoredClass}`).length > 0) {
        return false;
    }

    return true;
}
