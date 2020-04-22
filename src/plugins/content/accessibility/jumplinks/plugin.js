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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author aliaksandr paliakou <lecosson@gmail.com>
 */

import pluginFactory from 'taoTests/runner/plugin';
import jumplinksFactory from "./jumplinks";
import shortcutsFactory from "./shortcuts";

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

        self.jumplinks = jumplinksFactory({areaBroker: self.getAreaBroker()});
        self.shortcuts = shortcutsFactory({});
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
