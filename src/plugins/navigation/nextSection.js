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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Runner Navigation Plugin : Next Section
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import hider from 'ui/hider';
import pluginFactory from 'taoTests/runner/plugin';
import messages from 'taoQtiTest/runner/helpers/messages';
import buttonTpl from 'taoQtiTest/runner/plugins/templates/button';
import mapHelper from 'taoQtiTest/runner/helpers/map';

export default pluginFactory({
    name: 'nextsection',
    init() {
        const self = this;
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();

        /**
         * Retrieve the nexSection categories of the current item
         * @returns {Object} the calculator categories
         */
        function getNextSectionCategories(){
            const testContext = testRunner.getTestContext();
            const testMap = testRunner.getTestMap();

            return {
                nextSection: mapHelper.hasItemCategory(
                    testMap,
                    testContext.itemIdentifier,
                    'nextSection',
                    true
                ),
                nextSectionWarning: mapHelper.hasItemCategory(
                    testMap,
                    testContext.itemIdentifier,
                    'nextSectionWarning',
                    true
                ),
                noExitTimedSectionWarning: mapHelper.hasItemCategory(
                    testMap,
                    testContext.itemIdentifier,
                    'noExitTimedSectionWarning',
                    true
                )
            };
        }

        function toggle() {
            const categories = getNextSectionCategories();

            if (testRunnerOptions.nextSection && (categories.nextSection || categories.nextSectionWarning)) {
                self.show();
            } else {
                self.hide();
            }
        }

        function nextSection() {
            testRunner.next('section');
        }

        /**
         * Check if warn section leaving dialog enabled to prevent showing double dialogs
         * @returns {Boolean}
         */
        const isWarnSectionLeavingEabled = () => {
            const testContext = testRunner.getTestContext();
            const categories = getNextSectionCategories();
            const timeConstraints = testContext.timeConstraints || [];


            return timeConstraints.some(({ source }) => source === testContext.sectionId)
                && !categories.noExitTimedSectionWarning
                && !(testRunnerOptions.timer || {}).keepUpToTimeout;
        };

        this.$element = $(
            buttonTpl({
                control: 'next-section',
                title: __('Skip to the next section'),
                icon: 'fast-forward',
                text: __('Next Section')
            })
        );

        this.$element.on('click', function(e) {
            const enable = _.bind(self.enable, self);
            const categories = getNextSectionCategories();
            e.preventDefault();
            if (self.getState('enabled') !== false) {
                self.disable();

                if (categories.nextSectionWarning && !isWarnSectionLeavingEabled()) {
                    const submitButtonLabel = __('CONTINUE TO THE NEXT SECTION');

                    testRunner.trigger(
                        'confirm.nextsection',
                        messages.getExitMessage(
                            'section',
                            testRunner,
                            '',
                            false,
                            submitButtonLabel
                        ),
                        nextSection, // if the test taker accept
                        enable, // if the test taker refuse
                        {
                            buttons: {
                                labels: {
                                    ok: submitButtonLabel,
                                    cancel: __('CANCEL')
                                }
                            }
                        }
                    );
                } else {
                    nextSection();
                }
            }
        });

        this.disable();
        toggle();

        testRunner
            .on('loaditem', toggle)
            .on('enablenav', function() {
                self.enable();
            })
            .on('disablenav', function() {
                self.disable();
            })
            .on('hidenav', function() {
                self.hide();
            })
            .on('shownav', function() {
                self.show();
            });
    },

    /**
     * Called during the runner's render phase
     */
    render: function render() {
        //attach the element to the navigation area
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
