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
import _ from 'lodash';
import ttsTemplate from 'taoQtiTest/runner/plugins/tools/apipTextToSpeech/textToSpeech.tpl';
import component from 'ui/component';
import interact from 'interact';
import makeStackable from 'ui/component/stackable';
import makePlaceable from 'ui/component/placeable';
import 'nouislider';

const defaultConfig = {
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
 * @param {Object} config - component configurations
 * @param {Number} config.playbackRate - playback rate. Default value 1
 * @returns {ttsComponent} the textToSpeech component (uninitialized)
 */
function maskingComponentFactory(config) {
    const initConfig = _.defaults(config || {}, defaultConfig);

    // component API
    const spec = {
        close() {
            this.setState('playing', false);
            this.setState('sfhMode', false);
            this.setState('settings', false);

            this.trigger('close');
        },
        togglePlayback() {
            const isPlaying = this.is('playing');

            this.setState('playing', !isPlaying);
        },
        // toggle start from here mode
        toggleSFHMode() {
            const isSFHMode = this.is('sfhMode');

            this.setState('sfhMode', !isSFHMode);
        },
        toggleSettings() {
            const isSettings = this.is('settings');

            this.setState('settings', !isSettings);
        }
    };

    const ttsComponent = component(spec);
    makePlaceable(ttsComponent);
    makeStackable(ttsComponent, stackingOptions);

    ttsComponent
        .setTemplate(ttsTemplate)
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
                        restriction: this.getContainer()[0],
                        elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
                    },
                    onmove: (event) => {
                        const xOffset = Math.round(event.dx),
                            yOffset = Math.round(event.dy);

                        this.moveBy(xOffset, yOffset);
                    }
                });

            interact($dragElement[0]).on('down', (event) => {
                var interaction = event.interaction;

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
                .on('change', () => {});

            // handle controls
            $closeElement.on('click', this.close);
            $playbackElement.on('click', this.togglePlayback);
            $sfhModeElement.on('click', this.toggleSFHMode);
            $settingsElement.on('click', this.toggleSettings);

            // move to initial position
            this.moveTo(left, top);
        });

    ttsComponent.init(initConfig);

    return ttsComponent;
}

export default maskingComponentFactory;
