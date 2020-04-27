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
 * Shortcuts is popup with list of actual shortcuts for test runner
 *
 * @author aliaksandr paliakou <lecosson@gmail.com>
 */
import _ from 'lodash';
import component from 'ui/component';
import shortcutsTpl from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/shortcuts.tpl';

/**
 * Default config values, see below.
 */
const defaults = {};

/**
 * Creates and initialize the shortcuts component.
 * Please not the component IS NOT rendered.
 * You'll have to render it by yourself.
 *
 * @param {Object} config
 * @returns {shortcutsBox} the component, initialized and rendered
 */
export default function shortcutsBoxFactory(config) {

    const shortcutsBox = component({}, defaults);

    shortcutsBox.setTemplate(shortcutsTpl);

    _.defer(function() {
        shortcutsBox.init(config);
    });

    return shortcutsBox;
}
