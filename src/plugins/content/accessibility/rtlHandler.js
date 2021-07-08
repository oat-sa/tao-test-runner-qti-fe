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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Aliaksandr Paliakou <lecosson@gmail.com>
 */
import pluginFactory from 'taoTests/runner/plugin';
import locale from 'util/locale';

/**
 * Apply RTL/LTR layout for rendered item depends of language configured on item authoring
 * Overrides test runner language if it defined on item authoring
 */
export default pluginFactory({
    name: 'rtlHandler',

    /**
     * Initializes the plugin (called during runner's init)
     */
    init: function init() {
        const testRunner = this.getTestRunner();
        testRunner
            .on('renderitem', function applyRtlLayout() {
                const $item = testRunner
                    .getAreaBroker()
                    .getContentArea()
                    .find('.qti-item');
                const itemLang = $item.attr('lang');
                $item
                    .find('.grid-row')
                    .attr('dir', locale.getLanguageDirection(itemLang));
            });
    }
});
