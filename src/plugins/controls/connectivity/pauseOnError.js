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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

import __ from 'i18n';
import pluginFactory from 'taoTests/runner/plugin';
import dialogTpl from 'taoQtiTest/runner/plugins/controls/connectivity/pauseOnError.tpl';

const name = 'pauseOnError';
const dialogMessage = {
    title: __('Something unexpected happened.'),
    message: __('Please try reloading the page or pause the test. If you pause, you will be able to resume the test from this page.')
};
const dialogConfig = {
    buttons: {
        labels: {
            ok: __('Pause the test'),
            cancel: __('Reload the page')
        }
    }
};
const pauseContext = {
    reasons: {
        category: 'technical',
        subCategory: 'error'
    },
    originalMessage: 'Due to an unexpected issue the test has been suspended.'
};

export default pluginFactory({
    name,

    /**
     * Initialize the plugin (called during runner's init)
     */
    init() {
        const testRunner = this.getTestRunner();
        const returnToHome = () => testRunner.trigger('pause', pauseContext);
        const reloadPage = () => testRunner.trigger('reloadpage');
        const processError = () => {
            testRunner
                .on('reloadpage', () => window.location.reload())
                .trigger('disablenav disabletools hidenav')
                .trigger(`confirm.${name}`, dialogTpl(dialogMessage), returnToHome, reloadPage, dialogConfig);
        };

        testRunner.on('error', processError);
    }
});
