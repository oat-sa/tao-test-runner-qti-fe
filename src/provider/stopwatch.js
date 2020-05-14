/*
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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA
 *
 */

/**
 * Tick elapsed time
 */
import eventifier from 'core/eventifier';
import pollingFactory from 'core/polling';
import timerFactory from 'core/timer';

const defaultOptions = {
    interval: 1000,
};

/**
 * The stopwatch factory
 * @param {Object} options
 * @param {Number} [options.interval]
 * @returns {Object} stopwatch instance
 */
export default function stopwatchFactory(options) {
    const config = Object.assign({}, defaultOptions, options);

    return eventifier({
        /**
         * Initialize stopwatch
         */
        init() {
            this.stopwatch = timerFactory({
                autoStart: false,
            });

            /**
             * @fires tick - every time when interval is elapsed
             */
            this.polling = pollingFactory({
                action: () => this.trigger('tick', this.stopwatch.tick()),
                interval: config.interval,
                autoStart: false,
            });

            this.initialized = true;
        },
        /**
         * Start stopwatch
         */
        start() {
            if (this.initialized) {
                this.stopwatch.resume();
                this.polling.start();
            }
        },
        /**
         * Stop stopwatch
         */
        stop() {
            if (this.initialized) {
                this.stopwatch.pause();
                this.polling.stop();
            }
        },
        /**
         * Destory stopwatch by stoping the timer
         */
        destroy() {
            if (this.initialized) {
                this.stopwatch.stop();
                this.polling.stop();
            }
        }
    });
}
