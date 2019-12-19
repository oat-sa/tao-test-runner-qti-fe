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
 * Copyright (c) 2016-2019  (original work) Open Assessment Technologies SA;
 *
 * @author Anton Tsymuk <anton@taotesting.com>
 */

/**
 * Extract TTS data from APIP item data
 *
 * @param {Object} apipElement - APIP item Data
 * @returns {Object}
 */
const getTTSItemData = (apipElement) => {
    const { identifier } = apipElement['@attributes'];
    const {
        contentLinkInfo = { '@attributes': {} },
        relatedElementInfo: {
            spoken: {
                audioFileInfo = [],
            } = {},
        } = {},
    } = apipElement;
    const { fileHref = '' } = audioFileInfo.find((audioFile) => audioFile['@attributes'].mimeType === 'audio/mpeg') || {};
    const elementId = contentLinkInfo['@attributes'].qtiLinkIdentifierRef;

    return {
        identifier,
        selector: elementId && `#${elementId}`,
        url: fileHref.replace('assets/', ''),
    };
};

/**
 * Get APIP item order from APIP order data
 *
 * @param {String} identifier - APIP item identifier
 * @param {Object} elementOrder - APIP order data
 * @returns {Number}
 */
const getTTSItemOrder = (identifier, elementOrder) => {
    const { order } = elementOrder.find(
        (apipElementOrder) => apipElementOrder['@attributes'].identifierRef === identifier
    ) || {};

    return parseInt(order) || Number.POSITIVE_INFINITY;
};

/**
 * Extract data related to Text To Speech from item APIP data
 * @param {Object} apipData
 * @returns {Object}
 */
export default (apipData) => {
    const {
        accessibilityInfo: {
            accessElement = [],
        } = {},
        inclusionOrder: {
            textGraphicsDefaultOrder: {
                elementOrder = [],
            } = {},
        } = {},
    } = apipData;

    return accessElement
        .map(getTTSItemData)
        .filter(({ url }) => !!url)
        .sort(
            (a, b) => getTTSItemOrder(a.identifier, elementOrder) - getTTSItemOrder(b.identifier, elementOrder)
        );
};
