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
 * Copyright (c) 2023 (original work) Open Assessment Technologies SA ;
 */
(function() {
    const MESSAGE_TYPE = {
        REGISTER: 'REGISTER',
        ACTIVE: 'ACTIVE',
        PAUSED: 'PAUSED',
        FOCUS: 'FOCUS',
        BLUR: 'BLUR',
        CLOSING: 'CLOSING',
        UNPAUSE: 'UNPAUSE'
    };

    const tabs = new Map();
    let activeTabId = null;
    let focusedPausedTabId = null;
    let waitingForFocusedPausedTab = false;

    const ensureTab = tabId => {
        if (!tabs.has(tabId)) {
            tabs.set(tabId, {
                port: null,
                isPaused: false,
                isFocused: false
            });
        }
        return tabs.get(tabId);
    };

    const tryGrantUnpause = () => {
        if (!waitingForFocusedPausedTab || !focusedPausedTabId) {
            return;
        }

        const candidate = tabs.get(focusedPausedTabId);
        if (!candidate || !candidate.port || !candidate.isPaused) {
            return;
        }

        waitingForFocusedPausedTab = false;
        focusedPausedTabId = null;
        candidate.port.postMessage({ type: MESSAGE_TYPE.UNPAUSE });
    };

    onconnect = event => {
        const port = event.ports[0];
        let tabId = null;

        port.onmessage = ({ data }) => {
            if (!data || !data.type) {
                return;
            }

            if (data.type === MESSAGE_TYPE.REGISTER) {
                tabId = data.tabId;
                const tab = ensureTab(tabId);
                tab.port = port;
                return;
            }

            if (!tabId) {
                return;
            }

            const tab = ensureTab(tabId);

            if (data.type === MESSAGE_TYPE.ACTIVE) {
                activeTabId = tabId;
                tab.isPaused = false;
                waitingForFocusedPausedTab = false;
                if (focusedPausedTabId === tabId) {
                    focusedPausedTabId = null;
                }
                return;
            }

            if (data.type === MESSAGE_TYPE.PAUSED) {
                tab.isPaused = true;
                if (activeTabId === tabId) {
                    activeTabId = null;
                }
                return;
            }

            if (data.type === MESSAGE_TYPE.FOCUS) {
                tab.isFocused = true;
                if (tab.isPaused) {
                    focusedPausedTabId = tabId;
                    tryGrantUnpause();
                }
                return;
            }

            if (data.type === MESSAGE_TYPE.BLUR) {
                tab.isFocused = false;
                if (focusedPausedTabId === tabId) {
                    focusedPausedTabId = null;
                }
                return;
            }

            if (data.type === MESSAGE_TYPE.CLOSING) {
                const wasActive = activeTabId === tabId;
                tabs.delete(tabId);
                if (focusedPausedTabId === tabId) {
                    focusedPausedTabId = null;
                }
                if (wasActive) {
                    activeTabId = null;
                    waitingForFocusedPausedTab = true;
                    tryGrantUnpause();
                }
            }
        };

        port.start();
    };
})();
