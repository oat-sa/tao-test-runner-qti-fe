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
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */

import __ from 'i18n';

const RUBY_HTML = /<\s*(?:ruby|rt|rp|rb)\b/i;

/**
 * Extract plain text from a translated string that may contain HTML ruby annotations.
 * Used for HTML title attributes where markup is not allowed.
 *
 * @param {string} text
 * @returns {string}
 */
export default function plainTextFromRuby(text) {
    if (typeof __.plainTextFromRuby === 'function') {
        return __.plainTextFromRuby(text);
    }

    if (!text || typeof text !== 'string' || !RUBY_HTML.test(text)) {
        return text;
    }

    if (typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.innerHTML = text;
        return el.textContent || text;
    }

    return text.replace(/<[^>]+>/g, '');
}
