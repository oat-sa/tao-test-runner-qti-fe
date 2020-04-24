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
     * @typedef {Object} jumplinksBox
     */
    const jumplinksBox = component({}, defaults )
    .on('render', function() {
        // handle related Jump Links
        const behavior = [
            {
                selector: '[data-jump=question] ',
                eventName: 'jumplink',
                eventParam: 'question',
            }, {
                selector: '[data-jump=navigation]',
                eventName: 'jumplink',
                eventParam: 'navigation',
            }, {
                selector: '[data-jump=toolbox]',
                eventName: 'jumplink',
                eventParam: 'toolbox',
            }, {
                selector: '[data-jump=teststatus]',
                eventName: 'jumplink',
                eventParam: 'teststatus',
            }, {
                selector: '[data-jump=shortcuts]',
                eventName: 'shortcuts',
                eventParam: 'shortcuts',
            }
        ];
        _.forEach(behavior, (linkDescription) => {
            const $link = this.getElement().find(linkDescription.selector);
            if ($link) {
                $link.on('click', () => {
                    this.trigger(linkDescription.eventName);
                });
                $link.on('keyup', (event) => {
                    const activationKeys = [32, 13]; // link can be activated by click or enter/space keys
                    if (activationKeys.includes(event.keyCode)) {
                        this.trigger(linkDescription.eventName, linkDescription.eventParam);
                    }
                });
            }
        });
    });


    jumplinksBox.setTemplate(jumplinksTpl);

    _.defer(function() {
        jumplinksBox.init(config);
    });

    return jumplinksBox;
}
