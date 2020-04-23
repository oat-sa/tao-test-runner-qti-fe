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
 * The jumplinks bsx manages accessibility feature "jumplinks"
 *
 *  @author aliaksandr paliakou <lecosson@gmail.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import jumplinksTpl from 'taoQtiTest/runner/plugins/content/accessibility/jumplinks/jumplinks.tpl';

/**
 * Default config values, see below.
 */
const defaults = {
};

/**
 * Creates and initialize the jumplinks component.
 * Please not the component IS NOT rendered.
 * You'll have to render it by yourself.
 *
 * @param {Object} config
 * @param {Object[]} [config.areaBroker] - test page area broker
 * @returns {jumplinks} the component, initialized and rendered
 */
export default function jumplinksFactory(config) {

    /**
     * adds rendered jump links support
     */
    function handleJumpLinks() {
        const areaBroker = config.areaBroker;

        function findFocusable(targetElement) {
            const elem = $(targetElement)
                .find('input, select, a[href], textarea, button, [tabindex]')
                .toArray()
                .filter((el) => (el.tabIndex >= 0 && !el.disabled && el.offsetParent ) )
                .find((el) => (typeof el.focus === 'function') );
            return elem;
        }

        const _jumpLinksBehavior = {
            jumpLinkQuestion: {
                selector: '.top-action-bar .jump-links-box .jump-link-question',
                handler: () => {
                    const e = findFocusable(areaBroker.getContentArea() );
                    e && e.focus();
                }
            },
            jumpLinkNavigation: {
                selector: '.top-action-bar .jump-links-box .jump-link-navigation',
                handler: () => {
                    const e = findFocusable(areaBroker.getNavigationArea() );
                    e && e.focus();
                }
            },
            jumpLinkToolbox: {
                selector: '.top-action-bar .jump-links-box .jump-link-toolbox',
                handler: () => {
                    const e = findFocusable(areaBroker.getToolboxArea() );
                    e && e.focus();
                }
            },
            jumpLinkTeststatus: {
                selector: '.top-action-bar .jump-links-box .jump-link-teststatus',
                handler: () => {
                    const e = findFocusable(areaBroker.getPanelArea() );
                    e && e.focus();
                }
            },
        };
        _.forOwn(_jumpLinksBehavior, (linkDescription) => {
            const link = $(linkDescription.selector);
            if (link) {
                link.on('click', linkDescription.handler);
                link.on('keyup', (event) => {
                    const activationKeys = [32, 13]; // link can be activated by click or enter/space keys
                    if (activationKeys.includes(event.keyCode)) {
                        linkDescription.handler(event);
                    }
                });
            }
        });
    }

    /**
     * @typedef {Object} jumplinksBox
     */
    const jumplinksBox = component({}, defaults )
        .on('render', function() {
            handleJumpLinks();
        });

    jumplinksBox.setTemplate(jumplinksTpl);

    _.defer(function() {
        jumplinksBox.init(config);
    });

    return jumplinksBox;
}
