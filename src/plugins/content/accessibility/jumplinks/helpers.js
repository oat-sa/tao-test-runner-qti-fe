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
 * Copyright (c) 2016-2020 (original work) Open Assessment Technologies SA ;
 */

export const getJumpElementFactory = (broker) => ({
    get question() {
        return broker
            .getContainer()
            .find('.content-wrapper')
            .first();
    },
    get navigation() {
        return broker
            .getNavigationArea()
            .find(':not(.hidden)[tabindex]')
            .first();
    },
    get toolbox() {
        return broker
            .getToolboxArea()
            .find(':not(.hidden)[tabindex]')
            .first();
    },
    get teststatus() {
        return broker
            .getPanelArea()
            .find(':not(.hidden)[tabindex]')
            .first();
    },
});

export const getItemStatus = (item) => {
    if (item.flagged) {
        return 'Flagged for review';
    }

    if (item.answered) {
        return 'Answered';
    }

    if (item.viewed) {
        return 'Not answered';
    }

    return 'Not seen';
}
