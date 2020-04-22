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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

/**
 * Shortcuts is popup with list of actual shortcuts for test runner
 *
 * @author aliaksandr paliakou <lecosson@gmail.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import shortcutsTpl from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/shortcuts.tpl';
import 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/shortcuts.css';

/**
 * Default config values, see below.
 */
var defaults = {};

/**
 * Creates and initialize the shortcuts component.
 * Please not the component IS NOT rendered.
 * You'll have to render it by yourself.
 *
 * @param {Object} config
 * @returns {shortcutsBox} the component, initialized and rendered
 */
export default function shortcutsBoxFactory(config) {

    /**
     * @typedef {Object} jumplinksBox
     */
    var shortcutsBox = component( {}, defaults)
        .on('init', function() {
        })
        .on('render', function() {
            // handle related Jump Links
            const _jumpLinksBehavior = {
                jumpLinkShortcuts: {
                    selector: '.top-action-bar .jump-link-shortcuts',
                    handler: () => {
                        const _shortcutsSelector = ".top-action-bar .shortcuts-list-wrapper";
                        const _shortcutsList = $(_shortcutsSelector);
                        const closeHandler = function(event) {
                            if (event) {
                                _shortcutsList.addClass("hidden");
                                _shortcutsList.off("click", closeHandler);
                                $(window).off("keydown", closeHandler);
                            }
                        };
                        $(_jumpLinksBehavior.jumpLinkShortcuts.selector).blur();
                        _shortcutsList.removeClass("hidden");
                        _shortcutsList
                            .off("click", closeHandler)
                            .on("click", closeHandler);
                        $(window)
                            .off("keydown", closeHandler)
                            .on("keydown", closeHandler);
                    }
                },
            };
            _.forOwn(_jumpLinksBehavior, (linkDescription) => {
                const link = $(linkDescription.selector);
                if (link) {
                    link.on('click', linkDescription.handler);
                    link.on('keyup', (event) => {
                        var activationKeys = [32, 13]; // link can be activated by click or enter/space keys
                        if (activationKeys.includes(event.keyCode)) {
                            linkDescription.handler(event);
                        }
                    });
                }
            });
        });

    shortcutsBox.setTemplate(shortcutsTpl);

    _.defer(function() {
        shortcutsBox.init(config);
    });

    return shortcutsBox;
}
