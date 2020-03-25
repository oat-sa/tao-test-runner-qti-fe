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
import _ from "lodash";
import strategyFactory from 'taoQtiTest/runner/plugins/content/accessibility/keyNavigation/strategiesManager';

/**
 * When either an element or its parents have this class - navigation from it would be disabled.
 *
 * @type {String}
 */
const ignoredClass = 'no-key-navigation';

/**
 * Checks whether element is navigable from
 *
 * @param {HTMLElement|keyNavigator} from
 * @returns {boolean}
 */
export function allowedToNavigateFrom(from) {
    let element = from;
    if (element && 'function' === typeof element.getCursor) {
        const {navigable} = element.getCursor();
        element = navigable;
    }
    if (element && 'function' === typeof element.getElement) {
        element = element.getElement();
    }
    const $element = $(element);

    if ($element.hasClass(ignoredClass) || $element.parents(`.${ignoredClass}`).length > 0) {
        return false;
    }

    return true;
}

/**
 * Applies an items' navigation scheme on a keyNavigator.
 * @param {keyNavigator} navigator
 * @param {keyNavigationStrategyConfig} config - the config to apply
 * @returns {keyNavigator}
 */
export function setupItemsNavigator(navigator, config) {
    return navigator
        .on(config.keyNextItem, function navigateToNextItem(elem) {
            if (allowedToNavigateFrom(elem)) {
                this.next();
            }
        })
        .on(config.keyPrevItem, function navigateToPrevItem(elem) {
            if (allowedToNavigateFrom(elem)) {
                this.previous();
            }
        });
}

/**
 * Applies an items' navigation scheme on a keyNavigator.
 * @param {keyNavigator} navigator
 * @returns {keyNavigator}
 */
export function setupClickableNavigator(navigator) {
    return navigator
        .on('activate', function activateItem(cursor) {
            const $elt = cursor.navigable.getElement();

            // jQuery <= 1.9.0
            // the checkbox values are set after the click event if triggered with jQuery
            if ($elt.is(':checkbox')) {
                $elt.each(function () {
                    this.click();
                });
            } else {
                $elt
                    .click()
                    .mousedown();
            }
        });
}

/**
 * Build the strategies related to a key navigation mode
 * @param {keyNavigationMode} navigationMode
 * @param {testRunner} testRunner
 * @returns {keyNavigationStrategy[]}
 */
export function getStrategies(navigationMode, testRunner) {
    return navigationMode.strategies.map(
        area => strategyFactory(area, testRunner, navigationMode.config).init()
    );
}

/**
 * Gets the key navigators from the provided strategies
 * @param {keyNavigationStrategy[]} strategies
 * @returns {keyNavigator[]}
 */
export function getNavigators(strategies) {
    return _.flatten(
        strategies.map(
            strategy => strategy.getNavigators()
        )
    );
}
