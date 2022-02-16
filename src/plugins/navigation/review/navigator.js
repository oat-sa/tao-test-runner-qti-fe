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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import component from 'ui/component';
import autoscroll from 'ui/autoscroll';
import itemButtonListFactory from 'ui/itemButtonList';
import mapHelper from 'taoQtiTest/runner/helpers/map';
import fizzyTpl from './navigatorFizzy.tpl';
import fizzyTreeTpl from './navigatorBubbles.tpl';
import accordionTpl from 'taoQtiTest/runner/plugins/navigation/review/navigator.tpl';
import accordionTreeTpl from 'taoQtiTest/runner/plugins/navigation/review/navigatorTree';

let navigatorTpl = accordionTpl;
let navigatorTreeTpl = accordionTreeTpl;
/**
 * Some default values
 * @type {Object}
 * @private
 */
var _defaults = {
    scope: 'test',
    canCollapse: false,
    preventsUnseen: true,
    hidden: false
};

/**
 * List of CSS classes
 * @type {Object}
 * @private
 */
var _cssCls = {
    active: 'active',
    collapsed: 'collapsed',
    collapsible: 'collapsible',
    hidden: 'hidden',
    disabled: 'disabled',
    flagged: 'flagged',
    answered: 'answered',
    viewed: 'viewed',
    unseen: 'unseen',
    info: 'info',
    icon: 'qti-navigator-icon',
    scope: {
        test: 'scope-test',
        testPart: 'scope-test-part',
        testSection: 'scope-test-section'
    }
};

/**
 * List of icon CSS classes
 * @type {Array}
 * @private
 */
var _iconCls = [_cssCls.info, _cssCls.flagged, _cssCls.answered, _cssCls.viewed];

/**
 * List of common CSS selectors
 * @type {Object}
 * @private
 */
var _selectors = {
    component: '.qti-navigator',
    filterBar: '.qti-navigator-filters',
    filter: '.qti-navigator-filter',
    tree: '.qti-navigator-tree', //+ linear
    collapseHandle: '.qti-navigator-collapsible',
    linearState: '.qti-navigator-linear', //+ linear
    infoAnswered: '.qti-navigator-answered .qti-navigator-counter',
    infoViewed: '.qti-navigator-viewed .qti-navigator-counter',
    infoUnanswered: '.qti-navigator-unanswered .qti-navigator-counter',
    infoFlagged: '.qti-navigator-flagged .qti-navigator-counter',
    infoPanel: '.qti-navigator-info',
    infoPanelLabels: '.qti-navigator-info > .qti-navigator-label',
    tabInfoAll: '[data-mode="all"] .qti-navigator-counter',
    tabInfoUnanswered: '[data-mode="unanswered"] .qti-navigator-counter',
    tabInfoFlagged: '[data-mode="flagged"] .qti-navigator-counter',
    parts: '.qti-navigator-part',
    partLabels: '.qti-navigator-part > .qti-navigator-label',
    sections: '.qti-navigator-section',
    sectionLabels: '.qti-navigator-section > .qti-navigator-label',
    items: '.qti-navigator-item',
    itemLabels: '.qti-navigator-item > .qti-navigator-label',
    itemIcons: '.qti-navigator-item > .qti-navigator-icon',
    activeItem: '.qti-navigator-item.active',
    icons: '.qti-navigator-icon',
    linearStart: '.qti-navigator-linear-part button',
    counters: '.qti-navigator-counter',
    actives: '.active',
    collapsible: '.collapsible',
    collapsiblePanels: '.collapsible-panel',
    unseen: '.unseen',
    answered: '.answered',
    flagged: '.flagged',
    notFlagged: ':not(.flagged)',
    notAnswered: ':not(.answered)',
    notInformational: ':not(.info)',
    informational: '.info',
    hidden: '.hidden',
    disabled: '.disabled',
    closeButton: '.icon-close', //+ (fizzy-only, btw)
    itemButtonListContainer: '.review-panel-items'
};

/**
 * Maps the filter mode to filter criteria.
 * Each filter criteria is a CSS selector used to find and mask the items to be discarded by the filter.
 * @type {Object}
 * @private
 */
var _filterMap = {
    all: '',
    unanswered: [_selectors.answered, _selectors.informational].join(','),
    flagged: _selectors.notFlagged,
    answered: _selectors.notAnswered,
    filtered: _selectors.hidden
};

/**
 *
 * @type {Object}
 */
