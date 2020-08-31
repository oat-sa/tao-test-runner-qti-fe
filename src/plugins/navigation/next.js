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
 * Test Runner Navigation Plugin : Next
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import __ from 'i18n';
import hider from 'ui/hider';
import pluginFactory from 'taoTests/runner/plugin';
import nextWarningHelper from 'taoQtiTest/runner/plugins/navigation/next/nextWarningHelper';
import messages from 'taoQtiTest/runner/helpers/messages';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import navigationHelper from 'taoQtiTest/runner/helpers/navigation';
import statsHelper from 'taoQtiTest/runner/helpers/stats';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import buttonTpl from 'taoQtiTest/runner/plugins/templates/button';

/**
 * The display of the next button
 */
var buttonData = {
    next: {
        control: 'move-forward',
        title: 'Submit and go to the item %s',
        icon: 'forward',
        text: __('Next')
    },
    end: {
        control: 'move-end',
        title: 'Submit and go to the end of the test',
        icon: 'fast-forward',
        text: __('End test')
    }
};

/**
 * Create the button based on the current context
 * @param {Boolean} [isLast=false] - is the current item the last
 * @returns {jQueryElement} the button
 */
var createElement = function createElement(isLast = false) {
    var dataType = isLast ? 'end' : 'next';
    return $(buttonTpl(buttonData[dataType]));
};

/**
 * Update the button based on the context
 * @param {jQueryElement} $element - the element to update
 * @param {TestRunner} [testRunner] - the test runner instance
 * @param {Boolean} [isLast=false] - is the current item the last
 */
const updateElement = function updateElement($element, testRunner, isLast = false) {
    const dataType = isLast ? 'end' : 'next';
    const testContext = testRunner.getTestContext();
    const nextItemPosition = testContext.itemPosition + 1;
    if (dataType === 'next') {
        $element.attr('title', __(buttonData[dataType].title, nextItemPosition));
    }
    if ($element.attr('data-control') !== buttonData[dataType].control) {
        $element
            .attr('data-control', buttonData[dataType].control)
            .find('.text')
            .text(buttonData[dataType].text);

        if (dataType === 'next') {
            $element
                .find(`.icon-${buttonData.end.icon}`)
                .removeClass(`icon-${buttonData.end.icon}`)
                .addClass(`icon-${buttonData.next.icon}`);
        } else {
            $element
                .find(`.icon-${buttonData.next.icon}`)
                .removeClass(`icon-${buttonData.next.icon}`)
                .addClass(`icon-${buttonData.end.icon}`);
        }
    }
};

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'next',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const self = this;
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        const pluginShortcuts = (testRunnerOptions.shortcuts || {})[this.getName()] || {};

        /**
         * Check if the current item is the last item
         * @returns {Boolean} true if the last
         */
        function isLastItem(){
            const testContext = testRunner.getTestContext();
            const testMap = testRunner.getTestMap();
            const itemIdentifier = testContext.itemIdentifier;
            return navigationHelper.isLast(testMap, itemIdentifier);
        }

        //plugin behavior
        /**
         * @param {Boolean} nextItemWarning - enable the display of a warning when going to the next item.
         * Note: the actual display of the warning depends on other conditions (see nextWarningHelper)
         */
        function doNext(nextItemWarning) {
            const testContext = testRunner.getTestContext();
            const testMap = testRunner.getTestMap();
            const testPart = testRunner.getCurrentPart();
            const nextItemPosition = testContext.itemPosition + 1;
            const itemIdentifier = testContext.itemIdentifier;

            // x-tao-option-unansweredWarning is a deprecated option whose behavior now matches the one of
            const unansweredWarning = mapHelper.hasItemCategory(testMap, itemIdentifier, 'unansweredWarning', true);

            // x-tao-option-nextPartWarning with the unansweredOnly option
            const nextPartWarning = mapHelper.hasItemCategory(testMap, itemIdentifier, 'nextPartWarning', true) || unansweredWarning;

            const endTestWarning = mapHelper.hasItemCategory(testMap, itemIdentifier, 'endTestWarning', true);

            // this check to avoid an edge case where having both endTestWarning
            // and unansweredWarning options would prevent endTestWarning to behave normally
            const unansweredOnly = !endTestWarning && unansweredWarning;

            const warningScope = nextPartWarning ? 'part' : 'test';

            function enableNav() {
                testRunner.trigger('enablenav');
            }

            testRunner.trigger('disablenav');

            if (self.getState('enabled') !== false) {
                const warningHelper = nextWarningHelper({
                    endTestWarning: endTestWarning,
                    isLast: isLastItem(),
                    isLinear: testPart.isLinear,
                    nextItemWarning: nextItemWarning,
                    nextPartWarning: nextPartWarning,
                    nextPart: mapHelper.getItemPart(testMap, nextItemPosition),
                    remainingAttempts: testContext.remainingAttempts,
                    testPartId: testContext.testPartId,
                    unansweredWarning: unansweredWarning,
                    stats: statsHelper.getInstantStats(warningScope, testRunner),
                    unansweredOnly: unansweredOnly
                });

                if (warningHelper.shouldWarnBeforeEndPart()) {
                    testRunner.trigger(
                        'confirm.endTestPart',
                        messages.getExitMessage(
                            warningScope,
                            testRunner
                        ),
                        triggerNextAction, // if the test taker accept
                        enableNav, // if he refuse
                        {
                            buttons: {
                                labels: {
                                    ok: __('SUBMIT THIS PART'),
                                    cancel: __('CANCEL')
                                }
                            }
                        }
                    );
                } else if (warningHelper.shouldWarnBeforeEnd()) {
                    testRunner.trigger(
                        'confirm.endTest',
                        messages.getExitMessage(
                            warningScope,
                            testRunner,
                            __('You will not be able to return to this test after you submit your answers.')
                        ),
                        triggerNextAction, // if the test taker accept
                        enableNav, // if he refuse
                        {
                            buttons: {
                                labels: {
                                    ok: __('SUBMIT THE TEST'),
                                    cancel: __('CANCEL')
                                }
                            }
                        }
                    );
                } else if (warningHelper.shouldWarnBeforeNext()) {
                    testRunner.trigger(
                        'confirm.next',
                        __('You are about to go to the next item. Click OK to continue and go to the next item.'),
                        triggerNextAction, // if the test taker accept
                        enableNav, // if he refuse
                    );
                } else {
                    triggerNextAction();
                }
            }
        }

        function triggerNextAction() {
            if (isLastItem()) {
                self.trigger('end');
            }
            testRunner.next();
        }

        //create the button (detached)
        this.$element = createElement(isLastItem());

        //attach behavior
        this.$element.on('click', function(e) {
            e.preventDefault();
            testRunner.trigger('nav-next');
        });

        const registerShortcut = (kbdShortcut) => {
            if (testRunnerOptions.allowShortcuts && kbdShortcut) {
                shortcut.add(
                    namespaceHelper.namespaceAll(kbdShortcut, this.getName(), true),
                    function() {
                        if (self.getState('enabled') === true) {
                            testRunner.trigger('nav-next', true);
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

        //disabled by default
        this.disable();

        //change plugin state
        testRunner
            .on('loaditem', () => {
                updateElement(this.$element, testRunner, isLastItem());
            })
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
            .on('nav-next', function(nextItemWarning) {
                doNext(nextItemWarning);
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
        //attach the element to the navigation area
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
