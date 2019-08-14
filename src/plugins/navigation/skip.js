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
 * Test Runner Navigation Plugin : Skip
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import __ from 'i18n';
import hider from 'ui/hider';
import pluginFactory from 'taoTests/runner/plugin';
import messages from 'taoQtiTest/runner/helpers/messages';
import buttonTpl from 'taoQtiTest/runner/plugins/templates/button';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import mapHelper from 'taoQtiTest/runner/helpers/map';

/**
 * The display of the skip
 */
var buttonData = {
    skip: {
        control: 'skip',
        title: __('Skip and go to the next item'),
        icon: 'external',
        text: __('Skip')
    },
    end: {
        control: 'skip-end',
        title: __('Skip and go to the end of the test'),
        icon: 'external',
        text: __('Skip and end test')
    }
};

/**
 * Create the button based on the current context
 * @param {Object} context - the test context
 * @returns {jQueryElement} the button
 */
var createElement = function createElement(context) {
    var dataType = context.isLast ? 'end' : 'skip';
    return $(buttonTpl(buttonData[dataType]));
};

/**
 * Update the button based on the context
 * @param {jQueryElement} $element - the element to update
 * @param {Boolean} [isLast=false] - are we on the last item ?
 */
const updateElement = function updateElement($element, isLast = false) {
    const dataType = isLast ? 'end' : 'skip';
    const button   = buttonData[dataType];
    if (button && $element.attr('data-control') !== button.control) {
        $element
            .attr('data-control', button.control)
            .attr('title', button.title)
            .find('.text')
            .text(button.text);
    }
};

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'skip',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();

        const toggle = () => {
            const testContext = testRunner.getTestContext();
            if (testContext.allowSkipping === true) {
                this.show();
                return true;
            }

            this.hide();
            return false;
        };

        function doSkip() {
            testRunner.skip();
        }

        this.$element = createElement(testRunner.getTestContext());

        this.$element.on('click', e => {
            const enable = this.enable.bind(this);
            const testContext = testRunner.getTestContext();
            const testMap = testRunner.getTestMap();
            const isLast  = navigationHelper.isLast(testMap, testContext.itemIdentifier);
            const endTestWarning = mapHelper.hasCategory(testMap, testContext.itemIdentifier, 'endTestWarning', true);

            e.preventDefault();

            if (this.getState('enabled') !== false) {
                this.disable();
                if (endTestWarning && isLast) {
                    testRunner.trigger(
                        'confirm.endTest',
                        messages.getExitMessage(
                            __(
                                'You are about to submit the test. You will not be able to access this test once submitted. Click OK to continue and submit the test.'
                            ),
                            'test',
                            testRunner
                        ),
                        doSkip, // if the test taker accept
                        enable // if the test taker refuse
                    );
                } else {
                    doSkip();
                }
            }
        });

        toggle();
        this.disable();

        testRunner
            .on('loaditem', () => {
                if (toggle()) {

                    const testContext = testRunner.getTestContext();
                    const testMap = testRunner.getTestMap();
                    const isLast  = navigationHelper.isLast(testMap, testContext.itemIdentifier);
                    updateElement(this.$element, isLast);
                }
            })
            .on('enablenav', () => this.enable() )
            .on('disablenav', () => this.disable() )
            .on('hidenav', () => this.hide() )
            .on('shownav', () => this.show() );
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        var $container = this.getAreaBroker().getNavigationArea();
        $container.append(this.$element);
    },

    /**
     * Called during the runner's destroy phase
     */
    destroy: function destroy() {
        this.$element.remove();
    },

    /**
     * Enable the button
     */
    enable: function enable() {
        this.$element.removeProp('disabled').removeClass('disabled');
    },

    /**
     * Disable the button
     */
    disable: function disable() {
        this.$element.prop('disabled', true).addClass('disabled');
    },

    /**
     * Show the button
     */
    show: function show() {
        hider.show(this.$element);
    },

    /**
     * Hide the button
     */
    hide: function hide() {
        hider.hide(this.$element);
    }
});
