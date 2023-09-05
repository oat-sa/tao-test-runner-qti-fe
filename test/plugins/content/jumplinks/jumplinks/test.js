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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Anton Tsymuk <anton@taotesting.com>
 */
define([
    'jquery',
    'taoQtiTest/runner/plugins/content/accessibility/jumplinks/jumplinks',
], function ($, componentFactory) {
    'use strict';

    QUnit.module('Visual');

    QUnit.test('visual test', (assert) => {
        const $playgroundContainer = $('#playground-container');

        const config = {
            isReviewPanelEnabled: true,
            questionStatus: '',
        };

        const jumplinksComponent = componentFactory({});

        jumplinksComponent.init(config);
        jumplinksComponent.render($playgroundContainer[0]);

        assert.ok(true);
    });

    QUnit.test('Test jumplinks review panel link', (assert) => {
        const $container = $('<div id="jump-container"></div>');

        const config = {
            isReviewPanelEnabled: false,
            questionStatus: '',
        };

        const jumplinksComponent = componentFactory({});

        jumplinksComponent.init(config);
        jumplinksComponent.render($container[0]);

        const reviewClass = jumplinksComponent
            .getElement()
            .find('[data-jump="teststatus"]')
            .parent()
            .attr('class');

        assert.equal(reviewClass, 'jump-link-item hidden', 'should be hidden');
    });

    QUnit.test('Test jumplinks review panel link', (assert) => {
        const $container = $('<div id="jump-container"></div>');

        const config = {
            isReviewPanelEnabled: true,
            questionStatus: '',
        };

        const jumplinksComponent = componentFactory({});

        jumplinksComponent.init(config);
        jumplinksComponent.render($container[0]);

        const reviewClass = jumplinksComponent
            .getElement()
            .find('[data-jump="teststatus"]')
            .parent()
            .attr('class');

        assert.equal(reviewClass, 'jump-link-item ', 'should be visible');
    });
});
