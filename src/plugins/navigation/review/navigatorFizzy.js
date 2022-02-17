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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */
import _ from 'lodash';
import __ from 'i18n';
import componentFactory from 'ui/component';
import itemButtonListFactory from 'ui/itemButtonList';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import navigatorTpl from './navigatorFizzy.tpl';
import navigatorTreeTpl from './navigatorBubbles.tpl';

/**
 * Some default values
 * @type {Object}
 * @private
 */
const _defaults = {
    scope: 'test',
    preventsUnseen: true
};

/**
 * List of common CSS selectors
 * @type {Object}
 * @private
 */
const _selectors = {
    component: '.qti-navigator',
    tree: '.qti-navigator-tree',
    linearState: '.qti-navigator-linear',
    closeButton: '.icon-close',
    itemButtonListContainer: '.qti-navigator-items'
};

/**
 *
 * @param {Object} config
 * @param {String} [config.scope] Limit the review screen to a particular scope: test, testPart, testSection
 * @param {Boolean} [config.preventsUnseen] Prevents the test taker to access unseen items
 * @returns {*}
 */
function navigatorFactory(config) {
    let component;

    // click on an item: jump to the position
    function onItemClick(itemId, disableUnseenItems) {
        const item = mapHelper.getItem(component.map, itemId);
        const activeItem = mapHelper.getItem(component.map, component.testContext.itemIdentifier);
        if (item && !component.is('disabled')) {
            if (
                !(disableUnseenItems && !item.viewed) &&
                (!activeItem || item.position !== activeItem.position)
            ) {
                component.select(item.position);
                /**
                 * A jump to a particular item is required
                 * @event navigator#jump
                 * @param {Number} position - The item position on which jump
                 */
                component.trigger('jump', item.position);
            }
        }
    }

    function renderItemButtonListComponents(fizzyItemButtonMap, activeItemId, disableUnseenItems) {
        component.itemButtonListComponents.forEach(c => c.destroy());
        component.itemButtonListComponents = [];

        component.controls.$tree.find(_selectors.itemButtonListContainer).each((index, itemButtonListContainerElem) => {
            const itemButtonListComponent = itemButtonListFactory({
                items: fizzyItemButtonMap.sections[index].items,
                scrollContainer: component.controls.$tree
            })
                .render(itemButtonListContainerElem)
                .on('click', ({id}) => onItemClick(id, disableUnseenItems));
            component.itemButtonListComponents.push(itemButtonListComponent);
        });

        component.itemButtonListComponents.forEach(c => c.setActiveItem(activeItemId));
    }

    function getFizzyItemButtonMap(scopeMap, disableUnseenItems) {
        const displaySectionTitles = component.getConfig().displaySectionTitles;

        let nonInformationalCount = 0;
        const fizzyMap = {
            sections: []
        };

        _.forEach(scopeMap.parts, function(part) {
            _.forEach(part.sections, function (dataSection) {
                let fizzySection;
                if (displaySectionTitles) {
                    fizzySection = {
                        label: dataSection.label,
                        items: []
                    };
                    fizzyMap.sections.push(fizzySection);
                } else {
                    if (fizzyMap.sections.length) {
                        fizzySection = fizzyMap.sections[0];
                    } else {
                        fizzySection = {
                            items: []
                        };
                        fizzyMap.sections.push(fizzySection);
                    }
                }

                _.forEach(dataSection.items, function (dataItem) {
                    if (!dataItem.informational) {
                        nonInformationalCount++;
                    }

                    const fizzyItem = {
                        id: dataItem.id,
                        position: dataItem.position
                    };
                    fizzySection.items.push(fizzyItem);

                    fizzyItem.numericLabel = dataItem.informational ? '' : `${nonInformationalCount}`;

                    if (dataItem.informational) {
                        fizzyItem.icon = 'info';
                        fizzyItem.ariaLabel = __('Informational item');
                    } else if (dataItem.flagged) {
                        fizzyItem.icon = 'flagged';
                        fizzyItem.ariaLabel = __('Bookmarked question %s', nonInformationalCount);
                    } else {
                        fizzyItem.icon = null;
                        fizzyItem.ariaLabel = __('Question %s', nonInformationalCount);
                    }

                    if (dataItem.answered) {
                        fizzyItem.status = 'answered';
                    } else if (dataItem.viewed) {
                        fizzyItem.status = 'viewed';
                    } else {
                        fizzyItem.status = 'unseen';
                    }

                    if (disableUnseenItems && !dataItem.viewed) {
                        // disables all unseen items to prevent the test taker has access to.
                        fizzyItem.disabled = true;
                    }
                });
            });
        });

        return fizzyMap;
    }

    /**
     *
     * @type {Object}
     */
    const navigatorApi = {
        /**
         * Set the marked state of an item
         * @param {Number} position
         * @param {Boolean} flag
         */
        setItemFlag: function setItemFlag(position, flag) {
            const updatedMap = _.cloneDeep(this.map);
            const updatedItem = mapHelper.getItemAt(updatedMap, position);
            if (updatedItem) {
                updatedItem.flagged = flag;
                const updatedScopeMap = mapHelper.getScopeMapFromContext(updatedMap, this.testContext, this.config.scope);
                const updatedFizzyMap = getFizzyItemButtonMap(updatedScopeMap, false, false);
                let updatedItemData;
                _.forEach(updatedFizzyMap.sections, fizzySection => {
                    updatedItemData = _.find(fizzySection.items, (fizzyItem) => fizzyItem.id === updatedItem.id);
                    if (updatedItemData) {
                        return false;
                    }
                });
                this.itemButtonListComponents.forEach(c => c.updateItem(updatedItem.id, updatedItemData));
            }
        },

        /**
         * Update the config
         * @returns {navigatorApi}
         */
        updateConfig: function updateConfig() {
            //not implemented
            return this;
        },

        /**
         * Updates the review screen
         * @param {Object} map The current test map
         * @param {Object} context The current test context
         * @returns {navigatorApi}
         * @fires navigator#update
         */
        update(map, context) {
            const scopedMap = mapHelper.getScopeMapFromContext(map, context, this.config.scope);
            scopedMap.displaySectionTitles = this.getConfig().displaySectionTitles;

            this.map = map;
            this.testContext = context;

            // rebuild the tree
            const testPart = mapHelper.getPart(map, context.testPartId);
            if (!testPart.isLinear) {
                this.controls.$linearState.hide();

                const activeItemId = context.itemIdentifier;
                const isSkipaheadEnabled = mapHelper.hasItemCategory(map, activeItemId, 'x-tao-option-review-skipahead');

                this.setState('skipahead-enabled', isSkipaheadEnabled);
                this.setState('prevents-unseen', this.config.preventsUnseen);

                this.controls.$tree.html(navigatorTreeTpl(scopedMap));

                const disableUnseenItems = this.config.preventsUnseen && !isSkipaheadEnabled;
                const fizzyItemButtonMap = getFizzyItemButtonMap(scopedMap, disableUnseenItems);
                renderItemButtonListComponents(fizzyItemButtonMap, activeItemId, disableUnseenItems);

            } else {
                this.controls.$linearState.show();
                this.controls.$tree.empty();
            }

            /**
             * @event navigator#update the navigation data have changed
             */
            this.trigger('update');

            return this;
        },

        /**
         * Selects an item
         * @param {Number} position The item's position
         */
        select: function select(position) {
            let previousPosition = 0;

            const previousItem = mapHelper.getItem(this.map, this.testContext.itemIdentifier);
            if (previousItem) {
                previousPosition = previousItem.position;
            }
            const item = mapHelper.getItemAt(this.map, parseInt(position));
            if (item) {
                this.itemButtonListComponents.forEach(c => c.setActiveItem(item.id));
            }

            /**
             * An item is selected
             *
             * @param {Number} position - The item position on which select
             * @param {Number} previousPosition - The item position from which select
             * @event navigator#selected
             */
            this.trigger('selected', position, previousPosition);
        }
    };

    component = componentFactory(navigatorApi, _defaults)
        .setTemplate(navigatorTpl)
        .on('init', function() {
            this.itemButtonListComponents = [];
        })
        .on('destroy', function() {
            this.controls = null;
            this.itemButtonListComponents.forEach(c => c.destroy());
            this.itemButtonListComponents = [];
        })
        .on('render', function () {
            // main component element
            const $component = this.getElement();
            // links the component to the underlying DOM elements
            this.controls = {
                // access to the tree of parts/sections/items
                $tree: $component.find(_selectors.tree),
                // access to the panel displayed when a linear part is reached
                $linearState: $component.find(_selectors.linearState),
                $closeButton: $component.find(_selectors.closeButton)
            };

            //click on close button
            this.controls.$closeButton.on('click', function (e) {
                e.preventDefault();
                /**
                 * Review screen should be closed
                 * @fires navigator#close
                 */
                component.trigger('close');
            });
        })
        .on('enable', function() {
            this.itemButtonListComponents.forEach(c => c.enable());
        })
        .on('disable', function() {
            this.itemButtonListComponents.forEach(c => c.disable());
        });

    // the component will be ready
    return component.init(config);
}

export default navigatorFactory;