var navigatorApi = {
    /**
     * Updates the stats on the flagged items in the current map
     * @param {Number} position
     * @param {Boolean} flag
     */
    updateStats: function updateStats(position, flag) {
        var map = this.map;
        var item;

        if (map) {
            item = mapHelper.getItemAt(map, position);

            if (item) {
                item.flagged = flag;
                mapHelper.updateItemStats(map, position);
            }
        }
    },

    /**
     * Gets the total number of items for the provided target
     * @param {Object} progression
     * @param {String} target
     * @returns {Number}
     */
    getProgressionTotal: function getProgressionTotal(progression, target) {
        var total;

        if ('questions' === target) {
            total = progression.questions;
        } else {
            total = progression.total;
        }

        return total;
    },

    /**
     * Set the marked state of an item
     * @param {Number|String|jQuery} position
     * @param {Boolean} flag
     */
    setItemFlag: function setItemFlag(position, flag) {
        if (this.isFizzyLayout) {
            const updatedMap = _.cloneDeep(this.map);
            const updatedItem = mapHelper.getItemAt(updatedMap, parseInt(position));
            if (updatedItem) {
                updatedItem.flagged = flag;
                const updatedScopeMap = mapHelper.getScopeMapFromContext(updatedMap, this.context, this.config.scope);
                const updatedFizzyMap = this.getFizzyItemButtonMap(updatedScopeMap, false, false);
                let updatedItemData;
                _.forEach(updatedFizzyMap.sections, fizzySection => {
                    updatedItemData = _.find(fizzySection.items, (fizzyItem) => fizzyItem.id === updatedItem.id);
                    if (updatedItemData) {
                        return false;
                    }
                });
                this.itemButtonListComponents.forEach(c => c.updateItem(updatedItem.id, updatedItemData));
            }
        } else {
            const $item = position && position.jquery ? position : this.controls.$tree.find(`[data-position=${position}]`);
            const progression = this.progression;
            let icon;

            // update the map stats
            this.updateStats(position, flag);

            // update the item flag
            $item.toggleClass(_cssCls.flagged, flag);

            // set the item icon according to its state
            icon = _.find(_iconCls, _.bind($item.hasClass, $item)) || _cssCls.unseen;
            $item.find(_selectors.icons).attr('class', `${_cssCls.icon} icon-${icon}`);

            // update the info panel
            progression.flagged = this.controls.$tree.find(_selectors.flagged).length;
            this.writeCount(
                this.controls.$infoFlagged,
                progression.flagged,
                this.getProgressionTotal(progression, 'questions')
            );

            // recompute the filters
            this.filter(this.currentFilter);
        }
    },

    /**
     * Filters the items by a criteria
     * @param {String} criteria
     */
    filter: function filter(criteria) {
        var self = this;

        // remove the current filter by restoring all items
        var $items = this.controls.$tree.find(_selectors.items).removeClass(_cssCls.hidden);

        // filter the items according to the provided criteria
        var filterCb = _filterMap[criteria];
        if (filterCb) {
            $items.filter(filterCb).addClass(_cssCls.hidden);
        }

        // update the section counters
        this.controls.$tree.find(_selectors.sections).each(function() {
            var $section = $(this);
            var $itemsFound = $section.find(_selectors.items).not(_selectors.hidden);
            var $filtered = $itemsFound.not(_selectors.disabled);
            self.writeCount($section.find(_selectors.counters), $filtered.length, $itemsFound.length);
        });
        this.currentFilter = criteria;
    },

    /**
     * Update the config
     * @param {Object} [config]
     * @returns {navigatorApi}
     */
    updateConfig: function updateConfig(config) {
        var $component = this.getElement();
        var scopeClass = _cssCls.scope[this.config.scope || _defaults.scope];

        // apply the new config
        config = _.merge(this.config, config || {});

        // enable/disable the collapsing of the panel
        $component.toggleClass(_cssCls.collapsible, config.canCollapse);

        // update the component CSS class according to the scope
        $component.removeClass(scopeClass);
        scopeClass = _cssCls.scope[this.config.scope || _defaults.scope];
        $component.addClass(scopeClass);

        return this;
    },

    /**
     * Keep the active item visible, auto scroll if needed
     */
    autoScroll: function autoScroll() {
        autoscroll(this.controls.$tree.find(_selectors.activeItem), this.controls.$tree);
    },

    /**
     * Updates the review screen
     * @param {Object} map The current test map
     * @param {Object} context The current test context
     * @returns {navigatorApi}
     * @fires navigator#update
     */
    update(map, context) {
        const scopedMap = this.getScopedMap(map, context);
        const testPart  = mapHelper.getPart(map, context.testPartId);
        const progression = scopedMap.stats || {
            questions: 0,
            answered: 0,
            flagged: 0,
            viewed: 0,
            total: 0
        };
        const totalQuestions = this.getProgressionTotal(progression, 'questions');
        const activeItem = mapHelper.getActiveItem(scopedMap);

        this.map = map;
        this.progression = progression;
        this.testContext = context;

        // update the info panel
        this.writeCount(this.controls.$infoAnswered, progression.answered, totalQuestions);
        this.writeCount(this.controls.$infoUnanswered, totalQuestions - progression.answered, totalQuestions);
        this.writeCount(this.controls.$infoViewed, progression.viewed, this.getProgressionTotal(progression, 'total'));
        this.writeCount(this.controls.$infoFlagged, progression.flagged, totalQuestions);
        this.writeCount(this.controls.$infoAll, totalQuestions, null);

        // rebuild the tree
        if (!testPart.isLinear) {
            this.controls.$filterBar.show();
            this.controls.$linearState.hide();

            const isSkipaheadEnabled =
                activeItem &&
                activeItem.categories &&
                _.indexOf(activeItem.categories, 'x-tao-option-review-skipahead') >= 0;

            this.setState('skipahead-enabled', isSkipaheadEnabled);
            this.setState('prevents-unseen', this.config.preventsUnseen);

            this.controls.$tree.html(navigatorTreeTpl(scopedMap));

            if (this.isFizzyLayout) {
                const scopeMap = mapHelper.getScopeMapFromContext(this.map, this.context, this.config.scope);
                const disableUnseenItems = this.config.preventsUnseen && !isSkipaheadEnabled;
                const fizzyItemButtonMap = this.getFizzyItemButtonMap(scopeMap, disableUnseenItems);
                this.renderItemButtonListComponents(fizzyItemButtonMap, activeItem.id, disableUnseenItems);
            } else {
                if (this.config.preventsUnseen && !isSkipaheadEnabled) {
                    // disables all unseen items to prevent the test taker has access to.
                    this.controls.$tree.find(_selectors.unseen).addClass(_cssCls.disabled);
                }
                this.autoScroll();
            }
        } else {
            this.controls.$filterBar.hide();
            this.controls.$linearState.show();
            this.controls.$tree.empty();
        }

        if (!this.isFizzyLayout) {
            // apply again the current filter
            this.filter(this.controls.$filters.filter(_selectors.actives).data('mode'));
        }

        /**
         * @event navigator#update the navigation data have changed
         */
        this.trigger('update');

        return this;
    },

    /**
     * Gets the scoped map
     * @param {Object} map The current test map
     * @param {Object} context The current test context
     * @returns {object} The scoped map
     */
    getScopedMap: function getScopedMap(map, context) {
        var scopedMap = mapHelper.getScopeMapFromContext(map, context, this.config.scope);
        var testPart = mapHelper.getPart(scopedMap, context.testPartId) || {};
        var section = mapHelper.getSection(scopedMap, context.sectionId) || {};
        var item = mapHelper.getItem(scopedMap, context.itemIdentifier) || {};

        scopedMap.displaySectionTitles = this.getConfig().displaySectionTitles;

        // set the active part/section/item
        testPart.active = true;
        section.active = true;
        item.active = true;

        //interactive item counter
        let counter = 0;

        // adjust each item with additional meta
        return mapHelper.each(scopedMap, function(itm) {
            var cls = [];
            var icon = '';

            if (itm.active) {
                cls.push('active');
            }
            if (itm.informational) {
                cls.push('info');
                icon = icon || 'info';
            }
            if (itm.flagged) {
                cls.push('flagged');
                icon = icon || 'flagged';
            }
            if (itm.answered) {
                cls.push('answered');
                icon = icon || 'answered';
            }
            if (itm.viewed) {
                cls.push('viewed');
                icon = icon || 'viewed';
            } else {
                cls.push('unseen');
                icon = icon || 'unseen';
            }

            if(!itm.informational){
                counter += 1;
                itm.numberTest = counter; //item position in this scope from 1
            }
            itm.cls = cls.join(' ');
            itm.icon = icon;
        });
    },

    getFizzyItemButtonMap: function getFizzyItemButtonMap(map, disableUnseenItems) {
        const displaySectionTitles = this.getConfig().displaySectionTitles;

        let nonInformationalCount = 0;
        const fizzyMap = {
            sections: []
        };

        _.forEach(map.parts, function(part) {
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
    },

    /**
     * Updates a counter
     * @param {jQuery} $place
     * @param {Number} count
     * @param {Number|Null} total
     * @private
     */
    writeCount: function writeCount($place, count, total) {
        var display = 0;
        if ($place.parent().hasClass('qti-navigator-tab')) {
            display = Math.max(count, 0);
        } else if (total > 0) {
            display = `${Math.min(count, total)}/${total}`;
        }
        $place.text(display);
    },

    /**
     * Selects an item
     * @param {String|jQuery} position The item's position
     * @param {Boolean} [open] Forces the tree to be opened on the selected item
     */
    select: function select(position, open) {
        let previousPosition = 0;

        if (this.isFizzyLayout) {
            const previousItem = mapHelper.getItem(this.map, this.testContext.itemIdentifier);
            if (previousItem) {
                previousPosition = previousItem.position;
            }
            const item = mapHelper.getItemAt(this.map, parseInt(position));
            if (item) {
                this.itemButtonListComponents.forEach(c => c.setActiveItem(item.id));
            }
        } else {
            // find the item to select and extract its hierarchy
            const $tree = this.controls.$tree;
            const selected = position && position.jquery ? position : $tree.find(`[data-position=${position}]`);
            const hierarchy = selected.parentsUntil($tree);
            const $previous = $tree.find(_selectors.activeItem);
            if ($previous.length) {
                previousPosition = $previous.data('position');
            }

            // collapse the full tree and open only the hierarchy of the selected item
            if (open) {
                this.openOnly(hierarchy);
            }

            // select the item
            $tree.find(_selectors.actives).removeClass(_cssCls.active);
            hierarchy.add(selected).addClass(_cssCls.active);

            position = selected.data('position');
        }

        /**
         * An item is selected
         *
         * @param {Number} position - The item position on which select
         * @param {Number} previousPosition - The item position from which select
         * @event navigator#selected
         */
        this.trigger('selected', position, previousPosition);
    },

    /**
     * Opens the tree on the selected item only
     * @returns {jQuery} Returns the selected item
     */
    openSelected: function openSelected() {
        // find the selected item and extract its hierarchy
        var $tree = this.controls.$tree;
        var selected = $tree.find(_selectors.items + _selectors.actives);
        var hierarchy = selected.parentsUntil($tree);

        // collapse the full tree and open only the hierarchy of the selected item
        this.openOnly(hierarchy);

        return selected;
    },

    /**
     * Collapses the full tree and opens only the provided branch
     * @param {jQuery} opened The element to be opened
     * @param {jQuery} [root] The root element from which collapse the panels
     */
    openOnly: function openOnly(opened, root) {
        (root || this.controls.$tree).find(_selectors.collapsible).addClass(_cssCls.collapsed);
        opened.removeClass(_cssCls.collapsed);
    },

    /**
     * Toggles a panel
     * @param {jQuery} panel The panel to toggle
     * @param {String} [collapseSelector] Selector of panels to collapse
     * @returns {Boolean} Returns `true` if the panel just expanded now
     */
    togglePanel: function togglePanel(panel, collapseSelector) {
        var collapsed = panel.hasClass(_cssCls.collapsed);

        if (collapseSelector) {
            this.controls.$tree.find(collapseSelector).addClass(_cssCls.collapsed);
        }

        if (collapsed) {
            panel.removeClass(_cssCls.collapsed);
        } else {
            panel.addClass(_cssCls.collapsed);
        }
        return collapsed;
    },

    /**
     * Toggles the display state of the component
     * @param {Boolean} [show] External condition that's tells if the component must be shown or hidden
     * @returns {navigatorApi}
     */
    toggle: function toggle(show) {
        if (typeof show === 'undefined') {
            show = this.is('hidden');
        }

        if (show) {
            this.show();
        } else {
            this.hide();
        }

        return this;
    },

    /**
     * Jumps to an item
     * @param {Number} position
     * @private
     */
    jump: function jump(position) {
        /**
         * A jump to a particular item is required
         * @event navigator#jump
         * @param {Number} position - The item position on which jump
         */
        this.trigger('jump', position);
    },

    /**
     * Get active item, based on data, not visual state
     * Unlike `mapHelper.getActiveItem`, works with original `map`, not `scopedMap`
     * @param {Object} map
     * @param {Object} testContext
     * @returns {Object} item
     */
    getActiveItemFromTestContext: function (map, testContext) {
        return mapHelper.getItem(map, testContext.itemIdentifier);
    },

    renderItemButtonListComponents: function(fizzyItemButtonMap, activeItemId, disableUnseenItems) {
        this.itemButtonListComponents.forEach(c => c.destroy());
        this.itemButtonListComponents = [];

        const self = this;
        this.controls.$tree.find(_selectors.itemButtonListContainer).each((index, itemButtonListContainerElem) => {
            const itemButtonListComponent = itemButtonListFactory({
                items: fizzyItemButtonMap.sections[index].items,
                scrollContainer: this.controls.$tree
            })
                .render(itemButtonListContainerElem)
                .on('click', function onItemClick({ position }) {
                    // click on an item: jump to the position
                    const item = mapHelper.getItemAt(self.map, position);
                    const activeItem = self.getActiveItemFromTestContext(self.map, self.testContext);

                    if (item && !self.is('disabled')) {
                        if (
                            !(disableUnseenItems && !item.viewed) &&
                            (!activeItem || item.position !== activeItem.position)
                        ) {
                            self.select(position);
                            self.jump(position);
                        }
                    }
                });
            this.itemButtonListComponents.push(itemButtonListComponent);
        });

        this.itemButtonListComponents.forEach(c => c.setActiveItem(activeItemId));
    }
};

/* eslint-disable no-unused-vars */
/**
 *
 * @param {Object} config
 * @param {String} [config.scope] Limit the review screen to a particular scope: test, testPart, testSection
 * @param {Boolean} [config.preventsUnseen] Prevents the test taker to access unseen items
 * @param {Boolean} [config.canCollapse] Allow the test taker to collapse the component
 * @param {Boolean} [config.canFlag] Allow the test taker to flag items
 * @param {Boolean} [config.hidden] Hide the component at init
 * @param {Object} map The current test map
 * @param {Object} context The current test context
 * @returns {*}
 */
function navigatorFactory(config, map, context) {
    /* eslint-enable no-unused-vars */

    var navigator;

    /**
     * Flags an item
     * @param {jQuery} $item
     */
    function flagItem($item) {
        //not implemented for fizzy
        if (!this.isFizzyLayout) {
            const position = $item.data('position');
            const flagged = !$item.hasClass(_cssCls.flagged);

            // update the display
            navigator.setItemFlag(position, flagged);

            /**
             * An item is flagged
             * @event navigator#flag
             * @param {Number} position - The item position on which jump
             * @param {Boolean} flag - Tells whether the item is marked for review or not
             */
            navigator.trigger('flag', position, flagged);
        }
    }

    if (config.reviewLayout === 'fizzy') {
        navigatorTpl = fizzyTpl;
        navigatorTreeTpl = fizzyTreeTpl;
    }

    navigator = component(navigatorApi, _defaults)
        .setTemplate(navigatorTpl)

        .on('init', function() {
            this.isFizzyLayout = this.getConfig().reviewLayout === 'fizzy';
            this.itemButtonListComponents = [];
        })

        // uninstalls the component
        .on('destroy', function() {
            this.controls = null;

            if (this.isFizzyLayout) {
                this.itemButtonListComponents.forEach(c => c.destroy());
                this.itemButtonListComponents = [];
            }
        })

        // renders the component
        .on('render', function() {
            var self = this;

            // main component elements
            var $component = this.getElement();
            var $filterBar = $component.find(_selectors.filterBar);
            var $filters = $filterBar.find('li');
            var $tree = $component.find(_selectors.tree);
            var $closeButton = $component.find(_selectors.closeButton);

            // links the component to the underlying DOM elements
            this.controls = {
                // access to info panel displaying counters

                $infoAnswered: $component.find(_selectors.infoAnswered),
                $infoViewed: $component.find(_selectors.infoViewed),
                $infoAll: $component.find(_selectors.tabInfoAll),
                $infoUnanswered: this.config.showLegend
                    ? $component.find(_selectors.infoUnanswered)
                    : $component.find(_selectors.tabInfoUnanswered),
                $infoFlagged: this.config.showLegend
                    ? $component.find(_selectors.infoFlagged)
                    : $component.find(_selectors.tabInfoFlagged),

                // access to filter switches
                $filterBar: $filterBar,
                $filters: $filters,

                // access to the tree of parts/sections/items
                $tree: $tree,

                // access to the panel displayed when a linear part is reached
                $linearState: $component.find(_selectors.linearState)
            };

            // apply options
            this.updateConfig();

            if (!this.isFizzyLayout) {
                // click on the collapse handle: collapse/expand the review panel
                $component.on(`click${_selectors.component}`, _selectors.collapseHandle, function() {
                    if (!self.is('disabled')) {
                        $component.toggleClass(_cssCls.collapsed);
                        if ($component.hasClass(_cssCls.collapsed)) {
                            self.openSelected();
                        }
                    }
                });

                // click on the info panel title: toggle the related panel
                $component.on(`click${_selectors.component}`, _selectors.infoPanelLabels, function() {
                    if (!self.is('disabled')) {
                        self.togglePanel($(this).closest(_selectors.infoPanel), _selectors.infoPanel);
                    }
                });

                // click on a part title: toggle the related panel
                $tree.on(`click${_selectors.component}`, _selectors.partLabels, function() {
                    var $panel;

                    if (!self.is('disabled')) {
                        $panel = $(this).closest(_selectors.parts);

                        if (self.togglePanel($panel, _selectors.parts)) {
                            if ($panel.hasClass(_cssCls.active)) {
                                self.openSelected();
                            } else {
                                self.openOnly($panel.find(_selectors.sections).first(), $panel);
                            }
                        }
                    }
                });

                // click on a section title: toggle the related panel
                $tree.on(`click${_selectors.component}`, _selectors.sectionLabels, function() {
                    if (!self.is('disabled')) {
                        self.togglePanel($(this).closest(_selectors.sections), _selectors.sections);
                    }
                });

                // click on an item: jump to the position
                // fizzy click handler will be bound when rendering itemButtonList
                $tree.on(`click${_selectors.component}`, _selectors.itemLabels, function (event) {
                    var $item, $target;

                    if (!self.is('disabled')) {
                        $item = $(this).closest(_selectors.items);

                        if (!$item.hasClass(_cssCls.disabled)) {
                            $target = $(event.target);
                            if (
                                self.config.canFlag &&
                                $target.is(_selectors.icons) &&
                                !$component.hasClass(_cssCls.collapsed)
                            ) {
                                // click on the icon, just flag the item, unless the panel is collapsed
                                if (!$item.hasClass(_cssCls.unseen) && !$item.hasClass(_cssCls.info)) {
                                    flagItem($item);
                                }
                            } else if (!$item.hasClass(_cssCls.active)) {
                                // go to the selected item
                                self.select($item);
                                self.jump($item.data('position'));
                            }
                        }
                    }
                });

                // click on a filter button
                $filterBar.on(`click${_selectors.component}`, _selectors.filter, function() {
                    var $btn, mode;

                    if (!self.is('disabled')) {
                        $btn = $(this);
                        mode = $btn.data('mode');

                        // select the button
                        $filters.removeClass(_cssCls.active);
                        $filters.attr('aria-selected', false);
                        $component.removeClass(_cssCls.collapsed);
                        $btn.addClass(_cssCls.active);
                        $btn.attr('aria-selected', true);

                        // filter the items
                        self.filter(mode);

                        //after filtering, ensure that the active item (if exists) is visible
                        self.autoScroll();
                    }
                });
            }

            // click on the start button inside a linear part: jump to the position
            $tree.on(`click${_selectors.component}`, _selectors.linearStart, function() {
                var $btn;

                if (!self.is('disabled')) {
                    $btn = $(this);

                    // go to the first item of the linear part
                    if (!$btn.hasClass(_cssCls.disabled)) {
                        $btn.addClass(_cssCls.disabled);
                        self.jump($btn.data('position'));
                    }
                }
            });

            //click on close button
            $closeButton.on('click', function (e) {
                e.preventDefault();
                /**
                 * Review screen should be closed
                 * @event navigator#close
                 */
                navigator.trigger('close');
            });
        })
        .on('enable', function() {
            this.itemButtonListComponents.forEach(c => c.enable());
        })
        .on('disable', function() {
            this.itemButtonListComponents.forEach(c => c.disable());
        });

    // set default filter
    navigator.currentFilter = 'all';

    // the component will be ready
    return navigator.init(config);
}

export default navigatorFactory;
