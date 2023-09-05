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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * Module which displays modal window after the end of offline test
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 */
import $ from 'jquery';
import __ from 'i18n';
import polling from 'core/polling';
import hider from 'ui/hider';
import waitingDialogFactory from 'ui/waitingDialog/waitingDialog';
import offlineSyncModalCountdownTpl from 'taoQtiTest/runner/helpers/templates/offlineSyncModalCountdown';
import offlineSyncModalWaitContentTpl from 'taoQtiTest/runner/helpers/templates/offlineSyncModalWaitContent';
import shortcutRegistry from 'util/shortcut/registry';
import globalShortcut from 'util/shortcut';

/**
 * Display the waiting dialog, while waiting the connection to be back
 * @param {Object} [proxy] - test runner proxy
 * @returns {waitingDialog} resolves once the wait is over and the user click on 'proceed'
 */
function offlineSyncModalFactory(proxy) {
    const waitingConfig = {
        message: __('You are currently working offline.'),
        waitContent: offlineSyncModalWaitContentTpl(),
        proceedContent: __('Your connection seems to be back, please proceed.'),
        proceedButtonText: __('PROCEED & END ASSESSMENT'),
        showSecondary: true,
        secondaryButtonText: __('Download'),
        secondaryButtonIcon: 'download',
        buttonSeparatorText: __('or'),
        width: '600px'
    };
    let $secondaryButton;
    const betweenButtonTextSelector = '.between-buttons-text';
    const secondaryButtonWait = 60; // seconds to wait until it enables
    let delaySec;
    const $countdown = $(offlineSyncModalCountdownTpl());
    let countdownPolling;

    const dialogShortcut = shortcutRegistry($('body'), {
        propagate: false,
        prevent: true
    });

    // starts with shortcuts disabled, prevents the TAB key to be used to move outside the dialog box
    dialogShortcut.disable().set('Tab Shift+Tab');

    //creates the waiting modal dialog
    const waitingDialog = waitingDialogFactory(waitingConfig);

    const getDialogEl = selector => waitingDialog.dialog.getDom().find(selector);

    waitingDialog
        .on('render', () => {
            delaySec = secondaryButtonWait;
            $secondaryButton = getDialogEl('button[data-control="secondary"]');
            $countdown.insertAfter($secondaryButton);

            proxy.after('reconnect.waiting', () => {
                waitingDialog.endWait();
                hider.hide(getDialogEl('p.message'));
            });
            proxy.before('disconnect.waiting', () => {
                // need to open dialog again if it is closed
                waitingDialog.dialog.show();
                waitingDialog.beginWait();
            });

            // if render comes before beginWait:
            if (waitingDialog.is('waiting')) {
                waitingDialog.trigger('begincountdown');
            }

            globalShortcut.disable();
            dialogShortcut.enable();
        })
        .on('destroy', () => {
            proxy.off('.waiting');
            globalShortcut.enable();
            dialogShortcut.disable();
            dialogShortcut.clear();
        })
        .on('wait', () => {
            hider.show(getDialogEl(betweenButtonTextSelector));
            hider.show(getDialogEl('p.message'));
            // if beginWait comes before render:
            if (waitingDialog.is('rendered')) {
                waitingDialog.trigger('begincountdown');
            }
        })
        .on('begincountdown', () => {
            // Set up secondary button time delay:
            // it can only be clicked after 60 seconds have passed
            // if disconnect-reconnect delay will be left seconds
            $secondaryButton.prop('disabled', true);
            countdownPolling = polling({
                action: function countdownAction() {
                    delaySec--;
                    $countdown.html(__('The download will be available in <strong>%d</strong> seconds', delaySec));
                    if (delaySec < 1) {
                        this.stop();
                        $secondaryButton.removeProp('disabled');
                        $countdown.html('');
                    }
                },
                interval: 1000,
                autoStart: true
            });
        })
        .on('unwait', () => {
            countdownPolling.stop();
            $secondaryButton.prop('disabled', true);
            $countdown.html('');
            hider.hide(getDialogEl(betweenButtonTextSelector));
        });

    return waitingDialog;
}

export default offlineSyncModalFactory;
