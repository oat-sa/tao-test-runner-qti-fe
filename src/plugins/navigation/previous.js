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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Runner Navigation Plugin : Previous
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import hider from 'ui/hider';
import pluginFactory from 'taoTests/runner/plugin';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import buttonTpl from 'taoQtiTest/runner/plugins/templates/button';

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'previous',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const self = this;

        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        const pluginShortcuts = (testRunnerOptions.shortcuts || {})[this.getName()] || {};

        /**
         * Check if the "Previous" functionality should be available or not
         */
        var canDoPrevious = function canDoPrevious() {
            const testMap = testRunner.getTestMap();
            const context = testRunner.getTestContext();
            const currentSection = testRunner.getCurrentSection();
            const noExitTimedSectionWarning = mapHelper.hasItemCategory(
                testMap,
                context.itemIdentifier,
                'noExitTimedSectionWarning',
                true
            );
            const currentPart = testRunner.getCurrentPart();
            let previousSection;
            let previousPart;

            // check TestMap if empty
            if (_.isPlainObject(testMap) && _.size(testMap) === 0) {
                return false;
            }

            //first item of the test
            if (navigationHelper.isFirst(testMap, context.itemIdentifier)) {
                return false;
            }

            //first item of a section
            if (navigationHelper.isFirstOf(testMap, context.itemIdentifier, 'section')) {
                //when entering an adaptive section,
                //you can't leave the section from the beginning
                if (currentSection.isCatAdaptive) {
                    return false;
                }

                //if the previous section is adaptive or a timed section
                previousSection = mapHelper.getItemSection(testMap, context.itemPosition - 1);
                // since 2025.02, empty timeConstraint can be null or []; defined timeConstraint will still be an object
                const previousSectionHasTimeConstraint =
                    previousSection.timeConstraint && 'allowLateSubmission' in previousSection.timeConstraint;
                if (
                    previousSection.isCatAdaptive ||
                    (previousSectionHasTimeConstraint && !noExitTimedSectionWarning)
                ) {
                    return false;
                }
            }

            if (navigationHelper.isFirstOf(testMap, context.itemIdentifier, 'part')) {
                //if the previous part is linear, we don't enter it too
                previousPart = mapHelper.getItemPart(testMap, context.itemPosition - 1);
                if (previousPart.isLinear) {
                    return false;
                }
            }
            return currentPart.isLinear === false && context.canMoveBackward === true;
        };

        /**
         * Hide the plugin if the Previous functionality shouldn't be available
         */
        var toggle = function toggle() {
            if (canDoPrevious()) {
                self.show();
            } else {
                self.hide();
            }
        };

        //build element (detached)
        this.$element = $(
            buttonTpl({
                control: 'move-backward',
                title: __('Submit and go to the previous item'),
                icon: 'backward',
                text: __('Previous')
            })
        );

        //attach behavior
        function doPrevious(previousItemWarning) {
            var context = testRunner.getTestContext();

            function enableNav() {
                testRunner.trigger('enablenav');
            }

            function triggerAction() {
                testRunner.previous();
            }

            testRunner.trigger('disablenav');

            if (self.getState('enabled') !== false) {
                if (previousItemWarning && context.remainingAttempts !== -1) {
                    testRunner.trigger(
                        'confirm.previous',
                        __(
                            'You are about to go to the previous item. Click OK to continue and go to the previous item.'
                        ),
                        triggerAction, // if the test taker accept
                        enableNav // if he refuses
                    );
                } else {
                    triggerAction();
                }
            }
        }

        this.$element.on('click', function(e) {
            e.preventDefault();
            testRunner.trigger('nav-previous');
        });

        const registerShortcut = (kbdShortcut) => {
            if (testRunnerOptions.allowShortcuts && kbdShortcut) {
                shortcut.add(
                    namespaceHelper.namespaceAll(kbdShortcut, this.getName(), true),
                    function() {
                        if (canDoPrevious() && self.getState('enabled') === true) {
                            testRunner.trigger('nav-previous', [true]);
                        }
                    },
                    {
                        avoidInput: true,
                        prevent: true
                    }
                );
            }
        };

        registerShortcut(pluginShortcuts.trigger);

        //start disabled
        toggle();
        self.disable();

        //update plugin state based on changes
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
            })
            .on('nav-previous', function(previousItemWarning) {
                doPrevious(previousItemWarning);
            })
            .on('enableaccessibilitymode', () => {
                const kbdShortcut = pluginShortcuts.triggerAccessibility;

                if (kbdShortcut && !this.getState('eaccessibilitymode')) {
                    shortcut.remove(`.${this.getName()}`);

                    registerShortcut(kbdShortcut);

                    this.setState('eaccessibilitymode');
                }
            });
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
        shortcut.remove(`.${this.getName()}`);
        this.$element.remove();
    },

    /**
     * Use to avoid blinking on often change conditions of button en./dis. status
     */
    throttledEnabledDisabled: _.throttle(function throttledEnabledDisabled(val) {
        if (val) {
            this.$element.removeProp('disabled').removeClass('disabled');
        } else {
            this.$element.prop('disabled', true).addClass('disabled');
        }
    }, 100),

    /**
     * Enable the button
     */
    enable: function enable() {
        this.throttledEnabledDisabled(true);
    },

    /**
     * Disable the button
     */
    disable: function disable() {
        this.throttledEnabledDisabled(true);
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
