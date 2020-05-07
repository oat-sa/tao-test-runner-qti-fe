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
 * Copyright (c) 2016-2019  (original work) Open Assessment Technologies SA;
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 */

import _ from 'lodash';
import __ from 'i18n';
import 'ui/hider';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import pluginFactory from 'taoTests/runner/plugin';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import keyNavigator from 'ui/keyNavigation/navigator';
import navigableDomElement from 'ui/keyNavigation/navigableDomElement';
import ttsComponentFactory from 'taoQtiTest/runner/plugins/tools/apipTextToSpeech/textToSpeech';
import ttsApipDataProvider from 'taoQtiTest/runner/plugins/tools/apipTextToSpeech/ttsApipDataProvider';

const pluginName = 'apiptts';

const actionPrefix = `tool-${pluginName}-`;

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: pluginName,

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        const pluginShortcuts = (testRunnerOptions.shortcuts || {})[this.getName()] || {};
        let ttsComponent;
        let ttsApipData;

        const createNavigationGroup = () => {
            const $container = testRunner.getAreaBroker().getContainer();
            const $navigationGroupElement = this.button.getElement();
            const groupNavigationId = `${pluginName}_navigation_group`;

            const $navigationElements = $container
                .find(
                    ttsApipData
                        .map(({ selector }) => selector)
                        .join(', ')
                );

            this.navigationGroup = keyNavigator({
                id: groupNavigationId,
                group: $navigationGroupElement,
                elements: navigableDomElement.createFromDoms($navigationElements.add($navigationGroupElement)),
                propagateTab: false,
                loop: true,
                keepState: true,
            })
                .on('tab', () => {
                    if (ttsComponent.is('sfhMode')) {
                        this.navigationGroup.next();

                        testRunner.trigger(`${actionPrefix}next`);
                    }
                })
                .on('shift+tab', () => {
                    if (ttsComponent.is('sfhMode')) {
                        this.navigationGroup.previous();

                        testRunner.trigger(`${actionPrefix}previous`);
                    }
                })
                .on('activate', () => {
                    if (ttsComponent.is('sfhMode')) {
                        testRunner.trigger(`${actionPrefix}togglePlayback`);
                    }
                })
                .on('blur', () => {
                    setTimeout(
                        () => {
                            if (!this.navigationGroup.isFocused()) {
                                this.navigationGroup.focus();
                            }
                        },
                        0
                    );
                })
                .setCursorAt($navigationElements.length);

            ttsComponent.on('next finish', () => {
                if (ttsComponent.is('sfhMode')) {
                    const $currentElement = this.navigationGroup.getCursor().navigable.getElement();
                    const { selector } = ttsComponent.getCurrentItem() || {};

                    if (!selector || !$currentElement.is(selector)) {
                        this.navigationGroup.next();
                    }
                }
            });
        };

        /**
         * Creates the tts component on demand
         * @returns {textToSpeech}
         */
        const getTTSComponent = () => {
            if (!ttsComponent) {
                const $container = testRunner.getAreaBroker().getContainer();

                ttsComponent = ttsComponentFactory($container, {})
                    .on('close', () => {
                        if (this.getState('active')) {
                            testRunner.trigger(`${actionPrefix}toggle`);
                        }
                    })
                    .hide();
            }

            return ttsComponent;
        };

        /**
         * Checks if the plugin is currently available.
         * To be activated with the special category x-tao-option-apiptts
         *
         * @returns {Boolean}
         */
        const isConfigured = () => mapHelper.hasItemCategory(
            testRunner.getTestMap(),
            testRunner.getTestContext().itemIdentifier,
            'apiptts',
            true
        );

        /**
         * Is plugin activated ? if not, then we hide the plugin
         */
        const togglePlugin = () => {
            if (isConfigured()) {
                this.show();
            } else {
                this.hide();
            }
        };

        /**
         * Show the plugin panel
         *
         * @fires plugin-open.apiptts
         */
        const enablePlugin = () => {
            createNavigationGroup();

            this.button.turnOn();
            this.setState('active', true);

            this.trigger('open');

            if (ttsComponent.is('hidden')) {
                ttsComponent.show();
            }
        };

        /**
         * Hide the plugin panel
         *
         * @fires plugin-close.apiptts
         */
        const disablePlugin = () => {
            if (this.getState('active')) {
                this.navigationGroup.blur();
                this.navigationGroup.destroy();

                this.setState('active', false);

                this.button.turnOff();
                this.trigger('close');

                if (ttsComponent && !ttsComponent.is('hidden')) {
                    ttsComponent.close();
                    ttsComponent.hide();
                }
            }
        };

        /**
         * Shows/hides the plugin
         */
        const toggleTool = () => {
            if (this.getState('enabled')) {
                if (this.getState('active')) {
                    disablePlugin();
                    this.setState('sleep', true);
                } else {
                    enablePlugin();
                }
            }
        };

        // Add plugin button to toolbox
        this.button = this.getAreaBroker()
            .getToolbox()
            .createEntry({
                className: `${this.getName()}-plugin`,
                control: this.getName(),
                icon: 'headphones',
                text: __('Text To Speech'),
                title: __('Enable text to speech'),
            });

        // Handle plugin button click
        this.button.on('click', (e) => {
            e.preventDefault();
            testRunner.trigger(`${actionPrefix}toggle`);
        });

        // Register plugin shortcuts
        if (testRunnerOptions.allowShortcuts) {
            _.forEach(pluginShortcuts, (command, key) => {
                shortcut.add(
                    namespaceHelper.namespaceAll(command, pluginName, true),
                    () => {
                        if (
                            key === 'spaceTogglePlayback'
                            && ttsComponent
                            && ttsComponent.is('sfhMode')
                        ) {
                            return;
                        }

                        const eventKey = key.endsWith('TogglePlayback') ? 'togglePlayback' : key;

                        testRunner.trigger(actionPrefix + eventKey);
                    },
                    {
                        avoidInput: true
                    }
                );
            });
        }

        //update plugin state based on changes
        testRunner
            .on('loaditem', () => {
                togglePlugin();
                this.disable();
            })
            .on('enabletools renderitem', () => {
                this.enable();
            })
            .on('disabletools unloaditem', () => {
                disablePlugin();
                this.disable();
            })
            .on(`${actionPrefix}toggle`, () => {
                this.setState('sleep', false);
                if (isConfigured()) {
                    toggleTool();
                }
            })
            .on(`${actionPrefix}togglePlayback`, () => {
                if (this.getState('enabled')) {
                    if (this.getState('active')) {
                        if (ttsComponent.is('sfhMode')) {
                            const $currentElement = this.navigationGroup.getCursor().navigable.getElement();
                            const { selector } = ttsComponent.getCurrentItem() || {};

                            if (!$currentElement.is(selector)) {
                                if (this.button.getElement()[0] !== $currentElement[0]) {
                                    $currentElement.trigger('click');
                                }

                                return;
                            }
                        }

                        ttsComponent.togglePlayback();
                    }
                }
            })
            .on('renderitem', () => {
                if (!isConfigured()) {
                    return;
                }

                ttsApipData = ttsApipDataProvider(testRunner.itemRunner.getData().apipAccessibility || {})
                    .map((apipItemData) => Object.assign(
                        {},
                        apipItemData,
                        { url: testRunner.itemRunner.assetManager.resolve(apipItemData.url) }
                    ));

                if (!ttsApipData.length) {
                    disablePlugin();
                    this.hide();

                    return;
                }

                getTTSComponent().setMediaContentData(ttsApipData);
                this.show();
                if (!this.getState('sleep')) {
                    this.setState('enabled', true);
                    toggleTool();
                }
            });
    },
    /**
     * Called during the runner's destroy phase
     */
    destroy() {
        shortcut.remove(`.${this.getName()}`);
    },
    /**
     * Enable the button
     */
    enable() {
        this.button.enable();
    },
    /**
     * Disable the button
     */
    disable() {
        this.button.disable();
    },
    /**
     * Show the button
     */
    show() {
        this.button.show();
    },
    /**
     * Hide the button
     */
    hide() {
        this.button.hide();
    }
});
