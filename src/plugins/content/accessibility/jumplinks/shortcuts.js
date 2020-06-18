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
import __ from 'i18n';
import _ from 'lodash';
import component from 'ui/component';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import shortcutsTpl from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/shortcuts.tpl';

/**
 * Default config values, see below.
 */
const defaults = {
    shortcutsGroups: [
        {
            id: 'navigation-shortcuts',
            label: __('Navigation shortcuts'),
            shortcuts: [
                {
                    id: 'next',
                    shortcut: 'ALT + Shift + N',
                    label: __('Go to the next question'),
                },
                {
                    id: 'previous',
                    shortcut: 'ALT + Shift + P',
                    label: __('Go to the previous question'),
                },
                {
                    id: 'current',
                    shortcut: 'ALT + Shift + Q',
                    label: __('Go to the current question'),
                },
                {
                    id: 'top',
                    shortcut: 'ALT + Shift + T',
                    label: __('Go to the top of the page'),
                },
            ]
        },
    ]
};

/**
 * Creates and initialize the shortcuts component.
 * Please not the component IS NOT rendered.
 * You'll have to render it by yourself.
 *
 * @param {Object} config
 * @returns {shortcutsBox} the component, initialized and rendered
 */
export default function shortcutsBoxFactory(config) {
    const ESK_KEY_CODE = 27;
    const shortcutsBox = component({}, defaults)
        .on('render', function () {
            const $element = this.getElement();
            const $closeBtn = $element.find('.btn-close');
            const $keyNavigationItems = this.getElement()
                .find('.shortcuts-list, .btn-close');

            $closeBtn.on('click', () => this.trigger('close'));
            // handle overlay click
            $element.on('click', (e) => {
                if ($element.is(e.target)) {
                    this.trigger('close');
                }
            });
            $element.on('keyup', (e) => {
                if (e.keyCode === ESK_KEY_CODE) {
                    this.trigger('close');
                }
            });

            this.navigator = keyNavigator({
                elements: navigableDomElement.createFromDoms($keyNavigationItems),
                propagateTab: false
            })
                // keep cursor at close button
                .on('tab', function () {
                    this.setCursorAt(1);
                })
                .on('shift+tab', function () {
                    this.setCursorAt(1);
                })
                // prevent focus move from shortcuts modal
                .on('blur', () => {
                    _.defer(() => {
                        if (!this.navigator.isFocused()) {
                            this.navigator.focus();
                        }
                    });
                })
                .on('activate', function (cursor) {
                    cursor.navigable.getElement().click();
                });

            this.navigator.first();
        })
        .on('destroy', function () {
            this.navigator.destroy();

            this.getElement().remove();
        });

    shortcutsBox.setTemplate(shortcutsTpl);

    shortcutsBox.init(config);

    return shortcutsBox;
}
