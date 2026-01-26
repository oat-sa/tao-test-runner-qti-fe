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
 * Copyright (c) 2016-2022  (original work) Open Assessment Technologies SA;
 *
 * @author dieter <dieter@taotesting.com>
 * @author Alexander Zagovorichev <zagovorichev@1pt.com>
 */

import $ from 'jquery';
import __ from 'i18n';
import 'ui/hider';
import transformer from 'ui/transformer';
import shortcut from 'util/shortcut';
import namespaceHelper from 'util/namespace';
import pluginFactory from 'taoTests/runner/plugin';
import mapHelper from 'taoQtiTest/runner/helpers/map';

/**
 * The standard zoom level, in percentage
 * @type {Number}
 */
const standard = 100;

/**
 * Zoom-In/Zoom-Out steps
 * @type {Number}
 */
const increment = 10;

/**
 * The zoom boundaries, in percentage
 * @type {Object}
 */
const threshold = {
    lower: 10,
    upper: 200
};

/**
 * @param {jQuery} $container
 */
const _removeContainerCentering = $container => {
    if ($container) {
        $container.css('margin-left', '0');
    }
};

/**
 * @param {jQuery} $container
 */
const _restoreContainerCentering = $container => {
    if ($container) {
        $container.css('margin-left', '');
    }
};

/**
 * Sets the zoom level
 * @param {jQuery} $target
 * @param {jQuery} $container
 * @param {Number} level - Zoom percentage
 */
const _setZoomLevel = ($target, $container, level) => {
    const $parent = $target.parent();
    const newScale = level / standard;

    const isOverZoom = $parent.outerWidth(true) < $target.width() * newScale;

    if (isOverZoom) {
        transformer.setTransformOrigin($target, '0 0');
        _removeContainerCentering($container);
    } else {
        transformer.setTransformOrigin($target, '50% 0');
        _restoreContainerCentering($container);
    }

    transformer.scale($target, newScale);
};

/**
 * Restores the standard zoom level
 * @param {jQuery} $target
 * @param {jQuery} $container
 */
const _resetZoom = ($target, $container) => {
    transformer.reset($target);
    _restoreContainerCentering($container);
};

/**
 * Forces a browser repaint
 * Solution from http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes?answertab=votes#tab-top
 * @param {jQuery} $target
 */
const forceRepaint = $target => {
    const sel = $target[0];
    if (sel) {
        sel.style.display = 'none';
        sel.offsetHeight; // no need to store this anywhere, the reference is enough
        sel.style.display = '';
    }
};

/**
 * Returns the configured plugin
 */
export default pluginFactory({
    name: 'zoom',

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        const pluginShortcuts = (testRunnerOptions.shortcuts || {})[this.getName()] || {};
        const testRunnerContainer = this.getAreaBroker().getContainer().get(0);

        /**
         * Checks if the plugin is currently available
         * @returns {Boolean}
         */
        const isConfigured = () => {
            //to be activated with the special category x-tao-option-zoom
            return mapHelper.hasItemCategory(
                testRunner.getTestMap(),
                testRunner.getTestContext().itemIdentifier,
                'zoom',
                true
            );
        };

        /**
         * Is zoom activated ? if not, then we hide the plugin
         */
        const togglePlugin = () => {
            if (isConfigured()) {
                //allow zoom
                this.show();
            } else {
                this.hide();
            }
        };

        const zoomAction = dir => {
            const inc = increment * dir;

            if (this.$zoomTarget) {
                const el = this.$zoomTarget[0];

                const before = el.getBoundingClientRect();

                let sx = this.$container.scrollLeft();
                let sy = this.$container.scrollTop();

                this.zoom = Math.max(threshold.lower, Math.min(threshold.upper, this.zoom + inc));

                if (this.zoom === standard) {
                    _resetZoom(this.$zoomTarget, this.$container);
                } else {
                    _setZoomLevel(this.$zoomTarget, this.$container, this.zoom);
                }

                testRunnerContainer.style.setProperty('--tool-zoom-level', this.zoom / standard);

                // force a browser repaint to fix a scrollbar issue with WebKit
                forceRepaint(this.$zoomTarget);

                const after = el.getBoundingClientRect();

                sx = Math.max(0, sx + (after.width - before.width) / 2);
                sy = Math.max(0, sy + (after.height - before.height) / 2);

                this.$container.scrollLeft(sx).scrollTop(sy);
            }
        };

        const zoomIn = () => {
            if (this.getState('enabled') !== false) {
                zoomAction(1);
            }
        };

        const zoomOut = () => {
            if (this.getState('enabled') !== false) {
                zoomAction(-1);
            }
        };

        /**
         * Reapplys the same zoom level to the target
         * It can be useful if the element was (visually-)hidden why zoom happened
         */
        const zoomReApply = () => {
            if (this.zoom !== standard) {
                _setZoomLevel(this.$zoomTarget, this.$container, this.zoom);
            }
        };

        //build element (detached)
        this.buttonZoomOut = this.getAreaBroker()
            .getToolbox()
            .createEntry({
                control: 'zoomOut',
                title: __('Zoom out'),
                icon: 'remove'
            });

        this.buttonZoomIn = this.getAreaBroker()
            .getToolbox()
            .createEntry({
                control: 'zoomIn',
                title: __('Zoom in'),
                icon: 'add'
            });

        //attach behavior
        this.buttonZoomIn.on('click', e => {
            e.preventDefault();
            testRunner.trigger('tool-zoomin');
        });

        //attach behavior
        this.buttonZoomOut.on('click', e => {
            e.preventDefault();
            testRunner.trigger('tool-zoomout');
        });

        if (testRunnerOptions.allowShortcuts) {
            if (pluginShortcuts.in) {
                shortcut.add(
                    namespaceHelper.namespaceAll(pluginShortcuts.in, this.getName(), true),
                    () => {
                        testRunner.trigger('tool-zoomin');
                    },
                    {
                        avoidInput: true
                    }
                );
            }

            if (pluginShortcuts.out) {
                shortcut.add(
                    namespaceHelper.namespaceAll(pluginShortcuts.out, this.getName(), true),
                    () => {
                        testRunner.trigger('tool-zoomout');
                    },
                    {
                        avoidInput: true
                    }
                );
            }
        }

        //start disabled
        togglePlugin();
        this.disable();

        //update plugin state based on changes
        testRunner
            .on('loaditem', () => {
                this.zoom = standard;

                togglePlugin();
                this.disable();
            })
            .on('renderitem', () => {
                this.$container = $('#qti-content');
                this.$zoomTarget = $('.qti-item');

                this.enable();
            })
            .on('enabletools', () => {
                this.enable();
            })
            .on('disabletools', () => {
                this.disable();
            })
            .on('unloaditem', () => {
                this.disable();
                _restoreContainerCentering(this.$container);
            })
            .on('tool-zoomin', zoomIn)
            .on('tool-zoomout', zoomOut)
            .on('tool-zoomreapply', zoomReApply);
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
        this.buttonZoomIn.enable();
        this.buttonZoomOut.enable();
    },
    /**
     * Disable the button
     */
    disable() {
        this.buttonZoomIn.disable();
        this.buttonZoomOut.disable();
    },
    /**
     * Show the button
     */
    show() {
        this.buttonZoomIn.show();
        this.buttonZoomOut.show();
    },
    /**
     * Hide the button
     */
    hide() {
        this.buttonZoomIn.hide();
        this.buttonZoomOut.hide();
    }
});
