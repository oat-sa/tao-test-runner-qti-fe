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
 * @author aliaksandr paliakou <lecosson@gmail.com>
 */

import $ from 'jquery';
import pluginFactory from 'taoTests/runner/plugin';
import jumplinksFactory from "./jumplinks";
import shortcutsFactory from "./shortcuts";
import _ from "lodash";

/**
 * adds rendered jump links support
 */

function findFocusable(targetElement) {
    const elem = $(targetElement)
        .find('input, select, a[href], textarea, button, [tabindex]')
        .toArray()
        .filter((el) => (el.tabIndex >= 0 && !el.disabled && el.offsetParent ) )
        .find((el) => (typeof el.focus === 'function') );
    return elem;
}


/**
 * Creates the JumpLinks plugin.
 * adding jumplinks accessibility feature for quick navigation
 */
export default pluginFactory({
    name: 'jumplinks',


    /**
     * Initializes the plugin (called during runner's init)
     */
    init: function init() {
        const self = this;

        self.jumplinks = jumplinksFactory({})
            .on('render', function() {
                handleJumpLinks();
            });
        self.shortcuts = shortcutsFactory({});

        function handleJumpLinks() {
            const _jumpLinksBehavior = {
                jumpLinkQuestion: {
                    selector: '.top-action-bar .jump-links-box [data-jump=question] ',
                    eventName: 'question',
                    handler: () => {
                        const e = findFocusable(self.getAreaBroker().getContentArea() );
                        e && e.focus();
                    }
                },
                jumpLinkNavigation: {
                    selector: '.top-action-bar .jump-links-box [data-jump=navigation]',
                    eventName: 'navigation',
                    handler: () => {
                        const e = findFocusable(self.getAreaBroker().getNavigationArea() );
                        e && e.focus();
                    }
                },
                jumpLinkToolbox: {
                    selector: '.top-action-bar .jump-links-box [data-jump=toolbox]',
                    eventName: 'toolbox',
                    handler: () => {
                        const e = findFocusable(self.getAreaBroker().getToolboxArea() );
                        e && e.focus();
                    }
                },
                jumpLinkTeststatus: {
                    selector: '.top-action-bar .jump-links-box [data-jump=teststatus]',
                    eventName: 'teststatus',
                    handler: () => {
                        const e = findFocusable(self.getAreaBroker().getPanelArea() );
                        e && e.focus();
                    }
                },
                jumpLinkShortcuts: {
                    selector: '.top-action-bar [data-jump=shortcuts]',
                    eventName: 'shortcuts',
                    handler: () => {
                        self.shortcuts.show();
                        const closeHandler = function(event) {
                            if (event) {
                                self.shortcuts.hide();
                                self.shortcuts.getElement().off("click", closeHandler);
                                $(window).off("keydown", closeHandler);
                            }
                        };
                        self.shortcuts.getElement()
                            .off("click", closeHandler)
                            .on("click", closeHandler);
                        $(window)
                            .off("keydown", closeHandler)
                            .on("keydown", closeHandler);
                    }
                },
            };
            _.forOwn(_jumpLinksBehavior, (linkDescription) => {
                self.jumplinks.on(linkDescription.eventName, () => {
                    self.jumplinks.getElement().find(':focus').blur();
                    linkDescription.handler();
                });
            });
        }
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        const self = this;

        self.jumplinks.render(self.getAreaBroker().getControlArea());
        self.shortcuts.render(self.getAreaBroker().getControlArea());
    },

});
