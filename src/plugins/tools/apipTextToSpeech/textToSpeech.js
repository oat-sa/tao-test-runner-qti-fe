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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA;
 */

/**
 * Create Text to Speech component which can playback APIP media content
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 */
import $ from 'jquery';
import ttsTemplate from 'taoQtiTest/runner/plugins/tools/apipTextToSpeech/textToSpeech.tpl';
import component from 'ui/component';
import interact from 'interact';
import makeStackable from 'ui/component/stackable';
import makePlaceable from 'ui/component/placeable';
import 'nouislider';

const defaultConfig = {
    activeElementClass: 'tts-active-content-node',
    elementClass: 'tts-content-node',
    left: 50,
    maxPlaybackRate: 2,
    minPlaybackRate: 0.5,
    playbackRate: 1,
    top: 50,
};

const stackingOptions = {
    stackingScope: 'test-runner'
};

/**
 * Creates an instance of Text to Speech component
 *
 * @param {Element} container
 * @param {Object} config - component configurations
 * @param {String} config.activeElementClass - class applied to active content element. Default value 'tts-active-content-node'
 * @param {String} config.elementClass - class applied to content element. Default value 'tts-content-node'
 * @param {Number} config.left - initial left position of component. Default value 50
 * @param {Number} config.maxPlaybackRate - max playback rate. Default value 2
 * @param {Number} config.minPlaybackRate - min playback rate. Default value 0.5
 * @param {Number} config.playbackRate - playback rate. Default value 1
 * @param {Number} config.top - initial top position of component. Default value 50
 * @returns {ttsComponent} the textToSpeech component (uninitialized)
 */
