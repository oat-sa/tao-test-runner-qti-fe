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

/**
 * adds rendered jump links support
 */

function findFocusable(targetElement) {
    const $elem = $(targetElement)
        .find('input, select, a[href], textarea, button, [tabindex]')
        .toArray()
        .filter((el) => (el.tabIndex >= 0 && !el.disabled && el.offsetParent ) )
        .find((el) => (typeof el.focus === 'function') );
    return $elem;
}

/**
 * close shortcuts popup
 */
function closeShortcuts() {
    this.shortcuts.hide();
    this.shortcuts.getElement().off("click", this.closeShortcuts);
    $(window).off("keydown", this.closeShortcuts);
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
            .on('render', handleJumpLinks);
        self.shortcuts = shortcutsFactory({});

        function handleJumpLinks() {
            const closeShortcutsHandler = closeShortcuts.bind(self);
            const mapJumpToAreaBroker = {
                question: 'getContentArea',
                navigation: 'getNavigationArea',
                toolbox: 'getToolboxArea',
                teststatus: 'getPanelArea',
            };
            self.jumplinks.on('jump', (jump) => {
                const $elementGetter = self.getAreaBroker()[mapJumpToAreaBroker[jump]];
                if ($elementGetter) {
                    const $focusable = findFocusable($elementGetter());
                    $focusable && $focusable.focus();
                }
            });
            self.jumplinks.on('shortcuts', () => {
                self.shortcuts.show();
                self.shortcuts.getElement()
                    .off("click", closeShortcutsHandler)
                    .on("click", closeShortcutsHandler);
                $(window)
                    .off("keydown", closeShortcutsHandler)
                    .on("keydown", closeShortcutsHandler);
            });
        }
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        this.jumplinks.render(this.getAreaBroker().getControlArea());
        this.shortcuts.render(this.getAreaBroker().getControlArea());
    },

});
