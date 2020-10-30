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
 * Test Runner Control Plugin : Title
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import pluginFactory from 'taoTests/runner/plugin';
import titleTpl from 'taoQtiTest/runner/plugins/controls/title/title.tpl';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import getTimerMessage from 'taoQtiTest/runner/helpers/getTimerMessage';
import moment from 'moment';
import statsHelper from 'taoQtiTest/runner/helpers/stats';

const precision = 1000;

export default pluginFactory({
    name: 'title',
    init: function init() {
        const testRunner = this.getTestRunner();
        const testMap = testRunner.getTestMap();

        const updateTitles = () => {
            const testContext = testRunner.getTestContext();
            const currentPart = mapHelper.getItemPart(
                testMap,
                testContext.itemPosition
            );
            const currentItem = mapHelper.getItem(
                testMap,
                testContext.itemIdentifier
            );

            // update test title
            if (testMap.title) {
                this.titles.test.$title.text(testMap.title).show();
            }

            // update part title
            if (currentPart && currentPart.label) {
                this.titles.testPart.$title
                    .text(` - ${currentPart.label}`)
                    .show();
            }

            // update section title
            //@deprecated the following block seems to
            //be very specific and need to be reworked
            if (testContext.isDeepestSectionVisible) {
                const section = mapHelper.getItemSection(
                    testMap,
                    testContext.itemPosition
                );

                //testContext.sectionTitle is kept only for backward compat
                this.titles.section.$title
                    .text(` - ${section.label || testContext.sectionTitle}`)
                    .show();
            }

            // update item title
            if (currentItem.label) {
                this.titles.item.$title
                    .text(` - ${currentItem.label}`)
                    .show();
            }
        };

        testRunner
            .after('renderitem', () => {
                _.forOwn(this.titles, (options, scope) => {
                    this.titles[scope].$title.text('');
                    this.titles[scope].$timer.text('');

                    if (scope !== 'item') {
                        this.titles[scope].stats = statsHelper.getInstantStats(scope, testRunner);
                    }
                });

                updateTitles();
            })
            .on('timertick', (remainingTime, scope) => {
                const title = this.titles[scope];

                if (!title) {
                    return;
                }

                const {
                    $timer,
                    stats
                } = this.titles[scope];
                const time = moment.duration(remainingTime / precision, 'seconds');
                const hours = time.get('hours');
                const minutes = time.get('minutes');
                const seconds = time.get('seconds');
                const unansweredQuestions = stats && (stats.questions - stats.answered);

                // check if notification should be updated
                if ($timer) {
                    $timer.text(getTimerMessage(hours, minutes, seconds, unansweredQuestions));
                }
            })
            .on('unloaditem', () => {
                $('.qti-controls', this.$element).hide();
            });
    },
    render: function render() {
        const $container = this.getAreaBroker().getControlArea();
        this.titles = {
            test: {
                attribute: 'qti-test-title',
                className: '',
            },
            testPart: {
                attribute: 'qti-test-part-title',
                className: 'visible-hidden',
            },
            section: {
                attribute: 'qti-test-position',
                className: '',
            },
            item: {
                attribute: 'qti-test-item-title',
                className: 'visible-hidden',
            },
        };
        this.$element = $(titleTpl({ titles: _.values(this.titles) }));

        // hide titles by default
        $('.qti-controls', this.$element).hide();

        $container.append(this.$element);

        _.forOwn(this.titles, ({ attribute }, scope) => {
            this.titles[scope].$title = $container.find(`[data-control="${attribute}"]`);
            this.titles[scope].$timer = $container.find(`[data-control="${attribute}-timer"]`);
        });
    },
});