function maskingComponentFactory(container, config) {
    const audio = new Audio();
    let currentPlayback = [];
    let currentItem;
    let mediaContentData = [];
    // Browser does not support selection Api If getSelection is not defined
    const selection = window.getSelection && window.getSelection();

    // component API
    const spec = {
        /**
         * Update componet state and stop playback
         *
         * @fires close
         */
        close() {
            this.setTTSStateOnPage('playing', false);
            this.setTTSStateOnPage('sfhMode', false);
            this.setState('settings', false);
            this.stop();

            this.trigger('close');
        },
        /**
         * Get current active APIP item
         *
         * @returns {Object} active APIP item
         */
        getCurrentItem() {
            return currentItem;
        },
        /**
         * When component in start from here mode, switch to clicked content element
         *
         * @param {Object} e - event object
         */
        handleContentNodeClick(e) {
            const $target = $(e.target);

            // Allow default behaviour for inputs
            if (
                $target.hasClass('icon-checkbox')
                || $target.hasClass('icon-radio')
                || $target.is('input')
            ) {
                return;
            }

            // Prevent default behaviour for lables and links
            e.stopPropagation();
            e.preventDefault();

            if (!this.is('sfhMode')) {
                return;
            }

            const $currentTarget = $(e.currentTarget);
            // Find APIP item associated with clicked element
            const selectedItem = mediaContentData.find(({ selector: itemSelector }) => $currentTarget.is(itemSelector));
            currentPlayback = [selectedItem];

            this.stop();
            this.initNextItem();
            this.togglePlayback();
        },
        /**
         * Select APIP item for default mode
         */
        initDefaultModeItem() {
            this.initItemWithTextSelection();

            if (!currentItem) {
                this.initDefaultModePlayback();
            }
        },
        /**
         * Check if there is some selected content inside APIP elelemts on the page
         */
        initItemWithTextSelection() {
            // Check if there is selected content
            if (!selection || !selection.toString()) {
                return;
            }

            // Get APIP item by current selection
            const currentSelection = selection.getRangeAt(0);
            const { commonAncestorContainer } = currentSelection;
            const selectedItem = mediaContentData.find(({ selector }) => $(selector).is(commonAncestorContainer)
                || $.contains($(selector)[0], commonAncestorContainer));

            if (selectedItem && selectedItem !== currentItem) {
                currentPlayback = [selectedItem];
                this.initNextItem();
            }
        },
        /**
         * Check if there is next APIP item to play and start playback if component in playing state.
         * If there is no APIP item to play stop playback
         */
        initNextItem() {
            const { activeElementClass } = this.config;

            currentItem && $(currentItem.selector).removeClass(activeElementClass);
            currentItem = currentPlayback.shift();

            if (currentItem) {
                const { selector, url } = currentItem;
                $(selector).addClass(activeElementClass);

                audio.setAttribute('src', url);
                audio.load();

                if (this.is('playing')) {
                    audio.play();
                }

                return;
            }

            this.stop();
        },
        /**
         * Init default mode playback
         */
        initDefaultModePlayback() {
            currentPlayback = [...mediaContentData];

            this.initNextItem();
        },
        /**
         * Set APIP data. Apply handlers to APIP elements. Stop current playback
         *
         * @param {Array} data - APIP data items
         */
        setMediaContentData(data) {
            const { elementClass } = this.config;
            mediaContentData = data;
            const $contentNodes = $(
                mediaContentData
                    .map(({ selector }) => selector)
                    .join(', ')
            );

            $contentNodes.addClass(elementClass);
            $contentNodes.on('click', this.handleContentNodeClick);

            this.stop();
        },
        /**
         * Set playback rate
         *
         * @param {Object} e - event object
         * @param {Number} value - playback rate
         */
        setPlaybackRate(e, value) {
            audio.playbackRate = value;
        },
        /**
         * Update component state. Toggle state class on page body
         *
         * @param {String} name
         * @param {Boolean} value
         */
        setTTSStateOnPage(name, value) {
            this.setState(name, value);

            $(document.body).toggleClass(`tts-${name}`, value);
        },
        /**
         * Pause playback and update component state. Set current item to null
         */
        stop() {
            const { activeElementClass } = this.config;

            audio.pause();
            audio.currentTime = 0;
            currentItem && $(currentItem.selector).removeClass(activeElementClass);
            currentItem = null;

            this.setTTSStateOnPage('playing', false);
        },
        /**
         * Toggle playback
         *
         * @param {Object} e - event object
         */
        togglePlayback(e) {
            e && e.preventDefault();

            const isPlaying = this.is('playing');

            if (!this.is('sfhMode')) {
                this.initDefaultModeItem();
            }

            if (!isPlaying && currentItem) {
                audio.play();

                this.setTTSStateOnPage('playing', true);
            } else {
                audio.pause();

                this.setTTSStateOnPage('playing', false);
            }
        },
        /**
         * Toggle start from here mode
         */
        toggleSFHMode() {
            const isSFHMode = this.is('sfhMode');

            this.setTTSStateOnPage('sfhMode', !isSFHMode);
            this.stop();
        },
        /**
         * Toggle settings element
         */
        toggleSettings() {
            const isSettings = this.is('settings');

            this.setState('settings', !isSettings);
        },
    };

    const ttsComponent = component(spec, defaultConfig);
    makePlaceable(ttsComponent);
    makeStackable(ttsComponent, stackingOptions);

    ttsComponent
        .setTemplate(ttsTemplate)
        .on('init', function () {
            this.render(container);
        })
        .on('render', function () {
            const {
                left,
                maxPlaybackRate,
                minPlaybackRate,
                playbackRate,
                top
            } = this.getConfig();
            const $element = this.getElement();
            const $closeElement = $('.tts-control-close', $element);
            const $dragElement = $('.tts-control-drag', $element);
            const $playbackElement = $('.tts-control-playback', $element);
            const $sfhModeElement = $('.tts-control-mode', $element);
            const $sliderElement = $('.tts-slider', $element);
            const $settingsElement = $('.tts-control-settings', $element);

            $element.css('touch-action', 'none');

            // make component dragable
            const interactElement = interact($element)
                .draggable({
                    autoScroll: true,
                    manualStart: true,
                    restrict: {
                        restriction: container[0],
                        elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
                    },
                    onmove: (event) => {
                        const xOffset = Math.round(event.dx),
                            yOffset = Math.round(event.dy);

                        this.moveBy(xOffset, yOffset);
                    }
                });

            interact($dragElement[0]).on('down', (event) => {
                const interaction = event.interaction;

                interaction.start(
                    {
                        name: 'drag',
                    },
                    interactElement,
                    $element[0]
                );
            });

            // initialise slider
            $sliderElement.noUiSlider({
                animate: true,
                connected: true,
                range: {
                    min: minPlaybackRate,
                    max: maxPlaybackRate,
                },
                start: playbackRate,
                step: 0.1
            })
                .on('change', this.setPlaybackRate);

            // handle controls
            $closeElement.on('click', this.close);
            // handle mousedown instead of click to prevent selection lose
            $playbackElement.on('mousedown', this.togglePlayback);
            $sfhModeElement.on('click', this.toggleSFHMode);
            $settingsElement.on('click', this.toggleSettings);
            audio.addEventListener('ended', this.initNextItem);

            // move to initial position
            this.moveTo(left, top);
        })
        .on('hide', function () {
            this.setTTSStateOnPage('visible', false);
        })
        .on('show', function () {
            this.setTTSStateOnPage('visible', true);
        })
        .on('destory', function () {
            this.stop();
        });

    ttsComponent.init(config);

    return ttsComponent;
}

export default maskingComponentFactory;
